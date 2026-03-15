package com.yas.product.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.yas.commonlibrary.exception.BadRequestException;
import com.yas.commonlibrary.exception.DuplicatedException;
import com.yas.commonlibrary.exception.NotFoundException;
import com.yas.product.model.Brand;
import com.yas.product.model.Category;
import com.yas.product.model.Product;
import com.yas.product.model.ProductCategory;
import com.yas.product.model.ProductImage;
import com.yas.product.model.ProductOption;
import com.yas.product.model.ProductOptionCombination;
import com.yas.product.model.ProductRelated;
import com.yas.product.model.attribute.ProductAttribute;
import com.yas.product.model.attribute.ProductAttributeGroup;
import com.yas.product.model.attribute.ProductAttributeValue;
import com.yas.product.model.enumeration.DimensionUnit;
import com.yas.product.model.enumeration.FilterExistInWhSelection;
import com.yas.product.repository.BrandRepository;
import com.yas.product.repository.CategoryRepository;
import com.yas.product.repository.ProductCategoryRepository;
import com.yas.product.repository.ProductImageRepository;
import com.yas.product.repository.ProductOptionCombinationRepository;
import com.yas.product.repository.ProductOptionRepository;
import com.yas.product.repository.ProductOptionValueRepository;
import com.yas.product.repository.ProductRelatedRepository;
import com.yas.product.repository.ProductRepository;
import com.yas.product.viewmodel.NoFileMediaVm;
import com.yas.product.viewmodel.product.ProductExportingDetailVm;
import com.yas.product.viewmodel.product.ProductGetDetailVm;
import com.yas.product.viewmodel.product.ProductInfoVm;
import com.yas.product.viewmodel.product.ProductListVm;
import com.yas.product.viewmodel.product.ProductPostVm;
import com.yas.product.viewmodel.product.ProductQuantityPostVm;
import com.yas.product.viewmodel.product.ProductQuantityPutVm;
import com.yas.product.viewmodel.product.ProductSlugGetVm;
import com.yas.product.viewmodel.product.ProductVariationGetVm;
import com.yas.product.viewmodel.product.ProductsGetVm;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;

@ExtendWith(MockitoExtension.class)
class ProductServiceTest {

    @Mock private ProductRepository productRepository;
    @Mock private MediaService mediaService;
    @Mock private BrandRepository brandRepository;
    @Mock private CategoryRepository categoryRepository;
    @Mock private ProductCategoryRepository productCategoryRepository;
    @Mock private ProductImageRepository productImageRepository;
    @Mock private ProductOptionRepository productOptionRepository;
    @Mock private ProductOptionValueRepository productOptionValueRepository;
    @Mock private ProductOptionCombinationRepository productOptionCombinationRepository;
    @Mock private ProductRelatedRepository productRelatedRepository;

    @InjectMocks
    private ProductService productService;

    private NoFileMediaVm mediaVm;

    // ── helpers ──────────────────────────────────────────────────────────────

    private Product buildProduct(long id, String name, String slug, String sku) {
        return Product.builder()
                .id(id).name(name).slug(slug).sku(sku).gtin("")
                .price(100.0).isPublished(true).isAllowedToOrder(true)
                .isFeatured(false).isVisibleIndividually(true)
                .stockTrackingEnabled(false).hasOptions(false)
                .productCategories(new ArrayList<>())
                .attributeValues(new ArrayList<>())
                .productImages(new ArrayList<>())
                .products(new ArrayList<>())
                .relatedProducts(new ArrayList<>())
                .build();
    }

    @BeforeEach
    void setUp() {
        mediaVm = new NoFileMediaVm(1L, "", "file.jpg", "image/jpeg", "http://img.url");
    }

    // ── createProduct ─────────────────────────────────────────────────────────

    @Test
    void createProduct_WhenValidSimpleProduct_ReturnsGetDetailVm() {
        ProductPostVm vm = new ProductPostVm(
                "Laptop", "laptop-slug", null, List.of(),
                "short", "desc", "spec", "SKU-1", "",
                1.0, DimensionUnit.CM, 10.0, 5.0, 3.0, 999.0,
                true, true, false, true, false,
                "meta", "kw", "metadesc", null,
                List.of(), List.of(), List.of(), List.of(), List.of(), null);

        Product saved = buildProduct(1L, "Laptop", "laptop-slug", "SKU-1");

        when(productRepository.findBySlugAndIsPublishedTrue("laptop-slug")).thenReturn(Optional.empty());
        when(productRepository.findBySkuAndIsPublishedTrue("SKU-1")).thenReturn(Optional.empty());
        when(productRepository.findAllById(anyList())).thenReturn(List.of());
        when(productRepository.save(any(Product.class))).thenReturn(saved);
        when(productImageRepository.saveAll(anyList())).thenReturn(List.of());
        when(productCategoryRepository.saveAll(anyList())).thenReturn(List.of());

        ProductGetDetailVm result = productService.createProduct(vm);

        assertNotNull(result);
        assertEquals("Laptop", result.name());
        assertEquals("laptop-slug", result.slug());
    }

    @Test
    void createProduct_WhenLengthLessThanWidth_ThrowsBadRequestException() {
        ProductPostVm vm = new ProductPostVm(
                "Laptop", "laptop-slug2", null, List.of(),
                "short", "desc", "spec", "SKU-2", "",
                1.0, DimensionUnit.CM, 3.0, 10.0, 3.0, 999.0,
                true, true, false, true, false,
                null, null, null, null,
                List.of(), List.of(), List.of(), List.of(), List.of(), null);

        assertThrows(BadRequestException.class, () -> productService.createProduct(vm));
        verify(productRepository, never()).save(any());
    }

    @Test
    void createProduct_WhenSlugAlreadyExists_ThrowsDuplicatedException() {
        ProductPostVm vm = new ProductPostVm(
                "Laptop", "dup-slug", null, List.of(),
                "short", "desc", "spec", "SKU-3", "",
                1.0, DimensionUnit.CM, 10.0, 5.0, 3.0, 999.0,
                true, true, false, true, false,
                null, null, null, null,
                List.of(), List.of(), List.of(), List.of(), List.of(), null);

        when(productRepository.findBySlugAndIsPublishedTrue("dup-slug"))
                .thenReturn(Optional.of(buildProduct(99L, "Other", "dup-slug", "SKU-X")));

        assertThrows(DuplicatedException.class,
                () -> productService.createProduct(vm));
    }

    @Test
    void createProduct_WhenBrandIdProvided_SetsBrandOnProduct() {
        Brand brand = new Brand();
        brand.setId(5L);
        brand.setName("TechBrand");

        ProductPostVm vm = new ProductPostVm(
                "Phone", "phone-slug", 5L, List.of(),
                "short", "desc", "spec", "SKU-4", "",
                1.0, DimensionUnit.CM, 10.0, 5.0, 3.0, 499.0,
                true, true, false, true, false,
                null, null, null, null,
                List.of(), List.of(), List.of(), List.of(), List.of(), null);

        Product saved = buildProduct(2L, "Phone", "phone-slug", "SKU-4");

        when(productRepository.findBySlugAndIsPublishedTrue("phone-slug")).thenReturn(Optional.empty());
        when(productRepository.findBySkuAndIsPublishedTrue("SKU-4")).thenReturn(Optional.empty());
        when(productRepository.findAllById(anyList())).thenReturn(List.of());
        when(brandRepository.findById(5L)).thenReturn(Optional.of(brand));
        when(productRepository.save(any(Product.class))).thenReturn(saved);
        when(productImageRepository.saveAll(anyList())).thenReturn(List.of());
        when(productCategoryRepository.saveAll(anyList())).thenReturn(List.of());

        ProductGetDetailVm result = productService.createProduct(vm);

        assertNotNull(result);
        verify(brandRepository).findById(5L);
    }

    // ── setProductImages ───────────────────────────────────────────────────────

    @Test
    void setProductImages_WhenImageIdsProvided_ReturnsProductImageList() {
        Product product = buildProduct(1L, "P", "p", "S");
        List<Long> imageIds = List.of(10L, 20L);

        List<ProductImage> result = productService.setProductImages(imageIds, product);

        assertEquals(2, result.size());
        assertEquals(10L, result.get(0).getImageId());
        assertEquals(20L, result.get(1).getImageId());
    }

    @Test
    void setProductImages_WhenEmptyList_ReturnsEmptyList() {
        Product product = buildProduct(1L, "P", "p", "S");

        List<ProductImage> result = productService.setProductImages(List.of(), product);

        assertNotNull(result);
        assertTrue(result.isEmpty());
    }

    // ── getProductSlug ─────────────────────────────────────────────────────────

    @Test
    void getProductSlug_WhenProductHasNoParent_ReturnsProductSlug() {
        Product product = buildProduct(1L, "P", "my-slug", "S");
        when(productRepository.findById(1L)).thenReturn(Optional.of(product));

        ProductSlugGetVm result = productService.getProductSlug(1L);

        assertEquals("my-slug", result.slug());
        assertNull(result.productVariantId());
    }

    @Test
    void getProductSlug_WhenProductHasParent_ReturnsParentSlug() {
        Product parent = buildProduct(10L, "Parent", "parent-slug", "P-SKU");
        Product child = buildProduct(2L, "Child", "child-slug", "C-SKU");
        child.setParent(parent);

        when(productRepository.findById(2L)).thenReturn(Optional.of(child));

        ProductSlugGetVm result = productService.getProductSlug(2L);

        assertEquals("parent-slug", result.slug());
        assertEquals(2L, result.productVariantId());
    }

    @Test
    void getProductSlug_WhenNotFound_ThrowsNotFoundException() {
        when(productRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(NotFoundException.class, () -> productService.getProductSlug(99L));
    }

    // ── getProductEsDetailById ─────────────────────────────────────────────────

    @Test
    void getProductEsDetailById_WhenSimpleProduct_ReturnsEsDetailVm() {
        Product product = buildProduct(1L, "Laptop", "laptop", "SKU-1");
        when(productRepository.findById(1L)).thenReturn(Optional.of(product));

        var result = productService.getProductEsDetailById(1L);

        assertNotNull(result);
        assertEquals(1L, result.id());
        assertEquals("Laptop", result.name());
        assertNull(result.brand());
        assertTrue(result.categories().isEmpty());
    }

    @Test
    void getProductEsDetailById_WhenProductHasBrandAndCategories_ReturnsBrandName() {
        Brand brand = new Brand();
        brand.setId(5L);
        brand.setName("Apple");

        Category category = new Category();
        category.setId(1L);
        category.setName("Electronics");

        ProductCategory pc = new ProductCategory();
        pc.setCategory(category);

        Product product = buildProduct(2L, "MacBook", "macbook", "MB-1");
        product.setBrand(brand);
        product.setProductCategories(List.of(pc));

        when(productRepository.findById(2L)).thenReturn(Optional.of(product));

        var result = productService.getProductEsDetailById(2L);

        assertEquals("Apple", result.brand());
        assertEquals(1, result.categories().size());
        assertEquals("Electronics", result.categories().get(0));
    }

    @Test
    void getProductEsDetailById_WhenNotFound_ThrowsNotFoundException() {
        when(productRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(NotFoundException.class, () -> productService.getProductEsDetailById(99L));
    }

    @Test
    void getProductEsDetailById_WhenHasAttributeValues_ReturnsAttributeNames() {
        ProductAttribute attr = new ProductAttribute();
        attr.setId(1L);
        attr.setName("Color");

        ProductAttributeValue attrVal = new ProductAttributeValue();
        attrVal.setId(1L);
        attrVal.setProductAttribute(attr);
        attrVal.setValue("Red");

        Product product = buildProduct(3L, "Shirt", "shirt", "SH-1");
        product.setAttributeValues(List.of(attrVal));

        when(productRepository.findById(3L)).thenReturn(Optional.of(product));

        var result = productService.getProductEsDetailById(3L);

        assertEquals(1, result.attributes().size());
        assertEquals("Color", result.attributes().get(0));
    }

    // ── getRelatedProductsBackoffice ───────────────────────────────────────────

    @Test
    void getRelatedProductsBackoffice_WhenProductHasRelated_ReturnsList() {
        Product related = buildProduct(2L, "Related", "related", "R-SKU");
        ProductRelated pr = ProductRelated.builder()
                .product(buildProduct(1L, "Main", "main", "M-SKU"))
                .relatedProduct(related)
                .build();

        Product main = buildProduct(1L, "Main", "main", "M-SKU");
        main.setRelatedProducts(List.of(pr));

        when(productRepository.findById(1L)).thenReturn(Optional.of(main));

        List<ProductListVm> result = productService.getRelatedProductsBackoffice(1L);

        assertEquals(1, result.size());
        assertEquals(2L, result.get(0).id());
    }

    @Test
    void getRelatedProductsBackoffice_WhenNoRelated_ReturnsEmptyList() {
        Product main = buildProduct(1L, "Main", "main", "M-SKU");
        when(productRepository.findById(1L)).thenReturn(Optional.of(main));

        List<ProductListVm> result = productService.getRelatedProductsBackoffice(1L);

        assertTrue(result.isEmpty());
    }

    @Test
    void getRelatedProductsBackoffice_WhenNotFound_ThrowsNotFoundException() {
        when(productRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(NotFoundException.class,
                () -> productService.getRelatedProductsBackoffice(99L));
    }

    // ── getRelatedProductsStorefront ───────────────────────────────────────────

    @Test
    void getRelatedProductsStorefront_WhenProductExists_ReturnsPaginatedVm() {
        Product main = buildProduct(1L, "Main", "main", "M-SKU");
        Product related = buildProduct(2L, "Related", "related-slug", "R-SKU");
        related.setThumbnailMediaId(1L);

        ProductRelated pr = ProductRelated.builder()
                .product(main).relatedProduct(related).build();

        Page<ProductRelated> page = new PageImpl<>(List.of(pr));

        when(productRepository.findById(1L)).thenReturn(Optional.of(main));
        when(productRelatedRepository.findAllByProduct(any(Product.class), any(Pageable.class)))
                .thenReturn(page);
        when(mediaService.getMedia(1L)).thenReturn(mediaVm);

        ProductsGetVm result = productService.getRelatedProductsStorefront(1L, 0, 10);

        assertNotNull(result);
        assertEquals(1, result.productContent().size());
    }

    @Test
    void getRelatedProductsStorefront_WhenNotFound_ThrowsNotFoundException() {
        when(productRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(NotFoundException.class,
                () -> productService.getRelatedProductsStorefront(99L, 0, 10));
    }

    @Test
    void getRelatedProductsStorefront_WhenRelatedProductUnpublished_ExcludesFromResult() {
        Product main = buildProduct(1L, "Main", "main", "M-SKU");
        Product unpublishedRelated = buildProduct(2L, "Unpub", "unpub", "U-SKU");
        unpublishedRelated.setPublished(false);

        ProductRelated pr = ProductRelated.builder()
                .product(main).relatedProduct(unpublishedRelated).build();

        Page<ProductRelated> page = new PageImpl<>(List.of(pr));

        when(productRepository.findById(1L)).thenReturn(Optional.of(main));
        when(productRelatedRepository.findAllByProduct(any(Product.class), any(Pageable.class)))
                .thenReturn(page);

        ProductsGetVm result = productService.getRelatedProductsStorefront(1L, 0, 10);

        assertTrue(result.productContent().isEmpty());
    }

    // ── getProductsForWarehouse ────────────────────────────────────────────────

    @Test
    void getProductsForWarehouse_WhenMatchingProducts_ReturnsList() {
        Product p = buildProduct(1L, "Laptop", "laptop", "L-SKU");
        when(productRepository.findProductForWarehouse(anyString(), anyString(), anyList(), anyString()))
                .thenReturn(List.of(p));

        List<ProductInfoVm> result = productService.getProductsForWarehouse(
                "laptop", "L-SKU", List.of(1L), FilterExistInWhSelection.ALL);

        assertEquals(1, result.size());
        assertEquals("Laptop", result.get(0).name());
        assertEquals("L-SKU", result.get(0).sku());
    }

    @Test
    void getProductsForWarehouse_WhenNoMatch_ReturnsEmptyList() {
        when(productRepository.findProductForWarehouse(anyString(), anyString(), anyList(), anyString()))
                .thenReturn(List.of());

        List<ProductInfoVm> result = productService.getProductsForWarehouse(
                "none", "NONE-SKU", List.of(), FilterExistInWhSelection.ALL);

        assertTrue(result.isEmpty());
    }

    // ── updateProductQuantity ──────────────────────────────────────────────────

    @Test
    void updateProductQuantity_WhenProductsExist_UpdatesStockQuantity() {
        Product product = buildProduct(1L, "P", "p", "S");
        product.setStockQuantity(10L);

        when(productRepository.findAllByIdIn(List.of(1L))).thenReturn(List.of(product));
        when(productRepository.saveAll(anyList())).thenReturn(List.of(product));

        productService.updateProductQuantity(List.of(new ProductQuantityPostVm(1L, 50L)));

        assertEquals(50L, product.getStockQuantity());
        verify(productRepository).saveAll(anyList());
    }

    @Test
    void updateProductQuantity_WhenEmptyList_SavesNothing() {
        when(productRepository.findAllByIdIn(List.of())).thenReturn(List.of());
        when(productRepository.saveAll(anyList())).thenReturn(List.of());

        productService.updateProductQuantity(List.of());

        verify(productRepository).saveAll(anyList());
    }

    // ── subtractStockQuantity ──────────────────────────────────────────────────

    @Test
    void subtractStockQuantity_WhenStockTrackingEnabled_DecrementsStock() {
        Product product = buildProduct(1L, "P", "p", "S");
        product.setStockTrackingEnabled(true);
        product.setStockQuantity(100L);

        when(productRepository.findAllByIdIn(List.of(1L))).thenReturn(List.of(product));
        when(productRepository.saveAll(anyList())).thenReturn(List.of(product));

        productService.subtractStockQuantity(List.of(new ProductQuantityPutVm(1L, 30L)));

        assertEquals(70L, product.getStockQuantity());
    }

    @Test
    void subtractStockQuantity_WhenSubtractMoreThanStock_SetsToZero() {
        Product product = buildProduct(1L, "P", "p", "S");
        product.setStockTrackingEnabled(true);
        product.setStockQuantity(10L);

        when(productRepository.findAllByIdIn(List.of(1L))).thenReturn(List.of(product));
        when(productRepository.saveAll(anyList())).thenReturn(List.of(product));

        productService.subtractStockQuantity(List.of(new ProductQuantityPutVm(1L, 50L)));

        assertEquals(0L, product.getStockQuantity());
    }

    @Test
    void subtractStockQuantity_WhenStockTrackingDisabled_DoesNotChangeStock() {
        Product product = buildProduct(1L, "P", "p", "S");
        product.setStockTrackingEnabled(false);
        product.setStockQuantity(100L);

        when(productRepository.findAllByIdIn(List.of(1L))).thenReturn(List.of(product));
        when(productRepository.saveAll(anyList())).thenReturn(List.of(product));

        productService.subtractStockQuantity(List.of(new ProductQuantityPutVm(1L, 30L)));

        assertEquals(100L, product.getStockQuantity());
    }

    // ── restoreStockQuantity ───────────────────────────────────────────────────

    @Test
    void restoreStockQuantity_WhenStockTrackingEnabled_IncrementsStock() {
        Product product = buildProduct(1L, "P", "p", "S");
        product.setStockTrackingEnabled(true);
        product.setStockQuantity(50L);

        when(productRepository.findAllByIdIn(List.of(1L))).thenReturn(List.of(product));
        when(productRepository.saveAll(anyList())).thenReturn(List.of(product));

        productService.restoreStockQuantity(List.of(new ProductQuantityPutVm(1L, 20L)));

        assertEquals(70L, product.getStockQuantity());
    }

    // ── getProductByIds ────────────────────────────────────────────────────────

    @Test
    void getProductByIds_WhenMatchingProducts_ReturnsMappedVms() {
        Product p = buildProduct(1L, "Laptop", "laptop", "L-SKU");
        when(productRepository.findAllByIdIn(List.of(1L))).thenReturn(List.of(p));

        List<ProductListVm> result = productService.getProductByIds(List.of(1L));

        assertEquals(1, result.size());
        assertEquals(1L, result.get(0).id());
        assertEquals("Laptop", result.get(0).name());
    }

    @Test
    void getProductByIds_WhenEmptyList_ReturnsEmptyList() {
        when(productRepository.findAllByIdIn(List.of())).thenReturn(List.of());

        List<ProductListVm> result = productService.getProductByIds(List.of());

        assertTrue(result.isEmpty());
    }

    // ── exportProducts ─────────────────────────────────────────────────────────

    @Test
    void exportProducts_WhenProductsExist_ReturnsDetailVms() {
        Product p = buildProduct(1L, "Laptop", "laptop", "L-SKU");
        Brand brand = new Brand(); brand.setId(1L); brand.setName("BrandX"); p.setBrand(brand);
        when(productRepository.getExportingProducts(anyString(), anyString()))
                .thenReturn(List.of(p));

        List<ProductExportingDetailVm> result = productService.exportProducts("laptop", "");

        assertEquals(1, result.size());
        assertEquals("Laptop", result.get(0).name());
    }

    @Test
    void exportProducts_WhenNoProducts_ReturnsEmptyList() {
        when(productRepository.getExportingProducts(anyString(), anyString()))
                .thenReturn(List.of());

        List<ProductExportingDetailVm> result = productService.exportProducts("", "");

        assertTrue(result.isEmpty());
    }

    // ── getProductVariationsByParentId ─────────────────────────────────────────

    @Test
    void getProductVariationsByParentId_WhenNoOptions_ReturnsEmptyList() {
        Product parent = buildProduct(1L, "Parent", "parent", "P-SKU");
        // hasOptions = false by default in builder
        when(productRepository.findById(1L)).thenReturn(Optional.of(parent));

        List<ProductVariationGetVm> result = productService.getProductVariationsByParentId(1L);

        assertTrue(result.isEmpty());
    }

    @Test
    void getProductVariationsByParentId_WhenHasOptions_ReturnsVariations() {
        ProductOption colorOption = new ProductOption();
        colorOption.setId(10L);
        colorOption.setName("Color");

        ProductOptionCombination combo = ProductOptionCombination.builder()
                .id(1L).productOption(colorOption).value("Red").build();

        Product variation = buildProduct(2L, "Red Shirt", "red-shirt", "RS-SKU");

        Product parent = buildProduct(1L, "Shirt", "shirt", "S-SKU");
        parent.setHasOptions(true);
        parent.setProducts(List.of(variation));

        when(productRepository.findById(1L)).thenReturn(Optional.of(parent));
        when(productOptionCombinationRepository.findAllByProduct(variation))
                .thenReturn(List.of(combo));

        List<ProductVariationGetVm> result = productService.getProductVariationsByParentId(1L);

        assertEquals(1, result.size());
        assertEquals(2L, result.get(0).id());
        assertEquals("Red", result.get(0).options().get(10L));
    }

    @Test
    void getProductVariationsByParentId_WhenNotFound_ThrowsNotFoundException() {
        when(productRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(NotFoundException.class,
                () -> productService.getProductVariationsByParentId(99L));
    }

    @Test
    void getProductVariationsByParentId_WhenVariationHasThumbnail_ReturnsThumbnail() {
        ProductOption opt = new ProductOption();
        opt.setId(1L);
        opt.setName("Size");

        ProductOptionCombination combo = ProductOptionCombination.builder()
                .id(1L).productOption(opt).value("L").build();

        Product variation = buildProduct(2L, "Large", "large", "L-SKU");
        variation.setThumbnailMediaId(55L);

        Product parent = buildProduct(1L, "Shirt", "shirt", "S-SKU");
        parent.setHasOptions(true);
        parent.setProducts(List.of(variation));

        when(productRepository.findById(1L)).thenReturn(Optional.of(parent));
        when(productOptionCombinationRepository.findAllByProduct(variation))
                .thenReturn(List.of(combo));
        when(mediaService.getMedia(55L))
                .thenReturn(new NoFileMediaVm(55L, "", "", "", "http://thumb.url"));

        List<ProductVariationGetVm> result = productService.getProductVariationsByParentId(1L);

        assertNotNull(result.get(0).thumbnail());
        assertEquals("http://thumb.url", result.get(0).thumbnail().url());
    }

    // ── getProductCheckoutList ─────────────────────────────────────────────────

    @Test
    void getProductCheckoutList_WhenProductsExist_ReturnsPaginatedVm() {
        Product p = buildProduct(1L, "Laptop", "laptop", "L-SKU");
        p.setThumbnailMediaId(1L);
        Brand brand = new Brand();
        brand.setId(1L);
        brand.setName("TechBrand");
        p.setBrand(brand);
        Page<Product> page = new PageImpl<>(List.of(p));

        when(productRepository.findAllPublishedProductsByIds(anyList(), any(Pageable.class)))
                .thenReturn(page);
        when(mediaService.getMedia(1L)).thenReturn(mediaVm);

        var result = productService.getProductCheckoutList(0, 10, List.of(1L));

        assertNotNull(result);
        assertEquals(1, result.productCheckoutListVms().size());
    }

    @Test
    void getProductCheckoutList_WhenNoProducts_ReturnsEmptyPaginatedVm() {
        when(productRepository.findAllPublishedProductsByIds(anyList(), any(Pageable.class)))
                .thenReturn(Page.empty());

        var result = productService.getProductCheckoutList(0, 10, List.of());

        assertNotNull(result);
        assertTrue(result.productCheckoutListVms().isEmpty());
    }
}
