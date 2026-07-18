package com.mtgpacksim.auth;

public class AuthTokenException extends AuthException {
    private final String code;

    private AuthTokenException(String code, String message) {
        super(message);
        this.code = code;
    }

    public static AuthTokenException required() {
        return new AuthTokenException("AUTH_REQUIRED", "Sign in to access this resource.");
    }

    public static AuthTokenException invalid() {
        return new AuthTokenException("AUTH_INVALID", "Your sign-in has expired or is invalid.");
    }

    public String getCode() {
        return code;
    }
}
