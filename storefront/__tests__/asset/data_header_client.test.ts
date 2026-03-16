import { data_menu_top_no_login } from 'asset/data/data_header_client';

describe('data_menu_top_no_login', () => {
  it('is an array', () => {
    expect(Array.isArray(data_menu_top_no_login)).toBe(true);
  });

  it('has 3 items', () => {
    expect(data_menu_top_no_login).toHaveLength(3);
  });

  it('first item is Notification with bell icon', () => {
    const item = data_menu_top_no_login[0];
    expect(item.id).toBe(1);
    expect(item.name).toBe('Notification');
    expect(item.links).toBe('#');
    expect(item.icon).toBe('bi bi-bell');
  });

  it('second item is Help & FAQs with question icon', () => {
    const item = data_menu_top_no_login[1];
    expect(item.id).toBe(2);
    expect(item.name).toBe('Help & FAQs');
    expect(item.icon).toBe('bi bi-question-circle');
  });

  it('third item is EN with no icon', () => {
    const item = data_menu_top_no_login[2];
    expect(item.id).toBe(3);
    expect(item.name).toBe('EN');
    expect(item.icon).toBeUndefined();
  });

  it('all items have id, name, and links', () => {
    data_menu_top_no_login.forEach((item) => {
      expect(item).toHaveProperty('id');
      expect(item).toHaveProperty('name');
      expect(item).toHaveProperty('links');
    });
  });
});
