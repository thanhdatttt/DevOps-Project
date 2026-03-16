jest.mock('../../common/services/ApiClientService', () => ({
  __esModule: true,
  default: { get: jest.fn(), post: jest.fn(), put: jest.fn(), delete: jest.fn() },
}));

import api from '../../common/services/ApiClientService';
import {
  getCustomers, getCustomer, createCustomer, updateCustomer, deleteCustomer, getMyProfile,
} from '../../modules/customer/services/CustomerService';

const mockGet = api.get as jest.Mock;
const mockPost = api.post as jest.Mock;
const mockPut = api.put as jest.Mock;
const mockDelete = api.delete as jest.Mock;
const json = (d: any) => ({ json: jest.fn().mockResolvedValue(d) });
const resp204 = () => ({ status: 204 });
const respErr = () => ({ status: 400, json: jest.fn().mockResolvedValue({ detail: 'err' }) });

beforeEach(() => jest.clearAllMocks());

describe('CustomerService', () => {
  it('getCustomers builds correct URL', async () => {
    mockGet.mockResolvedValue(json({}));
    await getCustomers(2);
    expect(mockGet).toHaveBeenCalledWith('/api/customer/backoffice/customers?pageNo=2');
  });

  it('getCustomer fetches by userId', async () => {
    mockGet.mockResolvedValue(json({}));
    await getCustomer('abc-123');
    expect(mockGet).toHaveBeenCalledWith('/api/customer/backoffice/customers/profile/abc-123');
  });

  it('createCustomer posts data', async () => {
    mockPost.mockResolvedValue({ status: 201 });
    const payload: any = { username: 'john' };
    await createCustomer(payload);
    expect(mockPost).toHaveBeenCalledWith('/api/customer/backoffice/customers', JSON.stringify(payload));
  });

  it('updateCustomer puts data', async () => {
    mockPut.mockResolvedValue({ status: 204 });
    const payload: any = { firstName: 'John' };
    await updateCustomer('abc-123', payload);
    expect(mockPut).toHaveBeenCalledWith('/api/customer/backoffice/customers/profile/abc-123', JSON.stringify(payload));
  });

  it('deleteCustomer returns response on 204', async () => {
    const r = resp204();
    mockDelete.mockResolvedValue(r);
    const result = await deleteCustomer('abc-123');
    expect(result).toBe(r);
  });

  it('deleteCustomer returns json on non-204', async () => {
    mockDelete.mockResolvedValue(respErr());
    const result = await deleteCustomer('x');
    expect(result).toEqual({ detail: 'err' });
  });

  it('getMyProfile fetches storefront profile', async () => {
    mockGet.mockResolvedValue(json({ username: 'me' }));
    await getMyProfile();
    expect(mockGet).toHaveBeenCalledWith('/api/customer/storefront/customer/profile');
  });
});
