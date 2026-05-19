package com.yas.product.controller;


import com.yas.product.ProductApplication;
import com.yas.product.model.Product;
import com.yas.product.model.ProductOption;
import com.yas.product.model.ProductOptionValue;
import com.yas.product.repository.ProductOptionValueRepository;
import com.yas.product.repository.ProductRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.context.ContextConfiguration;
import org.springframework.test.context.junit.jupiter.SpringExtension;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;
import java.util.Optional;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(SpringExtension.class)
@WebMvcTest(controllers = ProductOptionValueController.class)
@ContextConfiguration(classes = ProductApplication.class)
@AutoConfigureMockMvc(addFilters = false)
class ProductOptionValueControllerTest {
    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private ProductOptionValueRepository productOptionValueRepository;

    @MockBean
    private ProductRepository productRepository;

    @Test
    void testListProductOptionValues() throws Exception {
        Product product = new Product();
        product.setId(1L);
        product.setName("Laptop");

        ProductOption productOption = new ProductOption();
        productOption.setId(1L);
        productOption.setName("RAM");

        ProductOptionValue mockProductOptionValue
                = new ProductOptionValue();
        mockProductOptionValue.setId(1L);
        mockProductOptionValue.setValue("1GB");
        mockProductOptionValue.setProductOption(productOption);
        mockProductOptionValue.setProduct(product);

        when(productOptionValueRepository.findAll()).thenReturn(List.of(mockProductOptionValue));

        mockMvc.perform(get("/backoffice/product-option-values"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$[0].id").value(1L));
    }

    @Test
    void testListProductOptionValueOfProduct() throws Exception {
        Long productId = 1L;
        Product mockProduct = new Product();

        ProductOption productOption = new ProductOption();
        productOption.setId(1L);
        productOption.setName("RAM");

        ProductOptionValue mockProductOptionValue
                = new ProductOptionValue();
        mockProductOptionValue.setId(1L);
        mockProductOptionValue.setValue("1GB");
        mockProductOptionValue.setProductOption(productOption);
        mockProductOptionValue.setProduct(mockProduct);

        when(productRepository.findById(productId)).thenReturn(Optional.of(mockProduct));
        when(productOptionValueRepository.findAllByProduct(mockProduct)).thenReturn(List.of(mockProductOptionValue));

        mockMvc.perform(get("/storefront/product-option-values/{productId}", productId))
                .andExpect(status().isOk());

        // Test for Not Found scenario
        when(productRepository.findById(2L)).thenReturn(Optional.empty());
        mockMvc.perform(get("/storefront/product-option-values/2"))
                .andExpect(status().isNotFound());
    }

    @Test
    void testListProductOptionValues_Empty() throws Exception {
        when(productOptionValueRepository.findAll()).thenReturn(List.of());

        mockMvc.perform(get("/backoffice/product-option-values"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$").isEmpty());
    }

    @Test
    void testListProductOptionValueOfProduct_Empty() throws Exception {
        Long productId = 3L;
        Product mockProduct = new Product();
        mockProduct.setId(productId);

        when(productRepository.findById(productId)).thenReturn(Optional.of(mockProduct));
        when(productOptionValueRepository.findAllByProduct(mockProduct)).thenReturn(List.of());

        mockMvc.perform(get("/storefront/product-option-values/{productId}", productId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isEmpty());
    }

    @Test
    void testListProductOptionValueOfProduct_MultipleValues() throws Exception {
        Long productId = 4L;
        Product mockProduct = new Product();
        mockProduct.setId(productId);

        ProductOption optRam = new ProductOption();
        optRam.setId(1L);
        optRam.setName("RAM");

        ProductOption optColor = new ProductOption();
        optColor.setId(2L);
        optColor.setName("Color");

        ProductOptionValue val1 = new ProductOptionValue();
        val1.setId(10L);
        val1.setValue("8GB");
        val1.setProductOption(optRam);
        val1.setProduct(mockProduct);

        ProductOptionValue val2 = new ProductOptionValue();
        val2.setId(11L);
        val2.setValue("Black");
        val2.setProductOption(optColor);
        val2.setProduct(mockProduct);

        when(productRepository.findById(productId)).thenReturn(Optional.of(mockProduct));
        when(productOptionValueRepository.findAllByProduct(mockProduct))
                .thenReturn(List.of(val1, val2));

        mockMvc.perform(get("/storefront/product-option-values/{productId}", productId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(10L))
                .andExpect(jsonPath("$[1].id").value(11L));
    }
}
