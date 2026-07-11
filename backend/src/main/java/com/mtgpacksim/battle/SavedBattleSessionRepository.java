package com.mtgpacksim.battle;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface SavedBattleSessionRepository extends JpaRepository<SavedBattleSessionEntity, UUID> {
}
