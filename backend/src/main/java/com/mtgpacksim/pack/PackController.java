package com.mtgpacksim.pack;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Duration;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.TimeUnit;

@RestController
@RequestMapping("/api/packs")
public class PackController {
    private static final Duration PACK_OPENING_TIMEOUT = Duration.ofSeconds(25);

    private final PackOpeningService packOpeningService;

    public PackController(PackOpeningService packOpeningService) {
        this.packOpeningService = packOpeningService;
    }

    @GetMapping("/{setCode}/open")
    public CompletableFuture<ResponseEntity<OpenedPackDto>> openPack(
            @PathVariable String setCode,
            @RequestParam(defaultValue = "play") String boosterType
    ) {
        return CompletableFuture
                .supplyAsync(() -> packOpeningService.openPack(setCode, boosterType))
                .orTimeout(PACK_OPENING_TIMEOUT.toSeconds(), TimeUnit.SECONDS)
                .thenApply(ResponseEntity::ok);
    }

    @GetMapping("/{setCode}/warmup")
    public CompletableFuture<ResponseEntity<Void>> warmUpPack(
            @PathVariable String setCode,
            @RequestParam(defaultValue = "play") String boosterType
    ) {
        return CompletableFuture
                .runAsync(() -> packOpeningService.warmUpPack(setCode, boosterType))
                .orTimeout(PACK_OPENING_TIMEOUT.toSeconds(), TimeUnit.SECONDS)
                .thenApply(ignored -> ResponseEntity.accepted().build());
    }
}
