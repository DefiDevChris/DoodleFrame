export const handleError = (context: string, error: unknown): void => {
  const message = error instanceof Error ? error.message : 'Unknown error';
  alert(`${context}: ${message}`);
};
