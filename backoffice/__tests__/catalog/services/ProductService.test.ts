jest.mock('../../../common/services/ApiClientService', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  },
}));

import apiClientService from '../../../common/services/ApiClientService';
import {
  getProducts,
  getLatestProducts,
  exportProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  getVariationsByProductId,
  getRelatedProductByProductId,
  getProductOptionValueByProductId,
} from '../../../modules/catalog/services/ProductService';

const mockGet = apiClientService.get as jest.Mock;
const mockPost = apiClientService.post as jest.Mock;
const mockPut = apiClientService.put as jest.Mock;
const mockDelete = apiClientService.delete as jest.Mock;

const makeJson = (data: any, status = 200) => ({
  status,
  json: jest.fn().mockResolvedValue(data),
});
const makeStatus = (status: number, data?: any) => ({
  status,
  statusText: status === 200 ? 'OK' : 'Error',
  json: jest.fn().mockResolvedValue(data ?? {}),
});

beforeEach(() => jest.clearAllMocks());

describe('getProducts', () => {
  it('calls endpoint with correct query params', async () => {
    mockGet.mockResolvedValue(makeJson({ content: [] }));
    await getProducts(0, 'widget', 'Nike');
    expect(mockGet).toHaveBeenCalledWith(
      '/api/product/backoffice/products?pageNo=0&product-name=widget&brand-name=Nike'
    );
  });
});

describe('getLatestProducts', () => {
  it('returns products when status is 2xx', async () => {
    const products = [{ id: 1 }];
    mockGet.mockResolvedValue({ status: 200, json: jest.fn().mockResolvedValue(products) });
    const result = await getLatestProducts(5);
    expect(mockGet).toHaveBeenCalledWith('/api/product/backoffice/products/latest/5');
    expect(result).toEqual(products);
  });

  it('rejects when status >= 300', async () => {
    mockGet.mockResolvedValue({ status: 500, statusText: 'Server Error' });
    await expect(getLatestProducts(5)).rejects.toThrow('Server Error');
  });
});

describe('exportProducts', () => {
  it('calls export endpoint with correct params', async () => {
    mockGet.mockResolvedValue(makeJson([]));
    await exportProducts('widget', 'Nike');
    expect(mockGet).toHaveBeenCalledWith(
      '/api/product/backoffice/export/products?product-name=widget&brand-name=Nike'
    );
  });
});

describe('getProduct', () => {
  it('calls endpoint by id', async () => {
    mockGet.mockResolvedValue(makeJson({ id: 1 }));
    const result = await getProduct(1);
    expect(mockGet).toHaveBeenCalledWith('/api/product/backoffice/products/1');
  });
});

describe('createProduct', () => {
  it('posts to products endpoint', async () => {
    mockPost.mockResolvedValue({ status: 201 });
    const payload: any = { name: 'New Product' };
    await createProduct(payload);
    expect(mockPost).toHaveBeenCalledWith(
      '/api/product/backoffice/products',
      JSON.stringify(payload)
    );
  });
});

describe('updateProduct', () => {
  it('returns response on 204', async () => {
    const resp = { status: 204 };
    mockPut.mockResolvedValue(resp);
    const result = await updateProduct(1, {} as any);
    expect(result).toBe(resp);
  });

  it('returns parsed json on non-204', async () => {
    mockPut.mockResolvedValue({
      status: 400,
      json: jest.fn().mockResolvedValue({ detail: 'Error' }),
    });
    const result = await updateProduct(1, {} as any);
    expect(result).toEqual({ detail: 'Error' });
  });
});

describe('deleteProduct', () => {
  it('returns response on 204', async () => {
    const resp = { status: 204 };
    mockDelete.mockResolvedValue(resp);
    const result = await deleteProduct(1);
    expect(result).toBe(resp);
  });

  it('returns parsed json on non-204', async () => {
    mockDelete.mockResolvedValue({
      status: 404,
      json: jest.fn().mockResolvedValue({ title: 'Not Found' }),
    });
    const result = await deleteProduct(99);
    expect(result).toEqual({ title: 'Not Found' });
  });
});

describe('getVariationsByProductId', () => {
  it('returns variations when status is 2xx', async () => {
    const variations = [{ id: 1 }];
    mockGet.mockResolvedValue({ status: 200, json: jest.fn().mockResolvedValue(variations) });
    const result = await getVariationsByProductId(1);
    expect(mockGet).toHaveBeenCalledWith('/api/product/backoffice/product-variations/1');
    expect(result).toEqual(variations);
  });

  it('rejects when status >= 300', async () => {
    mockGet.mockResolvedValue({ status: 404, statusText: 'Not Found' });
    await expect(getVariationsByProductId(1)).rejects.toThrow('Not Found');
  });
});

describe('getRelatedProductByProductId', () => {
  it('returns related products when status is 2xx', async () => {
    const related = [{ id: 2 }];
    mockGet.mockResolvedValue({ status: 200, json: jest.fn().mockResolvedValue(related) });
    const result = await getRelatedProductByProductId(1);
    expect(mockGet).toHaveBeenCalledWith(
      '/api/product/backoffice/products/related-products/1'
    );
    expect(result).toEqual(related);
  });

  it('rejects when status >= 300', async () => {
    mockGet.mockResolvedValue({ status: 500, statusText: 'Server Error' });
    await expect(getRelatedProductByProductId(1)).rejects.toThrow('Server Error');
  });
});

describe('getProductOptionValueByProductId', () => {
  it('returns option values when status is 2xx', async () => {
    const options = [{ id: 1 }];
    mockGet.mockResolvedValue({ status: 200, json: jest.fn().mockResolvedValue(options) });
    const result = await getProductOptionValueByProductId(1);
    expect(mockGet).toHaveBeenCalledWith(
      '/api/product/storefront/product-option-values/1'
    );
    expect(result).toEqual(options);
  });

  it('rejects when status >= 300', async () => {
    mockGet.mockResolvedValue({ status: 404, statusText: 'Not Found' });
    await expect(getProductOptionValueByProductId(1)).rejects.toThrow('Not Found');
  });
});
