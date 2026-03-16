jest.mock('../../common/services/ApiClientService', () => ({
  __esModule: true,
  default: { get: jest.fn() },
}));

import api from '../../common/services/ApiClientService';
import { getOrders, getLatestOrders, getOrderById } from '../../modules/order/services/OrderService';

const mockGet = api.get as jest.Mock;
const json = (d: any) => ({ json: jest.fn().mockResolvedValue(d) });

beforeEach(() => jest.clearAllMocks());

const BASE = '/api/order/backoffice/orders';

describe('OrderService', () => {
  it('getOrders appends query params', async () => {
    mockGet.mockResolvedValue(json({ orderList: [], totalPages: 0, totalElements: 0 }));
    await getOrders('pageNo=0&status=PENDING');
    expect(mockGet).toHaveBeenCalledWith(`${BASE}?pageNo=0&status=PENDING`);
  });

  it('getLatestOrders returns orders on 2xx', async () => {
    const orders = [{ id: 1 }];
    mockGet.mockResolvedValue({ status: 200, json: jest.fn().mockResolvedValue(orders) });
    const result = await getLatestOrders(5);
    expect(mockGet).toHaveBeenCalledWith(`${BASE}/latest/5`);
    expect(result).toEqual(orders);
  });

  it('getLatestOrders rejects on non-2xx', async () => {
    mockGet.mockResolvedValue({ status: 500, statusText: 'Server Error' });
    await expect(getLatestOrders(5)).rejects.toThrow('Server Error');
  });

  it('getOrderById fetches by id', async () => {
    mockGet.mockResolvedValue(json({ id: 1 }));
    await getOrderById(1);
    expect(mockGet).toHaveBeenCalledWith(`${BASE}/1`);
  });
});
