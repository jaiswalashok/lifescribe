import { createPageUrl } from '../index';

describe('createPageUrl', () => {
  it('should convert page name to URL path', () => {
    expect(createPageUrl('Home')).toBe('/Home');
  });

  it('should replace spaces with hyphens', () => {
    expect(createPageUrl('Chapter Detail')).toBe('/Chapter-Detail');
  });

  it('should handle empty string', () => {
    expect(createPageUrl('')).toBe('/');
  });

  it('should handle single word', () => {
    expect(createPageUrl('About')).toBe('/About');
  });

  it('should handle multiple spaces', () => {
    expect(createPageUrl('Create New Entry')).toBe('/Create-New-Entry');
  });

  it('should preserve case', () => {
    expect(createPageUrl('EditProfile')).toBe('/EditProfile');
  });

  it('should handle trailing/leading spaces', () => {
    expect(createPageUrl(' Journal Entry ')).toBe('/-Journal-Entry-');
  });
});
