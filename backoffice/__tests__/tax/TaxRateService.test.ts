jest.mock('../../common/services/ApiClientService', () => ({
  __esModule: true,
  default: { get: jest.fn(), post: jest.fn(), put: jest.fn(), delete: jest.fn() },
}));

import api from '../../common/services/ApiClientService';
import {
  getTaxRates, getPageableTaxRates, createTaxRate, getTaxRate, deleteTaxRate, editTaxRate,
} from '../../modules/tax/services/TaxRateService';

const mockGet = api.get as jest.Mock;
const mockPost = api.post as jest.Mock;
const mockPut = api.put as jest.Mock;
const mockDelete = api.delete as jest.Mock;
const json = (d: any) => ({ json: jest.fn().mockResolvedValue(d) });
const resp204 = () => ({ status: 204 });
const respErr = () => ({ status: 400, json: jest.fn().mockResolvedValue({ detail: 'err' }) });

beforeEach(() => jest.clearAllMocks());

const BASE = '/api/tax/backoffice/tax-rates';
const sample: any = { id: 1, name: 'VAT 10%', rate: 10 };

describe('TaxRateService', () => {
  it('getTaxRates fetches all', async () => {
    mockGet.mockResolvedValue(json([]));
    await getTaxRates();
    expect(mockGet).toHaveBeenCalledWith(BASE);
  });

  it('getPageableTaxRates builds paging URL', async () => {
    mockGet.mockResolvedValue(json({}));
    await getPageableTaxRates(0, 10);
    expect(mockGet).toHaveBeenCalledWith(`${BASE}/paging?pageNo=0&pageSize=10`);
  });

  it('createTaxRate posts data', async () => {
    mockPost.mockResolvedValue({ status: 201 });
    await createTaxRate(sample);
    expect(mockPost).toHaveBeenCalledWith(BASE, JSON.stringify(sample));
  });

  it('getTaxRate fetches by id', async () => {
    mockGet.mockResolvedValue(json(sample));
    await getTaxRate(1);
    expect(mockGet).toHaveBeenCalledWith(`${BASE}/1`);
  });

  it('deleteTaxRate returns response on 204', async () => {
    const r = resp204();
    mockDelete.mockResolvedValue(r);
    expect(await deleteTaxRate(1)).toBe(r);
  });

  it('deleteTaxRate returns json on non-204', async () => {
    mockDelete.mockResolvedValue(respErr());
    expect(await deleteTaxRate(99)).toEqual({ detail: 'err' });
  });

  it('editTaxRate returns response on 204', async () => {
    const r = resp204();
    mockPut.mockResolvedValue(r);
    expect(await editTaxRate(1, sample)).toBe(r);
  });

  it('editTaxRate returns json on non-204', async () => {
    mockPut.mockResolvedValue(respErr());
    expect(await editTaxRate(99, sample)).toEqual({ detail: 'err' });
  });
});
