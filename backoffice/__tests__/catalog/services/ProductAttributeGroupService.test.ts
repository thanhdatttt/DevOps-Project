jest.mock('../../../common/services/ApiClientService', () => ({
  __esModule: true,
  default: { get: jest.fn(), post: jest.fn(), put: jest.fn(), delete: jest.fn() },
}));

import api from '../../../common/services/ApiClientService';
import {
  getProductAttributeGroups, getPageableProductAttributeGroups, getProductAttributeGroup,
  createProductAttributeGroup, updateProductAttributeGroup, deleteProductAttributeGroup,
} from '../../../modules/catalog/services/ProductAttributeGroupService';

const mockGet = api.get as jest.Mock;
const mockPost = api.post as jest.Mock;
const mockPut = api.put as jest.Mock;
const mockDelete = api.delete as jest.Mock;
const json = (d: any) => ({ json: jest.fn().mockResolvedValue(d) });
const resp204 = () => ({ status: 204 });
const respErr = () => ({ status: 400, json: jest.fn().mockResolvedValue({ detail: 'err' }) });

beforeEach(() => jest.clearAllMocks());

const BASE = '/api/product/backoffice/product-attribute-groups';
const sample: any = { id: 1, name: 'Size Group' };

describe('ProductAttributeGroupService', () => {
  it('getProductAttributeGroups fetches all', async () => {
    mockGet.mockResolvedValue(json([]));
    await getProductAttributeGroups();
    expect(mockGet).toHaveBeenCalledWith(BASE);
  });

  it('getPageableProductAttributeGroups builds paging URL', async () => {
    mockGet.mockResolvedValue(json({}));
    await getPageableProductAttributeGroups(1, 10);
    expect(mockGet).toHaveBeenCalledWith(`${BASE}/paging?pageNo=1&pageSize=10`);
  });

  it('getProductAttributeGroup fetches by id', async () => {
    mockGet.mockResolvedValue(json(sample));
    await getProductAttributeGroup(1);
    expect(mockGet).toHaveBeenCalledWith(`${BASE}/1`);
  });

  it('createProductAttributeGroup posts data', async () => {
    mockPost.mockResolvedValue({ status: 201 });
    await createProductAttributeGroup(sample);
    expect(mockPost).toHaveBeenCalledWith(BASE, JSON.stringify(sample));
  });

  it('updateProductAttributeGroup returns response on 204', async () => {
    const r = resp204();
    mockPut.mockResolvedValue(r);
    expect(await updateProductAttributeGroup(1, sample)).toBe(r);
  });

  it('updateProductAttributeGroup returns json on non-204', async () => {
    mockPut.mockResolvedValue(respErr());
    expect(await updateProductAttributeGroup(99, sample)).toEqual({ detail: 'err' });
  });

  it('deleteProductAttributeGroup returns response on 204', async () => {
    const r = resp204();
    mockDelete.mockResolvedValue(r);
    expect(await deleteProductAttributeGroup(1)).toBe(r);
  });

  it('deleteProductAttributeGroup returns json on non-204', async () => {
    mockDelete.mockResolvedValue(respErr());
    expect(await deleteProductAttributeGroup(99)).toEqual({ detail: 'err' });
  });
});
