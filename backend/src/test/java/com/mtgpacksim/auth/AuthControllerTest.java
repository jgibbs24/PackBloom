package com.mtgpacksim.auth;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.context.ActiveProfiles;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.OffsetDateTime;
import java.util.HexFormat;
import java.util.UUID;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class AuthControllerTest {
    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private AuthTokenRepository authTokenRepository;

    @Test
    void registersLogsInAndFetchesCurrentUser() throws Exception {
        String registerResponse = mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "displayName": " Jameson ",
                                  "email": "Jameson@Test.dev",
                                  "password": "password123"
                                }
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.user.displayName").value("Jameson"))
                .andExpect(jsonPath("$.user.email").value("jameson@test.dev"))
                .andReturn()
                .getResponse()
                .getContentAsString();

        JsonNode registered = objectMapper.readTree(registerResponse);
        String token = registered.get("token").asText();
        assertThat(token).isNotBlank();

        mockMvc.perform(get("/api/auth/me")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.displayName").value("Jameson"));

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "email": "jameson@test.dev",
                                  "password": "password123"
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isNotEmpty());
    }

    @Test
    void savesAndLoadsCurrentUserSession() throws Exception {
        String authResponse = mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "displayName": "Session User",
                                  "email": "session-user@test.dev",
                                  "password": "password123"
                                }
                                """))
                .andExpect(status().isCreated())
                .andReturn()
                .getResponse()
                .getContentAsString();

        String token = objectMapper.readTree(authResponse).get("token").asText();

        mockMvc.perform(post("/api/sessions")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "displayName": "Cloud Session",
                                  "state": {
                                    "selectedSetCode": "otj",
                                    "sessionStats": {
                                      "packsOpened": 4
                                    }
                                  }
                                }
                                """))
                .andExpect(status().isCreated());

        mockMvc.perform(get("/api/sessions/current")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.displayName").value("Cloud Session"))
                .andExpect(jsonPath("$.state.selectedSetCode").value("otj"))
                .andExpect(jsonPath("$.state.sessionStats.packsOpened").value(4));
    }

    @Test
    void distinguishesMissingInvalidAndExpiredCredentials() throws Exception {
        mockMvc.perform(get("/api/auth/me"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("AUTH_REQUIRED"));

        mockMvc.perform(get("/api/auth/me")
                        .header("Authorization", "Bearer unknown-token"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("AUTH_INVALID"));

        String authResponse = mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "displayName": "Expired User",
                                  "email": "expired-user@test.dev",
                                  "password": "password123"
                                }
                                """))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        UUID userId = UUID.fromString(objectMapper.readTree(authResponse).at("/user/id").asText());
        String expiredToken = "expired-token";
        authTokenRepository.save(new AuthTokenEntity(
                UUID.randomUUID(),
                userId,
                sha256(expiredToken),
                OffsetDateTime.now().minusMinutes(1)
        ));

        mockMvc.perform(get("/api/auth/me")
                        .header("Authorization", "Bearer " + expiredToken))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("AUTH_INVALID"));
    }

    private String sha256(String value) throws Exception {
        return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256")
                .digest(value.getBytes(StandardCharsets.UTF_8)));
    }
}
