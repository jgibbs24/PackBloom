package com.mtgpacksim.session;

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
public class SavedSessionService {
    private static final String DEFAULT_DISPLAY_NAME = "PackBloom Session";
    private static final int MAX_DISPLAY_NAME_LENGTH = 120;
    private static final int MAX_STATE_JSON_LENGTH = 1_000_000;

    private final ObjectMapper objectMapper;
    private final SavedSessionRepository savedSessionRepository;

    public SavedSessionService(ObjectMapper objectMapper, SavedSessionRepository savedSessionRepository) {
        this.objectMapper = objectMapper;
        this.savedSessionRepository = savedSessionRepository;
    }

    @Transactional
    public SavedSessionResponse createSession(SavedSessionRequest request, AuthenticatedUser user) {
        validateRequest(request);
        if (savedSessionRepository.findByUserId(user.id()).isPresent()) {
            throw conflict();
        }

        SavedSessionEntity entity = new SavedSessionEntity(
                UUID.randomUUID(),
                normalizeDisplayName(request.displayName()),
                serializeState(request.state())
        );
        entity.setUserId(user.id());
        return persistNew(entity);
    }

    @Transactional(readOnly = true)
    public SavedSessionResponse getCurrentSession(AuthenticatedUser user) {
        return savedSessionRepository.findByUserId(user.id())
                .map(this::toResponse)
                .orElseThrow(() -> new SavedSessionException("Saved session not found."));
    }

    @Transactional
    public SavedSessionResponse saveCurrentSession(SavedSessionRequest request, AuthenticatedUser user) {
        validateRequest(request);
        return savedSessionRepository.findByUserId(user.id())
                .map(entity -> updateEntity(entity, request, user))
                .orElseGet(() -> {
                    if (request.expectedRevision() != null) {
                        throw conflict();
                    }
                    return createSession(request, user);
                });
    }

    @Transactional(readOnly = true)
    public SavedSessionResponse getSession(UUID id, AuthenticatedUser user) {
        return savedSessionRepository.findById(id)
                .map(entity -> requireAccess(entity, user))
                .map(this::toResponse)
                .orElseThrow(() -> new SavedSessionException("Saved session not found."));
    }

    @Transactional
    public SavedSessionResponse updateSession(UUID id, SavedSessionRequest request, AuthenticatedUser user) {
        validateRequest(request);
        SavedSessionEntity entity = savedSessionRepository.findById(id)
                .orElseThrow(() -> new SavedSessionException("Saved session not found."));
        return updateEntity(entity, request, user);
    }

    @Transactional
    public void deleteSession(UUID id, AuthenticatedUser user) {
        SavedSessionEntity entity = savedSessionRepository.findById(id)
                .orElseThrow(() -> new SavedSessionException("Saved session not found."));
        savedSessionRepository.delete(requireAccess(entity, user));
    }

    @Transactional
    public void deleteCurrentSession(AuthenticatedUser user) {
        SavedSessionEntity entity = savedSessionRepository.findByUserId(user.id())
                .orElseThrow(() -> new SavedSessionException("Saved session not found."));
        savedSessionRepository.delete(entity);
    }

    private SavedSessionResponse updateEntity(
            SavedSessionEntity entity,
            SavedSessionRequest request,
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
            return toResponse(savedSessionRepository.saveAndFlush(entity));
        } catch (ObjectOptimisticLockingFailureException exception) {
            throw conflict();
        }
    }

    private SavedSessionEntity requireAccess(SavedSessionEntity entity, AuthenticatedUser user) {
        if (entity.getUserId() != null && entity.getUserId().equals(user.id())) {
            return entity;
        }
        throw new SavedSessionException("Saved session not found.");
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
            String serializedState = objectMapper.writeValueAsString(state);
            if (serializedState.length() > MAX_STATE_JSON_LENGTH) {
                throw new SavedSessionException("Saved session state is too large.");
            }
            return serializedState;
        } catch (JsonProcessingException exception) {
            throw new SavedSessionException("Saved session state could not be serialized.");
        }
    }

    private SavedSessionResponse persistNew(SavedSessionEntity entity) {
        try {
            return toResponse(savedSessionRepository.saveAndFlush(entity));
        } catch (DataIntegrityViolationException exception) {
            throw conflict();
        }
    }

    private SavedSessionConflictException conflict() {
        return new SavedSessionConflictException(
                "Saved session changed in another browser. Reload before saving again."
        );
    }

    private SavedSessionResponse toResponse(SavedSessionEntity entity) {
        try {
            return new SavedSessionResponse(
                    entity.getId(),
                    entity.getDisplayName(),
                    objectMapper.readTree(entity.getStateJson()),
                    entity.getRevision(),
                    entity.getCreatedAt(),
                    entity.getUpdatedAt()
            );
        } catch (JsonProcessingException exception) {
            throw new SavedSessionException("Saved session state could not be read.");
        }
    }
}
