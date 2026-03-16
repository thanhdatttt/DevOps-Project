jest.mock('../../../common/services/ApiClientService', () => ({
  __esModule: true,
  default: { get: jest.fn(), post: jest.fn(), put: jest.fn() },
}));

import api from '../../../common/services/ApiClientService';
import {
  getProductTemplates, getPageableProductTemplates, createProductTemplate,
  getProductTemplate, updateProductTemplate,
} from '../../../modules/catalog/services/ProductTemplateService';

const mockGet = api.get as jest.Mock;
const mockPost = api.post as jest.Mock;
const mockPut = api.put as jest.Mock;
const json = (d: any) => ({ json: jest.fn().mockResolvedValue(d) });
const resp204 = () => ({ status: 204 });
const respErr = () => ({ status: 400, json: jest.fn().mockResolvedValue({ detail: 'err' }) });

beforeEach(() => jest.clearAllMocks());

const BASE = '/api/product/backoffice/product-template';
const sample: any = { id: 1, name: 'T-Shirt Template' };

describe('ProductTemplateService', () => {
  it('getProductTemplates fetches all', async () => {
    mockGet.mockResolvedValue(json([]));
    await getProductTemplates();
    expect(mockGet).toHaveBeenCalledWith(BASE);
  });

  it('getPageableProductTemplates builds paging URL', async () => {
    mockGet.mockResolvedValue(json({}));
    await getPageableProductTemplates(0, 10);
    expect(mockGet).toHaveBeenCalledWith(`${BASE}/paging?pageNo=0&pageSize=10`);
  });

  it('createProductTemplate posts data', async () => {
    mockPost.mockResolvedValue({ status: 201 });
    await createProductTemplate(sample);
    expect(mockPost).toHaveBeenCalledWith(BASE, JSON.stringify(sample));
  });

  it('getProductTemplate fetches by id', async () => {
    mockGet.mockResolvedValue(json(sample));
    await getProductTemplate(1);
    expect(mockGet).toHaveBeenCalledWith(`${BASE}/1`);
  });

  it('updateProductTemplate returns response on 204', async () => {
    const r = resp204();
    mockPut.mockResolvedValue(r);
    expect(await updateProductTemplate(1, sample)).toBe(r);
  });

  it('updateProductTemplate returns json on non-204', async () => {
    mockPut.mockResolvedValue(respErr());
    expect(await updateProductTemplate(99, sample)).toEqual({ detail: 'err' });
  });
});
