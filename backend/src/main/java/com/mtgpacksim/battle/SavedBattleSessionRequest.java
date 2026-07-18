package com.mtgpacksim.battle;

import com.fasterxml.jackson.databind.JsonNode;

public record SavedBattleSessionRequest(String displayName, JsonNode state, Long expectedRevision) {
}
