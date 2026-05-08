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
import java.util.List;
import java.util.Map;
import java.util.Random;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class PackOpeningService {
    private static final Logger LOGGER = LoggerFactory.getLogger(PackOpeningService.class);

    private static final String SET_CODE = "blb";
    private static final double MYTHIC_CHANCE = 0.125;
    private static final Map<String, String> CARD_POOL_QUERIES = Map.of(
            "blb:common", "set:blb rarity:common is:booster -type:basic",
            "blb:uncommon", "set:blb rarity:uncommon is:booster",
            "blb:rare", "set:blb rarity:rare is:booster",
            "blb:mythic", "set:blb rarity:mythic is:booster",
            "blb:land", "set:blb type:basic"
    );

    private final ScryfallClient scryfallClient;
    private final Map<String, List<CardDto>> cardPoolCache = new ConcurrentHashMap<>();
    private final Random random = new Random();

    public PackOpeningService(ScryfallClient scryfallClient) {
        this.scryfallClient = scryfallClient;
    }

    public OpenedPackDto openBloomburrowPack() {
        List<CardDto> cards = new ArrayList<>();
        cards.addAll(drawCards("blb:common", 10));
        cards.addAll(drawCards("blb:uncommon", 3));

        boolean mythic = random.nextDouble() < MYTHIC_CHANCE;
        cards.add(drawOne(mythic ? "blb:mythic" : "blb:rare"));
        cards.add(drawOne("blb:land"));

        BigDecimal totalValueUsd = cards.stream()
                .map(CardDto::priceUsd)
                .reduce(BigDecimal.ZERO, BigDecimal::add)
                .setScale(2, RoundingMode.HALF_UP);

        return new OpenedPackDto(SET_CODE, cards, totalValueUsd);
    }

    private List<CardDto> drawCards(String cacheKey, int count) {
        List<CardDto> pool = new ArrayList<>(cardPool(cacheKey));
        if (pool.size() < count) {
            throw new PackOpeningException("Not enough cards were available for pack slot: " + cacheKey);
        }
        Collections.shuffle(pool, random);
        return pool.subList(0, count);
    }

    private List<CardDto> cardPool(String cacheKey) {
        return cardPoolCache.computeIfAbsent(cacheKey, this::loadCardPool);
    }

    private List<CardDto> loadCardPool(String cacheKey) {
        String query = CARD_POOL_QUERIES.get(cacheKey);
        if (query == null) {
            throw new PackOpeningException("Unknown pack slot cache key: " + cacheKey);
        }

        LOGGER.info("Loading Scryfall card pool '{}' with query '{}'.", cacheKey, query);
        List<CardDto> cards = scryfallClient.searchCards(query);
        if (cards.isEmpty()) {
            throw new PackOpeningException("No cards were returned for pack slot: " + cacheKey);
        }
        LOGGER.info("Cached {} cards for Scryfall card pool '{}'.", cards.size(), cacheKey);
        return List.copyOf(cards);
    }

    private CardDto drawOne(String cacheKey) {
        return drawCards(cacheKey, 1).getFirst();
    }
}
