# Centers / Courses / Olympiads / Reels – System Overview

This document describes the production-ready structure for Centers, Courses, Olympiads, and Reels: status flow, permissions, and database usage.

---

## 1. CENTERS MODULE

### Center record (`educational_centers`)

- **Fields**: name, description, logo_url, banner_url, address/city, contact (email, phone, website), owner_id (→ auth.users), status.
- **Status**: `pending` | `approved` | `rejected` | `active` | `suspended`
  - `pending`: Awaiting admin approval.
  - `approved`: Approved; may require tariff selection before `active`.
  - `active`: Full access (after tariff approval where applicable).
  - `rejected` / `suspended`: Access restricted; rejection_reason stored.

### Center permissions

- **Can**: Create/edit/delete own courses, tests, olympiads, reels (within plan limits); view analytics of their content.
- **Cannot**: Publish content directly; content goes through approval. Edit of already approved content requires resubmission (draft → submit → admin review).

### Center dashboard

- Total students (unique enrollments), active courses/tests/olympiads, total enrollments, reels count.
- Performance graph (last 14 days): enrollments, test completions, video views (from `center_analytics` when populated).

---

## 2. COURSES MODULE

### Structure

- **Course** → **Modules** (`course_modules`) → **Lessons** (`lessons`).
- Lessons may have `module_id` (optional) or legacy `section_title` for grouping.

### Course fields

- Title, description, subject_id, level (grade/difficulty), thumbnail_url, tags, duration_minutes, status.
- **Approval status**: `draft` | `pending_approval` | `approved` | `published` | `rejected`
  - Only `published` courses are visible to students in catalog/feed.

### Features

- CRUD by center; add modules and lessons; reorder (order_index).
- Preview mode (center sees draft); enrollment and progress tracking (`course_enrollments`, `lesson_progress`).
- Certificate support is future-ready (schema can be extended).

### Course player (user side)

- Sidebar with modules/lessons, video player, progress auto-save, mark complete, resume.

---

## 3. OLYMPIADS MODULE

### Olympiad fields

- Title, description, subject_id, grade, registration_deadline, start_date, end_date, duration, total questions, status.
- **Visibility**: public, private (invite/entry_code), center-specific (center_id).

### Features

- Question types: MCQ, True/False, Short Answer (via `questions` / test infrastructure where shared).
- Timer, auto-submit when time ends, basic anti-cheat (e.g. no copy/paste), leaderboard, ranking, score calculation, participation tracking (`olympiad_registrations`).

### Status

- Same approval flow as courses/tests: draft → submit → admin review → approved/rejected; then published for visibility.

---

## 4. REELS MODULE (Educational Shorts)

### Center side

- Upload short video; title, description, subject tag, grade (grades[]), thumbnail, status.
- Approval flow: draft → submit → admin review → approved → published.

### User side

- Vertical scroll feed, like system, view counter, save option; structure ready for algorithm/ranking.

---

## 5. STATUS & APPROVAL SYSTEM

All content (courses, tests, olympiads, reels) follows:

1. **Draft** – Center creates and edits.
2. **Submitted** – Center submits for review (`pending_approval` or equivalent).
3. **Admin review** – Admin approves or rejects (with optional rejection_reason).
4. **Approved** – Content approved; may be set to **published** for public visibility.
5. **Published** – Visible in catalog/feed to users.
6. **Rejected** – Center can edit and resubmit.
7. **Suspended** – Admin can suspend already published content.

- Centers **cannot** publish directly; publishing is gated by admin approval (and optionally by center status/tariff).

---

## 6. ANALYTICS

- **Tracked**: Course enrollments, course completion rate, test attempts, olympiad participation, reel views, engagement.
- **Tables**: `center_analytics` (per-day aggregates: enrollments, test_completions, video_views, etc.), plus event-level tables (enrollments, test_attempts, etc.).
- **Dashboards**: Admin (platform-wide) and Center (own content only).

---

## 7. DATABASE (Core tables)

- **Users**: auth.users; profiles (role, display_name, etc.).
- **Centers**: educational_centers (owner_id → auth.users).
- **Courses**: courses (center_id); course_modules; lessons (course_id, module_id optional).
- **Enrollments**: course_enrollments (course_id, user_id, center_id denormalized for center dashboard).
- **Tests**: tests (center_id); questions; test_attempts.
- **Olympiads**: olympiads (center_id); olympiad_registrations; olympiad_certificates.
- **Reels**: center_reels (center_id, subject_id, grades[]).
- **Approvals / activity**: Content tables carry approval_status, approved_at, approved_by, rejection_reason; activity_logs (or equivalent) for audit.

All linked with foreign keys; RLS enforces center ownership and admin role for approval actions.
