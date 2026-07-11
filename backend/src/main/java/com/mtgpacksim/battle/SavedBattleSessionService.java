package com.mtgpacksim.battle;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
public class SavedBattleSessionService {
    private static final String DEFAULT_DISPLAY_NAME = "PackBloom Battle Session";
    private static final int MAX_DISPLAY_NAME_LENGTH = 120;

    private final ObjectMapper objectMapper;
    private final SavedBattleSessionRepository savedBattleSessionRepository;

    public SavedBattleSessionService(
            ObjectMapper objectMapper,
            SavedBattleSessionRepository savedBattleSessionRepository
    ) {
        this.objectMapper = objectMapper;
        this.savedBattleSessionRepository = savedBattleSessionRepository;
    }

    public SavedBattleSessionResponse createBattleSession(SavedBattleSessionRequest request) {
        validateRequest(request);

        SavedBattleSessionEntity entity = new SavedBattleSessionEntity(
                UUID.randomUUID(),
                normalizeDisplayName(request.displayName()),
                serializeState(request.state())
        );

        return toResponse(savedBattleSessionRepository.save(entity));
    }

    public SavedBattleSessionResponse getBattleSession(UUID id) {
        return savedBattleSessionRepository.findById(id)
                .map(this::toResponse)
                .orElseThrow(() -> new SavedBattleSessionException("Saved battle session not found."));
    }

    public SavedBattleSessionResponse updateBattleSession(UUID id, SavedBattleSessionRequest request) {
        validateRequest(request);

        SavedBattleSessionEntity entity = savedBattleSessionRepository.findById(id)
                .orElseThrow(() -> new SavedBattleSessionException("Saved battle session not found."));

        entity.setDisplayName(normalizeDisplayName(request.displayName()));
        entity.setStateJson(serializeState(request.state()));
        return toResponse(savedBattleSessionRepository.save(entity));
    }

    public void deleteBattleSession(UUID id) {
        if (!savedBattleSessionRepository.existsById(id)) {
            throw new SavedBattleSessionException("Saved battle session not found.");
        }
        savedBattleSessionRepository.deleteById(id);
    }

    private void validateRequest(SavedBattleSessionRequest request) {
        if (request == null || request.state() == null || request.state().isNull()) {
            throw new SavedBattleSessionException("Saved battle session state is required.");
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
            throw new SavedBattleSessionException("Saved battle session state could not be serialized.");
        }
    }

    private SavedBattleSessionResponse toResponse(SavedBattleSessionEntity entity) {
        try {
            return new SavedBattleSessionResponse(
                    entity.getId(),
                    entity.getDisplayName(),
                    objectMapper.readTree(entity.getStateJson()),
                    entity.getCreatedAt(),
                    entity.getUpdatedAt()
            );
        } catch (JsonProcessingException exception) {
            throw new SavedBattleSessionException("Saved battle session state could not be read.");
        }
    }
}
