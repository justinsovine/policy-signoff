// Authenticated user returned by /user
export interface User {
  id: number;
  name: string;
  email: string
}

// Policy list item returned by GET /policies
export interface Policy {
  id: number;
  title: string;
  due_date: string;   // ISO date string, e.g. "2026-03-01"
  created_by: string; // Creator's full name
  has_file: boolean;
  signed: boolean;    // Has the current user signed?
  overdue: boolean;   // Not signed AND past due_date
}

// Full policy data including description and sign-off list
export interface PolicyDetail extends Policy {
  description: string;
  file_name?: string;
  signoff_summary: {
    total_users: number;
    signed_count: number;
    signoffs: SignoffEntry[];
  };
}

// A single user's sign-off status within a PolicyDetail
export interface SignoffEntry {
  user: string; // Full name
  signed_at: string | null;
  overdue: boolean;
}

// The `errors` field from a `422 Unprocessable Content` response
// Example: { email: ['The email has already been taken.'] }
export type ValidationErrors = Record<string,string[]>;

// Quote displayed on the auth pages
export interface Quote {
  quote: string,                                             
  initials: string,                                            
  name: string,
  title: string,
}