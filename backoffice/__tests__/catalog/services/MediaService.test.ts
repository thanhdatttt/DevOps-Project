jest.mock('../../../common/services/ApiClientService', () => ({
  __esModule: true,
  default: { post: jest.fn() },
}));

import api from '../../../common/services/ApiClientService';
import { uploadMedia } from '../../../modules/catalog/services/MediaService';

const mockPost = api.post as jest.Mock;

beforeEach(() => jest.clearAllMocks());

const BASE = '/api/media/medias';

describe('MediaService', () => {
  it('uploadMedia posts FormData and returns json on 2xx', async () => {
    const media = { id: 1, url: 'https://cdn.example.com/img.jpg' };
    mockPost.mockResolvedValue({ status: 200, json: jest.fn().mockResolvedValue(media) });

    const file = new File(['content'], 'photo.jpg', { type: 'image/jpeg' });
    const result = await uploadMedia(file);

    expect(mockPost).toHaveBeenCalledWith(BASE, expect.any(FormData));
    expect(result).toEqual(media);
  });

  it('uploadMedia rejects on non-2xx response', async () => {
    const errResp = { status: 413 };
    mockPost.mockResolvedValue(errResp);

    const file = new File(['content'], 'huge.jpg', { type: 'image/jpeg' });
    await expect(uploadMedia(file)).rejects.toBe(errResp);
  });
});
