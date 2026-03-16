jest.mock('../../common/services/ApiClientService', () => ({
  __esModule: true,
  default: { get: jest.fn(), post: jest.fn(), put: jest.fn() },
}));

import api from '../../common/services/ApiClientService';
import {
  addProductIntoWarehouse,
  fetchStocksInWarehouseByProductNameAndProductSku,
  updateProductQuantityInStock,
} from '../../modules/inventory/services/StockService';

const mockGet = api.get as jest.Mock;
const mockPost = api.post as jest.Mock;
const mockPut = api.put as jest.Mock;

beforeEach(() => jest.clearAllMocks());

const BASE = '/api/inventory/backoffice/stocks';

describe('StockService', () => {
  it('addProductIntoWarehouse posts stock array', async () => {
    mockPost.mockResolvedValue({ status: 201 });
    const stocks: any[] = [{ warehouseId: 1, productId: 2, quantity: 10 }];
    await addProductIntoWarehouse(stocks);
    expect(mockPost).toHaveBeenCalledWith(BASE, JSON.stringify(stocks));
  });

  it('fetchStocksInWarehouseByProductNameAndProductSku builds correct URL', async () => {
    mockGet.mockResolvedValue({ status: 200 });
    await fetchStocksInWarehouseByProductNameAndProductSku(1, 'widget', 'SKU-001');
    expect(mockGet).toHaveBeenCalledWith(
      `${BASE}?warehouseId=1&productName=widget&productSku=SKU-001`
    );
  });

  it('updateProductQuantityInStock puts with stockQuantityList', async () => {
    mockPut.mockResolvedValue({ status: 204 });
    const list: any[] = [{ id: 1, quantity: 5 }];
    await updateProductQuantityInStock(list);
    expect(mockPut).toHaveBeenCalledWith(BASE, JSON.stringify({ stockQuantityList: list }));
  });
});
