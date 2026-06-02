package com.mtgpacksim.pack;

import org.junit.jupiter.api.Test;

import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class PackDefinitionServiceTest {
    private final PackDefinitionService service = new PackDefinitionService();

    @Test
    void supportedDefinitionsExposePlayBoostersForEverySet() {
        var definitions = service.supportedDefinitions();

        assertThat(definitions)
                .hasSize(9)
                .extracting(PackDefinition::setCode)
                .containsExactlyInAnyOrderElementsOf(Set.of(
                        "blb", "dsk", "fdn", "lci", "mkm", "mom", "one", "otj", "woe"
                ));
        assertThat(definitions)
                .allSatisfy(definition -> {
                    assertThat(definition.boosterType()).isEqualTo("play");
                    assertThat(slotCount(definition)).isEqualTo(15);
                    assertThat(definition.msrpUsd()).isEqualTo(5.99);
                });
    }

    @Test
    void everySupportedSetHasPlayAndCollectorDefinitions() {
        for (PackDefinition playDefinition : service.supportedDefinitions()) {
            PackDefinition collectorDefinition = service.getDefinition(playDefinition.setCode(), "collector");

            assertThat(playDefinition.packType()).isEqualTo("play-booster-barebones");
            assertThat(slotCount(playDefinition)).isEqualTo(15);

            assertThat(collectorDefinition.setCode()).isEqualTo(playDefinition.setCode());
            assertThat(collectorDefinition.setName()).isEqualTo(playDefinition.setName());
            assertThat(collectorDefinition.boosterType()).isEqualTo("collector");
            assertThat(collectorDefinition.packType()).isEqualTo("collector-booster-barebones");
            assertThat(collectorDefinition.msrpUsd()).isEqualTo(24.99);
            assertThat(slotCount(collectorDefinition)).isEqualTo(15);
            assertThat(collectorDefinition.slots())
                    .filteredOn(PackSlot::hasAlternatePool)
                    .hasSize(2)
                    .satisfies(slots -> assertThat(slots.stream().mapToInt(PackSlot::count).sum()).isEqualTo(5));
        }
    }

    @Test
    void defaultsBlankBoosterTypeToPlay() {
        PackDefinition definition = service.getDefinition("BLB", " ");

        assertThat(definition.setCode()).isEqualTo("blb");
        assertThat(definition.boosterType()).isEqualTo("play");
    }

    @Test
    void rejectsUnsupportedSetOrBoosterType() {
        assertThatThrownBy(() -> service.getDefinition("zzz", "play"))
                .isInstanceOf(PackOpeningException.class)
                .hasMessageContaining("Unsupported pack definition");

        assertThatThrownBy(() -> service.getDefinition("blb", "draft"))
                .isInstanceOf(PackOpeningException.class)
                .hasMessageContaining("Unsupported pack definition");
    }

    private int slotCount(PackDefinition definition) {
        return definition.slots().stream()
                .mapToInt(PackSlot::count)
                .sum();
    }
}
