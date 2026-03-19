# Platform audit – fixes and verification checklist

This document summarizes the **full system audit** and the changes made. Use it to verify that auth, routing, onboarding, and panels work end-to-end.

---

## 1. Authentication and login

### Implemented / verified
- **Auth flow**: `useAuth` provides `user`, `session`, `loading`, `signUp`, `signIn`, `signOut`.
- **Role detection**: `useUserRole()` loads role from:
  1. `profiles.role` (admin, center, user)
  2. If profile.role is `user`, checks `educational_centers` for `owner_id` → then returns `center` if found
  3. Fallback: `user_roles` table via `get_user_role` RPC
  4. Fallback: `VITE_SUPER_ADMIN_EMAIL` (exact match) → admin
- **Role in app state**: Role is held in React Query cache (`['user-role', user?.id]`). No separate global “role” state; components use `useUserRole()` or `useIsAdmin()` / `useIsCenter()`.
- **Blocked users**: `signIn` checks `profiles.blocked_at` and returns an error if set.

### What you should do
- Set **`VITE_SUPER_ADMIN_EMAIL`** in `.env` to the admin email, or ensure that user has `profiles.role = 'admin'` or a row in `user_roles` with `role = 'admin'`.
- Ensure **`handle_new_user`** trigger (and optional **`create_center_for_signup`** RPC) are applied in Supabase so signup creates `profiles` and `user_roles` / `educational_centers` as expected.

---

## 2. Role-based routing

### Redirect rules (implemented)
- **admin** → `/admin`
- **center** → `/center/dashboard` (or `/center-panel`; alias in place)
- **user** → `/dashboard`

### Route protection
- **AdminRoute**: `allowedRoles = ['admin']`, `redirectTo = '/admin-login'`.
- **CenterRoute**: `allowedRoles = ['center']`.
- **UserRoute**: `allowedRoles = ['user']`.
- **UserOrCenterRoute**: `allowedRoles = ['user', 'center']` (e.g. tests, courses, olympiads).

When a user hits a route they’re not allowed to access, `ProtectedRoute` redirects:
- admin → `/admin`
- center → `/center/dashboard`
- otherwise → `/dashboard`

### Additional routes added
- **`/login`** → redirects to **`/auth`**.
- **`/admin/dashboard`** → same as `/admin` (dashboard).
- **`/admin/olympiads`** → admin Olympiads management page.

---

## 3. Database schema (reference)

The app expects at least these concepts. Table names in code may differ slightly (e.g. `educational_centers` vs “centers”):

| Concept        | Typical table / usage in code      |
|----------------|-------------------------------------|
| Profiles       | `profiles` (id, user_id, role, onboarding_completed, …) |
| Centers        | `educational_centers` (owner_id → auth.users.id) |
| Courses        | `courses` (center_id → educational_centers) |
| Tests          | `tests` (center_id)                |
| Test questions | `questions` or `test_questions`    |
| Olympiads      | `olympiads` (center_id)            |
| Reels          | `center_reels` or similar          |
| Enrollments    | `course_enrollments`               |
| Test attempts  | `test_attempts`                    |
| Notifications  | Depends on implementation          |

- **profiles.id / user_id** should align with **auth.users.id** (and trigger creates profile on signup).
- **educational_centers.owner_id** → **auth.users.id**.

If any table is missing, create it via Supabase migrations and match the types used in `src/integrations/supabase/types.ts` (or the hooks that query them).

---

## 4. Onboarding flows

### User (student) onboarding
- **Path**: `/onboarding/user`.
- **Data**: grade, school, interests, goals (and other fields in `StudentOnboarding`).
- **Save**: `profiles` upsert with `onboarding_completed: true`, `role: 'user'`.
- **After complete**: redirect to `/dashboard`.

### Center onboarding
- **Path**: `/onboarding/center`.
- **Data**: center name, description, subjects, grades, teachers, location, etc. (see `CenterOnboardingData`).
- **Save**: `educational_centers` insert/update with `onboarding_completed: true`; `profiles` upsert with `role: 'center'`, `onboarding_completed: true`.
- **After complete**: redirect to `/center/dashboard` (or `/center-panel`).

### Logic
- **Auth page**: When a logged-in user lands on `/auth`, they are redirected by role and onboarding status (admin → `/admin`, center → center onboarding or dashboard, user → user onboarding or `/dashboard`).
- **ProtectedRoute**: If role is user and `!profile?.onboarding_completed`, redirect to `/onboarding/user` (or `/onboarding/center` for center owners when `ownsCenter` is true).

---

## 5. Admin panel

### Routes (all under `AdminRoute`)
- `/admin` → dashboard (full `AdminPanel` with tabs).
- `/admin/dashboard` → same dashboard.
- `/admin/users` → `UsersManagement`.
- `/admin/centers` → `CentersManagement`.
- `/admin/courses` → `CoursesManagement`.
- `/admin/olympiads` → `OlympiadsManagement`.

### Fixes applied
- **Trophy** icon import added in `AdminPanel.tsx` (was causing “Trophy is not defined” and blank screen).
- **AdminOlympiadsPage** and **Olympiads** nav link added in `AdminLayout`.
- **AdminDashboard** wraps `AdminPanel` in an **error boundary** so a runtime error shows a message instead of a blank screen.

### Capabilities (to be verified in UI)
- View users, centers, courses, olympiads.
- Edit profiles, approve centers, approve olympiads, delete records (implemented in admin hooks/components; RLS and DB must allow it).

---

## 6. Center panel

### Routes (all under `CenterRoute`)
- `/center-panel` (and `/center`, `/center/dashboard` redirects) → `CenterPanelLayout` with:
  - index → CenterDashboard
  - courses, tests, olympiads, reels, profile, analytics, seo

Center-specific create/edit flows (courses, tests, olympiads, reels) depend on Supabase RLS and correct table structure. If something fails, check browser console and network tab for 4xx/5xx and RLS errors.

---

## 7. Test system, Olympiads, Courses

- **Tests**: Visibility and “fully created” state should be enforced in the API (e.g. only publish when questions exist). Front-end uses `useTests` and related hooks; ensure they filter by `is_published` or equivalent if required.
- **Olympiads**: Centers create olympiads; admin approves (e.g. status or approval flag). Approval flow and leaderboard depend on your schema and hooks.
- **Courses**: Centers create courses and lessons; users enroll and track progress. Again, RLS and table structure must match the hooks (e.g. `useCourses`, enrollments, progress).

No structural changes were made in this audit for tests/olympiads/courses; only routing and admin/center layout and role checks were aligned.

---

## 8. Performance and UI

- **Loading states**: `ProtectedRoute` and `Auth` show a spinner while auth/role (and optionally profile) are loading. Admin panel uses skeletons and loading flags.
- **Empty states**: Individual components (e.g. `UsersManagement`, `CentersManagement`) may define their own empty states; add them where you see “no data” with no message.
- **Vite**: `server.open: '/auth'` so the dev server opens the auth page and not a cached `/admin` that might error.

---

## 9. Local development

### Checklist
- **Env**: `.env` (or `.env.local`) with `VITE_SUPER_ADMIN_EMAIL` and Supabase `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
- **Run**: `npm run dev` → app at `http://localhost:8080` (or `VITE_DEV_PORT`).
- **Main URLs**:
  - `/` or `/dashboard` → user feed (if role = user and onboarding done).
  - `/auth` or `/login` → login/signup.
  - `/admin-login` → admin login → then redirect to `/admin`.
  - `/admin` → admin dashboard (and `/admin/users`, `/admin/centers`, `/admin/courses`, `/admin/olympiads`).
  - `/center-panel` → center dashboard (after center login and onboarding).

---

## 10. Expected result (after your verification)

- **Auth**: Signup and login work; role is resolved from profile / user_roles / super admin email.
- **Routing**: admin → `/admin`, center → `/center/dashboard`, user → `/dashboard`; protected routes redirect correctly.
- **Onboarding**: User and center onboarding save to `profiles` and `educational_centers` and set `onboarding_completed`; redirect after completion works.
- **Admin panel**: All admin routes load; no blank screen; Trophy and other icons render; error boundary shows a message if something throws.
- **Center panel**: Center can open dashboard and sub-routes; create/edit flows work if DB and RLS are correct.
- **DB**: All required tables exist and match the code (and migrations are applied). Fix any RLS or missing columns as errors appear.

If something still fails (e.g. infinite loading, wrong redirect, or “table/column does not exist”), use the browser console and network tab and fix the reported error or RLS policy next.
