package com.mtgpacksim.battle;

import com.fasterxml.jackson.databind.JsonNode;

import java.time.OffsetDateTime;
import java.util.UUID;

public record SavedBattleSessionResponse(
        UUID id,
        String displayName,
        JsonNode state,
        long revision,
        OffsetDateTime createdAt,
        OffsetDateTime updatedAt
) {
}
