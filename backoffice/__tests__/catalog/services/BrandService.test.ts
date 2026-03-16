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
  getBrands,
  getPageableBrands,
  createBrand,
  getBrand,
  deleteBrand,
  editBrand,
} from '../../../modules/catalog/services/BrandService';
import { Brand } from '../../../modules/catalog/models/Brand';

const mockGet = apiClientService.get as jest.Mock;
const mockPost = apiClientService.post as jest.Mock;
const mockPut = apiClientService.put as jest.Mock;
const mockDelete = apiClientService.delete as jest.Mock;

const mockJsonFn = (data: any) => ({ json: jest.fn().mockResolvedValue(data) });

beforeEach(() => jest.clearAllMocks());

const sampleBrand: Brand = { id: 1, name: 'Nike', slug: 'nike' } as Brand;

describe('getBrands', () => {
  it('fetches all brands from base URL', async () => {
    mockGet.mockResolvedValue(mockJsonFn([sampleBrand]));
    const result = await getBrands();
    expect(mockGet).toHaveBeenCalledWith('/api/product/backoffice/brands');
    expect(result).toEqual([sampleBrand]);
  });
});

describe('getPageableBrands', () => {
  it('fetches pageable brands with correct query params', async () => {
    mockGet.mockResolvedValue(mockJsonFn({ content: [sampleBrand] }));
    const result = await getPageableBrands(0, 10);
    expect(mockGet).toHaveBeenCalledWith(
      '/api/product/backoffice/brands/paging?pageNo=0&pageSize=10'
    );
  });

  it('passes page number and page size correctly', async () => {
    mockGet.mockResolvedValue(mockJsonFn({}));
    await getPageableBrands(2, 20);
    expect(mockGet).toHaveBeenCalledWith(
      '/api/product/backoffice/brands/paging?pageNo=2&pageSize=20'
    );
  });
});

describe('createBrand', () => {
  it('posts brand data to base URL', async () => {
    mockPost.mockResolvedValue({ status: 201 });
    await createBrand(sampleBrand);
    expect(mockPost).toHaveBeenCalledWith(
      '/api/product/backoffice/brands',
      JSON.stringify(sampleBrand)
    );
  });
});

describe('getBrand', () => {
  it('fetches brand by id', async () => {
    mockGet.mockResolvedValue(mockJsonFn(sampleBrand));
    const result = await getBrand(1);
    expect(mockGet).toHaveBeenCalledWith('/api/product/backoffice/brands/1');
    expect(result).toEqual(sampleBrand);
  });
});

describe('deleteBrand', () => {
  it('returns response directly when status is 204', async () => {
    const fakeResp = { status: 204 };
    mockDelete.mockResolvedValue(fakeResp);
    const result = await deleteBrand(1);
    expect(mockDelete).toHaveBeenCalledWith('/api/product/backoffice/brands/1');
    expect(result).toBe(fakeResp);
  });

  it('returns parsed json when status is not 204', async () => {
    const fakeResp = { status: 404, json: jest.fn().mockResolvedValue({ title: 'Not Found' }) };
    mockDelete.mockResolvedValue(fakeResp);
    const result = await deleteBrand(99);
    expect(result).toEqual({ title: 'Not Found' });
  });
});

describe('editBrand', () => {
  it('puts brand data with correct URL', async () => {
    const fakeResp = { status: 204 };
    mockPut.mockResolvedValue(fakeResp);
    const result = await editBrand(1, sampleBrand);
    expect(mockPut).toHaveBeenCalledWith(
      '/api/product/backoffice/brands/1',
      JSON.stringify(sampleBrand)
    );
    expect(result).toBe(fakeResp);
  });

  it('returns parsed json when status is not 204', async () => {
    const fakeResp = {
      status: 400,
      json: jest.fn().mockResolvedValue({ detail: 'Invalid' }),
    };
    mockPut.mockResolvedValue(fakeResp);
    const result = await editBrand(1, sampleBrand);
    expect(result).toEqual({ detail: 'Invalid' });
  });
});
