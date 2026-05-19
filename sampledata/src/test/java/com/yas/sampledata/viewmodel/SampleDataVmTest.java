package com.yas.sampledata.viewmodel;

import static org.junit.jupiter.api.Assertions.assertEquals;

import org.junit.jupiter.api.Test;

class SampleDataVmTest {

    @Test
    void constructor_ShouldSetMessage() {
        String expectedMessage = "Test message";
        SampleDataVm vm = new SampleDataVm(expectedMessage);

        assertEquals(expectedMessage, vm.message());
    }
}
