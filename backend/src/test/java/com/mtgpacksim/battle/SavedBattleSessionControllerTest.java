package com.mtgpacksim.battle;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class SavedBattleSessionControllerTest {
    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void createsUpdatesFetchesAndDeletesSavedBattleSession() throws Exception {
        String createResponse = mockMvc.perform(post("/api/battle-sessions")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "displayName": " Battle Session ",
                                  "state": {
                                    "battleStats": {
                                      "battles": 1,
                                      "playerAWins": 1
                                    },
                                    "battleHistory": [
                                      {
                                        "winner": "A",
                                        "margin": 4.25
                                      }
                                    ]
                                  }
                                }
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.displayName").value("Battle Session"))
                .andExpect(jsonPath("$.state.battleStats.battles").value(1))
                .andReturn()
                .getResponse()
                .getContentAsString();

        JsonNode createdSession = objectMapper.readTree(createResponse);
        String id = createdSession.get("id").asText();
        assertThat(id).isNotBlank();

        mockMvc.perform(get("/api/battle-sessions/{id}", id))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.state.battleHistory[0].winner").value("A"));

        mockMvc.perform(put("/api/battle-sessions/{id}", id)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "displayName": "Updated Battle Session",
                                  "state": {
                                    "battleStats": {
                                      "battles": 2,
                                      "playerBWins": 1
                                    },
                                    "battleHistory": []
                                  }
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.displayName").value("Updated Battle Session"))
                .andExpect(jsonPath("$.state.battleStats.battles").value(2));

        mockMvc.perform(delete("/api/battle-sessions/{id}", id))
                .andExpect(status().isNoContent());

        mockMvc.perform(get("/api/battle-sessions/{id}", id))
                .andExpect(status().isNotFound());
    }

    @Test
    void rejectsMissingSavedBattleSessionState() throws Exception {
        mockMvc.perform(post("/api/battle-sessions")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "displayName": "Empty"
                                }
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("SAVED_BATTLE_SESSION_INVALID"));
    }
}
