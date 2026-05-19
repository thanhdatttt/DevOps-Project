package com.yas.product.service;

import com.yas.commonlibrary.exception.BadRequestException;
import com.yas.commonlibrary.exception.DuplicatedException;
import com.yas.commonlibrary.exception.NotFoundException;
import com.yas.product.model.Brand;
import com.yas.product.model.Product;
import com.yas.product.repository.BrandRepository;
import com.yas.product.viewmodel.brand.BrandListGetVm;
import com.yas.product.viewmodel.brand.BrandPostVm;
import com.yas.product.viewmodel.brand.BrandVm;
import org.junit.Test;
import org.junit.jupiter.api.Assertions;
import org.junit.runner.RunWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.MockitoJUnitRunner;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;

import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@RunWith(MockitoJUnitRunner.class)
class BrandServiceTest {

    @Mock
    private BrandRepository brandRepository;

    @InjectMocks
    private BrandService brandService;

    // Retrieve a paginated list of brands successfully
    @Test
    void test_retrieve_paginated_brands_successfully() {
        List<Brand> brands = List.of(new Brand(), new Brand());
        Page<Brand> brandPage = new PageImpl<>(brands);
        when(brandRepository.findAll(any(Pageable.class))).thenReturn(brandPage);

        BrandListGetVm result = brandService.getBrands(0, 2);

        assertEquals(2, result.brandContent().size());
        assertEquals(0, result.pageNo());
        assertEquals(2, result.pageSize());
    }

    // Create a new brand when valid data is provided
    @Test
    void test_create_brand_successfully() {
        BrandPostVm brandPostVm = new BrandPostVm("BrandName", "brand-slug", true);
        Brand brand = brandPostVm.toModel();
        when(brandRepository.save(any(Brand.class))).thenReturn(brand);

        Brand result = brandService.create(brandPostVm);

        assertEquals("BrandName", result.getName());
        assertEquals("brand-slug", result.getSlug());
    }

    // Update an existing brand when valid data is provided
    @Test
    void test_update_brand_successfully() {
        BrandPostVm brandPostVm = new BrandPostVm("UpdatedName", "updated-slug", true);
        Brand existingBrand = new Brand();
        existingBrand.setId(1L);
        when(brandRepository.findById(1L)).thenReturn(Optional.of(existingBrand));
        when(brandRepository.save(any(Brand.class))).thenReturn(existingBrand);

        Brand result = brandService.update(brandPostVm, 1L);

        assertEquals("UpdatedName", result.getName());
        assertEquals("updated-slug", result.getSlug());
    }

    // Attempt to create a brand with a name that already exists
    @Test
    void test_create_brand_with_existing_name() {
        BrandPostVm brandPostVm = new BrandPostVm("ExistingName", "existing-slug", true);
        when(brandRepository.findExistedName("ExistingName", null)).thenReturn(new Brand());

        Assertions.assertThrows(DuplicatedException.class, () -> {
            brandService.create(brandPostVm);
        });
    }

    // Attempt to update a brand with a name that already exists
    @Test
    void test_update_brand_with_existing_name() {
        BrandPostVm brandPostVm = new BrandPostVm("ExistingName", "existing-slug", true);
        when(brandRepository.findExistedName("ExistingName", 1L)).thenReturn(new Brand());

        Assertions.assertThrows(DuplicatedException.class, () -> {
            brandService.update(brandPostVm, 1L);
        });
    }

    // Attempt to update a brand that does not exist
    @Test
    void test_update_nonexistent_brand() {
        BrandPostVm brandPostVm = new BrandPostVm("NonExistentName", "nonexistent-slug", true);
        when(brandRepository.findById(1L)).thenReturn(Optional.empty());

        Assertions.assertThrows(NotFoundException.class, () -> {
            brandService.update(brandPostVm, 1L);
        });
    }

    // Delete a brand that has no products
    @Test
    void test_delete_brand_without_products_successfully() {
        Brand brand = new Brand();
        brand.setId(1L);
        brand.setProducts(Collections.emptyList());
        when(brandRepository.findById(1L)).thenReturn(Optional.of(brand));

        brandService.delete(1L);

        verify(brandRepository, times(1)).deleteById(1L);
    }

    // Attempt to delete a brand that has associated products
    @Test
    void test_delete_brand_with_products_throws_bad_request() {
        Brand brand = new Brand();
        brand.setId(1L);
        brand.setProducts(List.of(new Product()));
        when(brandRepository.findById(1L)).thenReturn(Optional.of(brand));

        Assertions.assertThrows(BadRequestException.class, () -> brandService.delete(1L));
        verify(brandRepository, never()).deleteById(any());
    }

    // Attempt to delete a non-existent brand
    @Test
    void test_delete_nonexistent_brand_throws_not_found() {
        when(brandRepository.findById(99L)).thenReturn(Optional.empty());

        Assertions.assertThrows(NotFoundException.class, () -> brandService.delete(99L));
    }

    // Get brands by IDs returns matching brand view models
    @Test
    void test_get_brands_by_ids_returns_correct_vms() {
        Brand brand1 = new Brand();
        brand1.setId(1L);
        brand1.setName("Brand A");
        brand1.setSlug("brand-a");

        Brand brand2 = new Brand();
        brand2.setId(2L);
        brand2.setName("Brand B");
        brand2.setSlug("brand-b");

        when(brandRepository.findAllById(List.of(1L, 2L))).thenReturn(List.of(brand1, brand2));

        List<BrandVm> result = brandService.getBrandsByIds(List.of(1L, 2L));

        assertEquals(2, result.size());
        assertEquals("Brand A", result.get(0).name());
        assertEquals("Brand B", result.get(1).name());
    }

    // Get brands by IDs with empty list returns empty result
    @Test
    void test_get_brands_by_ids_empty_list() {
        when(brandRepository.findAllById(Collections.emptyList())).thenReturn(Collections.emptyList());

        List<BrandVm> result = brandService.getBrandsByIds(Collections.emptyList());

        assertNotNull(result);
        assertTrue(result.isEmpty());
    }

    // Paginated brands - verify pagination metadata
    @Test
    void test_retrieve_brands_pagination_metadata() {
        List<Brand> brands = List.of(new Brand(), new Brand(), new Brand());
        Page<Brand> brandPage = new PageImpl<>(brands);
        when(brandRepository.findAll(any(Pageable.class))).thenReturn(brandPage);

        BrandListGetVm result = brandService.getBrands(0, 3);

        assertEquals(3, result.totalElements());
        assertEquals(1, result.totalPages());
        assertTrue(result.isLast());
    }
}
