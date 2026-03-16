jest.mock('../../../common/services/ApiClientService', () => ({
  __esModule: true,
  default: { get: jest.fn(), post: jest.fn(), put: jest.fn(), delete: jest.fn() },
}));

import api from '../../../common/services/ApiClientService';
import {
  getAttributeValueOfProduct, createProductAttributeValueOfProduct,
  updateProductAttributeValueOfProduct, deleteProductAttributeValueOfProductById,
} from '../../../modules/catalog/services/ProductAttributeValueService';

const mockGet = api.get as jest.Mock;
const mockPost = api.post as jest.Mock;
const mockPut = api.put as jest.Mock;
const mockDelete = api.delete as jest.Mock;
const json = (d: any) => ({ json: jest.fn().mockResolvedValue(d) });

beforeEach(() => jest.clearAllMocks());

const BASE = '/api/product/backoffice/product-attribute-value';
const sample: any = { productId: 1, productAttributeId: 2, value: 'Red' };

describe('ProductAttributeValueService', () => {
  it('getAttributeValueOfProduct fetches by productId', async () => {
    mockGet.mockResolvedValue(json([]));
    await getAttributeValueOfProduct(1);
    expect(mockGet).toHaveBeenCalledWith(`${BASE}/1`);
  });

  it('createProductAttributeValueOfProduct posts and returns json', async () => {
    const result = { id: 10 };
    mockPost.mockResolvedValue(json(result));
    const res = await createProductAttributeValueOfProduct(sample);
    expect(mockPost).toHaveBeenCalledWith(BASE, JSON.stringify(sample));
    expect(res).toEqual(result);
  });

  it('updateProductAttributeValueOfProduct returns status 204 on success', async () => {
    mockPut.mockResolvedValue({ status: 204 });
    const res = await updateProductAttributeValueOfProduct(1, sample);
    expect(mockPut).toHaveBeenCalledWith(`${BASE}/1`, JSON.stringify(sample));
    expect(res).toBe(204);
  });

  it('updateProductAttributeValueOfProduct returns json on non-204', async () => {
    mockPut.mockResolvedValue({ status: 400, json: jest.fn().mockResolvedValue({ detail: 'err' }) });
    const res = await updateProductAttributeValueOfProduct(99, sample);
    expect(res).toEqual({ detail: 'err' });
  });

  it('deleteProductAttributeValueOfProductById returns 204 status on success', async () => {
    mockDelete.mockResolvedValue({ status: 204 });
    const res = await deleteProductAttributeValueOfProductById(1);
    expect(mockDelete).toHaveBeenCalledWith(`${BASE}/1`);
    expect(res).toBe(204);
  });

  it('deleteProductAttributeValueOfProductById returns json on non-204', async () => {
    mockDelete.mockResolvedValue({ status: 404, json: jest.fn().mockResolvedValue({ detail: 'not found' }) });
    const res = await deleteProductAttributeValueOfProductById(99);
    expect(res).toEqual({ detail: 'not found' });
  });
});
