package com.yas.media;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.yas.commonlibrary.exception.NotFoundException;
import com.yas.media.controller.MediaController;
import com.yas.media.model.Media;
import com.yas.media.model.dto.MediaDto;
import com.yas.media.service.MediaService;
import com.yas.media.viewmodel.MediaVm;
import java.io.ByteArrayInputStream;
import java.util.Collections;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.mock.web.MockMultipartFile;
import com.yas.media.viewmodel.MediaPostVm;

class MediaControllerTest {

    @Mock
    private MediaService mediaService;

    @InjectMocks
    private MediaController mediaController;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
    }

    // ========================
    // POST /medias - create
    // ========================

    @Test
    void create_whenValidInput_thenReturnOk() {
        MockMultipartFile multipartFile = new MockMultipartFile(
            "file", "test.png", "image/png", new byte[]{});
        MediaPostVm mediaPostVm = new MediaPostVm("caption", multipartFile, "override.png");

        Media media = new Media();
        media.setId(1L);
        media.setCaption("caption");
        media.setFileName("override.png");
        media.setMediaType("image/png");

        when(mediaService.saveMedia(any(MediaPostVm.class))).thenReturn(media);

        ResponseEntity<Object> response = mediaController.create(mediaPostVm);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        verify(mediaService, times(1)).saveMedia(any(MediaPostVm.class));
    }

    // ========================
    // DELETE /medias/{id} - delete
    // ========================

    @Test
    void delete_whenValidId_thenReturnNoContent() {
        doNothing().when(mediaService).removeMedia(1L);

        ResponseEntity<Void> response = mediaController.delete(1L);

        assertEquals(HttpStatus.NO_CONTENT, response.getStatusCode());
        verify(mediaService, times(1)).removeMedia(1L);
    }

    @Test
    void delete_whenMediaNotFound_thenThrowNotFoundException() {
        doThrow(new NotFoundException("Media 99 is not found"))
            .when(mediaService).removeMedia(99L);

        try {
            mediaController.delete(99L);
        } catch (NotFoundException ex) {
            assertEquals("Media 99 is not found", ex.getMessage());
        }

        verify(mediaService, times(1)).removeMedia(99L);
    }

    // ========================
    // GET /medias/{id} - get
    // ========================

    @Test
    void get_whenMediaExists_thenReturnOk() {
        MediaVm mediaVm = new MediaVm(1L, "caption", "file.png", "image/png", "http://localhost/medias/1/file/file.png");
        when(mediaService.getMediaById(1L)).thenReturn(mediaVm);

        ResponseEntity<MediaVm> response = mediaController.get(1L);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(mediaVm, response.getBody());
        verify(mediaService, times(1)).getMediaById(1L);
    }

    @Test
    void get_whenMediaNotFound_thenReturnNotFound() {
        when(mediaService.getMediaById(99L)).thenReturn(null);

        ResponseEntity<MediaVm> response = mediaController.get(99L);

        assertEquals(HttpStatus.NOT_FOUND, response.getStatusCode());
        verify(mediaService, times(1)).getMediaById(99L);
    }

    // ========================
    // GET /medias?ids=... - getByIds
    // ========================

    @Test
    void getByIds_whenMediasExist_thenReturnOk() {
        List<Long> ids = List.of(1L, 2L);
        List<MediaVm> mediaVms = List.of(
            new MediaVm(1L, "cap1", "file1.png", "image/png", "http://url/1"),
            new MediaVm(2L, "cap2", "file2.png", "image/jpeg", "http://url/2")
        );
        when(mediaService.getMediaByIds(ids)).thenReturn(mediaVms);

        ResponseEntity<List<MediaVm>> response = mediaController.getByIds(ids);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(2, response.getBody().size());
        verify(mediaService, times(1)).getMediaByIds(ids);
    }

    @Test
    void getByIds_whenNoMediaFound_thenReturnNotFound() {
        List<Long> ids = List.of(99L, 100L);
        when(mediaService.getMediaByIds(ids)).thenReturn(Collections.emptyList());

        ResponseEntity<List<MediaVm>> response = mediaController.getByIds(ids);

        assertEquals(HttpStatus.NOT_FOUND, response.getStatusCode());
        verify(mediaService, times(1)).getMediaByIds(ids);
    }

    // ========================
    // GET /medias/{id}/file/{fileName} - getFile
    // ========================

    @Test
    void getFile_whenFileExists_thenReturnOkWithContent() {
        byte[] content = "fake-image-content".getBytes();
        MediaDto mediaDto = MediaDto.builder()
            .content(new ByteArrayInputStream(content))
            .mediaType(MediaType.IMAGE_PNG)
            .build();

        when(mediaService.getFile(1L, "file.png")).thenReturn(mediaDto);

        var response = mediaController.getFile(1L, "file.png");

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(MediaType.IMAGE_PNG, response.getHeaders().getContentType());
        verify(mediaService, times(1)).getFile(1L, "file.png");
    }
}
