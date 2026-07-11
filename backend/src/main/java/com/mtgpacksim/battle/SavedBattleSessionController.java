package com.mtgpacksim.battle;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/battle-sessions")
public class SavedBattleSessionController {
    private final SavedBattleSessionService savedBattleSessionService;

    public SavedBattleSessionController(SavedBattleSessionService savedBattleSessionService) {
        this.savedBattleSessionService = savedBattleSessionService;
    }

    @PostMapping
    public ResponseEntity<SavedBattleSessionResponse> createBattleSession(
            @RequestBody SavedBattleSessionRequest request
    ) {
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(savedBattleSessionService.createBattleSession(request));
    }

    @GetMapping("/{id}")
    public ResponseEntity<SavedBattleSessionResponse> getBattleSession(@PathVariable UUID id) {
        return ResponseEntity.ok(savedBattleSessionService.getBattleSession(id));
    }

    @PutMapping("/{id}")
    public ResponseEntity<SavedBattleSessionResponse> updateBattleSession(
            @PathVariable UUID id,
            @RequestBody SavedBattleSessionRequest request
    ) {
        return ResponseEntity.ok(savedBattleSessionService.updateBattleSession(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteBattleSession(@PathVariable UUID id) {
        savedBattleSessionService.deleteBattleSession(id);
        return ResponseEntity.noContent().build();
    }
}
