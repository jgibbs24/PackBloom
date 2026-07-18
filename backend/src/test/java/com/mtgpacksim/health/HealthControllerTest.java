package com.mtgpacksim.health;

import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.SQLException;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class HealthControllerTest {
    @Test
    void reportsReadyWhenDatabaseConnectionIsValid() throws Exception {
        DataSource dataSource = mock(DataSource.class);
        Connection connection = mock(Connection.class);
        when(dataSource.getConnection()).thenReturn(connection);
        when(connection.isValid(2)).thenReturn(true);

        var response = new HealthController(dataSource).readiness();

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isEqualTo(new HealthDto("ready"));
    }

    @Test
    void reportsUnavailableWhenDatabaseCannotBeReached() throws Exception {
        DataSource dataSource = mock(DataSource.class);
        when(dataSource.getConnection()).thenThrow(new SQLException("database unavailable"));

        var response = new HealthController(dataSource).readiness();

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.SERVICE_UNAVAILABLE);
        assertThat(response.getBody()).isEqualTo(new HealthDto("not_ready"));
    }
}
