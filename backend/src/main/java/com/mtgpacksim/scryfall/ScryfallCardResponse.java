package com.mtgpacksim.scryfall;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.List;
import java.util.Map;

@JsonIgnoreProperties(ignoreUnknown = true)
public record ScryfallCardResponse(
        String id,
        String name,
        String rarity,
        @JsonProperty("image_uris") Map<String, String> imageUris,
        Map<String, String> prices,
        List<String> finishes,
        @JsonProperty("frame_effects") List<String> frameEffects,
        @JsonProperty("border_color") String borderColor,
        @JsonProperty("full_art") Boolean fullArt,
        @JsonProperty("card_faces") ScryfallCardFaceResponse[] cardFaces
) {
}
