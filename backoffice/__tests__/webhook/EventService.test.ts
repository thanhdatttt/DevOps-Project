// EventService uses both global fetch AND apiClientService — mock both
jest.mock('../../common/services/ApiClientService', () => ({
  __esModule: true,
  default: { get: jest.fn() },
}));

const mockFetch = jest.fn();
global.fetch = mockFetch;

import api from '../../common/services/ApiClientService';
import { getEvents } from '../../modules/webhook/services/EventService';

const mockGet = api.get as jest.Mock;
const json = (d: any) => ({ json: jest.fn().mockResolvedValue(d) });

beforeEach(() => jest.clearAllMocks());

describe('EventService', () => {
  it('getEvents calls apiClientService.get and returns json', async () => {
    mockFetch.mockResolvedValue({ json: jest.fn().mockResolvedValue([]) });
    mockGet.mockResolvedValue(json([{ id: 1, name: 'ORDER_CREATED' }]));
    const result = await getEvents();
    expect(mockGet).toHaveBeenCalledWith('/api/webhook/backoffice/events');
    expect(result).toEqual([{ id: 1, name: 'ORDER_CREATED' }]);
  });
});
