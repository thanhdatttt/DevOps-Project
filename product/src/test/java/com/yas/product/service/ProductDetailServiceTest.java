package com.yas.product.service;

import com.yas.commonlibrary.exception.NotFoundException;
import com.yas.product.model.Brand;
import com.yas.product.model.Category;
import com.yas.product.model.Product;
import com.yas.product.model.ProductCategory;
import com.yas.product.model.ProductImage;
import com.yas.product.model.ProductOption;
import com.yas.product.model.ProductOptionCombination;
import com.yas.product.model.attribute.ProductAttribute;
import com.yas.product.model.attribute.ProductAttributeValue;
import com.yas.product.repository.ProductOptionCombinationRepository;
import com.yas.product.repository.ProductRepository;
import com.yas.product.viewmodel.NoFileMediaVm;
import com.yas.product.viewmodel.product.ProductDetailInfoVm;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ProductDetailServiceTest {

    @Mock
    private ProductRepository productRepository;

    @Mock
    private MediaService mediaService;

    @Mock
    private ProductOptionCombinationRepository productOptionCombinationRepository;

    @InjectMocks
    private ProductDetailService productDetailService;

    private NoFileMediaVm mediaVm;

    @BeforeEach
    void setUp() {
        mediaVm = new NoFileMediaVm(1L, "caption", "file.jpg", "image/jpeg", "http://media.url/img.jpg");
    }

    // ---- Helper builders ----

    private Product buildSimplePublishedProduct() {
        return Product.builder()
                .id(1L)
                .name("Laptop Pro")
                .slug("laptop-pro")
                .sku("LP-001")
                .gtin("GTIN001")
                .price(999.0)
                .isPublished(true)
                .isAllowedToOrder(true)
                .isFeatured(false)
                .isVisibleIndividually(true)
                .stockTrackingEnabled(false)
                .hasOptions(false)
                .productCategories(Collections.emptyList())
                .attributeValues(Collections.emptyList())
                .productImages(Collections.emptyList())
                .build();
    }

    // ---- Tests: Product not found / not published ----

    @Test
    void getProductDetailById_WhenProductNotFound_ThrowsNotFoundException() {
        when(productRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(NotFoundException.class, () -> productDetailService.getProductDetailById(99L));
    }

    @Test
    void getProductDetailById_WhenProductNotPublished_ThrowsNotFoundException() {
        Product unpublished = buildSimplePublishedProduct();
        unpublished.setPublished(false);

        when(productRepository.findById(1L)).thenReturn(Optional.of(unpublished));

        assertThrows(NotFoundException.class, () -> productDetailService.getProductDetailById(1L));
    }

    // ---- Tests: Basic product detail ----

    @Test
    void getProductDetailById_WhenSimpleProduct_ReturnsCorrectFields() {
        Product product = buildSimplePublishedProduct();

        when(productRepository.findById(1L)).thenReturn(Optional.of(product));

        ProductDetailInfoVm result = productDetailService.getProductDetailById(1L);

        assertNotNull(result);
        assertEquals(1L, result.getId());
        assertEquals("Laptop Pro", result.getName());
        assertEquals("laptop-pro", result.getSlug());
        assertEquals("LP-001", result.getSku());
        assertEquals(999.0, result.getPrice());
        assertTrue(result.getIsPublished());
        assertTrue(result.getIsAllowedToOrder());
    }

    @Test
    void getProductDetailById_WhenProductHasNoBrand_BrandFieldsAreNull() {
        Product product = buildSimplePublishedProduct();
        // brand is null by default via builder

        when(productRepository.findById(1L)).thenReturn(Optional.of(product));

        ProductDetailInfoVm result = productDetailService.getProductDetailById(1L);

        assertNull(result.getBrandId());
        assertNull(result.getBrandName());
    }

    @Test
    void getProductDetailById_WhenProductHasBrand_BrandFieldsArePopulated() {
        Brand brand = new Brand();
        brand.setId(10L);
        brand.setName("TechBrand");

        Product product = buildSimplePublishedProduct();
        product.setBrand(brand);

        when(productRepository.findById(1L)).thenReturn(Optional.of(product));

        ProductDetailInfoVm result = productDetailService.getProductDetailById(1L);

        assertEquals(10L, result.getBrandId());
        assertEquals("TechBrand", result.getBrandName());
    }

    // ---- Tests: Categories ----

    @Test
    void getProductDetailById_WhenProductHasCategories_ReturnsCategoryList() {
        Category category = new Category();
        category.setId(5L);
        category.setName("Electronics");

        ProductCategory productCategory = new ProductCategory();
        productCategory.setCategory(category);

        Product product = buildSimplePublishedProduct();
        product.setProductCategories(List.of(productCategory));

        when(productRepository.findById(1L)).thenReturn(Optional.of(product));

        ProductDetailInfoVm result = productDetailService.getProductDetailById(1L);

        assertEquals(1, result.getCategories().size());
        assertEquals("Electronics", result.getCategories().get(0).getName());
    }

    @Test
    void getProductDetailById_WhenProductCategoriesNull_ReturnsEmptyList() {
        Product product = buildSimplePublishedProduct();
        product.setProductCategories(null);

        when(productRepository.findById(1L)).thenReturn(Optional.of(product));

        ProductDetailInfoVm result = productDetailService.getProductDetailById(1L);

        assertNotNull(result.getCategories());
        assertTrue(result.getCategories().isEmpty());
    }

    // ---- Tests: Thumbnail ----

    @Test
    void getProductDetailById_WhenProductHasThumbnail_ReturnsThumbnailVm() {
        Product product = buildSimplePublishedProduct();
        product.setThumbnailMediaId(1L);

        when(productRepository.findById(1L)).thenReturn(Optional.of(product));
        when(mediaService.getMedia(1L)).thenReturn(mediaVm);

        ProductDetailInfoVm result = productDetailService.getProductDetailById(1L);

        assertNotNull(result.getThumbnail());
        assertEquals(1L, result.getThumbnail().id());
        assertEquals("http://media.url/img.jpg", result.getThumbnail().url());
    }

    @Test
    void getProductDetailById_WhenProductHasNoThumbnail_ThumbnailIsNull() {
        Product product = buildSimplePublishedProduct();
        // thumbnailMediaId is null

        when(productRepository.findById(1L)).thenReturn(Optional.of(product));

        ProductDetailInfoVm result = productDetailService.getProductDetailById(1L);

        assertNull(result.getThumbnail());
        verifyNoInteractions(mediaService);
    }

    // ---- Tests: Product images ----

    @Test
    void getProductDetailById_WhenProductHasImages_ReturnsImageList() {
        ProductImage image1 = ProductImage.builder().id(1L).imageId(10L).build();
        ProductImage image2 = ProductImage.builder().id(2L).imageId(20L).build();

        NoFileMediaVm media10 = new NoFileMediaVm(10L, "", "", "", "http://img10.url");
        NoFileMediaVm media20 = new NoFileMediaVm(20L, "", "", "", "http://img20.url");

        Product product = buildSimplePublishedProduct();
        product.setProductImages(List.of(image1, image2));

        when(productRepository.findById(1L)).thenReturn(Optional.of(product));
        when(mediaService.getMedia(10L)).thenReturn(media10);
        when(mediaService.getMedia(20L)).thenReturn(media20);

        ProductDetailInfoVm result = productDetailService.getProductDetailById(1L);

        assertEquals(2, result.getProductImages().size());
        assertEquals("http://img10.url", result.getProductImages().get(0).url());
        assertEquals("http://img20.url", result.getProductImages().get(1).url());
    }

    @Test
    void getProductDetailById_WhenProductImagesNull_ReturnsEmptyImageList() {
        Product product = buildSimplePublishedProduct();
        product.setProductImages(null);

        when(productRepository.findById(1L)).thenReturn(Optional.of(product));

        ProductDetailInfoVm result = productDetailService.getProductDetailById(1L);

        assertNotNull(result.getProductImages());
        assertTrue(result.getProductImages().isEmpty());
    }

    // ---- Tests: Attribute values ----

    @Test
    void getProductDetailById_WhenProductHasAttributeValues_ReturnsAttributeList() {
        ProductAttribute attribute = new ProductAttribute();
        attribute.setId(1L);
        attribute.setName("Color");

        ProductAttributeValue attrValue = new ProductAttributeValue();
        attrValue.setId(1L);
        attrValue.setProductAttribute(attribute);
        attrValue.setValue("Red");

        Product product = buildSimplePublishedProduct();
        product.setAttributeValues(List.of(attrValue));

        when(productRepository.findById(1L)).thenReturn(Optional.of(product));

        ProductDetailInfoVm result = productDetailService.getProductDetailById(1L);

        assertEquals(1, result.getAttributeValues().size());
        assertEquals("Color", result.getAttributeValues().get(0).nameProductAttribute());
        assertEquals("Red", result.getAttributeValues().get(0).value());
    }

    // ---- Tests: Product with variations (hasOptions = true) ----

    @Test
    void getProductDetailById_WhenProductHasOptions_ReturnsVariations() {
        ProductOption colorOption = new ProductOption();
        colorOption.setId(100L);
        colorOption.setName("Color");

        ProductOptionCombination combination = ProductOptionCombination.builder()
                .id(1L)
                .productOption(colorOption)
                .value("Red")
                .build();

        Product variation = Product.builder()
                .id(2L)
                .name("Laptop Pro - Red")
                .slug("laptop-pro-red")
                .sku("LP-RED")
                .gtin("GTIN-RED")
                .price(1099.0)
                .isPublished(true)
                .productImages(Collections.emptyList())
                .build();

        Product mainProduct = buildSimplePublishedProduct();
        mainProduct.setHasOptions(true);
        mainProduct.setProducts(List.of(variation));

        when(productRepository.findById(1L)).thenReturn(Optional.of(mainProduct));
        when(productOptionCombinationRepository.findAllByProduct(variation))
                .thenReturn(List.of(combination));

        ProductDetailInfoVm result = productDetailService.getProductDetailById(1L);

        assertEquals(1, result.getVariations().size());
        assertEquals(2L, result.getVariations().get(0).id());
        assertEquals("Laptop Pro - Red", result.getVariations().get(0).name());
        assertEquals("Red", result.getVariations().get(0).options().get(100L));
    }

    @Test
    void getProductDetailById_WhenProductHasOptions_UnpublishedVariationsAreExcluded() {
        Product publishedVariation = Product.builder()
                .id(2L).name("Published Variant").slug("pv").sku("PV1")
                .price(500.0).isPublished(true).productImages(Collections.emptyList()).build();

        Product unpublishedVariation = Product.builder()
                .id(3L).name("Unpublished Variant").slug("uv").sku("UV1")
                .price(400.0).isPublished(false).productImages(Collections.emptyList()).build();

        Product mainProduct = buildSimplePublishedProduct();
        mainProduct.setHasOptions(true);
        mainProduct.setProducts(List.of(publishedVariation, unpublishedVariation));

        when(productRepository.findById(1L)).thenReturn(Optional.of(mainProduct));
        when(productOptionCombinationRepository.findAllByProduct(publishedVariation))
                .thenReturn(Collections.emptyList());

        ProductDetailInfoVm result = productDetailService.getProductDetailById(1L);

        assertEquals(1, result.getVariations().size());
        assertEquals("Published Variant", result.getVariations().get(0).name());
    }

    @Test
    void getProductDetailById_WhenProductHasNoOptions_VariationsListIsEmpty() {
        Product product = buildSimplePublishedProduct();
        // hasOptions = false (default)

        when(productRepository.findById(1L)).thenReturn(Optional.of(product));

        ProductDetailInfoVm result = productDetailService.getProductDetailById(1L);

        assertNotNull(result.getVariations());
        assertTrue(result.getVariations().isEmpty());
        verifyNoInteractions(productOptionCombinationRepository);
    }

    @Test
    void getProductDetailById_WhenVariationHasThumbnail_ReturnsThumbnailForVariation() {
        ProductOption sizeOption = new ProductOption();
        sizeOption.setId(200L);
        sizeOption.setName("Size");

        ProductOptionCombination combo = ProductOptionCombination.builder()
                .id(1L).productOption(sizeOption).value("Large").build();

        Product variation = Product.builder()
                .id(5L).name("Shirt - Large").slug("shirt-lg").sku("SH-L")
                .price(49.0).isPublished(true)
                .thumbnailMediaId(55L)
                .productImages(Collections.emptyList())
                .build();

        Product mainProduct = buildSimplePublishedProduct();
        mainProduct.setHasOptions(true);
        mainProduct.setProducts(List.of(variation));

        when(productRepository.findById(1L)).thenReturn(Optional.of(mainProduct));
        when(productOptionCombinationRepository.findAllByProduct(variation)).thenReturn(List.of(combo));
        when(mediaService.getMedia(55L))
                .thenReturn(new NoFileMediaVm(55L, "", "", "", "http://shirt-lg.url"));

        ProductDetailInfoVm result = productDetailService.getProductDetailById(1L);

        assertNotNull(result.getVariations().get(0).thumbnail());
        assertEquals("http://shirt-lg.url", result.getVariations().get(0).thumbnail().url());
    }
}

