package com.mtgpacksim.session;

import com.fasterxml.jackson.databind.JsonNode;

import java.time.OffsetDateTime;
import java.util.UUID;

public record SavedSessionResponse(
        UUID id,
        String displayName,
        JsonNode state,
        OffsetDateTime createdAt,
        OffsetDateTime updatedAt
) {
}
