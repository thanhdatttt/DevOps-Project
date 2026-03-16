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
  getProductAttributes,
  getPageableProductAttributes,
  createProductAttribute,
  updateProductAttribute,
  getProductAttribute,
  deleteProductAttribute,
} from '../../../modules/catalog/services/ProductAttributeService';

const mockGet = apiClientService.get as jest.Mock;
const mockPost = apiClientService.post as jest.Mock;
const mockPut = apiClientService.put as jest.Mock;
const mockDelete = apiClientService.delete as jest.Mock;

const json = (data: any) => ({ json: jest.fn().mockResolvedValue(data) });
const resp204 = () => ({ status: 204 });
const respErr = (status: number) => ({
  status,
  json: jest.fn().mockResolvedValue({ detail: 'error' }),
});

beforeEach(() => jest.clearAllMocks());

const BASE = '/api/product/backoffice/product-attribute';

describe('ProductAttributeService', () => {
  it('getProductAttributes fetches all', async () => {
    mockGet.mockResolvedValue(json([]));
    await getProductAttributes();
    expect(mockGet).toHaveBeenCalledWith(BASE);
  });

  it('getPageableProductAttributes passes paging params', async () => {
    mockGet.mockResolvedValue(json({}));
    await getPageableProductAttributes(1, 5);
    expect(mockGet).toHaveBeenCalledWith(`${BASE}/paging?pageNo=1&pageSize=5`);
  });

  it('createProductAttribute posts data', async () => {
    mockPost.mockResolvedValue({ status: 201 });
    const payload = { name: 'Color', productAttributeGroupId: '1' };
    await createProductAttribute(payload);
    expect(mockPost).toHaveBeenCalledWith(BASE, JSON.stringify(payload));
  });

  it('updateProductAttribute returns 204 response', async () => {
    const r = resp204();
    mockPut.mockResolvedValue(r);
    const result = await updateProductAttribute(1, { name: 'Size', productAttributeGroupId: '2' });
    expect(result).toBe(r);
  });

  it('updateProductAttribute returns json on non-204', async () => {
    mockPut.mockResolvedValue(respErr(400));
    const result = await updateProductAttribute(1, { name: 'X', productAttributeGroupId: '1' });
    expect(result).toEqual({ detail: 'error' });
  });

  it('getProductAttribute fetches by id', async () => {
    mockGet.mockResolvedValue(json({ id: 1, name: 'Color' }));
    const result = await getProductAttribute(1);
    expect(mockGet).toHaveBeenCalledWith(`${BASE}/1`);
  });

  it('deleteProductAttribute returns 204 response', async () => {
    const r = resp204();
    mockDelete.mockResolvedValue(r);
    const result = await deleteProductAttribute(1);
    expect(result).toBe(r);
  });

  it('deleteProductAttribute returns json on non-204', async () => {
    mockDelete.mockResolvedValue(respErr(404));
    const result = await deleteProductAttribute(99);
    expect(result).toEqual({ detail: 'error' });
  });
});
