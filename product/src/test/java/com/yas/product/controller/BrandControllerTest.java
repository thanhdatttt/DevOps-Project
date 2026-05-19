package com.yas.product.controller;

import com.yas.product.ProductApplication;
import com.yas.product.model.Brand;
import com.yas.product.repository.BrandRepository;
import com.yas.product.service.BrandService;
import com.yas.product.viewmodel.brand.BrandListGetVm;
import com.yas.product.viewmodel.brand.BrandVm;
import com.yas.product.viewmodel.brand.BrandPostVm;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.context.ContextConfiguration;
import org.springframework.test.context.junit.jupiter.SpringExtension;
import org.springframework.test.web.servlet.MockMvc;
import org.testcontainers.shaded.com.fasterxml.jackson.databind.ObjectMapper;

import java.util.Arrays;
import java.util.Collections;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(SpringExtension.class)
@WebMvcTest(controllers = BrandController.class)
@ContextConfiguration(classes = ProductApplication.class)
@AutoConfigureMockMvc(addFilters = false)
class BrandControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private BrandRepository brandRepository;

    @MockBean
    private BrandService brandService;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Test
    void testListBrands() throws Exception {

        when(brandRepository.findByNameContainingIgnoreCase(any())).thenReturn(Arrays.asList(
                createBrand(1L, "Brand 1"),
                createBrand(2L, "Brand 2")
        ));

        mockMvc.perform(get("/backoffice/brands"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(1L))
                .andExpect(jsonPath("$[0].name").value("Brand 1"))
                .andExpect(jsonPath("$[1].id").value(2L))
                .andExpect(jsonPath("$[1].name").value("Brand 2"));
    }

    @Test
    void testGetBrand() throws Exception {
        Brand brand = createBrand(1L, "Brand 1");

        when(brandRepository.findById(1L)).thenReturn(Optional.of(brand));

        mockMvc.perform(get("/backoffice/brands/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1L))
                .andExpect(jsonPath("$.name").value("Brand 1"));
    }

    @Test
    void testGetBrandNotFound() throws Exception {
        when(brandRepository.findById(anyLong())).thenReturn(Optional.empty());

        mockMvc.perform(get("/backoffice/brands/999"))
                .andExpect(status().isNotFound());
    }

    @Test
    void testCreateBrand() throws Exception {
        BrandPostVm brandPostVm = new BrandPostVm("New Brand", "newB", true);
        Brand brand = createBrand(1L, "New Brand");

        when(brandService.create(any(BrandPostVm.class))).thenReturn(brand);

        mockMvc.perform(post("/backoffice/brands")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(brandPostVm)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(1L))
                .andExpect(jsonPath("$.name").value("New Brand"));
    }

    @Test
    void testUpdateBrand() throws Exception {
        BrandPostVm brandPostVm = new BrandPostVm("Updated Brand", "update-b", true);

        mockMvc.perform(put("/backoffice/brands/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(brandPostVm)))
                .andExpect(status().isNoContent());
    }

    @Test
    void testDeleteBrand() throws Exception {
        Brand brand = createBrand(1L, "Brand 1");
        when(brandRepository.findById(1L)).thenReturn(Optional.of(brand));

        mockMvc.perform(delete("/backoffice/brands/1"))
                .andExpect(status().isNoContent());
    }

    private Brand createBrand(Long id, String name) {
        Brand brand = new Brand();
        brand.setId(id);
        brand.setName(name);
        brand.setProducts(Collections.emptyList());
        return brand;
    }

    @Test
    void testListBrandsStorefront() throws Exception {
        when(brandRepository.findByNameContainingIgnoreCase(any())).thenReturn(Arrays.asList(
                createBrand(1L, "Brand 1"),
                createBrand(2L, "Brand 2")
        ));

        mockMvc.perform(get("/storefront/brands"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(1L))
                .andExpect(jsonPath("$[1].id").value(2L));
    }

    @Test
    void testListBrandsWithNameFilter() throws Exception {
        when(brandRepository.findByNameContainingIgnoreCase("Nike")).thenReturn(
                Arrays.asList(createBrand(3L, "Nike"))
        );

        mockMvc.perform(get("/backoffice/brands").param("brandName", "Nike"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].name").value("Nike"));
    }

    @Test
    void testListBrandsEmpty() throws Exception {
        when(brandRepository.findByNameContainingIgnoreCase(any())).thenReturn(Collections.emptyList());

        mockMvc.perform(get("/backoffice/brands"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isEmpty());
    }

    @Test
    void testGetPageableBrands() throws Exception {
        BrandListGetVm brandListGetVm = new BrandListGetVm(
                Arrays.asList(
                        new BrandVm(1L, "Brand A", "brand-a", true),
                        new BrandVm(2L, "Brand B", "brand-b", true)
                ), 0, 10, 2, 1, true);

        when(brandService.getBrands(0, 10)).thenReturn(brandListGetVm);

        mockMvc.perform(get("/backoffice/brands/paging").param("pageNo", "0").param("pageSize", "10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.brandContent[0].name").value("Brand A"))
                .andExpect(jsonPath("$.totalElements").value(2))
                .andExpect(jsonPath("$.totalPages").value(1));
    }

    @Test
    void testGetPageableBrandsStorefront() throws Exception {
        BrandListGetVm brandListGetVm = new BrandListGetVm(
                Collections.emptyList(), 0, 10, 0, 0, true);

        when(brandService.getBrands(0, 10)).thenReturn(brandListGetVm);

        mockMvc.perform(get("/storefront/brands/paging"))
                .andExpect(status().isOk());
    }

    @Test
    void testGetBrandsByIds() throws Exception {
        when(brandService.getBrandsByIds(Arrays.asList(1L, 2L))).thenReturn(Arrays.asList(
                new BrandVm(1L, "Brand A", "brand-a", true),
                new BrandVm(2L, "Brand B", "brand-b", true)
        ));

        mockMvc.perform(get("/backoffice/brands/by-ids").param("ids", "1", "2"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(1L))
                .andExpect(jsonPath("$[1].id").value(2L));
    }
}
