package com.mtgpacksim.pack;

import com.mtgpacksim.card.CardDto;

import java.math.BigDecimal;
import java.util.List;

public record OpenedPackDto(
        String setCode,
        List<CardDto> cards,
        BigDecimal totalValueUsd
) {
}
