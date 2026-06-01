package com.mtgpacksim.pack;

import com.mtgpacksim.card.CardDto;
import com.mtgpacksim.scryfall.ScryfallClient;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.IntStream;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class PackOpeningServiceTest {
    private ScryfallClient scryfallClient;
    private PackOpeningService service;

    @BeforeEach
    void setUp() {
        scryfallClient = mock(ScryfallClient.class);
        stubCardPools();
        service = new PackOpeningService(scryfallClient, new PackDefinitionService());
    }

    @Test
    void opensPlayBoosterWithFifteenCardsAndRoundedTotal() {
        OpenedPackDto pack = service.openPack("blb", "play");

        assertThat(pack.setCode()).isEqualTo("blb");
        assertThat(pack.cards()).hasSize(15);
        assertThat(pack.totalValueUsd()).isEqualByComparingTo("15.00");
        assertThat(pack.totalValueUsd().scale()).isEqualTo(2);
        assertThat(pack.cards()).filteredOn(card -> card.rarity().equals("common")).hasSize(10);
        assertThat(pack.cards()).filteredOn(card -> card.rarity().equals("uncommon")).hasSize(3);
        assertThat(pack.cards()).filteredOn(card -> card.rarity().equals("basic")).hasSize(1);
        assertThat(pack.cards())
                .filteredOn(card -> card.rarity().equals("rare") || card.rarity().equals("mythic"))
                .hasSize(1);
    }

    @Test
    void opensCollectorBoosterWithRareMythicHeavyStructure() {
        OpenedPackDto pack = service.openPack("blb", "collector");

        assertThat(pack.cards()).hasSize(15);
        assertThat(pack.cards()).filteredOn(card -> card.rarity().equals("common")).hasSize(4);
        assertThat(pack.cards()).filteredOn(card -> card.rarity().equals("uncommon")).hasSize(5);
        assertThat(pack.cards()).filteredOn(card -> card.rarity().equals("basic")).hasSize(1);
        assertThat(pack.cards())
                .filteredOn(card -> card.rarity().equals("rare") || card.rarity().equals("mythic"))
                .hasSize(5);
    }

    @Test
    void reusesLoadedCardPoolsAcrossPackOpenings() {
        service.openPack("blb", "play");
        service.openPack("blb", "play");

        verify(scryfallClient).searchCards("set:blb rarity:common is:booster -type:basic");
        verify(scryfallClient).searchCards("set:blb rarity:uncommon is:booster");
        verify(scryfallClient).searchCards("set:blb type:basic");
    }

    @Test
    void warmUpPackLoadsAllFixedAndAlternatePools() {
        service.warmUpPack("blb", "collector");

        verify(scryfallClient).searchCards("set:blb rarity:common -type:basic");
        verify(scryfallClient).searchCards("set:blb rarity:uncommon");
        verify(scryfallClient).searchCards("set:blb rarity:rare");
        verify(scryfallClient).searchCards("set:blb rarity:mythic");
        verify(scryfallClient).searchCards("set:blb type:basic");
    }

    private void stubCardPools() {
        when(scryfallClient.searchCards(argThat(query -> query != null && query.contains("type:basic"))))
                .thenReturn(cards("basic", 20));
        when(scryfallClient.searchCards(argThat(query -> query != null && query.contains("rarity:common"))))
                .thenReturn(cards("common", 30));
        when(scryfallClient.searchCards(argThat(query -> query != null && query.contains("rarity:uncommon"))))
                .thenReturn(cards("uncommon", 30));
        when(scryfallClient.searchCards(argThat(query -> query != null && query.contains("rarity:rare"))))
                .thenReturn(cards("rare", 30));
        when(scryfallClient.searchCards(argThat(query -> query != null && query.contains("rarity:mythic"))))
                .thenReturn(cards("mythic", 30));
    }

    private List<CardDto> cards(String rarity, int count) {
        return IntStream.rangeClosed(1, count)
                .mapToObj(index -> new CardDto(
                        rarity + "-" + index,
                        rarity + " card " + index,
                        rarity,
                        "https://example.com/" + rarity + "-" + index + ".jpg",
                        BigDecimal.ONE
                ))
                .toList();
    }
}
