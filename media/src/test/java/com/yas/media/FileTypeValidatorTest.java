package com.yas.media;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import jakarta.validation.ConstraintValidatorContext;
import jakarta.validation.ConstraintValidatorContext.ConstraintViolationBuilder;
import java.awt.Color;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import javax.imageio.ImageIO;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockMultipartFile;

import com.yas.media.utils.FileTypeValidator;
import com.yas.media.utils.ValidFileType;

class FileTypeValidatorTest {

    private FileTypeValidator validator;
    private ConstraintValidatorContext context;
    private ConstraintViolationBuilder violationBuilder;
    private ValidFileType constraintAnnotation;

    @BeforeEach
    void setUp() {
        validator = new FileTypeValidator();
        context = mock(ConstraintValidatorContext.class);
        violationBuilder = mock(ConstraintViolationBuilder.class);

        constraintAnnotation = mock(ValidFileType.class);
        when(constraintAnnotation.allowedTypes()).thenReturn(new String[]{"image/png", "image/jpeg", "image/gif"});
        when(constraintAnnotation.message()).thenReturn("Invalid file type");

        when(context.buildConstraintViolationWithTemplate(anyString())).thenReturn(violationBuilder);
        when(violationBuilder.addConstraintViolation()).thenReturn(context);

        validator.initialize(constraintAnnotation);
    }

    private byte[] createValidImageBytes(String format) throws IOException {
        BufferedImage img = new BufferedImage(10, 10, BufferedImage.TYPE_INT_RGB);
        img.setRGB(0, 0, Color.RED.getRGB());
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        ImageIO.write(img, format, baos);
        return baos.toByteArray();
    }

    @Test
    void isValid_whenFileIsNull_thenReturnFalse() {
        boolean result = validator.isValid(null, context);
        assertFalse(result);
    }

    @Test
    void isValid_whenContentTypeIsNull_thenReturnFalse() {
        MockMultipartFile file = new MockMultipartFile("file", "test.png", null, new byte[]{});
        boolean result = validator.isValid(file, context);
        assertFalse(result);
    }

    @Test
    void isValid_whenContentTypeNotAllowed_thenReturnFalse() {
        MockMultipartFile file = new MockMultipartFile("file", "test.pdf", "application/pdf", new byte[]{});
        boolean result = validator.isValid(file, context);
        assertFalse(result);
    }

    @Test
    void isValid_whenValidPngFile_thenReturnTrue() throws IOException {
        byte[] pngBytes = createValidImageBytes("png");
        MockMultipartFile file = new MockMultipartFile("file", "test.png", "image/png", pngBytes);

        boolean result = validator.isValid(file, context);
        assertTrue(result);
    }

    @Test
    void isValid_whenValidJpegFile_thenReturnTrue() throws IOException {
        byte[] jpegBytes = createValidImageBytes("jpeg");
        MockMultipartFile file = new MockMultipartFile("file", "test.jpg", "image/jpeg", jpegBytes);

        boolean result = validator.isValid(file, context);
        assertTrue(result);
    }

    @Test
    void isValid_whenValidGifFile_thenReturnTrue() throws IOException {
        byte[] gifBytes = createValidImageBytes("gif");
        MockMultipartFile file = new MockMultipartFile("file", "test.gif", "image/gif", gifBytes);

        boolean result = validator.isValid(file, context);
        assertTrue(result);
    }

    @Test
    void isValid_whenCorruptedImageContent_thenReturnFalse() {
        // Content type matches but content is not a real image
        MockMultipartFile file = new MockMultipartFile(
            "file", "test.png", "image/png", "not-an-image".getBytes());

        boolean result = validator.isValid(file, context);
        assertFalse(result);
    }

    @Test
    void isValid_whenEmptyFile_thenReturnFalse() {
        MockMultipartFile file = new MockMultipartFile("file", "test.png", "image/png", new byte[]{});
        boolean result = validator.isValid(file, context);
        assertFalse(result);
    }
}
