package com.yas.media;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import jakarta.validation.ConstraintValidatorContext;
import jakarta.validation.ConstraintValidatorContext.ConstraintViolationBuilder;
import java.io.IOException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.web.multipart.MultipartFile;

import com.yas.media.utils.FileTypeValidator;
import com.yas.media.utils.ValidFileType;

class FileTypeValidatorTest {

    private FileTypeValidator validator;
    private ConstraintValidatorContext context;
    private ConstraintViolationBuilder violationBuilder;
    private ValidFileType annotation;

    @BeforeEach
    void setUp() {
        validator = new FileTypeValidator();

        // Wire up the mock context chain used when returning false
        context = mock(ConstraintValidatorContext.class);
        violationBuilder = mock(ConstraintViolationBuilder.class);
        when(context.buildConstraintViolationWithTemplate(org.mockito.ArgumentMatchers.anyString()))
            .thenReturn(violationBuilder);
        when(violationBuilder.addConstraintViolation()).thenReturn(context);

        annotation = mock(ValidFileType.class);
        when(annotation.allowedTypes()).thenReturn(new String[]{"image/jpeg", "image/png", "image/gif"});
        when(annotation.message()).thenReturn("File type not allowed");

        validator.initialize(annotation);
    }

    // ── null / missing file ─────────────────────────────────────────────────

    @Test
    void isValid_whenFileIsNull_thenReturnFalse() {
        assertFalse(validator.isValid(null, context));
    }

    @Test
    void isValid_whenContentTypeIsNull_thenReturnFalse() {
        MultipartFile file = new MockMultipartFile("file", "photo.png", null, new byte[]{});
        assertFalse(validator.isValid(file, context));
    }

    // ── disallowed types ────────────────────────────────────────────────────

    @Test
    void isValid_whenContentTypeNotAllowed_thenReturnFalse() {
        MultipartFile file = new MockMultipartFile(
            "file", "doc.pdf", "application/pdf", "pdf-content".getBytes());
        assertFalse(validator.isValid(file, context));
    }

    @Test
    void isValid_whenContentTypeIsTextPlain_thenReturnFalse() {
        MultipartFile file = new MockMultipartFile(
            "file", "readme.txt", "text/plain", "hello".getBytes());
        assertFalse(validator.isValid(file, context));
    }

    // ── allowed types with invalid image bytes (ImageIO returns null) ───────

    @Test
    void isValid_whenJpegTypeButEmptyBytes_thenReturnFalse() {
        // Empty byte array → ImageIO.read() returns null
        MultipartFile file = new MockMultipartFile(
            "file", "photo.jpg", "image/jpeg", new byte[]{});
        assertFalse(validator.isValid(file, context));
    }

    @Test
    void isValid_whenPngTypeButEmptyBytes_thenReturnFalse() {
        MultipartFile file = new MockMultipartFile(
            "file", "photo.png", "image/png", new byte[]{});
        assertFalse(validator.isValid(file, context));
    }

    @Test
    void isValid_whenGifTypeButEmptyBytes_thenReturnFalse() {
        MultipartFile file = new MockMultipartFile(
            "file", "anim.gif", "image/gif", new byte[]{});
        assertFalse(validator.isValid(file, context));
    }

    // ── allowed types with real image bytes ─────────────────────────────────

    @Test
    void isValid_whenValidPngBytes_thenReturnTrue() throws Exception {
        byte[] pngBytes = buildMinimalPng();
        MultipartFile file = new MockMultipartFile(
            "file", "photo.png", "image/png", pngBytes);
        assertTrue(validator.isValid(file, context));
    }

    @Test
    void isValid_whenValidJpegBytes_thenReturnTrue() throws Exception {
        byte[] jpegBytes = buildMinimalJpeg();
        MultipartFile file = new MockMultipartFile(
            "file", "photo.jpg", "image/jpeg", jpegBytes);
        assertTrue(validator.isValid(file, context));
    }

    @Test
    void isValid_whenValidGifBytes_thenReturnTrue() throws Exception {
        byte[] gifBytes = buildMinimalGif();
        MultipartFile file = new MockMultipartFile(
            "file", "anim.gif", "image/gif", gifBytes);
        assertTrue(validator.isValid(file, context));
    }

    // ── IOException path ────────────────────────────────────────────────────

    @Test
    void isValid_whenIoExceptionOnRead_thenReturnFalse() throws Exception {
        MultipartFile file = mock(MultipartFile.class);
        when(file.getContentType()).thenReturn("image/png");
        when(file.getInputStream()).thenThrow(new IOException("disk error"));
        assertFalse(validator.isValid(file, context));
    }

    // ── helpers: minimal valid image byte arrays ────────────────────────────

    /**
     * Returns a 1×1 transparent PNG (67 bytes) that ImageIO can decode.
     */
    private byte[] buildMinimalPng() {
        return new byte[]{
            (byte)0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A,  // PNG signature
            0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52,          // IHDR length + type
            0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,          // width=1, height=1
            0x08, 0x02, 0x00, 0x00, 0x00, (byte)0x90, 0x77, 0x53,    // 8-bit RGB, CRC
            (byte)0xDE, 0x00, 0x00, 0x00, 0x0C, 0x49, 0x44, 0x41,   // IDAT length + type
            0x54, 0x08, (byte)0xD7, 0x63, (byte)0xF8, (byte)0xCF,
            (byte)0xC0, 0x00, 0x00, 0x00, 0x02, 0x00, 0x01,
            (byte)0xE2, 0x21, (byte)0xBC, 0x33,                      // IDAT CRC
            0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4E, 0x44,          // IEND type
            (byte)0xAE, 0x42, 0x60, (byte)0x82                        // IEND CRC
        };
    }

    /**
     * Minimal valid JPEG (a real 1×1 white pixel).
     */
    private byte[] buildMinimalJpeg() {
        return new byte[]{
            (byte)0xFF, (byte)0xD8, (byte)0xFF, (byte)0xE0,  // SOI + APP0 marker
            0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00,        // APP0 length + "JFIF\0"
            0x01, 0x01, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00, // version, density
            (byte)0xFF, (byte)0xDB, 0x00, 0x43, 0x00,         // DQT marker + length
            0x08, 0x06, 0x06, 0x07, 0x06, 0x05, 0x08, 0x07,
            0x07, 0x07, 0x09, 0x09, 0x08, 0x0A, 0x0C, 0x14,
            0x0D, 0x0C, 0x0B, 0x0B, 0x0C, 0x19, 0x12, 0x13,
            0x0F, 0x14, 0x1D, 0x1A, 0x1F, 0x1E, 0x1D, 0x1A,
            0x1C, 0x1C, 0x20, 0x24, 0x2E, 0x27, 0x20, 0x22,
            0x2C, 0x23, 0x1C, 0x1C, 0x28, 0x37, 0x29, 0x2C,
            0x30, 0x31, 0x34, 0x34, 0x34, 0x1F, 0x27, 0x39,
            0x3D, 0x38, 0x32, 0x3C, 0x2E, 0x33, 0x34, 0x32,
            (byte)0xFF, (byte)0xC0, 0x00, 0x0B, 0x08,         // SOF0
            0x00, 0x01, 0x00, 0x01, 0x01, 0x01, 0x11, 0x00,
            (byte)0xFF, (byte)0xC4, 0x00, 0x1F, 0x00,         // DHT
            0x00, 0x01, 0x05, 0x01, 0x01, 0x01, 0x01, 0x01,
            0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
            0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07,
            0x08, 0x09, 0x0A, 0x0B,
            (byte)0xFF, (byte)0xDA, 0x00, 0x08, 0x01, 0x01,   // SOS
            0x00, 0x00, 0x3F, 0x00, (byte)0xFB, (byte)0xD8,
            (byte)0xFF, (byte)0xD9                              // EOI
        };
    }

    /**
     * Minimal GIF87a 1×1 image.
     */
    private byte[] buildMinimalGif() {
        return new byte[]{
            0x47, 0x49, 0x46, 0x38, 0x37, 0x61,              // "GIF87a"
            0x01, 0x00, 0x01, 0x00,                            // width=1, height=1
            (byte)0x80, 0x00, 0x00,                            // GCT flag, bg, aspect
            (byte)0xFF, (byte)0xFF, (byte)0xFF,                // GCT: white
            0x00, 0x00, 0x00,                                  // GCT: black
            0x2C,                                              // Image descriptor
            0x00, 0x00, 0x00, 0x00,                            // left=0, top=0
            0x01, 0x00, 0x01, 0x00, 0x00,                     // width=1, height=1
            0x02,                                              // LZW min code size
            0x02, 0x4C, 0x01, 0x00,                           // LZW data
            0x3B                                               // GIF trailer
        };
    }
}