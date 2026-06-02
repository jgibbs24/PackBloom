package com.mtgpacksim.scryfall;

import com.mtgpacksim.card.CardDto;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Component
public class ScryfallClient {
    private static final Logger LOGGER = LoggerFactory.getLogger(ScryfallClient.class);

    private final RestTemplate restTemplate;
    private final String baseUrl;

    public ScryfallClient(
            RestTemplate scryfallRestTemplate,
            @Value("${scryfall.base-url}") String baseUrl
    ) {
        this.restTemplate = scryfallRestTemplate;
        this.baseUrl = baseUrl;
    }

    public List<CardDto> searchCards(String query) {
        var uri = UriComponentsBuilder
                .fromHttpUrl(baseUrl)
                .path("/cards/search")
                .queryParam("unique", "prints")
                .queryParam("order", "set")
                .queryParam("q", query)
                .build()
                .encode()
                .toUri();

        try {
            ScryfallSearchResponse response = restTemplate.getForObject(uri, ScryfallSearchResponse.class);
            if (response == null || response.data() == null) {
                return List.of();
            }
            return response.data().stream()
                    .map(this::toCardDto)
                    .filter(card -> card.imageUrl() != null && !card.imageUrl().isBlank())
                    .toList();
        } catch (RestClientException exception) {
            LOGGER.error("Scryfall request failed for query '{}'. URL: {}", query, uri, exception);
            throw new ScryfallException("Scryfall is temporarily unavailable while loading cards for query: " + query, exception);
        }
    }

    private CardDto toCardDto(ScryfallCardResponse card) {
        PriceDetails priceDetails = priceUsd(card.prices());
        return new CardDto(
                card.id(),
                card.name(),
                card.rarity(),
                imageUrl(card),
                priceDetails.priceUsd(),
                priceDetails.available(),
                finishLabel(card.finishes()),
                treatmentLabel(card),
                null
        );
    }

    private String imageUrl(ScryfallCardResponse card) {
        return imageUri(card.imageUris())
                .or(() -> {
                    if (card.cardFaces() == null || card.cardFaces().length == 0) {
                        return Optional.empty();
                    }
                    return imageUri(card.cardFaces()[0].imageUris());
                })
                .orElse(null);
    }

    private Optional<String> imageUri(Map<String, String> imageUris) {
        if (imageUris == null) {
            return Optional.empty();
        }
        return Optional.ofNullable(imageUris.get("normal"))
                .or(() -> Optional.ofNullable(imageUris.get("large")))
                .or(() -> Optional.ofNullable(imageUris.get("small")));
    }

    private String finishLabel(List<String> finishes) {
        if (finishes == null || finishes.isEmpty()) {
            return null;
        }
        if (finishes.contains("etched")) {
            return "Etched foil";
        }
        if (finishes.contains("foil")) {
            return "Foil";
        }
        if (finishes.contains("nonfoil")) {
            return "Nonfoil";
        }
        return null;
    }

    private String treatmentLabel(ScryfallCardResponse card) {
        List<String> frameEffects = card.frameEffects() == null ? List.of() : card.frameEffects();
        if (frameEffects.contains("showcase")) {
            return "Showcase";
        }
        if (frameEffects.contains("extendedart")) {
            return "Extended art";
        }
        if ("borderless".equals(card.borderColor())) {
            return "Borderless";
        }
        if (Boolean.TRUE.equals(card.fullArt())) {
            return "Full art";
        }
        return null;
    }

    static PriceDetails priceUsd(Map<String, String> prices) {
        if (prices == null) {
            return PriceDetails.unavailable();
        }

        return priceValue(prices, "usd")
                .or(() -> priceValue(prices, "usd_foil"))
                .or(() -> priceValue(prices, "usd_etched"))
                .map(PriceDetails::available)
                .orElseGet(PriceDetails::unavailable);
    }

    private static Optional<BigDecimal> priceValue(Map<String, String> prices, String key) {
        String price = prices.get(key);
        if (price == null || price.isBlank()) {
            return Optional.empty();
        }

        return Optional.of(new BigDecimal(price).setScale(2, RoundingMode.HALF_UP));
    }

    record PriceDetails(BigDecimal priceUsd, boolean available) {
        static PriceDetails available(BigDecimal priceUsd) {
            return new PriceDetails(priceUsd, true);
        }

        static PriceDetails unavailable() {
            return new PriceDetails(BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP), false);
        }
    }
}
