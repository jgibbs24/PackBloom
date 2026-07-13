package com.mtgpacksim.auth;

public record AuthRequest(
        String email,
        String password,
        String displayName
) {
}
