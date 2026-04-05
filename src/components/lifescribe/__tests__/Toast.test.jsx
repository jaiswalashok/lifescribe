import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import Toast from '../Toast';

jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }) => <>{children}</>,
}));

describe('Toast Component', () => {
  it('should render message when show is true', () => {
    const message = 'Test message';
    render(<Toast message={message} show={true} onClose={jest.fn()} />);

    expect(screen.getByText(message)).toBeInTheDocument();
  });

  it('should not render when show is false', () => {
    const message = 'Test message';
    render(<Toast message={message} show={false} onClose={jest.fn()} />);

    expect(screen.queryByText(message)).not.toBeInTheDocument();
  });

  it('should call onClose after timeout', async () => {
    const onClose = jest.fn();
    const message = 'Test message';

    render(<Toast message={message} show={true} onClose={onClose} />);

    await waitFor(
      () => {
        expect(onClose).toHaveBeenCalled();
      },
      { timeout: 4000 }
    );
  });

  it('should clear timeout on unmount', () => {
    const onClose = jest.fn();
    const { unmount } = render(<Toast message="Test" show={true} onClose={onClose} />);

    unmount();

    // onClose should not be called if unmounted before timeout
    expect(onClose).not.toHaveBeenCalled();
  });

  it('should have correct styling classes', () => {
    const message = 'Test message';
    const { container } = render(<Toast message={message} show={true} onClose={jest.fn()} />);

    const toastDiv = container.querySelector('div[class*="fixed"]');
    expect(toastDiv).toBeInTheDocument();
    expect(toastDiv).toHaveClass('fixed', 'bottom-6', 'left-1/2');
  });
});
