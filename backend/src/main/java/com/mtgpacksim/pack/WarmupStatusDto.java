package com.mtgpacksim.pack;

public record WarmupStatusDto(
        String setCode,
        String boosterType,
        String status,
        int loadedPools,
        int totalPools
) {
}
