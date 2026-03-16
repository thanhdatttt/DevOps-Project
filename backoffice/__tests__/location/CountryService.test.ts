jest.mock('../../common/services/ApiClientService', () => ({
  __esModule: true,
  default: { get: jest.fn(), post: jest.fn(), put: jest.fn(), delete: jest.fn() },
}));

import api from '../../common/services/ApiClientService';
import {
  getCountries, getPageableCountries, createCountry, getCountry, deleteCountry, editCountry,
} from '../../modules/location/services/CountryService';

const mockGet = api.get as jest.Mock;
const mockPost = api.post as jest.Mock;
const mockPut = api.put as jest.Mock;
const mockDelete = api.delete as jest.Mock;
const json = (d: any) => ({ json: jest.fn().mockResolvedValue(d) });
const resp204 = () => ({ status: 204 });
const respErr = () => ({ status: 404, json: jest.fn().mockResolvedValue({ detail: 'not found' }) });

beforeEach(() => jest.clearAllMocks());

const BASE = '/api/location/backoffice/countries';
const sample: any = { id: 1, name: 'Vietnam', code2: 'VN' };

describe('CountryService', () => {
  it('getCountries fetches all', async () => {
    mockGet.mockResolvedValue(json([]));
    await getCountries();
    expect(mockGet).toHaveBeenCalledWith(BASE);
  });

  it('getPageableCountries builds URL', async () => {
    mockGet.mockResolvedValue(json({}));
    await getPageableCountries(0, 10);
    expect(mockGet).toHaveBeenCalledWith(`${BASE}/paging?pageNo=0&pageSize=10`);
  });

  it('createCountry posts data', async () => {
    mockPost.mockResolvedValue({ status: 201 });
    await createCountry(sample);
    expect(mockPost).toHaveBeenCalledWith(BASE, JSON.stringify(sample));
  });

  it('getCountry fetches by id', async () => {
    mockGet.mockResolvedValue(json(sample));
    await getCountry(1);
    expect(mockGet).toHaveBeenCalledWith(`${BASE}/1`);
  });

  it('deleteCountry returns response on 204', async () => {
    const r = resp204();
    mockDelete.mockResolvedValue(r);
    expect(await deleteCountry(1)).toBe(r);
  });

  it('deleteCountry returns json on non-204', async () => {
    mockDelete.mockResolvedValue(respErr());
    expect(await deleteCountry(99)).toEqual({ detail: 'not found' });
  });

  it('editCountry returns response on 204', async () => {
    const r = resp204();
    mockPut.mockResolvedValue(r);
    expect(await editCountry(1, sample)).toBe(r);
  });

  it('editCountry returns json on non-204', async () => {
    mockPut.mockResolvedValue(respErr());
    expect(await editCountry(99, sample)).toEqual({ detail: 'not found' });
  });
});
