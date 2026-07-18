package com.mtgpacksim.battle;

import com.mtgpacksim.auth.AuthService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/battle-sessions")
public class SavedBattleSessionController {
    private final AuthService authService;
    private final SavedBattleSessionService savedBattleSessionService;

    public SavedBattleSessionController(
            AuthService authService,
            SavedBattleSessionService savedBattleSessionService
    ) {
        this.authService = authService;
        this.savedBattleSessionService = savedBattleSessionService;
    }

    @PostMapping
    public ResponseEntity<SavedBattleSessionResponse> createBattleSession(
            @RequestHeader(value = "Authorization", required = false) String authorizationHeader,
            @RequestBody SavedBattleSessionRequest request
    ) {
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(savedBattleSessionService.createBattleSession(
                        request,
                        authService.requireUser(authorizationHeader)
                ));
    }

    @GetMapping("/current")
    public ResponseEntity<SavedBattleSessionResponse> getCurrentBattleSession(
            @RequestHeader(value = "Authorization", required = false) String authorizationHeader
    ) {
        return ResponseEntity.ok(savedBattleSessionService.getCurrentBattleSession(
                authService.requireUser(authorizationHeader)
        ));
    }

    @PutMapping("/current")
    public ResponseEntity<SavedBattleSessionResponse> saveCurrentBattleSession(
            @RequestHeader(value = "Authorization", required = false) String authorizationHeader,
            @RequestBody SavedBattleSessionRequest request
    ) {
        return ResponseEntity.ok(savedBattleSessionService.saveCurrentBattleSession(
                request,
                authService.requireUser(authorizationHeader)
        ));
    }

    @DeleteMapping("/current")
    public ResponseEntity<Void> deleteCurrentBattleSession(
            @RequestHeader(value = "Authorization", required = false) String authorizationHeader
    ) {
        savedBattleSessionService.deleteCurrentBattleSession(authService.requireUser(authorizationHeader));
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}")
    public ResponseEntity<SavedBattleSessionResponse> getBattleSession(
            @RequestHeader(value = "Authorization", required = false) String authorizationHeader,
            @PathVariable UUID id
    ) {
        return ResponseEntity.ok(savedBattleSessionService.getBattleSession(
                id,
                authService.requireUser(authorizationHeader)
        ));
    }

    @PutMapping("/{id}")
    public ResponseEntity<SavedBattleSessionResponse> updateBattleSession(
            @RequestHeader(value = "Authorization", required = false) String authorizationHeader,
            @PathVariable UUID id,
            @RequestBody SavedBattleSessionRequest request
    ) {
        return ResponseEntity.ok(savedBattleSessionService.updateBattleSession(
                id,
                request,
                authService.requireUser(authorizationHeader)
        ));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteBattleSession(
            @RequestHeader(value = "Authorization", required = false) String authorizationHeader,
            @PathVariable UUID id
    ) {
        savedBattleSessionService.deleteBattleSession(id, authService.requireUser(authorizationHeader));
        return ResponseEntity.noContent().build();
    }
}
