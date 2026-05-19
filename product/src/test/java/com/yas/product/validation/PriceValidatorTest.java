package com.yas.product.validation;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class PriceValidatorTest {

    private PriceValidator priceValidator;

    @BeforeEach
    void setUp() {
        priceValidator = new PriceValidator();
        priceValidator.initialize(null);
    }

    @Test
    void isValid_WhenPriceIsZero_ReturnsTrue() {
        assertTrue(priceValidator.isValid(0.0, null));
    }

    @Test
    void isValid_WhenPriceIsPositive_ReturnsTrue() {
        assertTrue(priceValidator.isValid(99.99, null));
    }

    @Test
    void isValid_WhenPriceIsLargePositive_ReturnsTrue() {
        assertTrue(priceValidator.isValid(1_000_000.0, null));
    }

    @Test
    void isValid_WhenPriceIsNegative_ReturnsFalse() {
        assertFalse(priceValidator.isValid(-0.01, null));
    }

    @Test
    void isValid_WhenPriceIsLargeNegative_ReturnsFalse() {
        assertFalse(priceValidator.isValid(-500.0, null));
    }
}
