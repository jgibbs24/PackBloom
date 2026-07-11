package com.mtgpacksim.session;

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
@RequestMapping("/api/sessions")
public class SavedSessionController {
    private final SavedSessionService savedSessionService;

    public SavedSessionController(SavedSessionService savedSessionService) {
        this.savedSessionService = savedSessionService;
    }

    @PostMapping
    public ResponseEntity<SavedSessionResponse> createSession(@RequestBody SavedSessionRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(savedSessionService.createSession(request));
    }

    @GetMapping("/{id}")
    public ResponseEntity<SavedSessionResponse> getSession(@PathVariable UUID id) {
        return ResponseEntity.ok(savedSessionService.getSession(id));
    }

    @PutMapping("/{id}")
    public ResponseEntity<SavedSessionResponse> updateSession(
            @PathVariable UUID id,
            @RequestBody SavedSessionRequest request
    ) {
        return ResponseEntity.ok(savedSessionService.updateSession(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteSession(@PathVariable UUID id) {
        savedSessionService.deleteSession(id);
        return ResponseEntity.noContent().build();
    }
}
