package com.mtgpacksim.battle;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.mtgpacksim.auth.AuthenticatedUser;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.orm.ObjectOptimisticLockingFailureException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
public class SavedBattleSessionService {
    private static final String DEFAULT_DISPLAY_NAME = "PackBloom Battle Session";
    private static final int MAX_DISPLAY_NAME_LENGTH = 120;
    private static final int MAX_STATE_JSON_LENGTH = 1_000_000;

    private final ObjectMapper objectMapper;
    private final SavedBattleSessionRepository savedBattleSessionRepository;

    public SavedBattleSessionService(
            ObjectMapper objectMapper,
            SavedBattleSessionRepository savedBattleSessionRepository
    ) {
        this.objectMapper = objectMapper;
        this.savedBattleSessionRepository = savedBattleSessionRepository;
    }

    @Transactional
    public SavedBattleSessionResponse createBattleSession(
            SavedBattleSessionRequest request,
            AuthenticatedUser user
    ) {
        validateRequest(request);
        if (savedBattleSessionRepository.findByUserId(user.id()).isPresent()) {
            throw conflict();
        }

        SavedBattleSessionEntity entity = new SavedBattleSessionEntity(
                UUID.randomUUID(),
                normalizeDisplayName(request.displayName()),
                serializeState(request.state())
        );
        entity.setUserId(user.id());
        return persistNew(entity);
    }

    @Transactional(readOnly = true)
    public SavedBattleSessionResponse getCurrentBattleSession(AuthenticatedUser user) {
        return savedBattleSessionRepository.findByUserId(user.id())
                .map(this::toResponse)
                .orElseThrow(() -> new SavedBattleSessionException("Saved battle session not found."));
    }

    @Transactional
    public SavedBattleSessionResponse saveCurrentBattleSession(
            SavedBattleSessionRequest request,
            AuthenticatedUser user
    ) {
        validateRequest(request);
        return savedBattleSessionRepository.findByUserId(user.id())
                .map(entity -> updateEntity(entity, request, user))
                .orElseGet(() -> {
                    if (request.expectedRevision() != null) {
                        throw conflict();
                    }
                    return createBattleSession(request, user);
                });
    }

    @Transactional(readOnly = true)
    public SavedBattleSessionResponse getBattleSession(UUID id, AuthenticatedUser user) {
        return savedBattleSessionRepository.findById(id)
                .map(entity -> requireAccess(entity, user))
                .map(this::toResponse)
                .orElseThrow(() -> new SavedBattleSessionException("Saved battle session not found."));
    }

    @Transactional
    public SavedBattleSessionResponse updateBattleSession(
            UUID id,
            SavedBattleSessionRequest request,
            AuthenticatedUser user
    ) {
        validateRequest(request);
        SavedBattleSessionEntity entity = savedBattleSessionRepository.findById(id)
                .orElseThrow(() -> new SavedBattleSessionException("Saved battle session not found."));
        return updateEntity(entity, request, user);
    }

    @Transactional
    public void deleteBattleSession(UUID id, AuthenticatedUser user) {
        SavedBattleSessionEntity entity = savedBattleSessionRepository.findById(id)
                .orElseThrow(() -> new SavedBattleSessionException("Saved battle session not found."));
        savedBattleSessionRepository.delete(requireAccess(entity, user));
    }

    @Transactional
    public void deleteCurrentBattleSession(AuthenticatedUser user) {
        SavedBattleSessionEntity entity = savedBattleSessionRepository.findByUserId(user.id())
                .orElseThrow(() -> new SavedBattleSessionException("Saved battle session not found."));
        savedBattleSessionRepository.delete(entity);
    }

    private SavedBattleSessionResponse updateEntity(
            SavedBattleSessionEntity entity,
            SavedBattleSessionRequest request,
            AuthenticatedUser user
    ) {
        requireAccess(entity, user);
        if (request.expectedRevision() == null
                || request.expectedRevision().longValue() != entity.getRevision()) {
            throw conflict();
        }

        entity.setDisplayName(normalizeDisplayName(request.displayName()));
        entity.setStateJson(serializeState(request.state()));
        try {
            return toResponse(savedBattleSessionRepository.saveAndFlush(entity));
        } catch (ObjectOptimisticLockingFailureException exception) {
            throw conflict();
        }
    }

    private SavedBattleSessionEntity requireAccess(
            SavedBattleSessionEntity entity,
            AuthenticatedUser user
    ) {
        if (entity.getUserId() != null && entity.getUserId().equals(user.id())) {
            return entity;
        }
        throw new SavedBattleSessionException("Saved battle session not found.");
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
            String serializedState = objectMapper.writeValueAsString(state);
            if (serializedState.length() > MAX_STATE_JSON_LENGTH) {
                throw new SavedBattleSessionException("Saved battle session state is too large.");
            }
            return serializedState;
        } catch (JsonProcessingException exception) {
            throw new SavedBattleSessionException("Saved battle session state could not be serialized.");
        }
    }

    private SavedBattleSessionResponse persistNew(SavedBattleSessionEntity entity) {
        try {
            return toResponse(savedBattleSessionRepository.saveAndFlush(entity));
        } catch (DataIntegrityViolationException exception) {
            throw conflict();
        }
    }

    private SavedBattleSessionConflictException conflict() {
        return new SavedBattleSessionConflictException(
                "Saved battle session changed in another browser. Reload before saving again."
        );
    }

    private SavedBattleSessionResponse toResponse(SavedBattleSessionEntity entity) {
        try {
            return new SavedBattleSessionResponse(
                    entity.getId(),
                    entity.getDisplayName(),
                    objectMapper.readTree(entity.getStateJson()),
                    entity.getRevision(),
                    entity.getCreatedAt(),
                    entity.getUpdatedAt()
            );
        } catch (JsonProcessingException exception) {
            throw new SavedBattleSessionException("Saved battle session state could not be read.");
        }
    }
}
