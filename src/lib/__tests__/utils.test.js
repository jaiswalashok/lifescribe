import { cn } from '../utils';

describe('cn utility', () => {
  it('should merge basic classes', () => {
    expect(cn('foo', 'bar')).toBe('foo bar');
  });

  it('should handle conditional classes', () => {
    const isActive = true;
    expect(cn('px-4', isActive && 'bg-blue-500')).toBe('px-4 bg-blue-500');
  });

  it('should remove falsy conditional classes', () => {
    const isActive = false;
    expect(cn('px-4', isActive && 'bg-blue-500')).toBe('px-4');
  });

  it('should merge conflicting Tailwind classes with last one winning', () => {
    // Tailwind merge should resolve conflicts, p-2 should override p-4
    const result = cn('p-4', 'p-2');
    expect(result).toContain('p-2');
    expect(result).not.toContain('p-4');
  });

  it('should handle undefined and null', () => {
    expect(cn('foo', undefined, 'bar', null)).toBe('foo bar');
  });

  it('should handle empty strings', () => {
    expect(cn('foo', '', 'bar')).toBe('foo bar');
  });

  it('should handle objects with boolean values', () => {
    expect(cn({
      'px-4': true,
      'py-2': true,
      'bg-red': false,
    })).toContain('px-4');
    expect(cn({
      'px-4': true,
      'py-2': true,
      'bg-red': false,
    })).toContain('py-2');
  });

  it('should handle arrays of classes', () => {
    expect(cn(['foo', 'bar'], 'baz')).toContain('foo');
    expect(cn(['foo', 'bar'], 'baz')).toContain('bar');
    expect(cn(['foo', 'bar'], 'baz')).toContain('baz');
  });

  it('should merge color Tailwind classes', () => {
    const result = cn('text-red-500', 'text-blue-500');
    expect(result).toContain('text-blue-500');
    expect(result).not.toContain('text-red-500');
  });

  it('should merge padding classes', () => {
    const result = cn('p-4', 'p-2', 'px-8');
    // Should use the most specific or last value for conflicting classes
    expect(result).toContain('px-8');
  });
});
