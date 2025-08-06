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
  
  // Get API base URL with multiple fallback strategies
  let apiBaseUrl = process.env.REACT_APP_API_URL;
  
  // If no environment variable, try to detect production vs development
  if (!apiBaseUrl) {
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      // Development environment
      apiBaseUrl = 'http://localhost:5001';
    } else {
      // Production environment - use Railway API
      apiBaseUrl = 'https://alle.up.railway.app';
    }
  }
  
  const separator = photoUrl.includes('?') ? '&' : '?';
  return `${apiBaseUrl}${photoUrl}${separator}t=${Date.now()}`;
};
