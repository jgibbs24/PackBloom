package com.mtgpacksim.health;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.SQLException;

@RestController
@RequestMapping("/api/health")
public class HealthController {
    private final DataSource dataSource;

    public HealthController(DataSource dataSource) {
        this.dataSource = dataSource;
    }

    @GetMapping
    public HealthDto health() {
        return new HealthDto("ok");
    }

    @GetMapping("/ready")
    public ResponseEntity<HealthDto> readiness() {
        try (Connection connection = dataSource.getConnection()) {
            if (connection.isValid(2)) {
                return ResponseEntity.ok(new HealthDto("ready"));
            }
        } catch (SQLException exception) {
            // A readiness probe should report the dependency failure without exposing database details.
        }

        return ResponseEntity
                .status(HttpStatus.SERVICE_UNAVAILABLE)
                .body(new HealthDto("not_ready"));
    }
}
