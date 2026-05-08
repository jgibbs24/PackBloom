package com.mtgpacksim.scryfall;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.Map;

@JsonIgnoreProperties(ignoreUnknown = true)
public record ScryfallCardFaceResponse(
        @JsonProperty("image_uris") Map<String, String> imageUris
) {
}
