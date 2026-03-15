package com.yas.media;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.yas.commonlibrary.exception.NotFoundException;
import com.yas.media.controller.MediaController;
import com.yas.media.model.Media;
import com.yas.media.model.dto.MediaDto;
import com.yas.media.service.MediaService;
import com.yas.media.viewmodel.MediaVm;
import java.io.ByteArrayInputStream;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

@ExtendWith(MockitoExtension.class)
class MediaControllerTest {

    @Mock
    private MediaService mediaService;

    @InjectMocks
    private MediaController mediaController;

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(mediaController).build();
    }

    // ── POST /medias ────────────────────────────────────────────────────────

    @Test
    void create_whenValidFile_thenReturns200WithBody() throws Exception {
        Media savedMedia = new Media();
        savedMedia.setId(1L);
        savedMedia.setCaption("my caption");
        savedMedia.setFileName("photo.png");
        savedMedia.setMediaType("image/png");

        when(mediaService.saveMedia(any())).thenReturn(savedMedia);

        MockMultipartFile file = new MockMultipartFile(
            "multipartFile", "photo.png", "image/png", "fake-image".getBytes()
        );

        mockMvc.perform(multipart("/medias")
                .file(file)
                .param("caption", "my caption")
                .param("fileNameOverride", ""))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.id").value(1))
            .andExpect(jsonPath("$.caption").value("my caption"))
            .andExpect(jsonPath("$.fileName").value("photo.png"))
            .andExpect(jsonPath("$.mediaType").value("image/png"));
    }

    // ── DELETE /medias/{id} ─────────────────────────────────────────────────

    @Test
    void delete_whenMediaExists_thenReturns204() throws Exception {
        doNothing().when(mediaService).removeMedia(1L);

        mockMvc.perform(delete("/medias/1"))
            .andExpect(status().isNoContent());
    }

    @Test
    void delete_whenMediaNotFound_thenReturns404() throws Exception {
        doThrow(new NotFoundException("Media 99 is not found"))
            .when(mediaService).removeMedia(99L);

        mockMvc.perform(delete("/medias/99"))
            .andExpect(status().isNotFound());
    }

    // ── GET /medias/{id} ────────────────────────────────────────────────────

    @Test
    void get_whenMediaExists_thenReturns200WithBody() throws Exception {
        MediaVm vm = new MediaVm(1L, "caption", "photo.png", "image/png",
            "http://localhost/medias/1/file/photo.png");
        when(mediaService.getMediaById(1L)).thenReturn(vm);

        mockMvc.perform(get("/medias/1"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.id").value(1))
            .andExpect(jsonPath("$.fileName").value("photo.png"));
    }

    @Test
    void get_whenMediaNotFound_thenReturns404() throws Exception {
        when(mediaService.getMediaById(99L)).thenReturn(null);

        mockMvc.perform(get("/medias/99"))
            .andExpect(status().isNotFound());
    }

    // ── GET /medias?ids= ────────────────────────────────────────────────────

    @Test
    void getByIds_whenMediasExist_thenReturns200WithList() throws Exception {
        MediaVm vm1 = new MediaVm(1L, "c1", "a.png", "image/png", "http://host/medias/1/file/a.png");
        MediaVm vm2 = new MediaVm(2L, "c2", "b.jpg", "image/jpeg", "http://host/medias/2/file/b.jpg");
        when(mediaService.getMediaByIds(anyList())).thenReturn(List.of(vm1, vm2));

        mockMvc.perform(get("/medias").param("ids", "1", "2"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.length()").value(2))
            .andExpect(jsonPath("$[0].id").value(1))
            .andExpect(jsonPath("$[1].id").value(2));
    }

    @Test
    void getByIds_whenNoMediasFound_thenReturns404() throws Exception {
        when(mediaService.getMediaByIds(anyList())).thenReturn(List.of());

        mockMvc.perform(get("/medias").param("ids", "99"))
            .andExpect(status().isNotFound());
    }

    // ── GET /medias/{id}/file/{fileName} ────────────────────────────────────

    @Test
    void getFile_whenFileExists_thenReturns200WithStream() throws Exception {
        byte[] content = "image-bytes".getBytes();
        MediaDto dto = MediaDto.builder()
            .content(new ByteArrayInputStream(content))
            .mediaType(MediaType.IMAGE_PNG)
            .build();
        when(mediaService.getFile(anyLong(), anyString())).thenReturn(dto);

        mockMvc.perform(get("/medias/1/file/photo.png"))
            .andExpect(status().isOk())
            .andExpect(header().string("Content-Disposition", "attachment; filename=\"photo.png\""))
            .andExpect(content().contentType(MediaType.IMAGE_PNG))
            .andExpect(content().bytes(content));
    }
}
