package com.mtgpacksim.session;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface SavedSessionRepository extends JpaRepository<SavedSessionEntity, UUID> {
    Optional<SavedSessionEntity> findByUserId(UUID userId);
}
