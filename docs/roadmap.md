# Roadmap

Ideas for continuing to grow PolicySignoff beyond the current portfolio scope.

## FastAPI rewrite

The current Laravel API was AI-generated. A from-scratch FastAPI rewrite would produce a backend that's actually understood and defensible. Python is more broadly marketable than PHP, and FastAPI's design — type hints throughout, Pydantic for validation, auto-generated OpenAPI docs — maps well to the TypeScript/Zod mental model on the frontend.

The existing `docs/api-spec.md` serves as the implementation contract, so the rewrite is focused on learning the stack rather than redesigning the system. Key decisions to make:

- **Auth** — Sanctum is Laravel-specific; the rewrite would need a deliberate choice (JWT or session-based) that may require updating `api.ts` and the CSRF handling in each frontend client
- **ORM** — SQLAlchemy + Alembic for models and migrations
- **File storage** — MinIO/S3 via boto3; presigned URL logic stays the same
- **422 error shape** — FastAPI's default validation error format differs from Laravel's; normalize it to match what the frontends expect or update the frontends

## Policy versioning and re-attestation

The most architecturally interesting feature. When a policy's content changes, existing signatures are no longer valid — users attested to the original text, not the updated one. A versioning system would:

- Store each edit as a new policy version, preserving the full history
- Invalidate signatures on content changes (deadline-only edits could be exempt)
- Prompt affected users to re-sign
- Maintain an audit trail: who signed which version, when

This is real compliance software behavior and would make a good case study write-up.

## Notifications

- Email users when a new policy is published or assigned
- Deadline reminders as the due date approaches
- Re-attestation requests when a policy is updated
- Requires a queue worker and a mail provider (already partially in place with Laravel's queue setup)

## Roles and permissions

Currently any authenticated user can create policies. A proper role system would separate:

- **Admin** — create, edit, and archive policies; view full compliance reports
- **Member** — sign off on policies assigned to them

Could be as simple as an `is_admin` boolean on the users table to start.

## Multi-tenancy

Allow different organizations to use the same instance with full data isolation. Each organization manages its own users and policies. Significant architectural change — worth designing from scratch rather than bolting on.

## Reporting and exports

- Compliance dashboard: overall sign-off rates, overdue counts, per-policy breakdowns
- CSV/PDF export of sign-off status for audits
- Per-user history: which policies has this person signed, which are outstanding

## Policy assignment

Currently all registered users sign every policy. A more realistic model would let admins target specific users or groups (departments, teams) per policy.

## Archive and lifecycle

- Soft-delete / archive policies that are no longer active
- Policy expiry — automatically mark policies as expired after a date
- Keep historical records intact for audit purposes

## Runtime validation with Zod

Currently the frontends trust API responses to match the TypeScript types — there's no runtime check. Zod would let you define schemas that double as both the runtime validator and the TypeScript type source, so a mismatched API response fails loudly instead of silently passing bad data into the UI. Natural fit alongside the FastAPI rewrite, since both push toward treating the API contract as the source of truth.

## API-first / webhooks

Expose webhooks so external systems (Slack, HRIS tools) can react to sign-off events. Useful if this ever becomes an integration target rather than a standalone app.
