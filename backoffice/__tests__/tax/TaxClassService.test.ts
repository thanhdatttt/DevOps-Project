jest.mock('../../common/services/ApiClientService', () => ({
  __esModule: true,
  default: { get: jest.fn(), post: jest.fn(), put: jest.fn(), delete: jest.fn() },
}));

import api from '../../common/services/ApiClientService';
import {
  getTaxClasses, getPageableTaxClasses, createTaxClass, getTaxClass, deleteTaxClass, editTaxClass,
} from '../../modules/tax/services/TaxClassService';

const mockGet = api.get as jest.Mock;
const mockPost = api.post as jest.Mock;
const mockPut = api.put as jest.Mock;
const mockDelete = api.delete as jest.Mock;
const json = (d: any) => ({ json: jest.fn().mockResolvedValue(d) });
const resp204 = () => ({ status: 204 });
const respErr = () => ({ status: 400, json: jest.fn().mockResolvedValue({ detail: 'err' }) });

beforeEach(() => jest.clearAllMocks());

const BASE = '/api/tax/backoffice/tax-classes';
const sample: any = { id: 1, name: 'Standard' };

describe('TaxClassService', () => {
  it('getTaxClasses fetches all', async () => {
    mockGet.mockResolvedValue(json([]));
    await getTaxClasses();
    expect(mockGet).toHaveBeenCalledWith(BASE);
  });

  it('getPageableTaxClasses builds paging URL', async () => {
    mockGet.mockResolvedValue(json({}));
    await getPageableTaxClasses(1, 5);
    expect(mockGet).toHaveBeenCalledWith(`${BASE}/paging?pageNo=1&pageSize=5`);
  });

  it('createTaxClass posts data', async () => {
    mockPost.mockResolvedValue({ status: 201 });
    await createTaxClass(sample);
    expect(mockPost).toHaveBeenCalledWith(BASE, JSON.stringify(sample));
  });

  it('getTaxClass fetches by id', async () => {
    mockGet.mockResolvedValue(json(sample));
    await getTaxClass(1);
    expect(mockGet).toHaveBeenCalledWith(`${BASE}/1`);
  });

  it('deleteTaxClass returns response on 204', async () => {
    const r = resp204();
    mockDelete.mockResolvedValue(r);
    expect(await deleteTaxClass(1)).toBe(r);
  });

  it('deleteTaxClass returns json on non-204', async () => {
    mockDelete.mockResolvedValue(respErr());
    expect(await deleteTaxClass(99)).toEqual({ detail: 'err' });
  });

  it('editTaxClass returns response on 204', async () => {
    const r = resp204();
    mockPut.mockResolvedValue(r);
    expect(await editTaxClass(1, sample)).toBe(r);
  });

  it('editTaxClass returns json on non-204', async () => {
    mockPut.mockResolvedValue(respErr());
    expect(await editTaxClass(99, sample)).toEqual({ detail: 'err' });
  });
});
