package com.mtgpacksim.pack;

import com.mtgpacksim.card.CardDto;
import com.mtgpacksim.scryfall.ScryfallClient;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ThreadLocalRandom;

@Service
public class PackOpeningService {
    private static final Logger LOGGER = LoggerFactory.getLogger(PackOpeningService.class);

    private final ScryfallClient scryfallClient;
    private final PackDefinitionService packDefinitionService;
    private final Map<String, List<CardDto>> cardPoolCache = new ConcurrentHashMap<>();
    private final Map<String, WarmupStatusDto> warmupStatuses = new ConcurrentHashMap<>();
    private final Map<String, Boolean> activeWarmups = new ConcurrentHashMap<>();

    public PackOpeningService(ScryfallClient scryfallClient, PackDefinitionService packDefinitionService) {
        this.scryfallClient = scryfallClient;
        this.packDefinitionService = packDefinitionService;
    }

    public OpenedPackDto openBloomburrowPack() {
        return openPack("blb", "play");
    }

    public OpenedPackDto openPack(String setCode, String boosterType) {
        PackDefinition definition = packDefinitionService.getDefinition(setCode, boosterType);
        List<CardDto> cards = definition.slots().stream()
                .map(this::drawSlot)
                .flatMap(List::stream)
                .toList();

        BigDecimal totalValueUsd = cards.stream()
                .map(CardDto::priceUsd)
                .reduce(BigDecimal.ZERO, BigDecimal::add)
                .setScale(2, RoundingMode.HALF_UP);

        return new OpenedPackDto(definition.setCode(), cards, totalValueUsd);
    }

    public void warmUpPack(String setCode, String boosterType) {
        PackDefinition definition = packDefinitionService.getDefinition(setCode, boosterType);
        List<PoolRequest> pools = poolRequests(definition);
        String warmupKey = warmupKey(definition);
        warmupStatuses.put(warmupKey, status(definition, "loading", pools));
        warmUpPools(definition, pools);
    }

    public WarmupStatusDto startWarmUpPack(String setCode, String boosterType) {
        PackDefinition definition = packDefinitionService.getDefinition(setCode, boosterType);
        List<PoolRequest> pools = poolRequests(definition);
        String warmupKey = warmupKey(definition);
        WarmupStatusDto currentStatus = status(definition, allPoolsCached(pools) ? "ready" : "loading", pools);
        warmupStatuses.put(warmupKey, currentStatus);

        if ("ready".equals(currentStatus.status()) || activeWarmups.putIfAbsent(warmupKey, true) != null) {
            return currentStatus;
        }

        CompletableFuture.runAsync(() -> {
            try {
                warmUpPools(definition, pools);
            } catch (RuntimeException exception) {
                LOGGER.warn("Pack warmup failed for '{}' / '{}'.", definition.setCode(), definition.boosterType(), exception);
                warmupStatuses.put(warmupKey, status(definition, "error", pools));
            } finally {
                activeWarmups.remove(warmupKey);
            }
        });

        return currentStatus;
    }

    public WarmupStatusDto warmUpStatus(String setCode, String boosterType) {
        PackDefinition definition = packDefinitionService.getDefinition(setCode, boosterType);
        List<PoolRequest> pools = poolRequests(definition);
        String warmupKey = warmupKey(definition);
        WarmupStatusDto currentStatus = warmupStatuses.get(warmupKey);
        if (currentStatus != null && "error".equals(currentStatus.status())) {
            return currentStatus;
        }
        if (currentStatus != null && activeWarmups.containsKey(warmupKey)) {
            return status(definition, "loading", pools);
        }

        return status(definition, allPoolsCached(pools) ? "ready" : "idle", pools);
    }

    private List<CardDto> drawSlot(PackSlot slot) {
        if (!slot.hasAlternatePool()) {
            return drawCards(
                    slot.cacheKey(),
                    slot.query(),
                    slot.fallbackCacheKey(),
                    slot.fallbackQuery(),
                    slot.count(),
                    slot.name()
            );
        }

        List<CardDto> cards = new ArrayList<>();
        for (int cardIndex = 0; cardIndex < slot.count(); cardIndex++) {
            boolean useAlternatePool = ThreadLocalRandom.current().nextDouble() < slot.alternateChance();
            String cacheKey = useAlternatePool ? slot.alternateCacheKey() : slot.cacheKey();
            String query = useAlternatePool ? slot.alternateQuery() : slot.query();
            String fallbackCacheKey = useAlternatePool ? slot.alternateFallbackCacheKey() : slot.fallbackCacheKey();
            String fallbackQuery = useAlternatePool ? slot.alternateFallbackQuery() : slot.fallbackQuery();
            cards.addAll(drawCards(cacheKey, query, fallbackCacheKey, fallbackQuery, 1, slot.name()));
        }
        return cards;
    }

    private List<CardDto> drawCards(
            String cacheKey,
            String query,
            String fallbackCacheKey,
            String fallbackQuery,
            int count,
            String slotName
    ) {
        List<CardDto> pool = new ArrayList<>(cardPool(cacheKey, query));
        if (pool.size() < count && fallbackCacheKey != null && fallbackQuery != null) {
            LOGGER.info("Using fallback Scryfall card pool '{}' for slot '{}'.", fallbackCacheKey, slotName);
            pool = new ArrayList<>(cardPool(fallbackCacheKey, fallbackQuery));
        }
        if (pool.size() < count) {
            throw new PackOpeningException("Not enough cards were available for pack slot: " + cacheKey);
        }
        Collections.shuffle(pool);
        return pool.subList(0, count).stream()
                .map(card -> card.withSlot(slotName))
                .toList();
    }

    private void warmUpPools(PackDefinition definition, List<PoolRequest> pools) {
        String warmupKey = warmupKey(definition);
        for (PoolRequest pool : pools) {
            cardPool(pool.cacheKey(), pool.query());
            warmupStatuses.put(warmupKey, status(definition, "loading", pools));
            pauseBetweenWarmupRequests();
        }
        warmupStatuses.put(warmupKey, status(definition, "ready", pools));
    }

    private List<CardDto> cardPool(String cacheKey, String query) {
        return cardPoolCache.computeIfAbsent(cacheKey, ignored -> loadCardPool(cacheKey, query));
    }

    private List<CardDto> loadCardPool(String cacheKey, String query) {
        LOGGER.info("Loading Scryfall card pool '{}' with query '{}'.", cacheKey, query);
        List<CardDto> cards = scryfallClient.searchCards(query);
        if (cards.isEmpty()) {
            LOGGER.info("No cards were returned for Scryfall card pool '{}'.", cacheKey);
            return List.of();
        }
        LOGGER.info("Cached {} cards for Scryfall card pool '{}'.", cards.size(), cacheKey);
        return List.copyOf(cards);
    }

    private List<PoolRequest> poolRequests(PackDefinition definition) {
        Map<String, PoolRequest> poolsByCacheKey = new LinkedHashMap<>();
        for (PackSlot slot : definition.slots()) {
            addPoolRequest(poolsByCacheKey, slot.cacheKey(), slot.query());
            addPoolRequest(poolsByCacheKey, slot.fallbackCacheKey(), slot.fallbackQuery());
            addPoolRequest(poolsByCacheKey, slot.alternateCacheKey(), slot.alternateQuery());
            addPoolRequest(poolsByCacheKey, slot.alternateFallbackCacheKey(), slot.alternateFallbackQuery());
        }
        return List.copyOf(poolsByCacheKey.values());
    }

    private void addPoolRequest(Map<String, PoolRequest> poolsByCacheKey, String cacheKey, String query) {
        if (cacheKey != null && query != null) {
            poolsByCacheKey.putIfAbsent(cacheKey, new PoolRequest(cacheKey, query));
        }
    }

    private WarmupStatusDto status(PackDefinition definition, String status, List<PoolRequest> pools) {
        return new WarmupStatusDto(
                definition.setCode(),
                definition.boosterType(),
                status,
                loadedPoolCount(pools),
                pools.size()
        );
    }

    private boolean allPoolsCached(List<PoolRequest> pools) {
        return loadedPoolCount(pools) >= pools.size();
    }

    private int loadedPoolCount(List<PoolRequest> pools) {
        return (int) pools.stream()
                .filter(pool -> cardPoolCache.containsKey(pool.cacheKey()))
                .count();
    }

    private String warmupKey(PackDefinition definition) {
        return definition.setCode() + ":" + definition.boosterType();
    }

    private void pauseBetweenWarmupRequests() {
        try {
            Thread.sleep(250);
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
        }
    }

    private record PoolRequest(String cacheKey, String query) {
    }
}
