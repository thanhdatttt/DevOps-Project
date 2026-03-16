jest.mock('../../common/services/ApiClientService', () => ({
  __esModule: true,
  default: { get: jest.fn(), delete: jest.fn() },
}));

import api from '../../common/services/ApiClientService';
import { getRatings, getLatestRatings, deleteRatingById } from '../../modules/rating/services/RatingService';

const mockGet = api.get as jest.Mock;
const mockDelete = api.delete as jest.Mock;
const json = (d: any) => ({ json: jest.fn().mockResolvedValue(d) });

beforeEach(() => jest.clearAllMocks());

const BASE = '/api/rating/backoffice/ratings';

describe('RatingService', () => {
  it('getRatings appends query params', async () => {
    mockGet.mockResolvedValue(json({ ratingList: [], totalPages: 0, totalElements: 0 }));
    await getRatings('pageNo=0&rating=5');
    expect(mockGet).toHaveBeenCalledWith(`${BASE}?pageNo=0&rating=5`);
  });

  it('getLatestRatings returns ratings on 2xx', async () => {
    const ratings = [{ id: 1 }];
    mockGet.mockResolvedValue({ status: 200, json: jest.fn().mockResolvedValue(ratings) });
    const result = await getLatestRatings(3);
    expect(mockGet).toHaveBeenCalledWith(`${BASE}/latest/3`);
    expect(result).toEqual(ratings);
  });

  it('getLatestRatings rejects on non-2xx', async () => {
    mockGet.mockResolvedValue({ status: 404, statusText: 'Not Found' });
    await expect(getLatestRatings(3)).rejects.toThrow('Not Found');
  });

  it('deleteRatingById calls delete and returns json', async () => {
    mockDelete.mockResolvedValue(json({}));
    await deleteRatingById(1);
    expect(mockDelete).toHaveBeenCalledWith(`${BASE}/1`);
  });
});
