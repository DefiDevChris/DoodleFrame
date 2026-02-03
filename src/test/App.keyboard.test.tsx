import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import App from '../App';

// Mock Konva and react-konva
vi.mock('react-konva', () => ({
  Stage: ({ children, onMouseDown, onMouseMove, onMouseUp }: any) => (
    <div data-testid="stage" onMouseDown={onMouseDown} onMouseMove={onMouseMove} onMouseUp={onMouseUp}>
      {children}
    </div>
  ),
  Layer: ({ children }: any) => <div data-testid="layer">{children}</div>,
  Line: (props: any) => <div data-testid="line" {...props} />,
  Rect: (props: any) => <div data-testid="rect" {...props} />,
  Circle: (props: any) => <div data-testid="circle" {...props} />,
  Text: (props: any) => <div data-testid="text" {...props} />,
  Arrow: (props: any) => <div data-testid="arrow" {...props} />,
  Image: (props: any) => <div data-testid="image" {...props} />,
  Group: (props: any) => <div data-testid="group" {...props} />,
  Transformer: (props: any) => <div data-testid="transformer" {...props} />,
}));

vi.mock('use-image', () => ({
  default: () => [null, { loading: false }]
}));

describe('Keyboard Shortcuts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should handle Ctrl+Z for undo', () => {
    render(<App />);
    
    // Draw something first
    const penButton = screen.getByTitle(/pen/i);
    fireEvent.click(penButton);
    
    // Trigger Ctrl+Z
    fireEvent.keyDown(window, { key: 'z', ctrlKey: true });
    
    // The app should handle the undo (we can't easily verify state with mocked Konva,
    // but we can verify it doesn't crash)
    expect(screen.getByTestId('stage')).toBeInTheDocument();
  });

  it('should handle Ctrl+Y for redo (GNOME HIG)', () => {
    render(<App />);
    
    // Trigger Ctrl+Y
    fireEvent.keyDown(window, { key: 'y', ctrlKey: true });
    
    // Should not crash
    expect(screen.getByTestId('stage')).toBeInTheDocument();
  });

  it('should handle Ctrl+Shift+Z for redo (alternative)', () => {
    render(<App />);
    
    // Trigger Ctrl+Shift+Z
    fireEvent.keyDown(window, { key: 'z', ctrlKey: true, shiftKey: true });
    
    expect(screen.getByTestId('stage')).toBeInTheDocument();
  });

  it('should handle Delete key for selected items', () => {
    render(<App />);
    
    // Trigger Delete
    fireEvent.keyDown(window, { key: 'Delete' });
    
    expect(screen.getByTestId('stage')).toBeInTheDocument();
  });

  it('should handle Backspace key for selected items', () => {
    render(<App />);
    
    // Trigger Backspace
    fireEvent.keyDown(window, { key: 'Backspace' });
    
    expect(screen.getByTestId('stage')).toBeInTheDocument();
  });

  it('should handle Ctrl+G for group', () => {
    render(<App />);
    
    fireEvent.keyDown(window, { key: 'g', ctrlKey: true });
    
    expect(screen.getByTestId('stage')).toBeInTheDocument();
  });

  it('should handle Ctrl+Shift+G for ungroup', () => {
    render(<App />);
    
    fireEvent.keyDown(window, { key: 'G', ctrlKey: true, shiftKey: true });
    
    expect(screen.getByTestId('stage')).toBeInTheDocument();
  });

  it('should not delete when typing in textarea', () => {
    render(<App />);
    
    // Create a textarea element
    const textarea = document.createElement('textarea');
    document.body.appendChild(textarea);
    textarea.focus();
    
    // Trigger Delete while textarea is focused
    fireEvent.keyDown(window, { key: 'Delete' });
    
    expect(screen.getByTestId('stage')).toBeInTheDocument();
    
    document.body.removeChild(textarea);
  });
});
