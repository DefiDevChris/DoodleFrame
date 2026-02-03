import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import App from '../App';

// Mock Konva and react-konva
vi.mock('react-konva', () => ({
  Stage: ({ children }: any) => <div data-testid="stage">{children}</div>,
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

// Mock window.electronAPI
const mockOnMenuExport = vi.fn();
const mockOnMenuClear = vi.fn();
const mockOnMenuUndo = vi.fn();
const mockOnMenuRedo = vi.fn();
const mockOnMenuDelete = vi.fn();
const mockOnMenuPaste = vi.fn();
const mockOnMenuNew = vi.fn();
const mockOnMenuOpen = vi.fn();
const mockOnMenuSave = vi.fn();
const mockOnMenuSaveAs = vi.fn();
const mockOnMenuSaveAndClose = vi.fn();
const mockSetDocumentDirty = vi.fn();
const mockSaveCompleted = vi.fn();
const mockSaveCancelled = vi.fn();
const mockRemoveAllListeners = vi.fn();

describe('IPC Menu Events', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup window.electronAPI mock
    (window as any).electronAPI = {
      onMenuExport: mockOnMenuExport,
      onMenuClear: mockOnMenuClear,
      onMenuUndo: mockOnMenuUndo,
      onMenuRedo: mockOnMenuRedo,
      onMenuDelete: mockOnMenuDelete,
      onMenuPaste: mockOnMenuPaste,
      onMenuNew: mockOnMenuNew,
      onMenuOpen: mockOnMenuOpen,
      onMenuSave: mockOnMenuSave,
      onMenuSaveAs: mockOnMenuSaveAs,
      onMenuSaveAndClose: mockOnMenuSaveAndClose,
      setDocumentDirty: mockSetDocumentDirty,
      saveCompleted: mockSaveCompleted,
      saveCancelled: mockSaveCancelled,
      removeAllListeners: mockRemoveAllListeners,
    };
  });

  afterEach(() => {
    delete (window as any).electronAPI;
  });

  it('should register all menu event listeners when electronAPI is available', () => {
    render(<App />);
    
    expect(mockOnMenuExport).toHaveBeenCalled();
    expect(mockOnMenuClear).toHaveBeenCalled();
    expect(mockOnMenuUndo).toHaveBeenCalled();
    expect(mockOnMenuRedo).toHaveBeenCalled();
    expect(mockOnMenuDelete).toHaveBeenCalled();
    expect(mockOnMenuPaste).toHaveBeenCalled();
    expect(mockOnMenuNew).toHaveBeenCalled();
    expect(mockOnMenuOpen).toHaveBeenCalled();
    expect(mockOnMenuSave).toHaveBeenCalled();
    expect(mockOnMenuSaveAs).toHaveBeenCalled();
    expect(mockOnMenuSaveAndClose).toHaveBeenCalled();
  });

  it('should not throw when electronAPI is not available', () => {
    delete (window as any).electronAPI;
    
    // Should render without errors
    expect(() => render(<App />)).not.toThrow();
  });

  it('should handle menu-export event', () => {
    render(<App />);

    // Get the callback registered for onMenuExport
    const exportCallback = mockOnMenuExport.mock.calls[0][0];

    // Call the callback (should not throw)
    expect(() => act(() => exportCallback())).not.toThrow();
  });

  it('should handle menu-clear event', () => {
    // Mock window.confirm to return true
    const originalConfirm = window.confirm;
    window.confirm = vi.fn(() => true);

    render(<App />);

    // Get the callback registered for onMenuClear
    const clearCallback = mockOnMenuClear.mock.calls[0][0];

    // Call the callback (should not throw)
    expect(() => act(() => clearCallback())).not.toThrow();

    window.confirm = originalConfirm;
  });

  it('should handle menu-undo event', () => {
    render(<App />);

    // Get the callback registered for onMenuUndo
    const undoCallback = mockOnMenuUndo.mock.calls[0][0];

    // Call the callback (should not throw)
    expect(() => act(() => undoCallback())).not.toThrow();
  });

  it('should handle menu-redo event', () => {
    render(<App />);

    // Get the callback registered for onMenuRedo
    const redoCallback = mockOnMenuRedo.mock.calls[0][0];

    // Call the callback (should not throw)
    expect(() => act(() => redoCallback())).not.toThrow();
  });

  it('should handle menu-delete event', () => {
    render(<App />);

    // Get the callback registered for onMenuDelete
    const deleteCallback = mockOnMenuDelete.mock.calls[0][0];

    // Call the callback (should not throw)
    expect(() => act(() => deleteCallback())).not.toThrow();
  });

  it('should clean up listeners on unmount', () => {
    const { unmount } = render(<App />);
    
    unmount();
    
    // Should have called removeAllListeners for each channel
    expect(mockRemoveAllListeners).toHaveBeenCalledWith('menu-export');
    expect(mockRemoveAllListeners).toHaveBeenCalledWith('menu-clear');
    expect(mockRemoveAllListeners).toHaveBeenCalledWith('menu-undo');
    expect(mockRemoveAllListeners).toHaveBeenCalledWith('menu-redo');
    expect(mockRemoveAllListeners).toHaveBeenCalledWith('menu-delete');
    expect(mockRemoveAllListeners).toHaveBeenCalledWith('menu-paste');
    expect(mockRemoveAllListeners).toHaveBeenCalledWith('menu-new');
    expect(mockRemoveAllListeners).toHaveBeenCalledWith('menu-open');
    expect(mockRemoveAllListeners).toHaveBeenCalledWith('menu-save');
    expect(mockRemoveAllListeners).toHaveBeenCalledWith('menu-save-as');
    expect(mockRemoveAllListeners).toHaveBeenCalledWith('menu-save-and-close');
  });
});
