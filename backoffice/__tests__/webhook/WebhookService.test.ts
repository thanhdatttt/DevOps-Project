jest.mock('../../common/services/ApiClientService', () => ({
  __esModule: true,
  default: { get: jest.fn(), post: jest.fn(), put: jest.fn(), delete: jest.fn() },
}));

import api from '../../common/services/ApiClientService';
import {
  getWebhooks, createWebhook, getWebhook, deleteWebhook, updateWebhook,
} from '../../modules/webhook/services/WebhookService';

const mockGet = api.get as jest.Mock;
const mockPost = api.post as jest.Mock;
const mockPut = api.put as jest.Mock;
const mockDelete = api.delete as jest.Mock;
const json = (d: any) => ({ json: jest.fn().mockResolvedValue(d) });
const resp204 = () => ({ status: 204 });
const respErr = () => ({ status: 400, json: jest.fn().mockResolvedValue({ detail: 'err' }) });

beforeEach(() => jest.clearAllMocks());

const BASE = '/api/webhook/backoffice/webhooks';
const sample: any = { id: 1, url: 'https://example.com/hook' };

describe('WebhookService', () => {
  it('getWebhooks builds paging URL', async () => {
    mockGet.mockResolvedValue(json({}));
    await getWebhooks(0, 10);
    expect(mockGet).toHaveBeenCalledWith(`${BASE}/paging?pageNo=0&pageSize=10`);
  });

  it('createWebhook posts data', async () => {
    mockPost.mockResolvedValue({ status: 201 });
    await createWebhook(sample);
    expect(mockPost).toHaveBeenCalledWith(BASE, JSON.stringify(sample));
  });

  it('getWebhook fetches by id', async () => {
    mockGet.mockResolvedValue(json(sample));
    await getWebhook(1);
    expect(mockGet).toHaveBeenCalledWith(`${BASE}/1`);
  });

  it('deleteWebhook returns response on 204', async () => {
    const r = resp204();
    mockDelete.mockResolvedValue(r);
    expect(await deleteWebhook(1)).toBe(r);
  });

  it('deleteWebhook returns json on non-204', async () => {
    mockDelete.mockResolvedValue(respErr());
    expect(await deleteWebhook(99)).toEqual({ detail: 'err' });
  });

  it('updateWebhook returns response on 204', async () => {
    const r = resp204();
    mockPut.mockResolvedValue(r);
    expect(await updateWebhook(1, sample)).toBe(r);
  });

  it('updateWebhook returns json on non-204', async () => {
    mockPut.mockResolvedValue(respErr());
    expect(await updateWebhook(99, sample)).toEqual({ detail: 'err' });
  });
});
