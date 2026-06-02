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
    private static final double COLLECTOR_MYTHIC_CHANCE = 0.20;
    private static final double COLLECTOR_WILDCARD_MYTHIC_CHANCE = 0.35;
    private static final double DEFAULT_PLAY_BOOSTER_MSRP_USD = 5.99;
    private static final double DEFAULT_COLLECTOR_BOOSTER_MSRP_USD = 24.99;
    private static final String COLLECTOR_BOOSTER_TYPE = "collector-booster-barebones";
    private static final String PLAY_BOOSTER = "play";
    private static final String PLAY_BOOSTER_TYPE = "play-booster-barebones";

    private final Map<String, Map<String, PackDefinition>> definitionsBySetCode;

    public PackDefinitionService() {
        List<PackDefinition> supportedDefinitions = List.of(
                barebonesPlayBooster("blb", "Bloomburrow"),
                barebonesCollectorBooster("blb", "Bloomburrow"),
                barebonesPlayBooster("fdn", "Foundations"),
                barebonesCollectorBooster("fdn", "Foundations"),
                barebonesPlayBooster("mkm", "Murders at Karlov Manor"),
                barebonesCollectorBooster("mkm", "Murders at Karlov Manor"),
                barebonesPlayBooster("dsk", "Duskmourn: House of Horror"),
                barebonesCollectorBooster("dsk", "Duskmourn: House of Horror"),
                barebonesPlayBooster("otj", "Outlaws of Thunder Junction"),
                barebonesCollectorBooster("otj", "Outlaws of Thunder Junction"),
                barebonesPlayBooster("lci", "The Lost Caverns of Ixalan"),
                barebonesCollectorBooster("lci", "The Lost Caverns of Ixalan"),
                barebonesPlayBooster("woe", "Wilds of Eldraine"),
                barebonesCollectorBooster("woe", "Wilds of Eldraine"),
                barebonesPlayBooster("mom", "March of the Machine"),
                barebonesCollectorBooster("mom", "March of the Machine"),
                barebonesPlayBooster("one", "Phyrexia: All Will Be One"),
                barebonesCollectorBooster("one", "Phyrexia: All Will Be One")
        );

        this.definitionsBySetCode = supportedDefinitions.stream()
                .collect(Collectors.groupingBy(
                        PackDefinition::setCode,
                        Collectors.toUnmodifiableMap(PackDefinition::boosterType, Function.identity())
                ));
    }

    public List<PackDefinition> supportedDefinitions() {
        return definitionsBySetCode.values().stream()
                .map(definitions -> definitions.get(PLAY_BOOSTER))
                .sorted((left, right) -> left.setName().compareToIgnoreCase(right.setName()))
                .toList();
    }

    public PackDefinition getDefinition(String setCode, String boosterType) {
        String normalizedBoosterType = normalizeBoosterType(boosterType);
        return findDefinition(setCode, normalizedBoosterType)
                .orElseThrow(() -> new PackOpeningException(
                        "Unsupported pack definition: " + setCode + " / " + normalizedBoosterType
                ));
    }

    private Optional<PackDefinition> findDefinition(String setCode, String boosterType) {
        if (setCode == null || setCode.isBlank()) {
            return Optional.empty();
        }
        Map<String, PackDefinition> definitions = definitionsBySetCode.get(setCode.toLowerCase(Locale.ROOT));
        if (definitions == null) {
            return Optional.empty();
        }
        return Optional.ofNullable(definitions.get(boosterType));
    }

    private PackDefinition barebonesPlayBooster(String setCode, String setName) {
        return new PackDefinition(
                setCode,
                setName,
                PLAY_BOOSTER_TYPE,
                PLAY_BOOSTER,
                DEFAULT_PLAY_BOOSTER_MSRP_USD,
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

    private PackDefinition barebonesCollectorBooster(String setCode, String setName) {
        return new PackDefinition(
                setCode,
                setName,
                COLLECTOR_BOOSTER_TYPE,
                "collector",
                DEFAULT_COLLECTOR_BOOSTER_MSRP_USD,
                List.of(
                        PackSlot.fixed("foil commons", 5, cacheKey(setCode, "collector-common"), query(setCode, "rarity:common is:booster -type:basic")),
                        PackSlot.fixed("foil uncommons", 4, cacheKey(setCode, "collector-uncommon"), query(setCode, "rarity:uncommon is:booster")),
                        PackSlot.rareOrMythic(
                                "foil rare/mythic",
                                cacheKey(setCode, "collector-foil-rare"),
                                query(setCode, "rarity:rare is:booster -frame:extendedart -frame:showcase -border:borderless"),
                                cacheKey(setCode, "collector-foil-mythic"),
                                query(setCode, "rarity:mythic is:booster -frame:extendedart -frame:showcase -border:borderless"),
                                COLLECTOR_MYTHIC_CHANCE
                        ),
                        PackSlot.rareOrMythicWithFallback(
                                "extended-art rare/mythic",
                                2,
                                cacheKey(setCode, "collector-extended-art-rare"),
                                query(setCode, "rarity:rare is:booster frame:extendedart"),
                                cacheKey(setCode, "collector-rare-fallback"),
                                query(setCode, "rarity:rare is:booster"),
                                cacheKey(setCode, "collector-extended-art-mythic"),
                                query(setCode, "rarity:mythic is:booster frame:extendedart"),
                                cacheKey(setCode, "collector-mythic-fallback"),
                                query(setCode, "rarity:mythic is:booster"),
                                COLLECTOR_WILDCARD_MYTHIC_CHANCE
                        ),
                        PackSlot.rareOrMythicWithFallback(
                                "showcase/borderless rare/mythic",
                                2,
                                cacheKey(setCode, "collector-showcase-borderless-rare"),
                                query(setCode, "rarity:rare is:booster (frame:showcase or border:borderless)"),
                                cacheKey(setCode, "collector-rare-fallback"),
                                query(setCode, "rarity:rare is:booster"),
                                cacheKey(setCode, "collector-showcase-borderless-mythic"),
                                query(setCode, "rarity:mythic is:booster (frame:showcase or border:borderless)"),
                                cacheKey(setCode, "collector-mythic-fallback"),
                                query(setCode, "rarity:mythic is:booster"),
                                COLLECTOR_WILDCARD_MYTHIC_CHANCE
                        ),
                        PackSlot.fixed("foil land", 1, cacheKey(setCode, "collector-land"), query(setCode, "type:basic"))
                )
        );
    }

    private String normalizeBoosterType(String boosterType) {
        if (boosterType == null || boosterType.isBlank()) {
            return PLAY_BOOSTER;
        }
        return boosterType.toLowerCase(Locale.ROOT);
    }

    private String cacheKey(String setCode, String poolName) {
        return setCode + ":" + poolName;
    }

    private String query(String setCode, String criteria) {
        return "set:" + setCode + " " + criteria;
    }
}
