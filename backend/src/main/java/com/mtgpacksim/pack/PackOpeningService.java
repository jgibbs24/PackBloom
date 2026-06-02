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
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ThreadLocalRandom;

@Service
public class PackOpeningService {
    private static final Logger LOGGER = LoggerFactory.getLogger(PackOpeningService.class);

    private final ScryfallClient scryfallClient;
    private final PackDefinitionService packDefinitionService;
    private final Map<String, List<CardDto>> cardPoolCache = new ConcurrentHashMap<>();

    public PackOpeningService(ScryfallClient scryfallClient, PackDefinitionService packDefinitionService) {
        this.scryfallClient = scryfallClient;
        this.packDefinitionService = packDefinitionService;
    }

    public OpenedPackDto openBloomburrowPack() {
        return openPack("blb", "play");
    }

    public OpenedPackDto openPack(String setCode, String boosterType) {
        PackDefinition definition = packDefinitionService.getDefinition(setCode, boosterType);
        List<CardDto> cards = definition.slots().parallelStream()
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
        definition.slots().parallelStream().forEach(this::warmUpSlot);
    }

    private List<CardDto> drawSlot(PackSlot slot) {
        if (!slot.hasAlternatePool()) {
            return drawCards(slot.cacheKey(), slot.query(), slot.count(), slot.name());
        }

        List<CardDto> cards = new ArrayList<>();
        for (int cardIndex = 0; cardIndex < slot.count(); cardIndex++) {
            boolean useAlternatePool = ThreadLocalRandom.current().nextDouble() < slot.alternateChance();
            String cacheKey = useAlternatePool ? slot.alternateCacheKey() : slot.cacheKey();
            String query = useAlternatePool ? slot.alternateQuery() : slot.query();
            cards.addAll(drawCards(cacheKey, query, 1, slot.name()));
        }
        return cards;
    }

    private List<CardDto> drawCards(String cacheKey, String query, int count, String slotName) {
        List<CardDto> pool = new ArrayList<>(cardPool(cacheKey, query));
        if (pool.size() < count) {
            throw new PackOpeningException("Not enough cards were available for pack slot: " + cacheKey);
        }
        Collections.shuffle(pool);
        return pool.subList(0, count).stream()
                .map(card -> card.withSlot(slotName))
                .toList();
    }

    private void warmUpSlot(PackSlot slot) {
        cardPool(slot.cacheKey(), slot.query());
        if (slot.hasAlternatePool()) {
            cardPool(slot.alternateCacheKey(), slot.alternateQuery());
        }
    }

    private List<CardDto> cardPool(String cacheKey, String query) {
        return cardPoolCache.computeIfAbsent(cacheKey, ignored -> loadCardPool(cacheKey, query));
    }

    private List<CardDto> loadCardPool(String cacheKey, String query) {
        LOGGER.info("Loading Scryfall card pool '{}' with query '{}'.", cacheKey, query);
        List<CardDto> cards = scryfallClient.searchCards(query);
        if (cards.isEmpty()) {
            throw new PackOpeningException("No cards were returned for pack slot: " + cacheKey);
        }
        LOGGER.info("Cached {} cards for Scryfall card pool '{}'.", cards.size(), cacheKey);
        return List.copyOf(cards);
    }
}
