import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { handleError } from '../error-handler';

describe('Error Handler', () => {
  let alertSpy: any;

  beforeEach(() => {
    alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
  });

  afterEach(() => {
    alertSpy.mockRestore();
  });

  it('should display alert with context and error message for Error objects', () => {
    const error = new Error('Test error message');
    handleError('Test context', error);

    expect(alertSpy).toHaveBeenCalledWith('Test context: Test error message');
  });

  it('should display alert with context and unknown error for non-Error objects', () => {
    handleError('Test context', 'string error');

    expect(alertSpy).toHaveBeenCalledWith('Test context: Unknown error');
  });

  it('should handle null error', () => {
    handleError('Test context', null);

    expect(alertSpy).toHaveBeenCalledWith('Test context: Unknown error');
  });

  it('should handle undefined error', () => {
    handleError('Test context', undefined);

    expect(alertSpy).toHaveBeenCalledWith('Test context: Unknown error');
  });

  it('should handle error with custom properties', () => {
    const customError = { message: 'Custom error' };
    handleError('Test context', customError);

    expect(alertSpy).toHaveBeenCalledWith('Test context: Unknown error');
  });
});
