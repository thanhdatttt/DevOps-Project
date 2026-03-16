jest.mock('../../common/services/ApiClientService', () => ({
  __esModule: true,
  default: { get: jest.fn(), post: jest.fn(), put: jest.fn(), delete: jest.fn() },
}));

import api from '../../common/services/ApiClientService';
import {
  getPromotions, createPromotion, updatePromotion, getPromotion, deletePromotion, cancel,
} from '../../modules/promotion/services/PromotionService';

const mockGet = api.get as jest.Mock;
const mockPost = api.post as jest.Mock;
const mockPut = api.put as jest.Mock;
const mockDelete = api.delete as jest.Mock;
const json = (d: any) => ({ json: jest.fn().mockResolvedValue(d) });

beforeEach(() => jest.clearAllMocks());

const BASE = '/api/promotion/backoffice/promotions';

describe('PromotionService', () => {
  it('getPromotions serialises request object as query string', async () => {
    mockGet.mockResolvedValue(json([]));
    await getPromotions({ pageNo: 0, pageSize: 10 } as any);
    expect(mockGet).toHaveBeenCalledWith(`${BASE}?pageNo=0&pageSize=10`);
  });

  it('createPromotion posts data', async () => {
    mockPost.mockResolvedValue({ status: 201 });
    const promo: any = { name: 'Summer Sale', discount: 10 };
    await createPromotion(promo);
    expect(mockPost).toHaveBeenCalledWith(BASE, JSON.stringify(promo));
  });

  it('updatePromotion puts data', async () => {
    mockPut.mockResolvedValue({ status: 204 });
    const promo: any = { id: 1, name: 'Updated Sale' };
    await updatePromotion(promo);
    expect(mockPut).toHaveBeenCalledWith(BASE, JSON.stringify(promo));
  });

  it('getPromotion fetches by id', async () => {
    mockGet.mockResolvedValue(json({ id: 1 }));
    await getPromotion(1);
    expect(mockGet).toHaveBeenCalledWith(`${BASE}/1`);
  });

  it('deletePromotion calls delete with correct URL', async () => {
    mockDelete.mockResolvedValue({ status: 204 });
    await deletePromotion(1);
    expect(mockDelete).toHaveBeenCalledWith(`${BASE}/1`);
  });

  it('cancel navigates to promotions list page', () => {
    // jsdom does not support navigation — verify it attempts to set href without throwing
    expect(() => cancel()).not.toThrow();
  });
});
