package com.mtgpacksim.scryfall;

public class ScryfallException extends RuntimeException {

    public ScryfallException(String message) {
        super(message);
    }

    public ScryfallException(String message, Throwable cause) {
        super(message, cause);
    }
}
