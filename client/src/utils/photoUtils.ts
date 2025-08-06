/**
 * Utility function to get the full photo URL with proper API base URL
 * @param photoUrl - The photo URL from the database (could be relative or full)
 * @returns Full photo URL with cache-busting, or undefined if no photo
 */
export const getFullPhotoUrl = (photoUrl: string | undefined): string | undefined => {
  if (!photoUrl) return undefined;
  
  // If it's already a full URL (starts with http), return as-is with cache-busting
  if (photoUrl.startsWith('http')) {
    const separator = photoUrl.includes('?') ? '&' : '?';
    return `${photoUrl}${separator}t=${Date.now()}`;
  }
  
  // If it's a relative path, prepend the API base URL
  // Use REACT_APP_API_URL (not REACT_APP_API_BASE_URL) to match other components
  const apiBaseUrl = process.env.REACT_APP_API_URL || 'http://localhost:5001';
  const separator = photoUrl.includes('?') ? '&' : '?';
  return `${apiBaseUrl}${photoUrl}${separator}t=${Date.now()}`;
};
