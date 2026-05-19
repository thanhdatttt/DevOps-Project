package com.yas.sampledata.viewmodel;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.util.List;
import org.junit.jupiter.api.Test;

class ErrorVmTest {

    @Test
    void constructorWithThreeArgs_ShouldInitializeEmptyFieldErrors() {
        ErrorVm errorVm = new ErrorVm("400", "Bad Request", "Detail message");

        assertEquals("400", errorVm.statusCode());
        assertEquals("Bad Request", errorVm.title());
        assertEquals("Detail message", errorVm.detail());
        assertTrue(errorVm.fieldErrors().isEmpty());
    }

    @Test
    void constructorWithFourArgs_ShouldInitializeAllFields() {
        List<String> fieldErrors = List.of("Error 1", "Error 2");
        ErrorVm errorVm = new ErrorVm("400", "Bad Request", "Detail message", fieldErrors);

        assertEquals("400", errorVm.statusCode());
        assertEquals("Bad Request", errorVm.title());
        assertEquals("Detail message", errorVm.detail());
        assertEquals(2, errorVm.fieldErrors().size());
        assertEquals("Error 1", errorVm.fieldErrors().get(0));
    }
}
