/**
 * API Configuration
 * Automatically detects the API base URL based on the current environment
 */
export function getApiBase(): string {
  const hostname = window.location.hostname;
  
  // Development - backend is on localhost:5000
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'http://localhost:5000';
  }
  
  // Production - use same origin (backend serves frontend from same domain)
  // Or you can set a custom API URL via window variable
  if ((window as any).__API_BASE__) {
    return (window as any).__API_BASE__;
  }
  
  return window.location.origin;
}

export const API_BASE = getApiBase();

