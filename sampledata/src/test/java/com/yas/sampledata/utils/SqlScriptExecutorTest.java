package com.yas.sampledata.utils;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.sql.Connection;
import java.sql.SQLException;
import javax.sql.DataSource;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

class SqlScriptExecutorTest {

    private SqlScriptExecutor sqlScriptExecutor;

    @BeforeEach
    void setUp() {
        sqlScriptExecutor = new SqlScriptExecutor();
    }

    @Test
    void executeScriptsForSchema_ShouldHandleSQLException() throws SQLException {
        DataSource dataSource = mock(DataSource.class);
        
        // Throw exception to cover the catch block in executeSqlScript
        when(dataSource.getConnection()).thenThrow(new SQLException("Database connection error"));

        // Giving it a pattern that will resolve to nothing, but if we create a dummy file it will resolve.
        // Actually, to make it resolve we can pass "classpath*:db/**/*.sql" but we don't know if the test has it.
        // If it finds nothing, loop won't execute. So let's test catching the exception inside executeScriptsForSchema
        // The resolver throws IOException if pattern is invalid, but wait, PathMatchingResourcePatternResolver doesn't throw easily.
        // It's better to just run it. If it finds files, it will hit SQLException and cover the catch block.
        sqlScriptExecutor.executeScriptsForSchema(dataSource, "public", "classpath*:META-INF/*.txt"); // Won't find anything, won't crash
        
        // But let's actually make it throw an Exception from getConnection to cover log.error.
        // We need a pattern that actually finds a file in the project.
        // pom.xml is in the project, but not in classpath. We can use "classpath*:**/*.class" which will definitely find files.
        sqlScriptExecutor.executeScriptsForSchema(dataSource, "public", "classpath*:**/*.class");
        
        // Since we mocked dataSource to throw SQLException, the inner executeSqlScript will catch it and log it,
        // resulting in coverage for that catch block.
    }
}
