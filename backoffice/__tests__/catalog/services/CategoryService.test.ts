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
  getCategories,
  getCategory,
  createCategory,
  updateCategory,
  deleteCategory,
  getProductsByCategory,
} from '../../../modules/catalog/services/CategoryService';
import { Category } from '../../../modules/catalog/models/Category';

const mockGet = apiClientService.get as jest.Mock;
const mockPost = apiClientService.post as jest.Mock;
const mockPut = apiClientService.put as jest.Mock;
const mockDelete = apiClientService.delete as jest.Mock;

const makeJson = (data: any) => ({ json: jest.fn().mockResolvedValue(data) });
const make204 = () => ({ status: 204 });
const makeError = (status: number, detail: string) => ({
  status,
  json: jest.fn().mockResolvedValue({ detail }),
});

beforeEach(() => jest.clearAllMocks());

const sampleCategory: Category = { id: 1, name: 'Electronics', slug: 'electronics' } as Category;

describe('getCategories', () => {
  it('calls correct endpoint and returns data', async () => {
    mockGet.mockResolvedValue(makeJson([sampleCategory]));
    const result = await getCategories();
    expect(mockGet).toHaveBeenCalledWith('/api/product/backoffice/categories');
    expect(result).toEqual([sampleCategory]);
  });
});

describe('getCategory', () => {
  it('calls correct endpoint with id', async () => {
    mockGet.mockResolvedValue(makeJson(sampleCategory));
    const result = await getCategory(1);
    expect(mockGet).toHaveBeenCalledWith('/api/product/backoffice/categories/1');
    expect(result).toEqual(sampleCategory);
  });
});

describe('createCategory', () => {
  it('posts category data', async () => {
    mockPost.mockResolvedValue({ status: 201 });
    await createCategory(sampleCategory);
    expect(mockPost).toHaveBeenCalledWith(
      '/api/product/backoffice/categories',
      JSON.stringify(sampleCategory)
    );
  });
});

describe('updateCategory', () => {
  it('returns response on 204', async () => {
    const resp = make204();
    mockPut.mockResolvedValue(resp);
    const result = await updateCategory(1, sampleCategory);
    expect(mockPut).toHaveBeenCalledWith(
      '/api/product/backoffice/categories/1',
      JSON.stringify(sampleCategory)
    );
    expect(result).toBe(resp);
  });

  it('returns parsed json on non-204', async () => {
    mockPut.mockResolvedValue(makeError(400, 'Bad request'));
    const result = await updateCategory(1, sampleCategory);
    expect(result).toEqual({ detail: 'Bad request' });
  });
});

describe('deleteCategory', () => {
  it('returns response on 204', async () => {
    const resp = make204();
    mockDelete.mockResolvedValue(resp);
    const result = await deleteCategory(1);
    expect(mockDelete).toHaveBeenCalledWith('/api/product/backoffice/categories/1');
    expect(result).toBe(resp);
  });

  it('returns parsed json on non-204', async () => {
    mockDelete.mockResolvedValue(makeError(404, 'Not found'));
    const result = await deleteCategory(99);
    expect(result).toEqual({ detail: 'Not found' });
  });
});

describe('getProductsByCategory', () => {
  it('calls storefront endpoint with slug and page', async () => {
    mockGet.mockResolvedValue(makeJson({ items: [] }));
    await getProductsByCategory(0, 'electronics');
    expect(mockGet).toHaveBeenCalledWith(
      '/api/product/storefront/category/electronics/products?pageNo=0'
    );
  });
});
