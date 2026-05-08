package com.mtgpacksim.card;

import java.math.BigDecimal;

public record CardDto(
        String id,
        String name,
        String rarity,
        String imageUrl,
        BigDecimal priceUsd
) {
}
