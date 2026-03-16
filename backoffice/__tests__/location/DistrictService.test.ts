jest.mock('../../common/services/ApiClientService', () => ({
  __esModule: true,
  default: { get: jest.fn() },
}));

import api from '../../common/services/ApiClientService';
import { getDistricts } from '../../modules/location/services/DistrictService';

const mockGet = api.get as jest.Mock;
const json = (d: any) => ({ json: jest.fn().mockResolvedValue(d) });

beforeEach(() => jest.clearAllMocks());

describe('DistrictService', () => {
  it('getDistricts fetches by id', async () => {
    mockGet.mockResolvedValue(json([{ id: 1, name: 'District 1' }]));
    const result = await getDistricts(1);
    expect(mockGet).toHaveBeenCalledWith('/api/location/backoffice/district/1');
    expect(result).toEqual([{ id: 1, name: 'District 1' }]);
  });

  it('getDistricts uses correct URL for different id', async () => {
    mockGet.mockResolvedValue(json([]));
    await getDistricts(7);
    expect(mockGet).toHaveBeenCalledWith('/api/location/backoffice/district/7');
  });
});
