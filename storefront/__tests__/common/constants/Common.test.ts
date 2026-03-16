import {
  UPDATE_SUCCESSFULLY,
  CREATE_SUCCESSFULLY,
  DELETE_SUCCESSFULLY,
  SEARCH_URL,
} from 'common/constants/Common';

describe('Common constants', () => {
  it('UPDATE_SUCCESSFULLY has correct value', () => {
    expect(UPDATE_SUCCESSFULLY).toBe('Update successfully');
  });

  it('CREATE_SUCCESSFULLY has correct value', () => {
    expect(CREATE_SUCCESSFULLY).toBe('Create successfully');
  });

  it('DELETE_SUCCESSFULLY has correct value', () => {
    expect(DELETE_SUCCESSFULLY).toBe('Delete successfully');
  });

  it('SEARCH_URL has correct value', () => {
    expect(SEARCH_URL).toBe('/search');
  });
});
