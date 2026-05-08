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
        return new CardDto(
                card.id(),
                card.name(),
                card.rarity(),
                imageUrl(card),
                priceUsd(card.prices())
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

    private BigDecimal priceUsd(Map<String, String> prices) {
        if (prices == null || prices.get("usd") == null || prices.get("usd").isBlank()) {
            return BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
        }
        return new BigDecimal(prices.get("usd")).setScale(2, RoundingMode.HALF_UP);
    }
}
