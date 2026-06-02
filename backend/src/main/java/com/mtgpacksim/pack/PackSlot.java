package com.mtgpacksim.pack;

public record PackSlot(
        String name,
        int count,
        String cacheKey,
        String query,
        String fallbackCacheKey,
        String fallbackQuery,
        String alternateCacheKey,
        String alternateQuery,
        String alternateFallbackCacheKey,
        String alternateFallbackQuery,
        double alternateChance
) {
    public static PackSlot fixed(String name, int count, String cacheKey, String query) {
        return new PackSlot(name, count, cacheKey, query, null, null, null, null, null, null, 0);
    }

    public static PackSlot rareOrMythic(
            String name,
            String rareCacheKey,
            String rareQuery,
            String mythicCacheKey,
            String mythicQuery,
            double mythicChance
    ) {
        return rareOrMythic(name, 1, rareCacheKey, rareQuery, mythicCacheKey, mythicQuery, mythicChance);
    }

    public static PackSlot rareOrMythic(
            String name,
            int count,
            String rareCacheKey,
            String rareQuery,
            String mythicCacheKey,
            String mythicQuery,
            double mythicChance
    ) {
        return new PackSlot(name, count, rareCacheKey, rareQuery, null, null, mythicCacheKey, mythicQuery, null, null, mythicChance);
    }

    public static PackSlot rareOrMythicWithFallback(
            String name,
            int count,
            String rareCacheKey,
            String rareQuery,
            String rareFallbackCacheKey,
            String rareFallbackQuery,
            String mythicCacheKey,
            String mythicQuery,
            String mythicFallbackCacheKey,
            String mythicFallbackQuery,
            double mythicChance
    ) {
        return new PackSlot(
                name,
                count,
                rareCacheKey,
                rareQuery,
                rareFallbackCacheKey,
                rareFallbackQuery,
                mythicCacheKey,
                mythicQuery,
                mythicFallbackCacheKey,
                mythicFallbackQuery,
                mythicChance
        );
    }

    public boolean hasAlternatePool() {
        return alternateCacheKey != null && alternateQuery != null;
    }

    public boolean hasFallbackPool() {
        return fallbackCacheKey != null && fallbackQuery != null;
    }

    public boolean hasAlternateFallbackPool() {
        return alternateFallbackCacheKey != null && alternateFallbackQuery != null;
    }
}
