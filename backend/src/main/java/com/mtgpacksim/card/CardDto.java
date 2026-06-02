package com.mtgpacksim.card;

import java.math.BigDecimal;

public record CardDto(
        String id,
        String name,
        String rarity,
        String imageUrl,
        BigDecimal priceUsd,
        boolean priceAvailable,
        String finish,
        String treatment,
        String slot
) {
    public CardDto withSlot(String slot) {
        return new CardDto(id, name, rarity, imageUrl, priceUsd, priceAvailable, finish, treatment, slot);
    }
}
