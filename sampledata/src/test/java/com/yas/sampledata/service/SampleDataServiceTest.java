package com.yas.sampledata.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mockConstruction;
import static org.mockito.Mockito.verify;

import com.yas.sampledata.utils.SqlScriptExecutor;
import com.yas.sampledata.viewmodel.SampleDataVm;
import javax.sql.DataSource;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockedConstruction;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class SampleDataServiceTest {

    @Mock
    private DataSource productDataSource;

    @Mock
    private DataSource mediaDataSource;

    private SampleDataService sampleDataService;

    @BeforeEach
    void setUp() {
        sampleDataService = new SampleDataService(productDataSource, mediaDataSource);
    }

    @Test
    void createSampleData_ShouldReturnSuccessMessage_WhenExecuted() {
        try (MockedConstruction<SqlScriptExecutor> mockedExecutor = mockConstruction(SqlScriptExecutor.class)) {
            SampleDataVm result = sampleDataService.createSampleData();

            assertEquals("Insert Sample Data successfully!", result.message());

            assertEquals(1, mockedExecutor.constructed().size());
            SqlScriptExecutor executor = mockedExecutor.constructed().get(0);

            verify(executor).executeScriptsForSchema(productDataSource, "public", "classpath*:db/product/*.sql");
            verify(executor).executeScriptsForSchema(mediaDataSource, "public", "classpath*:db/media/*.sql");
        }
    }
}
