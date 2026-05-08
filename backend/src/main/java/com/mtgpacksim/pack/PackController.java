package com.mtgpacksim.pack;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
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

    @GetMapping("/blb/open")
    public CompletableFuture<ResponseEntity<OpenedPackDto>> openBloomburrowPack() {
        return CompletableFuture
                .supplyAsync(packOpeningService::openBloomburrowPack)
                .orTimeout(PACK_OPENING_TIMEOUT.toSeconds(), TimeUnit.SECONDS)
                .thenApply(ResponseEntity::ok);
    }
}
