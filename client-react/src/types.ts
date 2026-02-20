export interface User {
  id: number;
  name: string;
  email: string
}

export interface Policy {
  id: number;
  title: string;
  due_date: string;   // ISO date string, e.g. "2026-03-01"
  created_by: string; // Creator's full name
  has_file: boolean;
  signed: boolean;    // Has the current user signed?
  overdue: boolean;   // Not signed AND past due_date
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

export interface SignoffEntry {
  user: string; // Full name
  signed_at: string | null;
  overdue: boolean;
}

// The `errors` field from a `422 Unprocessable Content` response
// Example: { email: ['The email has already been taken.'] }
export type ValidationErrors = Record<string,string[]>;