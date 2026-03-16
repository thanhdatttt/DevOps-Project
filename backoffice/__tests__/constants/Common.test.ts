import {
  ToastVariant,
  ResponseStatus,
  ResponseTitle,
  HAVE_BEEN_DELETED,
  DELETE_FAILED,
  UPDATE_SUCCESSFULLY,
  CREATE_SUCCESSFULLY,
  UPDATE_FAILED,
  CREATE_FAILED,
  DEFAULT_PAGE_SIZE,
  DEFAULT_PAGE_NUMBER,
  CATEGORIES_URL,
  BRAND_URL,
  PRODUCT_URL,
  mappingExportingProductColumnNames,
} from '../../constants/Common';

describe('ToastVariant constants', () => {
  it('has correct SUCCESS value', () => {
    expect(ToastVariant.SUCCESS).toBe('success');
  });
  it('has correct WARNING value', () => {
    expect(ToastVariant.WARNING).toBe('warning');
  });
  it('has correct ERROR value', () => {
    expect(ToastVariant.ERROR).toBe('error');
  });
});

describe('ResponseStatus constants', () => {
  it('CREATED is 201', () => {
    expect(ResponseStatus.CREATED).toBe(201);
  });
  it('SUCCESS is 204', () => {
    expect(ResponseStatus.SUCCESS).toBe(204);
  });
  it('NOT_FOUND is 404', () => {
    expect(ResponseStatus.NOT_FOUND).toBe(404);
  });
  it('BAD_REQUEST is 400', () => {
    expect(ResponseStatus.BAD_REQUEST).toBe(400);
  });
});

describe('ResponseTitle constants', () => {
  it('NOT_FOUND title is "Not Found"', () => {
    expect(ResponseTitle.NOT_FOUND).toBe('Not Found');
  });
  it('BAD_REQUEST title is "Bad Request"', () => {
    expect(ResponseTitle.BAD_REQUEST).toBe('Bad Request');
  });
});

describe('Message constants', () => {
  it('HAVE_BEEN_DELETED message', () => {
    expect(HAVE_BEEN_DELETED).toBe(' have been deleted');
  });
  it('DELETE_FAILED message', () => {
    expect(DELETE_FAILED).toBe('Delete failed');
  });
  it('UPDATE_SUCCESSFULLY message', () => {
    expect(UPDATE_SUCCESSFULLY).toBe('Update successfully');
  });
  it('CREATE_SUCCESSFULLY message', () => {
    expect(CREATE_SUCCESSFULLY).toBe('Create successfully');
  });
  it('UPDATE_FAILED message', () => {
    expect(UPDATE_FAILED).toBe('Update failed');
  });
  it('CREATE_FAILED message', () => {
    expect(CREATE_FAILED).toBe('Create failed');
  });
});

describe('Pagination defaults', () => {
  it('DEFAULT_PAGE_SIZE is 10', () => {
    expect(DEFAULT_PAGE_SIZE).toBe(10);
  });
  it('DEFAULT_PAGE_NUMBER is 0', () => {
    expect(DEFAULT_PAGE_NUMBER).toBe(0);
  });
});

describe('URL constants', () => {
  it('CATEGORIES_URL', () => {
    expect(CATEGORIES_URL).toBe('/catalog/categories');
  });
  it('BRAND_URL', () => {
    expect(BRAND_URL).toBe('/catalog/brands');
  });
  it('PRODUCT_URL', () => {
    expect(PRODUCT_URL).toBe('/catalog/products');
  });
});

describe('mappingExportingProductColumnNames', () => {
  it('has id column', () => {
    expect(mappingExportingProductColumnNames.id).toBe('Id');
  });
  it('has name column as "Product Name"', () => {
    expect(mappingExportingProductColumnNames.name).toBe('Product Name');
  });
  it('has price column', () => {
    expect(mappingExportingProductColumnNames.price).toBe('Price');
  });
  it('has isPublished column', () => {
    expect(mappingExportingProductColumnNames.isPublished).toBe('Published');
  });
});
