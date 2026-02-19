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