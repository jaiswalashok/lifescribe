import React from 'react';
import { render, screen } from '@testing-library/react';
import MoodRingAvatar from '../MoodRingAvatar';

jest.mock('../constants', () => ({
  getMoodColor: (mood) => {
    const colors = {
      very_happy: '#FFD700',
      happy: '#90EE90',
      peaceful: '#98FB98',
    };
    return colors[mood] || '#E0E0E0';
  },
}));

jest.mock('lucide-react', () => ({
  User: ({ style, className }) => (
    <div className={className} style={style} data-testid="user-icon">
      User Icon
    </div>
  ),
}));

describe('MoodRingAvatar Component', () => {
  it('should render with image when src is provided', () => {
    const src = 'https://example.com/avatar.jpg';
    const { container } = render(
      <MoodRingAvatar src={src} mood="happy" size={40} name="John" />
    );

    const img = container.querySelector('img');
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', src);
    expect(img).toHaveAttribute('alt', 'John');
  });

  it('should show initials when no src provided', () => {
    const { container } = render(
      <MoodRingAvatar mood="happy" size={40} name="John Doe" />
    );

    expect(screen.getByText('J')).toBeInTheDocument();
  });

  it('should show user icon when no src and no name', () => {
    render(<MoodRingAvatar mood="happy" size={40} />);

    expect(screen.getByTestId('user-icon')).toBeInTheDocument();
  });

  it('should apply mood color to border', () => {
    const { container } = render(
      <MoodRingAvatar mood="very_happy" size={40} name="Test" />
    );

    const outerDiv = container.firstChild;
    expect(outerDiv).toHaveStyle({ border: '3px solid #FFD700' });
  });

  it('should use default border width when no mood', () => {
    const { container } = render(
      <MoodRingAvatar size={40} name="Test" />
    );

    const outerDiv = container.firstChild;
    expect(outerDiv).toHaveStyle({ border: '1.5px solid #E0E0E0' });
  });

  it('should use thicker border when mood is set', () => {
    const { container } = render(
      <MoodRingAvatar mood="happy" size={40} name="Test" />
    );

    const outerDiv = container.firstChild;
    const style = outerDiv.getAttribute('style');
    expect(style).toContain('3px');
  });

  it('should calculate outer size correctly', () => {
    const size = 40;
    const { container } = render(
      <MoodRingAvatar mood="happy" size={size} name="Test" />
    );

    const outerDiv = container.firstChild;
    const width = outerDiv.style.width;
    const height = outerDiv.style.height;

    // With mood, border is 3px, so: 40 + 3*2 + 4 = 50
    const expectedSize = size + 3 * 2 + 4;
    expect(parseInt(width)).toBe(expectedSize);
    expect(parseInt(height)).toBe(expectedSize);
  });

  it('should render image with correct size', () => {
    const { container } = render(
      <MoodRingAvatar src="https://example.com/avatar.jpg" size={40} />
    );

    const img = container.querySelector('img');
    expect(img).toHaveStyle({ width: '40px', height: '40px' });
  });

  it('should format name correctly to uppercase initial', () => {
    render(<MoodRingAvatar size={40} name="alice" />);

    expect(screen.getByText('A')).toBeInTheDocument();
  });

  it('should handle name with special characters', () => {
    render(<MoodRingAvatar size={40} name="@alice" />);

    expect(screen.getByText('@')).toBeInTheDocument();
  });
});
