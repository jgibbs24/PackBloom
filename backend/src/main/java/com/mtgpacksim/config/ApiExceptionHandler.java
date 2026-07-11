package com.mtgpacksim.config;

import com.mtgpacksim.pack.PackOpeningException;
import com.mtgpacksim.battle.SavedBattleSessionException;
import com.mtgpacksim.scryfall.ScryfallException;
import com.mtgpacksim.session.SavedSessionException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.concurrent.TimeoutException;

@RestControllerAdvice
public class ApiExceptionHandler {
    private static final Logger LOGGER = LoggerFactory.getLogger(ApiExceptionHandler.class);

    @ExceptionHandler(ScryfallException.class)
    ResponseEntity<ApiErrorResponse> handleScryfallError(ScryfallException exception) {
        LOGGER.error("Pack opening failed because Scryfall could not be reached.", exception);
        return ResponseEntity
                .status(HttpStatus.SERVICE_UNAVAILABLE)
                .body(new ApiErrorResponse(
                        "SCRYFALL_UNAVAILABLE",
                        "Scryfall is temporarily unavailable. Please wait a moment and try opening another pack."
                ));
    }

    @ExceptionHandler(PackOpeningException.class)
    ResponseEntity<ApiErrorResponse> handlePackOpeningError(PackOpeningException exception) {
        LOGGER.error("Pack opening failed while preparing card pools.", exception);
        return ResponseEntity
                .status(HttpStatus.SERVICE_UNAVAILABLE)
                .body(new ApiErrorResponse(
                        "PACK_POOL_UNAVAILABLE",
                        exception.getMessage()
                ));
    }

    @ExceptionHandler(TimeoutException.class)
    ResponseEntity<ApiErrorResponse> handlePackOpeningTimeout(TimeoutException exception) {
        LOGGER.error("Pack opening timed out while loading card pools.", exception);
        return ResponseEntity
                .status(HttpStatus.SERVICE_UNAVAILABLE)
                .body(new ApiErrorResponse(
                        "PACK_OPENING_TIMEOUT",
                        "Opening this pack took too long while loading Scryfall data. Please try again."
                ));
    }

    @ExceptionHandler(SavedSessionException.class)
    ResponseEntity<ApiErrorResponse> handleSavedSessionError(SavedSessionException exception) {
        HttpStatus status = "Saved session not found.".equals(exception.getMessage())
                ? HttpStatus.NOT_FOUND
                : HttpStatus.BAD_REQUEST;

        return ResponseEntity
                .status(status)
                .body(new ApiErrorResponse(
                        status == HttpStatus.NOT_FOUND ? "SAVED_SESSION_NOT_FOUND" : "SAVED_SESSION_INVALID",
                        exception.getMessage()
                ));
    }

    @ExceptionHandler(SavedBattleSessionException.class)
    ResponseEntity<ApiErrorResponse> handleSavedBattleSessionError(SavedBattleSessionException exception) {
        HttpStatus status = "Saved battle session not found.".equals(exception.getMessage())
                ? HttpStatus.NOT_FOUND
                : HttpStatus.BAD_REQUEST;

        return ResponseEntity
                .status(status)
                .body(new ApiErrorResponse(
                        status == HttpStatus.NOT_FOUND ? "SAVED_BATTLE_SESSION_NOT_FOUND" : "SAVED_BATTLE_SESSION_INVALID",
                        exception.getMessage()
                ));
    }

    record ApiErrorResponse(String code, String message) {
    }
}
