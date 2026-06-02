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
import static org.mockito.ArgumentMatchers.eq;
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
        assertThat(pack.cards()).filteredOn(card -> card.rarity().equals("common")).hasSize(5);
        assertThat(pack.cards()).filteredOn(card -> card.rarity().equals("uncommon")).hasSize(4);
        assertThat(pack.cards()).filteredOn(card -> card.rarity().equals("basic")).hasSize(1);
        assertThat(pack.cards())
                .filteredOn(card -> card.rarity().equals("rare") || card.rarity().equals("mythic"))
                .hasSize(5);
        assertThat(pack.cards())
                .extracting(CardDto::slot)
                .contains(
                        "foil commons",
                        "foil uncommons",
                        "foil rare/mythic",
                        "extended-art rare/mythic",
                        "showcase/borderless rare/mythic",
                        "foil land"
                );
    }

    @Test
    void collectorBoosterFallsBackWhenSpecialTreatmentPoolsAreEmpty() {
        when(scryfallClient.searchCards(eq("set:blb rarity:rare is:booster frame:extendedart")))
                .thenReturn(List.of());
        when(scryfallClient.searchCards(eq("set:blb rarity:mythic is:booster frame:extendedart")))
                .thenReturn(List.of());
        when(scryfallClient.searchCards(eq("set:blb rarity:rare is:booster (frame:showcase or border:borderless)")))
                .thenReturn(List.of());
        when(scryfallClient.searchCards(eq("set:blb rarity:mythic is:booster (frame:showcase or border:borderless)")))
                .thenReturn(List.of());
        when(scryfallClient.searchCards(eq("set:blb rarity:rare is:booster")))
                .thenReturn(cards("rare", 30));
        when(scryfallClient.searchCards(eq("set:blb rarity:mythic is:booster")))
                .thenReturn(cards("mythic", 30));

        OpenedPackDto pack = service.openPack("blb", "collector");

        assertThat(pack.cards()).hasSize(15);
        assertThat(pack.cards())
                .filteredOn(card -> card.slot().equals("extended-art rare/mythic"))
                .hasSize(2);
        assertThat(pack.cards())
                .filteredOn(card -> card.slot().equals("showcase/borderless rare/mythic"))
                .hasSize(2);
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

        verify(scryfallClient).searchCards("set:blb rarity:common is:booster -type:basic");
        verify(scryfallClient).searchCards("set:blb rarity:uncommon is:booster");
        verify(scryfallClient).searchCards("set:blb rarity:rare is:booster -frame:extendedart -frame:showcase -border:borderless");
        verify(scryfallClient).searchCards("set:blb rarity:mythic is:booster -frame:extendedart -frame:showcase -border:borderless");
        verify(scryfallClient).searchCards("set:blb rarity:rare is:booster frame:extendedart");
        verify(scryfallClient).searchCards("set:blb rarity:mythic is:booster frame:extendedart");
        verify(scryfallClient).searchCards("set:blb rarity:rare is:booster (frame:showcase or border:borderless)");
        verify(scryfallClient).searchCards("set:blb rarity:mythic is:booster (frame:showcase or border:borderless)");
        verify(scryfallClient).searchCards("set:blb rarity:rare is:booster");
        verify(scryfallClient).searchCards("set:blb rarity:mythic is:booster");
        verify(scryfallClient).searchCards("set:blb type:basic");
    }

    @Test
    void reportsWarmupStatusFromCachedPools() {
        WarmupStatusDto initialStatus = service.warmUpStatus("blb", "collector");

        assertThat(initialStatus.status()).isEqualTo("idle");
        assertThat(initialStatus.loadedPools()).isZero();
        assertThat(initialStatus.totalPools()).isEqualTo(11);

        service.warmUpPack("blb", "collector");

        WarmupStatusDto readyStatus = service.warmUpStatus("blb", "collector");
        assertThat(readyStatus.status()).isEqualTo("ready");
        assertThat(readyStatus.loadedPools()).isEqualTo(11);
        assertThat(readyStatus.totalPools()).isEqualTo(11);
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
                        BigDecimal.ONE,
                        true,
                        "Foil",
                        null,
                        null
                ))
                .toList();
    }
}
