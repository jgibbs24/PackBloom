package com.mtgpacksim.session;

import com.fasterxml.jackson.databind.JsonNode;

public record SavedSessionRequest(
        String displayName,
        JsonNode state,
        Long expectedRevision
) {
}
