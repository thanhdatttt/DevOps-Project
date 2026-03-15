package com.yas.product.service;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertNull;
import static org.junit.Assert.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

import com.yas.commonlibrary.exception.DuplicatedException;
import com.yas.product.model.attribute.ProductAttribute;
import com.yas.product.model.attribute.ProductAttributeGroup;
import com.yas.product.repository.ProductAttributeGroupRepository;
import com.yas.product.repository.ProductAttributeRepository;
import com.yas.product.viewmodel.productattribute.ProductAttributeListGetVm;
import com.yas.product.viewmodel.productattribute.ProductAttributePostVm;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;

@ExtendWith(MockitoExtension.class)
class ProductAttributeServiceTest {

    @Mock
    private ProductAttributeRepository productAttributeRepository;

    @Mock
    private ProductAttributeGroupRepository productAttributeGroupRepository;

    @InjectMocks
    private ProductAttributeService productAttributeService;


    // Retrieve pageable product attributes successfully
    @Test
    void test_retrieve_pageable_product_attributes_successfully() {

        List<ProductAttribute> productAttributes = new ArrayList<>();
        ProductAttribute attr = new ProductAttribute();
        attr.setId(1L);
        attr.setName("Attribute1");
        productAttributes.add(attr);
        Page<ProductAttribute> page = new PageImpl<>(productAttributes);
        when(productAttributeRepository.findAll(any(Pageable.class))).thenReturn(page);

        ProductAttributeListGetVm result = productAttributeService.getPageableProductAttributes(0, 10);

        assertEquals(1, result.productAttributeContent().size());
        assertEquals("Attribute1", result.productAttributeContent().get(0).name());
    }

    // Save a new product attribute with a valid name and group ID
    @Test
    void test_save_new_product_attribute_with_valid_name_and_group_id() {
        ProductAttributeGroup group = new ProductAttributeGroup();
        group.setId(1L);
        group.setName("Group1");

        ProductAttribute productAttribute = new ProductAttribute();
        productAttribute.setId(1L);
        productAttribute.setName("Attribute1");
        productAttribute.setProductAttributeGroup(group);

        when(productAttributeGroupRepository.findById(1L)).thenReturn(Optional.of(group));
        when(productAttributeRepository.save(any(ProductAttribute.class)))
                .thenReturn(productAttribute);

        ProductAttributePostVm postVm = new ProductAttributePostVm("Attribute1", 1L);
        ProductAttribute result = productAttributeService.save(postVm);

        assertEquals("Attribute1", result.getName());
        assertEquals(group, result.getProductAttributeGroup());
    }

    // Update an existing product attribute with a valid name and group ID
    @Test
    void test_update_existing_product_attribute_with_valid_name_and_group_id() {
        ProductAttributeGroup group = new ProductAttributeGroup();
        group.setId(1L);
        group.setName("Group1");

        ProductAttribute existingAttr = new ProductAttribute();
        existingAttr.setId(1L);
        existingAttr.setName("Attribute1");
        existingAttr.setProductAttributeGroup(group);

        when(productAttributeRepository.findById(1L)).thenReturn(Optional.of(existingAttr));
        when(productAttributeGroupRepository.findById(1L)).thenReturn(Optional.of(group));
        when(productAttributeRepository.save(any(ProductAttribute.class)))
                .thenReturn(existingAttr);

        ProductAttributePostVm postVm = new ProductAttributePostVm("Updated Attribute", 1L);
        ProductAttribute result = productAttributeService.update(postVm, 1L);

        assertEquals("Updated Attribute", result.getName());
        assertEquals(group, result.getProductAttributeGroup());
    }

    // Save a product attribute with a null group ID
    @Test
    void test_save_product_attribute_with_null_group_id() {
        ProductAttribute saved = new ProductAttribute();
        saved.setId(1L);
        saved.setName("New Attribute");
        when(productAttributeRepository.save(any(ProductAttribute.class))).thenReturn(saved);

        ProductAttributePostVm postVm = new ProductAttributePostVm("New Attribute", null);
        ProductAttribute result = productAttributeService.save(postVm);

        assertEquals("New Attribute", result.getName());
        assertNull(result.getProductAttributeGroup());
    }

    // Update a product attribute with a null group ID
    @Test
    void test_update_product_attribute_with_null_group_id() {
        ProductAttribute existingAttr = new ProductAttribute();
        existingAttr.setId(1L);
        existingAttr.setName("Old Attribute");
        when(productAttributeRepository.findById(1L)).thenReturn(Optional.of(existingAttr));

        ProductAttribute updatedAttr = new ProductAttribute();
        updatedAttr.setId(1L);
        updatedAttr.setName("Updated Attribute");
        when(productAttributeRepository.save(any(ProductAttribute.class))).thenReturn(updatedAttr);

        ProductAttributePostVm postVm = new ProductAttributePostVm("Updated Attribute", null);
        ProductAttribute result = productAttributeService.update(postVm, 1L);

        assertEquals("Updated Attribute", result.getName());
        assertNull(result.getProductAttributeGroup());
    }

    // Save a product attribute with a duplicated name
    @Test
    void test_save_product_attribute_with_duplicated_name() {
        when(productAttributeRepository.findExistedName("Duplicate Name", null)).thenReturn(new ProductAttribute());

        ProductAttributePostVm vm = new ProductAttributePostVm("Duplicate Name", null);
        assertThrows(DuplicatedException.class, () -> productAttributeService.save(vm));
    }

    // Update a product attribute with a duplicated name
    @Test
    void test_update_product_attribute_with_duplicated_name() {
        when(productAttributeRepository.findExistedName("Duplicate Name", 1L)).thenReturn(new ProductAttribute());

        ProductAttributePostVm vm = new ProductAttributePostVm("Duplicate Name", null);
        assertThrows(DuplicatedException.class, () -> productAttributeService.update(vm, 1L));
    }

    @Test
    void test_save_product_attribute_with_group_id_not_found() {
        ProductAttributePostVm vm = new ProductAttributePostVm("NewAttr", 99L);
        when(productAttributeRepository.findExistedName("NewAttr", null)).thenReturn(null);
        when(productAttributeGroupRepository.findById(99L)).thenReturn(java.util.Optional.empty());

        assertThrows(com.yas.commonlibrary.exception.BadRequestException.class,
            () -> productAttributeService.save(vm));
    }

    @Test
    void test_update_product_attribute_not_found() {
        ProductAttributePostVm vm = new ProductAttributePostVm("UpdatedAttr", null);
        when(productAttributeRepository.findExistedName("UpdatedAttr", 99L)).thenReturn(null);
        when(productAttributeRepository.findById(99L)).thenReturn(java.util.Optional.empty());

        assertThrows(com.yas.commonlibrary.exception.NotFoundException.class,
            () -> productAttributeService.update(vm, 99L));
    }

    @Test
    void test_update_product_attribute_with_group_id_not_found() {
        ProductAttribute existing = new ProductAttribute();
        existing.setId(1L);
        existing.setName("OldAttr");
        ProductAttributePostVm vm = new ProductAttributePostVm("NewName", 99L);

        when(productAttributeRepository.findExistedName("NewName", 1L)).thenReturn(null);
        when(productAttributeRepository.findById(1L)).thenReturn(java.util.Optional.of(existing));
        when(productAttributeGroupRepository.findById(99L)).thenReturn(java.util.Optional.empty());

        assertThrows(com.yas.commonlibrary.exception.BadRequestException.class,
            () -> productAttributeService.update(vm, 1L));
    }
}