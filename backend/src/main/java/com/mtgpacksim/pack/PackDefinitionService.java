package com.mtgpacksim.pack;

import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
public class PackDefinitionService {
    private static final double MYTHIC_CHANCE = 0.125;
    private static final String PACK_TYPE = "play-booster-barebones";

    private final Map<String, PackDefinition> definitions;

    public PackDefinitionService() {
        List<PackDefinition> supportedDefinitions = List.of(
                barebonesPlayBooster("blb", "Bloomburrow"),
                barebonesPlayBooster("fdn", "Foundations"),
                barebonesPlayBooster("mkm", "Murders at Karlov Manor"),
                barebonesPlayBooster("dsk", "Duskmourn: House of Horror"),
                barebonesPlayBooster("otj", "Outlaws of Thunder Junction"),
                barebonesPlayBooster("lci", "The Lost Caverns of Ixalan"),
                barebonesPlayBooster("woe", "Wilds of Eldraine"),
                barebonesPlayBooster("mom", "March of the Machine"),
                barebonesPlayBooster("one", "Phyrexia: All Will Be One")
        );

        this.definitions = supportedDefinitions.stream()
                .collect(Collectors.toUnmodifiableMap(PackDefinition::setCode, Function.identity()));
    }

    public List<PackDefinition> supportedDefinitions() {
        return definitions.values().stream()
                .sorted((left, right) -> left.setName().compareToIgnoreCase(right.setName()))
                .toList();
    }

    public PackDefinition getDefinition(String setCode) {
        return findDefinition(setCode)
                .orElseThrow(() -> new PackOpeningException("Unsupported set code: " + setCode));
    }

    private Optional<PackDefinition> findDefinition(String setCode) {
        if (setCode == null || setCode.isBlank()) {
            return Optional.empty();
        }
        return Optional.ofNullable(definitions.get(setCode.toLowerCase(Locale.ROOT)));
    }

    private PackDefinition barebonesPlayBooster(String setCode, String setName) {
        return new PackDefinition(
                setCode,
                setName,
                PACK_TYPE,
                List.of(
                        PackSlot.fixed("commons", 10, cacheKey(setCode, "common"), query(setCode, "rarity:common is:booster -type:basic")),
                        PackSlot.fixed("uncommons", 3, cacheKey(setCode, "uncommon"), query(setCode, "rarity:uncommon is:booster")),
                        PackSlot.rareOrMythic(
                                "rare-or-mythic",
                                cacheKey(setCode, "rare"),
                                query(setCode, "rarity:rare is:booster"),
                                cacheKey(setCode, "mythic"),
                                query(setCode, "rarity:mythic is:booster"),
                                MYTHIC_CHANCE
                        ),
                        PackSlot.fixed("land", 1, cacheKey(setCode, "land"), query(setCode, "type:basic"))
                )
        );
    }

    private String cacheKey(String setCode, String poolName) {
        return setCode + ":" + poolName;
    }

    private String query(String setCode, String criteria) {
        return "set:" + setCode + " " + criteria;
    }
}
