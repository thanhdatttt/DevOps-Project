package com.yas.media;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.util.List;
import org.junit.jupiter.api.Test;

import com.yas.media.viewmodel.ErrorVm;

class ErrorVmTest {

    @Test
    void constructor_withAllFields_thenFieldsAreSet() {
        List<String> errors = List.of("field1 error", "field2 error");
        ErrorVm errorVm = new ErrorVm("400 BAD_REQUEST", "Bad Request", "Validation failed", errors);

        assertEquals("400 BAD_REQUEST", errorVm.statusCode());
        assertEquals("Bad Request", errorVm.title());
        assertEquals("Validation failed", errorVm.detail());
        assertEquals(errors, errorVm.fieldErrors());
    }

    @Test
    void constructor_withThreeArgs_thenFieldErrorsIsEmptyList() {
        ErrorVm errorVm = new ErrorVm("404 NOT_FOUND", "Not Found", "Media not found");

        assertEquals("404 NOT_FOUND", errorVm.statusCode());
        assertEquals("Not Found", errorVm.title());
        assertEquals("Media not found", errorVm.detail());
        assertNotNull(errorVm.fieldErrors());
        assertTrue(errorVm.fieldErrors().isEmpty());
    }
}
