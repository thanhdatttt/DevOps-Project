jest.mock('../../common/services/ApiClientService', () => ({
  __esModule: true,
  default: { get: jest.fn() },
}));

import api from '../../common/services/ApiClientService';
import {
  searchProducts, searchCategories, searchBrands,
} from '../../modules/promotion/services/ProductService';

const mockGet = api.get as jest.Mock;
const json = (d: any) => ({ json: jest.fn().mockResolvedValue(d) });

beforeEach(() => jest.clearAllMocks());

describe('Promotion ProductService', () => {
  it('searchProducts builds URL with product-name param', async () => {
    mockGet.mockResolvedValue(json([]));
    await searchProducts('widget');
    expect(mockGet).toHaveBeenCalledWith(
      '/api/product/backoffice/products?product-name=widget'
    );
  });

  it('searchCategories builds URL with categoryName param', async () => {
    mockGet.mockResolvedValue(json([]));
    await searchCategories('electronics');
    expect(mockGet).toHaveBeenCalledWith(
      '/api/product/backoffice/categories?categoryName=electronics'
    );
  });

  it('searchBrands builds URL with brandName param', async () => {
    mockGet.mockResolvedValue(json([]));
    await searchBrands('nike');
    expect(mockGet).toHaveBeenCalledWith(
      '/api/product/backoffice/brands?brandName=nike'
    );
  });
});
