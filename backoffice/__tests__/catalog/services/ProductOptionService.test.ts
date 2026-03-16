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
  getProductOptions,
  getPageableProductOptions,
  getProductOption,
  createProductOption,
  updateProductOption,
  deleteProductOption,
} from '../../../modules/catalog/services/ProductOptionService';

const mockGet = apiClientService.get as jest.Mock;
const mockPost = apiClientService.post as jest.Mock;
const mockPut = apiClientService.put as jest.Mock;
const mockDelete = apiClientService.delete as jest.Mock;

const json = (data: any) => ({ json: jest.fn().mockResolvedValue(data) });
const resp204 = () => ({ status: 204 });
const respErr = () => ({ status: 400, json: jest.fn().mockResolvedValue({ detail: 'error' }) });

beforeEach(() => jest.clearAllMocks());

const BASE = '/api/product/backoffice/product-options';
const sampleOption: any = { id: 1, name: 'Color' };

describe('ProductOptionService', () => {
  it('getProductOptions fetches all', async () => {
    mockGet.mockResolvedValue(json([]));
    await getProductOptions();
    expect(mockGet).toHaveBeenCalledWith(BASE);
  });

  it('getPageableProductOptions passes paging params', async () => {
    mockGet.mockResolvedValue(json({}));
    await getPageableProductOptions(0, 10);
    expect(mockGet).toHaveBeenCalledWith(`${BASE}/paging?pageNo=0&pageSize=10`);
  });

  it('getProductOption fetches by id', async () => {
    mockGet.mockResolvedValue(json(sampleOption));
    await getProductOption(1);
    expect(mockGet).toHaveBeenCalledWith(`${BASE}/1`);
  });

  it('createProductOption posts data', async () => {
    mockPost.mockResolvedValue({ status: 201 });
    await createProductOption(sampleOption);
    expect(mockPost).toHaveBeenCalledWith(BASE, JSON.stringify(sampleOption));
  });

  it('updateProductOption returns 204 response', async () => {
    const r = resp204();
    mockPut.mockResolvedValue(r);
    const result = await updateProductOption(1, sampleOption);
    expect(result).toBe(r);
  });

  it('updateProductOption returns json on non-204', async () => {
    mockPut.mockResolvedValue(respErr());
    const result = await updateProductOption(1, sampleOption);
    expect(result).toEqual({ detail: 'error' });
  });

  it('deleteProductOption returns 204 response', async () => {
    const r = resp204();
    mockDelete.mockResolvedValue(r);
    const result = await deleteProductOption(1);
    expect(result).toBe(r);
  });

  it('deleteProductOption returns json on non-204', async () => {
    mockDelete.mockResolvedValue(respErr());
    const result = await deleteProductOption(99);
    expect(result).toEqual({ detail: 'error' });
  });
});
