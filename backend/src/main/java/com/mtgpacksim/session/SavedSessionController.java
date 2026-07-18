package com.mtgpacksim.session;

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
@RequestMapping("/api/sessions")
public class SavedSessionController {
    private final AuthService authService;
    private final SavedSessionService savedSessionService;

    public SavedSessionController(AuthService authService, SavedSessionService savedSessionService) {
        this.authService = authService;
        this.savedSessionService = savedSessionService;
    }

    @PostMapping
    public ResponseEntity<SavedSessionResponse> createSession(
            @RequestHeader(value = "Authorization", required = false) String authorizationHeader,
            @RequestBody SavedSessionRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(savedSessionService.createSession(
                request,
                authService.requireUser(authorizationHeader)
        ));
    }

    @GetMapping("/current")
    public ResponseEntity<SavedSessionResponse> getCurrentSession(
            @RequestHeader(value = "Authorization", required = false) String authorizationHeader
    ) {
        return ResponseEntity.ok(savedSessionService.getCurrentSession(authService.requireUser(authorizationHeader)));
    }

    @PutMapping("/current")
    public ResponseEntity<SavedSessionResponse> saveCurrentSession(
            @RequestHeader(value = "Authorization", required = false) String authorizationHeader,
            @RequestBody SavedSessionRequest request
    ) {
        return ResponseEntity.ok(savedSessionService.saveCurrentSession(
                request,
                authService.requireUser(authorizationHeader)
        ));
    }

    @DeleteMapping("/current")
    public ResponseEntity<Void> deleteCurrentSession(
            @RequestHeader(value = "Authorization", required = false) String authorizationHeader
    ) {
        savedSessionService.deleteCurrentSession(authService.requireUser(authorizationHeader));
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}")
    public ResponseEntity<SavedSessionResponse> getSession(
            @RequestHeader(value = "Authorization", required = false) String authorizationHeader,
            @PathVariable UUID id
    ) {
        return ResponseEntity.ok(savedSessionService.getSession(id, authService.requireUser(authorizationHeader)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<SavedSessionResponse> updateSession(
            @RequestHeader(value = "Authorization", required = false) String authorizationHeader,
            @PathVariable UUID id,
            @RequestBody SavedSessionRequest request
    ) {
        return ResponseEntity.ok(savedSessionService.updateSession(
                id,
                request,
                authService.requireUser(authorizationHeader)
        ));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteSession(
            @RequestHeader(value = "Authorization", required = false) String authorizationHeader,
            @PathVariable UUID id
    ) {
        savedSessionService.deleteSession(id, authService.requireUser(authorizationHeader));
        return ResponseEntity.noContent().build();
    }
}
