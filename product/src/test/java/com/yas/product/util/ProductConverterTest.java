package com.yas.product.util;

import org.junit.jupiter.api.Test;

import com.yas.product.utils.ProductConverter;

import static org.junit.jupiter.api.Assertions.assertEquals;

class ProductConverterTest {

    @Test
    void toSlug_WhenSimpleString_ReturnsLowercaseHyphenated() {
        assertEquals("hello-world", ProductConverter.toSlug("Hello World"));
    }

    @Test
    void toSlug_WhenAlreadySlug_ReturnsSameSlug() {
        assertEquals("already-a-slug", ProductConverter.toSlug("already-a-slug"));
    }

    @Test
    void toSlug_WhenSpecialCharacters_ReplacedWithHyphens() {
        assertEquals("hello-world", ProductConverter.toSlug("Hello@World!"));
    }

    @Test
    void toSlug_WhenMultipleSpaces_CollapsedToSingleHyphen() {
        assertEquals("hello-world", ProductConverter.toSlug("Hello   World"));
    }

    @Test
    void toSlug_WhenLeadingHyphen_IsRemoved() {
        String result = ProductConverter.toSlug("-leading");
        assertFalse(result.startsWith("-"));
    }

    @Test
    void toSlug_WhenLeadingAndTrailingSpaces_AreTrimmed() {
        assertEquals("trimmed", ProductConverter.toSlug("  trimmed  "));
    }

    @Test
    void toSlug_WhenMixedCase_IsLowercased() {
        assertEquals("mixed-case-input", ProductConverter.toSlug("Mixed Case Input"));
    }

    @Test
    void toSlug_WhenNumbers_ArePreserved() {
        assertEquals("product-123", ProductConverter.toSlug("Product 123"));
    }

    private static void assertFalse(boolean condition) {
        if (condition) throw new AssertionError("Expected false but was true");
    }
}

