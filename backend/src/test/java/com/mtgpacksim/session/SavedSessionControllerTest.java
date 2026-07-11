package com.mtgpacksim.session;

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
class SavedSessionControllerTest {
    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void createsUpdatesFetchesAndDeletesSavedSession() throws Exception {
        String createResponse = mockMvc.perform(post("/api/sessions")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "displayName": " Test Session ",
                                  "state": {
                                    "selectedSetCode": "blb",
                                    "sessionStats": {
                                      "packsOpened": 1
                                    }
                                  }
                                }
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.displayName").value("Test Session"))
                .andExpect(jsonPath("$.state.selectedSetCode").value("blb"))
                .andReturn()
                .getResponse()
                .getContentAsString();

        JsonNode createdSession = objectMapper.readTree(createResponse);
        String id = createdSession.get("id").asText();
        assertThat(id).isNotBlank();

        mockMvc.perform(get("/api/sessions/{id}", id))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.state.sessionStats.packsOpened").value(1));

        mockMvc.perform(put("/api/sessions/{id}", id)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "displayName": "Updated Session",
                                  "state": {
                                    "selectedSetCode": "dsk",
                                    "sessionStats": {
                                      "packsOpened": 2
                                    }
                                  }
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.displayName").value("Updated Session"))
                .andExpect(jsonPath("$.state.selectedSetCode").value("dsk"));

        mockMvc.perform(delete("/api/sessions/{id}", id))
                .andExpect(status().isNoContent());

        mockMvc.perform(get("/api/sessions/{id}", id))
                .andExpect(status().isNotFound());
    }

    @Test
    void rejectsMissingSavedSessionState() throws Exception {
        mockMvc.perform(post("/api/sessions")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "displayName": "Empty"
                                }
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("SAVED_SESSION_INVALID"));
    }
}
