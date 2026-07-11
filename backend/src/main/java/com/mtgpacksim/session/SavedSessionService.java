package com.mtgpacksim.session;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
public class SavedSessionService {
    private static final String DEFAULT_DISPLAY_NAME = "PackBloom Session";
    private static final int MAX_DISPLAY_NAME_LENGTH = 120;

    private final ObjectMapper objectMapper;
    private final SavedSessionRepository savedSessionRepository;

    public SavedSessionService(ObjectMapper objectMapper, SavedSessionRepository savedSessionRepository) {
        this.objectMapper = objectMapper;
        this.savedSessionRepository = savedSessionRepository;
    }

    public SavedSessionResponse createSession(SavedSessionRequest request) {
        validateRequest(request);

        SavedSessionEntity entity = new SavedSessionEntity(
                UUID.randomUUID(),
                normalizeDisplayName(request.displayName()),
                serializeState(request.state())
        );

        return toResponse(savedSessionRepository.save(entity));
    }

    public SavedSessionResponse getSession(UUID id) {
        return savedSessionRepository.findById(id)
                .map(this::toResponse)
                .orElseThrow(() -> new SavedSessionException("Saved session not found."));
    }

    public SavedSessionResponse updateSession(UUID id, SavedSessionRequest request) {
        validateRequest(request);

        SavedSessionEntity entity = savedSessionRepository.findById(id)
                .orElseThrow(() -> new SavedSessionException("Saved session not found."));

        entity.setDisplayName(normalizeDisplayName(request.displayName()));
        entity.setStateJson(serializeState(request.state()));
        return toResponse(savedSessionRepository.save(entity));
    }

    public void deleteSession(UUID id) {
        if (!savedSessionRepository.existsById(id)) {
            throw new SavedSessionException("Saved session not found.");
        }
        savedSessionRepository.deleteById(id);
    }

    private void validateRequest(SavedSessionRequest request) {
        if (request == null || request.state() == null || request.state().isNull()) {
            throw new SavedSessionException("Saved session state is required.");
        }
    }

    private String normalizeDisplayName(String displayName) {
        String normalizedName = displayName == null || displayName.isBlank()
                ? DEFAULT_DISPLAY_NAME
                : displayName.trim();
        return normalizedName.length() <= MAX_DISPLAY_NAME_LENGTH
                ? normalizedName
                : normalizedName.substring(0, MAX_DISPLAY_NAME_LENGTH);
    }

    private String serializeState(JsonNode state) {
        try {
            return objectMapper.writeValueAsString(state);
        } catch (JsonProcessingException exception) {
            throw new SavedSessionException("Saved session state could not be serialized.");
        }
    }

    private SavedSessionResponse toResponse(SavedSessionEntity entity) {
        try {
            return new SavedSessionResponse(
                    entity.getId(),
                    entity.getDisplayName(),
                    objectMapper.readTree(entity.getStateJson()),
                    entity.getCreatedAt(),
                    entity.getUpdatedAt()
            );
        } catch (JsonProcessingException exception) {
            throw new SavedSessionException("Saved session state could not be read.");
        }
    }
}
