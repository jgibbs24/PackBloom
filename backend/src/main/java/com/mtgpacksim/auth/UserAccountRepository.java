package com.mtgpacksim.auth;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface UserAccountRepository extends JpaRepository<UserAccountEntity, UUID> {
    boolean existsByEmail(String email);

    Optional<UserAccountEntity> findByEmail(String email);
}
