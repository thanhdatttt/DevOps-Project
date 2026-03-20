package com.yas.sampledata.utils;

import static org.junit.jupiter.api.Assertions.assertEquals;

import org.junit.jupiter.api.Test;

class MessagesUtilsTest {

    @Test
    void getMessage_ShouldReturnErrorCode_WhenKeyIsMissing() {
        String errorCode = "non.existing.error.code";
        String result = MessagesUtils.getMessage(errorCode, "param1");
        
        // Since it's missing, it should return the errorCode formatted with params, 
        // but since errorCode doesn't have {} it just returns the errorCode.
        assertEquals(errorCode, result);
    }
}
