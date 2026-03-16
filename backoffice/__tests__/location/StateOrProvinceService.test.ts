jest.mock('../../common/services/ApiClientService', () => ({
  __esModule: true,
  default: { get: jest.fn(), post: jest.fn(), put: jest.fn(), delete: jest.fn() },
}));

import api from '../../common/services/ApiClientService';
import {
  getStateOrProvincesByCountry, getPageableStateOrProvinces, createStateOrProvince,
  getStateOrProvince, deleteStateOrProvince, editStateOrProvince, getStatesOrProvinces,
} from '../../modules/location/services/StateOrProvinceService';

const mockGet = api.get as jest.Mock;
const mockPost = api.post as jest.Mock;
const mockPut = api.put as jest.Mock;
const mockDelete = api.delete as jest.Mock;
const json = (d: any) => ({ json: jest.fn().mockResolvedValue(d) });
const resp204 = () => ({ status: 204 });
const respErr = () => ({ status: 400, json: jest.fn().mockResolvedValue({ detail: 'err' }) });

beforeEach(() => jest.clearAllMocks());

const BASE = '/api/location/backoffice/state-or-provinces';
const sample: any = { id: 1, name: 'Ho Chi Minh', countryId: 1 };

describe('StateOrProvinceService', () => {
  it('getStateOrProvincesByCountry builds URL with countryId', async () => {
    mockGet.mockResolvedValue(json([]));
    await getStateOrProvincesByCountry(1);
    expect(mockGet).toHaveBeenCalledWith(`${BASE}?countryId=1`);
  });

  it('getPageableStateOrProvinces builds paging URL', async () => {
    mockGet.mockResolvedValue(json({}));
    await getPageableStateOrProvinces(0, 10, 1);
    expect(mockGet).toHaveBeenCalledWith(`${BASE}/paging?pageNo=0&pageSize=10&countryId=1`);
  });

  it('createStateOrProvince posts data', async () => {
    mockPost.mockResolvedValue({ status: 201 });
    await createStateOrProvince(sample);
    expect(mockPost).toHaveBeenCalledWith(BASE, JSON.stringify(sample));
  });

  it('getStateOrProvince fetches by id', async () => {
    mockGet.mockResolvedValue(json(sample));
    await getStateOrProvince(1);
    expect(mockGet).toHaveBeenCalledWith(`${BASE}/1`);
  });

  it('deleteStateOrProvince returns response on 204', async () => {
    const r = resp204();
    mockDelete.mockResolvedValue(r);
    expect(await deleteStateOrProvince(1)).toBe(r);
  });

  it('deleteStateOrProvince returns json on non-204', async () => {
    mockDelete.mockResolvedValue(respErr());
    expect(await deleteStateOrProvince(99)).toEqual({ detail: 'err' });
  });

  it('editStateOrProvince returns response on 204', async () => {
    const r = resp204();
    mockPut.mockResolvedValue(r);
    expect(await editStateOrProvince(1, sample)).toBe(r);
  });

  it('editStateOrProvince returns json on non-204', async () => {
    mockPut.mockResolvedValue(respErr());
    expect(await editStateOrProvince(99, sample)).toEqual({ detail: 'err' });
  });

  it('getStatesOrProvinces fetches by id', async () => {
    mockGet.mockResolvedValue(json(sample));
    await getStatesOrProvinces(1);
    expect(mockGet).toHaveBeenCalledWith(`${BASE}/1`);
  });
});
