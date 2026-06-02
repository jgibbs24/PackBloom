package com.mtgpacksim.scryfall;

import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

class ScryfallClientTest {
    @Test
    void prefersUsdPriceWhenPresent() {
        ScryfallClient.PriceDetails priceDetails = ScryfallClient.priceUsd(Map.of(
                "usd", "1.234",
                "usd_foil", "5.00",
                "usd_etched", "7.00"
        ));

        assertThat(priceDetails.available()).isTrue();
        assertThat(priceDetails.priceUsd()).isEqualByComparingTo("1.23");
    }

    @Test
    void fallsBackToFoilAndEtchedPrices() {
        ScryfallClient.PriceDetails foilPrice = ScryfallClient.priceUsd(Map.of(
                "usd", "",
                "usd_foil", "5.00",
                "usd_etched", "7.00"
        ));
        ScryfallClient.PriceDetails etchedPrice = ScryfallClient.priceUsd(Map.of(
                "usd_etched", "7.00"
        ));

        assertThat(foilPrice.available()).isTrue();
        assertThat(foilPrice.priceUsd()).isEqualByComparingTo("5.00");
        assertThat(etchedPrice.available()).isTrue();
        assertThat(etchedPrice.priceUsd()).isEqualByComparingTo("7.00");
    }

    @Test
    void marksMissingPricesAsUnavailable() {
        ScryfallClient.PriceDetails priceDetails = ScryfallClient.priceUsd(Map.of());

        assertThat(priceDetails.available()).isFalse();
        assertThat(priceDetails.priceUsd()).isEqualByComparingTo(BigDecimal.ZERO);
        assertThat(priceDetails.priceUsd().scale()).isEqualTo(2);
    }
}
