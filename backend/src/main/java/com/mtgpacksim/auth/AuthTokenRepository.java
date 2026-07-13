package com.mtgpacksim.auth;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface AuthTokenRepository extends JpaRepository<AuthTokenEntity, UUID> {
    void deleteByTokenHash(String tokenHash);

    Optional<AuthTokenEntity> findByTokenHash(String tokenHash);
}
