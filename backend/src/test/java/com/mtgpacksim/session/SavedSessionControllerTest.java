package com.mtgpacksim.session;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.UUID;

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
    void requiresAuthenticationForEverySnapshotRoute() throws Exception {
        mockMvc.perform(post("/api/sessions")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"displayName":"Anonymous","state":{"selectedSetCode":"blb"}}
                                """))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("AUTH_REQUIRED"));

        mockMvc.perform(get("/api/sessions/current"))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(get("/api/sessions/{id}", UUID.randomUUID()))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void savesCanonicalSessionWithRevisionChecks() throws Exception {
        String token = register("revision-session");

        mockMvc.perform(put("/api/sessions/current")
                        .header("Authorization", bearer(token))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "displayName":"First",
                                  "state":{"selectedSetCode":"blb"},
                                  "expectedRevision":null
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.revision").value(0));

        mockMvc.perform(put("/api/sessions/current")
                        .header("Authorization", bearer(token))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "displayName":"Second",
                                  "state":{"selectedSetCode":"dsk"},
                                  "expectedRevision":0
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.revision").value(1))
                .andExpect(jsonPath("$.state.selectedSetCode").value("dsk"));

        mockMvc.perform(put("/api/sessions/current")
                        .header("Authorization", bearer(token))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "displayName":"Stale",
                                  "state":{"selectedSetCode":"otj"},
                                  "expectedRevision":0
                                }
                                """))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("SAVED_SESSION_CONFLICT"));

        mockMvc.perform(get("/api/sessions/current")
                        .header("Authorization", bearer(token)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.revision").value(1))
                .andExpect(jsonPath("$.state.selectedSetCode").value("dsk"));
    }

    @Test
    void hidesAnotherUsersSessionAndValidatesAuthenticatedRequests() throws Exception {
        String ownerToken = register("session-owner");
        String otherToken = register("session-other");

        String response = mockMvc.perform(put("/api/sessions/current")
                        .header("Authorization", bearer(ownerToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"displayName":"Owner","state":{"selectedSetCode":"blb"}}
                                """))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        String id = objectMapper.readTree(response).get("id").asText();

        mockMvc.perform(get("/api/sessions/{id}", id)
                        .header("Authorization", bearer(otherToken)))
                .andExpect(status().isNotFound());

        mockMvc.perform(post("/api/sessions")
                        .header("Authorization", bearer(otherToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"displayName":"Empty"}
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("SAVED_SESSION_INVALID"));
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
