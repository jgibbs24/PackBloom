package com.mtgpacksim.auth;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.OffsetDateTime;
import java.util.HexFormat;
import java.util.Locale;
import java.util.Optional;
import java.util.UUID;

@Service
public class AuthService {
    private static final int MAX_DISPLAY_NAME_LENGTH = 80;
    private static final int MIN_PASSWORD_LENGTH = 8;
    private static final int TOKEN_BYTES = 32;
    private static final int TOKEN_DAYS = 30;

    private final AuthTokenRepository authTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final SecureRandom secureRandom = new SecureRandom();
    private final UserAccountRepository userAccountRepository;

    public AuthService(
            AuthTokenRepository authTokenRepository,
            PasswordEncoder passwordEncoder,
            UserAccountRepository userAccountRepository
    ) {
        this.authTokenRepository = authTokenRepository;
        this.passwordEncoder = passwordEncoder;
        this.userAccountRepository = userAccountRepository;
    }

    @Transactional
    public AuthResponse register(AuthRequest request) {
        String email = normalizeEmail(request == null ? null : request.email());
        String password = request == null ? null : request.password();
        validatePassword(password);

        if (userAccountRepository.existsByEmail(email)) {
            throw new AuthException("An account already exists for that email.");
        }

        UserAccountEntity user = userAccountRepository.save(new UserAccountEntity(
                UUID.randomUUID(),
                email,
                normalizeDisplayName(request.displayName(), email),
                passwordEncoder.encode(password)
        ));

        return createAuthResponse(user);
    }

    @Transactional
    public AuthResponse login(AuthRequest request) {
        String email = normalizeEmail(request == null ? null : request.email());
        String password = request == null ? null : request.password();

        UserAccountEntity user = userAccountRepository.findByEmail(email)
                .orElseThrow(() -> new AuthException("Invalid email or password."));

        if (password == null || !passwordEncoder.matches(password, user.getPasswordHash())) {
            throw new AuthException("Invalid email or password.");
        }

        return createAuthResponse(user);
    }

    @Transactional
    public void logout(String authorizationHeader) {
        parseBearerToken(authorizationHeader)
                .ifPresent((token) -> authTokenRepository.deleteByTokenHash(hashToken(token)));
    }

    @Transactional(readOnly = true)
    public Optional<AuthenticatedUser> authenticate(String authorizationHeader) {
        return parseBearerToken(authorizationHeader)
                .flatMap((token) -> authTokenRepository.findByTokenHash(hashToken(token)))
                .filter((token) -> token.getExpiresAt().isAfter(OffsetDateTime.now()))
                .flatMap((token) -> userAccountRepository.findById(token.getUserId()))
                .map(this::toAuthenticatedUser);
    }

    public AuthenticatedUser requireUser(String authorizationHeader) {
        return authenticate(authorizationHeader)
                .orElseThrow(() -> new AuthException("Sign in to access this resource."));
    }

    private AuthResponse createAuthResponse(UserAccountEntity user) {
        String rawToken = generateToken();
        authTokenRepository.save(new AuthTokenEntity(
                UUID.randomUUID(),
                user.getId(),
                hashToken(rawToken),
                OffsetDateTime.now().plusDays(TOKEN_DAYS)
        ));

        return new AuthResponse(rawToken, toAuthenticatedUser(user));
    }

    private Optional<String> parseBearerToken(String authorizationHeader) {
        if (authorizationHeader == null || authorizationHeader.isBlank()) {
            return Optional.empty();
        }

        String prefix = "Bearer ";
        if (!authorizationHeader.startsWith(prefix)) {
            throw new AuthException("Invalid authorization header.");
        }

        String token = authorizationHeader.substring(prefix.length()).trim();
        return token.isBlank() ? Optional.empty() : Optional.of(token);
    }

    private String generateToken() {
        byte[] bytes = new byte[TOKEN_BYTES];
        secureRandom.nextBytes(bytes);
        return HexFormat.of().formatHex(bytes);
    }

    private String hashToken(String token) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            return HexFormat.of().formatHex(digest.digest(token.getBytes(StandardCharsets.UTF_8)));
        } catch (NoSuchAlgorithmException exception) {
            throw new AuthException("Authentication token could not be processed.");
        }
    }

    private String normalizeDisplayName(String displayName, String email) {
        String normalized = displayName == null || displayName.isBlank()
                ? email.substring(0, email.indexOf('@'))
                : displayName.trim();
        return normalized.length() <= MAX_DISPLAY_NAME_LENGTH
                ? normalized
                : normalized.substring(0, MAX_DISPLAY_NAME_LENGTH);
    }

    private String normalizeEmail(String email) {
        if (email == null || email.isBlank() || !email.contains("@")) {
            throw new AuthException("A valid email is required.");
        }

        return email.trim().toLowerCase(Locale.ROOT);
    }

    private void validatePassword(String password) {
        if (password == null || password.length() < MIN_PASSWORD_LENGTH) {
            throw new AuthException("Password must be at least 8 characters.");
        }
    }

    private AuthenticatedUser toAuthenticatedUser(UserAccountEntity user) {
        return new AuthenticatedUser(user.getId(), user.getEmail(), user.getDisplayName());
    }
}
