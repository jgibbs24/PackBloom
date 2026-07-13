package com.mtgpacksim.auth;

public record AuthResponse(
        String token,
        AuthenticatedUser user
) {
}
