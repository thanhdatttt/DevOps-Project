jest.mock('../../common/services/ApiClientService', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  },
}));

import apiClientService from '../../common/services/ApiClientService';
import {
  getWarehouses,
  getPageableWarehouses,
  createWarehouse,
  getWarehouse,
  deleteWarehouse,
  editWarehouse,
  getProductInWarehouse,
  FilterExistInWHSelection,
} from '../../modules/inventory/services/WarehouseService';

const mockGet = apiClientService.get as jest.Mock;
const mockPost = apiClientService.post as jest.Mock;
const mockPut = apiClientService.put as jest.Mock;
const mockDelete = apiClientService.delete as jest.Mock;

const json = (data: any) => ({ json: jest.fn().mockResolvedValue(data) });
const resp204 = () => ({ status: 204 });
const respErr = () => ({ status: 400, json: jest.fn().mockResolvedValue({ detail: 'error' }) });

beforeEach(() => jest.clearAllMocks());

const BASE = '/api/inventory/backoffice/warehouses';
const sampleWarehouse: any = { id: 1, name: 'Main Warehouse' };

describe('FilterExistInWHSelection enum', () => {
  it('has ALL value', () => expect(FilterExistInWHSelection.ALL).toBe('ALL'));
  it('has YES value', () => expect(FilterExistInWHSelection.YES).toBe('YES'));
  it('has NO value', () => expect(FilterExistInWHSelection.NO).toBe('NO'));
});

describe('WarehouseService', () => {
  it('getWarehouses fetches all warehouses', async () => {
    mockGet.mockResolvedValue(json([]));
    await getWarehouses();
    expect(mockGet).toHaveBeenCalledWith(BASE);
  });

  it('getPageableWarehouses builds correct paging URL', async () => {
    mockGet.mockResolvedValue(json({}));
    await getPageableWarehouses(1, 10);
    expect(mockGet).toHaveBeenCalledWith(`${BASE}/paging?pageNo=1&pageSize=10`);
  });

  it('createWarehouse posts warehouse data', async () => {
    mockPost.mockResolvedValue({ status: 201 });
    await createWarehouse(sampleWarehouse);
    expect(mockPost).toHaveBeenCalledWith(BASE, JSON.stringify(sampleWarehouse));
  });

  it('getWarehouse fetches by id', async () => {
    mockGet.mockResolvedValue(json(sampleWarehouse));
    await getWarehouse(1);
    expect(mockGet).toHaveBeenCalledWith(`${BASE}/1`);
  });

  it('deleteWarehouse returns response directly on 204', async () => {
    const r = resp204();
    mockDelete.mockResolvedValue(r);
    const result = await deleteWarehouse(1);
    expect(result).toBe(r);
  });

  it('deleteWarehouse returns parsed json on non-204', async () => {
    mockDelete.mockResolvedValue(respErr());
    const result = await deleteWarehouse(99);
    expect(result).toEqual({ detail: 'error' });
  });

  it('editWarehouse returns response directly on 204', async () => {
    const r = resp204();
    mockPut.mockResolvedValue(r);
    const result = await editWarehouse(1, sampleWarehouse);
    expect(result).toBe(r);
  });

  it('editWarehouse returns parsed json on non-204', async () => {
    mockPut.mockResolvedValue(respErr());
    const result = await editWarehouse(1, sampleWarehouse);
    expect(result).toEqual({ detail: 'error' });
  });

  it('getProductInWarehouse builds correct query URL', async () => {
    mockGet.mockResolvedValue(json([]));
    await getProductInWarehouse(1, 'widget', 'SKU-001', FilterExistInWHSelection.ALL);
    expect(mockGet).toHaveBeenCalledWith(
      `${BASE}/1/products?productName=widget&productSku=SKU-001&existStatus=ALL`
    );
  });

  it('getProductInWarehouse works with YES filter', async () => {
    mockGet.mockResolvedValue(json([]));
    await getProductInWarehouse(2, '', '', FilterExistInWHSelection.YES);
    expect(mockGet).toHaveBeenCalledWith(
      `${BASE}/2/products?productName=&productSku=&existStatus=YES`
    );
  });
});
