package com.yas.inventory.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.mockito.Mockito.mock;

import com.yas.inventory.model.Stock;
import com.yas.inventory.model.StockHistory;
import com.yas.inventory.model.Warehouse;
import com.yas.inventory.repository.StockHistoryRepository;
import com.yas.inventory.viewmodel.product.ProductInfoVm;
import com.yas.inventory.viewmodel.stock.StockQuantityVm;
import com.yas.inventory.viewmodel.stockhistory.StockHistoryListVm;
import com.yas.inventory.viewmodel.stockhistory.StockHistoryVm;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

class StockHistoryServiceTest {

    private StockHistoryRepository stockHistoryRepository;
    private ProductService productService;
    private StockHistoryService stockHistoryService;

    @BeforeEach
    void setUp() {
        stockHistoryRepository = mock(StockHistoryRepository.class);
        productService = mock(ProductService.class);
        stockHistoryService = new StockHistoryService(stockHistoryRepository, productService);
    }

    @Test
    void createStockHistories_ShouldSaveStockHistories_WhenStockQuantityMatches() {
        // Arrange
        Warehouse warehouse = new Warehouse();
        warehouse.setId(1L);

        Stock stock1 = new Stock();
        stock1.setId(10L);
        stock1.setProductId(100L);
        stock1.setWarehouse(warehouse);

        Stock stock2 = new Stock();
        stock2.setId(20L);
        stock2.setProductId(200L);
        stock2.setWarehouse(warehouse);

        List<Stock> stocks = List.of(stock1, stock2);

        StockQuantityVm vm1 = new StockQuantityVm(10L, 5L, "Note 1");
        List<StockQuantityVm> vms = List.of(vm1);

        // Act
        stockHistoryService.createStockHistories(stocks, vms);

        // Assert
        ArgumentCaptor<List<StockHistory>> captor = ArgumentCaptor.forClass(List.class);
        verify(stockHistoryRepository).saveAll(captor.capture());

        List<StockHistory> savedHistories = captor.getValue();
        assertEquals(1, savedHistories.size());
        
        StockHistory history = savedHistories.get(0);
        assertEquals(100L, history.getProductId());
        assertEquals("Note 1", history.getNote());
        assertEquals(5L, history.getAdjustedQuantity());
        assertEquals(warehouse, history.getWarehouse());
    }

    @Test
    void getStockHistories_ShouldReturnStockHistoryListVm_WhenValidInput() {
        // Arrange
        Long productId = 100L;
        Long warehouseId = 1L;

        Warehouse warehouse = new Warehouse();
        warehouse.setId(warehouseId);

        StockHistory history1 = new StockHistory();
        history1.setId(10L);
        history1.setProductId(productId);
        history1.setWarehouse(warehouse);
        history1.setAdjustedQuantity(5L);
        history1.setNote("Test Note");
        history1.setCreatedBy("admin");

        when(stockHistoryRepository.findByProductIdAndWarehouseIdOrderByCreatedOnDesc(productId, warehouseId))
            .thenReturn(List.of(history1));

        ProductInfoVm productInfoVm = new ProductInfoVm(productId, "Product 100", "SKU100", true);
        when(productService.getProduct(productId)).thenReturn(productInfoVm);

        // Act
        StockHistoryListVm result = stockHistoryService.getStockHistories(productId, warehouseId);

        // Assert
        assertNotNull(result);
        assertNotNull(result.data());
        assertEquals(1, result.data().size());

        StockHistoryVm vm = result.data().get(0);
        assertEquals(10L, vm.id());
        assertEquals("Product 100", vm.productName());
        assertEquals(5L, vm.adjustedQuantity());
        assertEquals("Test Note", vm.note());
        assertEquals("admin", vm.createdBy());
    }
}
