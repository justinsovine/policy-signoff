// Reads any cookie by name and URL-decodes it
function getCookie(name: string): string | null {
    // Matches `XSRF-TOKEN=somevalue` and captures `somevalue` in group 2
    const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
    
    // decodeURIComponent() decodes `%3D` back to `=` etc.
    return match ? decodeURIComponent(match[2]) : null;
}

// Shape of errors thrown by api() — callers can cast caught errors to this
export interface ApiError {
  status: number;
  [key: string]: unknown; // any extra fields from the error response body
}

// API fetch wrapper using generic type
// Handles Sanctum auth boilerplate for every request
export async function api<T>(method: string, path: string, body?: unknown): Promise<T> {
  // Request headers required for every API request
  const headers: Record<string, string> = {
    'Accept': 'application/json',
    'X-XSRF-TOKEN': getCookie('XSRF-TOKEN') ?? '',
  };

  // Only set Content-Type when there's a body (GET requests don't have one)
  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }

  // Gets URL from .env and tacks on path
  const url = `${import.meta.env.VITE_API_URL}${path}`;
  
  // Make the HTTP request with session cookie and CSRF token
  const response = await fetch(url, {
    method,
    credentials: 'include',  // Tells the browser to send the session cookie automatically
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  // Checks if response was successful (between 200-299)
  if (!response.ok) {
    // Some error responses (e.g. 401) may not have a JSON body; .catch() returns {} so we always have an object
    const body = await response.json().catch(() => ({}));
    // Callers can inspect the status code to distinguish auth errors (401) from validation (422) from server errors (500+)
    throw { status: response.status, ...body };
  }

  // Return early on empty responses
  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}