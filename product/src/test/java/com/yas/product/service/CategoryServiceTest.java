package com.yas.product.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

import com.yas.product.ProductApplication;
import com.yas.product.model.Category;
import com.yas.product.repository.CategoryRepository;
import com.yas.product.repository.ProductCategoryRepository;
import com.yas.product.viewmodel.NoFileMediaVm;
import com.yas.product.viewmodel.category.CategoryGetDetailVm;
import com.yas.product.viewmodel.category.CategoryGetVm;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;

@SpringBootTest(classes = ProductApplication.class)
class CategoryServiceTest {
    @Autowired
    private CategoryRepository categoryRepository;
    @Autowired
    private ProductCategoryRepository productCategoryRepository;
    @MockBean
    private MediaService mediaService;
    @Autowired
    private CategoryService categoryService;
    private Category category;
    private NoFileMediaVm noFileMediaVm;

    @BeforeEach
    void setUp() {

        category = new Category();
        category.setName("name");
        category.setSlug("slug");
        category.setDescription("description");
        category.setMetaKeyword("metaKeyword");
        category.setMetaDescription("metaDescription");
        category.setDisplayOrder((short) 1);
        category.setIsPublished(true);
        category.setImageId(1L);
        categoryRepository.save(category);

        noFileMediaVm = new NoFileMediaVm(1L, "caption", "fileName", "mediaType", "url");
    }

    @AfterEach
    void tearDown() {
        productCategoryRepository.deleteAll();
        categoryRepository.deleteAll();
    }

    @Test
    void getCategoryById_Success() {
        when(mediaService.getMedia(category.getImageId())).thenReturn(noFileMediaVm);
        CategoryGetDetailVm categoryGetDetailVm = categoryService.getCategoryById(category.getId());
        assertNotNull(categoryGetDetailVm);
        assertEquals("name", categoryGetDetailVm.name());
    }

    @Test
    void getCategories_Success() {
        when(mediaService.getMedia(any())).thenReturn(noFileMediaVm);
        Assertions.assertEquals(1, categoryService.getCategories("name").size());
        CategoryGetVm categoryGetVm = categoryService.getCategories("name").getFirst();
        assertEquals("name", categoryGetVm.name());
    }

    @Test
    void getCategoriesPageable_Success() {
        when(mediaService.getMedia(category.getImageId())).thenReturn(noFileMediaVm);
        Assertions.assertEquals(1, categoryService.getPageableCategories(0, 1).categoryContent().size());
        CategoryGetVm categoryGetVm = categoryService.getCategories("a").getFirst();
        assertEquals("name", categoryGetVm.name());
    }

    @Test
    void create_whenValidInput_thenSaveAndReturnCategory() {
        com.yas.product.viewmodel.category.CategoryPostVm postVm =
            new com.yas.product.viewmodel.category.CategoryPostVm(
                "New Cat", "desc", "new-cat", null, "kw", "meta-desc", (short) 1, true, null);

        Category created = categoryService.create(postVm);

        assertNotNull(created);
        assertEquals("New Cat", created.getName());
        assertEquals("new-cat", created.getSlug());
    }

    @Test
    void create_whenDuplicateName_thenThrowDuplicatedException() {
        com.yas.product.viewmodel.category.CategoryPostVm postVm =
            new com.yas.product.viewmodel.category.CategoryPostVm(
                "name", "desc", "name-slug", null, "kw", "meta", (short) 1, true, null);

        Assertions.assertThrows(com.yas.commonlibrary.exception.DuplicatedException.class,
            () -> categoryService.create(postVm));
    }

    @Test
    void create_whenParentIdProvided_thenSetParent() {
        Category parent = new Category();
        parent.setName("parent");
        parent.setSlug("parent-slug");
        categoryRepository.save(parent);

        com.yas.product.viewmodel.category.CategoryPostVm postVm =
            new com.yas.product.viewmodel.category.CategoryPostVm(
                "Child Cat", "desc", "child-cat", parent.getId(), "kw", "meta", (short) 1, true, null);

        Category created = categoryService.create(postVm);

        assertNotNull(created.getParent());
        assertEquals(parent.getId(), created.getParent().getId());
    }

    @Test
    void create_whenParentIdNotFound_thenThrowBadRequestException() {
        com.yas.product.viewmodel.category.CategoryPostVm postVm =
            new com.yas.product.viewmodel.category.CategoryPostVm(
                "Orphan Cat", "desc", "orphan-cat", 9999L, "kw", "meta", (short) 1, true, null);

        Assertions.assertThrows(com.yas.commonlibrary.exception.BadRequestException.class,
            () -> categoryService.create(postVm));
    }

    @Test
    void update_whenValidInput_thenUpdateCategory() {
        com.yas.product.viewmodel.category.CategoryPostVm postVm =
            new com.yas.product.viewmodel.category.CategoryPostVm(
                "Updated Name", "updated desc", "updated-slug", null, "kw", "meta", (short) 2, false, null);

        categoryService.update(postVm, category.getId());

        Category updated = categoryRepository.findById(category.getId()).orElseThrow();
        assertEquals("Updated Name", updated.getName());
        assertEquals("updated-slug", updated.getSlug());
    }

    @Test
    void update_whenCategoryNotFound_thenThrowNotFoundException() {
        com.yas.product.viewmodel.category.CategoryPostVm postVm =
            new com.yas.product.viewmodel.category.CategoryPostVm(
                "X", "desc", "x-slug", null, "kw", "meta", (short) 1, true, null);

        Assertions.assertThrows(com.yas.commonlibrary.exception.NotFoundException.class,
            () -> categoryService.update(postVm, 9999L));
    }

    @Test
    void update_whenDuplicateName_thenThrowDuplicatedException() {
        Category other = new Category();
        other.setName("other");
        other.setSlug("other-slug");
        categoryRepository.save(other);

        com.yas.product.viewmodel.category.CategoryPostVm postVm =
            new com.yas.product.viewmodel.category.CategoryPostVm(
                "other", "desc", "other-slug", null, "kw", "meta", (short) 1, true, null);

        Assertions.assertThrows(com.yas.commonlibrary.exception.DuplicatedException.class,
            () -> categoryService.update(postVm, category.getId()));
    }

    @Test
    void update_whenParentIsSelf_thenThrowBadRequestException() {
        com.yas.product.viewmodel.category.CategoryPostVm postVm =
            new com.yas.product.viewmodel.category.CategoryPostVm(
                "name", "desc", "slug", category.getId(), "kw", "meta", (short) 1, true, null);

        Assertions.assertThrows(com.yas.commonlibrary.exception.BadRequestException.class,
            () -> categoryService.update(postVm, category.getId()));
    }

    @Test
    void getCategoryById_whenNotFound_thenThrowNotFoundException() {
        Assertions.assertThrows(com.yas.commonlibrary.exception.NotFoundException.class,
            () -> categoryService.getCategoryById(9999L));
    }

    @Test
    void getCategoryById_whenNoImage_thenImageIsNull() {
        category.setImageId(null);
        categoryRepository.save(category);

        CategoryGetDetailVm result = categoryService.getCategoryById(category.getId());
        Assertions.assertNull(result.categoryImage());
    }

    @Test
    void getCategories_whenCategoryHasParent_thenParentIdIncluded() {
        Category parent = new Category();
        parent.setName("parent-for-test");
        parent.setSlug("parent-for-test");
        categoryRepository.save(parent);

        Category child = new Category();
        child.setName("child-cat");
        child.setSlug("child-cat");
        child.setParent(parent);
        categoryRepository.save(child);

        when(mediaService.getMedia(any())).thenReturn(noFileMediaVm);

        java.util.List<CategoryGetVm> result = categoryService.getCategories("child-cat");
        assertEquals(1, result.size());
        assertEquals(parent.getId(), result.get(0).parentId());
    }

    @Test
    void getCategoryByIds_whenIdsProvided_thenReturnMatchingCategories() {
        java.util.List<CategoryGetVm> result =
            categoryService.getCategoryByIds(java.util.List.of(category.getId()));

        assertEquals(1, result.size());
        assertEquals("name", result.get(0).name());
    }

    @Test
    void getTopNthCategories_whenLimitProvided_thenReturnLimitedList() {
        java.util.List<String> result = categoryService.getTopNthCategories(10);
        assertNotNull(result);
    }
}