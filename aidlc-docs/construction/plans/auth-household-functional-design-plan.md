# Unit 1: Auth & Household — Functional Design Plan

## Unit Context

**Unit**: Auth & Household (Unit 1)
**Scope**: User registration (full name), login, sessions, household create/join/invite/manage, multi-household membership
**Stories**: US-01, US-02, US-03, US-04, US-05, US-06, US-27, US-28
**Dependencies**: Unit 0 (Foundation) — DB schema, core middleware, error classes

---

## Design Steps

- [x] Define auth domain entities and relationships (user, session, household, user_household, invite)
- [x] Define registration business rules (password policy, email uniqueness, breached password check, full name validation)
- [x] Define login business rules (credential verification, brute-force protection, session creation)
- [x] Define session management rules (cookie attributes, expiry, refresh, invalidation)
- [x] Define household creation business logic (auto-owner, default category seeding)
- [x] Define invite generation business logic (token format, code format, expiry, owner-only gate)
- [x] Define join-by-link and join-by-code business logic (validation, duplicate prevention, expired handling)
- [x] Define member management rules (list members, remove member, owner self-removal prevention)
- [x] Define API route contracts for all 11 auth endpoints (input schemas, response shapes, status codes)
- [x] Define frontend component structure for web and mobile (auth screens, household screens, switcher)

---

## Questions

### Q1: Breached Password Check Strategy

The stories require breached password checking (SECURITY-12). Which approach do you prefer?

A) Call the HaveIBeenPwned API (k-anonymity model — send first 5 chars of SHA-1 hash, check response locally)
B) Maintain a local blocklist of common passwords (e.g., top 10K) — no external dependency
C) Skip breached password checking for now, enforce minimum length + complexity only

[Answer]: C

### Q2: Session Duration and Refresh

How long should sessions last, and should they auto-extend?

A) 30-day session, no auto-extend — user re-logs after 30 days
B) 7-day session, auto-extends on each API request (sliding window)
C) 24-hour session, auto-extends on each API request
D) Other (specify)

[Answer]: A

### Q3: Household Creation on Registration

Should a household be automatically created when a user registers, or should they go through an explicit onboarding step?

A) Auto-create a "My Household" on registration — user can rename later
B) Onboarding screen after registration: choose "Create household" or "Join household"
C) No household — user lands on a household-less state and must create or join from settings

[Answer]: B

### Q4: Invite Code Format

The invite code needs to be short enough to share verbally. What format?

A) 6-character alphanumeric (e.g., `A3F7K2`) — ~2.2 billion combinations
B) 8-character alphanumeric (e.g., `A3F7K2B9`) — more entropy
C) 6-digit numeric (e.g., `483021`) — easiest to say verbally, 1M combinations
D) Other (specify)

[Answer]: A

### Q5: Multiple Household Switching UX

When a user belongs to multiple households, how should switching work?

A) Dropdown/selector in the app header — always visible
B) Dedicated "Switch Household" screen accessible from settings/menu
C) Both — dropdown for quick switching + full screen in settings
D) Other (specify)

[Answer]: A

### Q6: Password Complexity Requirements

Beyond the minimum 8 characters, should additional complexity rules be enforced?

A) Length only — minimum 8 characters (let breached-password check handle weak passwords)
B) Length + at least 1 number and 1 special character
C) Length + at least 1 uppercase, 1 lowercase, 1 number
D) Use zxcvbn-style strength estimation (reject passwords below "fair" score)

[Answer]: D

### Q7: Account Recovery / Forgot Password

Should this unit include forgot-password / password reset flow?

A) Yes — email-based password reset (requires email sending capability)
B) No — defer to a later unit or post-MVP
C) Yes — but implement a simple token-based flow without actual email sending (log reset links to console for dev)

[Answer]: A

### Q8: What Happens When a Removed Member Has Active Session?

When the owner removes a member, should their existing sessions be immediately invalidated?

A) Yes — immediately invalidate all sessions for the removed user in that household
B) No — their session continues until it expires, but API requests will fail household validation
C) Invalidate sessions only for that household context (if they have other households, those sessions remain)

[Answer]: Sessions should not be tied to households at all.
