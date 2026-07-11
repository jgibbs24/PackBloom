package com.mtgpacksim.session;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface SavedSessionRepository extends JpaRepository<SavedSessionEntity, UUID> {
}
