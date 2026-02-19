// Reads any cookie by name and URL-decodes it
function getCookie(name: string): string | null {
    // Matches `XSRF-TOKEN=somevalue` and captures `somevalue` in group 2
    const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
    
    // decodeURIComponent() decodes `%3D` back to `=` etc.
    return match ? decodeURIComponent(match[2]) : null;
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
    // Otherwise throw an error with the parsed JSON body
    throw await response.json();
  }

  return response.json() as Promise<T>;
}

// ---- TYPES --------------------------------------------------------------------

export interface User {
  id: number;
  name: string;
  email: string
}

// The `errors` field from a `422 Unprocessable Content` response
// Example: { email: ['The email has already been taken.'] }
export type ValidationErrors = Record<string,string[]>;

export interface Policy {
  id: number;
  title: string;
  due_date: string;   // ISO date string, e.g. "2026-03-01"
  created_by: string; // creator's full name
  has_file: boolean;
  signed: boolean;    // has the current user signed?
  overdue: boolean;   // not signed AND past due_date
}

export interface SignoffEntry {
  user: string; // full name
  signed_at: string | null;
  overdue: boolean;
}

export interface PolicyDetail extends Policy {
  description: string;
  file_name?: string;
  signoff_summary: {
    total_users: number;
    signed_count: number;
    signoffs: SignoffEntry[];
  };
}