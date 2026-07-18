package com.mtgpacksim.session;

public class SavedSessionConflictException extends RuntimeException {
    public SavedSessionConflictException(String message) {
        super(message);
    }
}
