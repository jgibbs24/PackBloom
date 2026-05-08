package com.mtgpacksim.scryfall;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.Map;

@JsonIgnoreProperties(ignoreUnknown = true)
public record ScryfallCardResponse(
        String id,
        String name,
        String rarity,
        @JsonProperty("image_uris") Map<String, String> imageUris,
        Map<String, String> prices,
        @JsonProperty("card_faces") ScryfallCardFaceResponse[] cardFaces
) {
}
