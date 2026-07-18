package com.mtgpacksim.battle;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.context.ActiveProfiles;

import java.util.UUID;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class SavedBattleSessionControllerTest {
    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void requiresAuthenticationForBattleSnapshots() throws Exception {
        mockMvc.perform(post("/api/battle-sessions")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"displayName":"Anonymous","state":{"battleHistory":[]}}
                                """))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("AUTH_REQUIRED"));

        mockMvc.perform(get("/api/battle-sessions/current"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void savesCanonicalBattleSessionWithRevisionChecks() throws Exception {
        String token = register("revision-battle");

        mockMvc.perform(put("/api/battle-sessions/current")
                        .header("Authorization", bearer(token))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "displayName":"First",
                                  "state":{"battleHistory":[],"battleStats":{"battles":1}}
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.revision").value(0));

        mockMvc.perform(put("/api/battle-sessions/current")
                        .header("Authorization", bearer(token))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "displayName":"Second",
                                  "state":{"battleHistory":[],"battleStats":{"battles":2}},
                                  "expectedRevision":0
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.revision").value(1));

        mockMvc.perform(put("/api/battle-sessions/current")
                        .header("Authorization", bearer(token))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "displayName":"Stale",
                                  "state":{"battleHistory":[],"battleStats":{"battles":3}},
                                  "expectedRevision":0
                                }
                                """))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("SAVED_BATTLE_SESSION_CONFLICT"));
    }

    @Test
    void hidesBattleSnapshotsAcrossAccounts() throws Exception {
        String ownerToken = register("battle-owner");
        String otherToken = register("battle-other");
        String response = mockMvc.perform(put("/api/battle-sessions/current")
                        .header("Authorization", bearer(ownerToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"displayName":"Owner","state":{"battleHistory":[],"battleStats":{}}}
                                """))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        String id = objectMapper.readTree(response).get("id").asText();

        mockMvc.perform(get("/api/battle-sessions/{id}", id)
                        .header("Authorization", bearer(otherToken)))
                .andExpect(status().isNotFound());
    }

    private String register(String prefix) throws Exception {
        String email = prefix + "-" + UUID.randomUUID() + "@test.dev";
        String response = mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new Registration(
                                prefix,
                                email,
                                "password123"
                        ))))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        return objectMapper.readTree(response).get("token").asText();
    }

    private String bearer(String token) {
        return "Bearer " + token;
    }

    private record Registration(String displayName, String email, String password) {
    }
}
