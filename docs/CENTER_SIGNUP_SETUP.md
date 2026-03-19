# Detailed Instructions: Center Signup & Auth Setup

This guide walks you through fixing **"Center setup failed"** and **"Could not find the function create_center_for_signup"** errors, and ensures center users are redirected to center onboarding correctly.

---

## 1. Create the `create_center_for_signup` function (fixes "Center setup failed")

The app uses a database function to create a center during signup. If this function is missing, you get **"Could not find the function public.create_center_for_signup(...) in the schema cache"**.

### Steps

1. **Open Supabase Dashboard**
   - Go to [https://supabase.com/dashboard](https://supabase.com/dashboard) and sign in.
   - Select your project (the one used by this app).

2. **Open the SQL Editor**
   - In the left sidebar, click **SQL Editor**.

3. **Run the function script**
   - Click **New query** (or the **+** button).
   - Open this file in your project: **`supabase/run_create_center_for_signup.sql`**.
   - Copy **all** of its contents (from `CREATE OR REPLACE FUNCTION` through the final `GRANT EXECUTE` line).
   - Paste into the SQL Editor.
   - Click **Run** (or press Cmd/Ctrl + Enter).

4. **Check the result**
   - You should see a green success message, e.g. **"Success. No rows returned"**.
   - If you see an error (e.g. missing table or type), note the message and see **Troubleshooting** below.

5. **Retry center signup**
   - In your app, try signing up again as a **Center** (with center name and email).
   - The "Center setup failed" / "Could not find the function" error should be gone.

---

## 2. (Optional) Fix user_roles on signup (trigger)

If you also see **"new row violates row-level security policy for table user_roles"** during signup, the trigger that sets the user role on account creation may be missing or outdated.

### Steps

1. In Supabase Dashboard → **SQL Editor**, open a **New query**.

2. Copy and run the contents of this migration file from your project:
   - **`supabase/migrations/20260308100000_user_roles_insert_via_trigger.sql`**

   That script updates `handle_new_user()` so it:
   - Reads `app_role` from signup metadata (`'user'` or `'center'`).
   - Inserts into `profiles` and `user_roles` with that role.

3. Run the query. If it succeeds, new signups will get the correct role without hitting RLS on `user_roles`.

---

## 3. Apply all migrations (alternative to running scripts by hand)

If you prefer to apply everything via migrations instead of copying SQL:

1. **Install Supabase CLI** (if needed):
   ```bash
   npm install -g supabase
   ```

2. **Log in and link the project**:
   ```bash
   supabase login
   supabase link --project-ref YOUR_PROJECT_REF
   ```
   Replace `YOUR_PROJECT_REF` with your project reference (from Dashboard → Project Settings → General).

3. **Push migrations**:
   ```bash
   supabase db push
   ```
   This applies all pending migrations, including the one that creates `create_center_for_signup` and the trigger update.

4. If you already ran the standalone script in step 1, that’s fine; the migration will `CREATE OR REPLACE` the same function.

---

## 4. Verify the setup

- **Center signup**
  - Sign up as **Center** with email, password, and center name.
  - You should see a success message and then be redirected to sign in (or to center onboarding if the app keeps you logged in).
- **Center onboarding**
  - After signing in as a center, you should land on **`/onboarding/center`** (or `/center/dashboard` if onboarding is already done), not on `/onboarding/user`.

---

## 5. Troubleshooting

### "Could not find the function ... in the schema cache"
- The function was not created in the database, or the schema cache hasn’t refreshed.
- **Fix:** Run **`supabase/run_create_center_for_signup.sql`** in the SQL Editor (see step 1).
- Wait a few seconds and try again; Supabase may need a moment to refresh the schema cache.

### "Permission denied" when creating a center
- Usually means the `create_center_for_signup` function is missing, so the app falls back to a direct insert that is blocked by RLS.
- **Fix:** Create the function with **`supabase/run_create_center_for_signup.sql`** (step 1). The app is written to use this RPC for center creation.

### "new row violates row-level security policy for table user_roles"
- The trigger that inserts into `user_roles` on signup is missing or doesn’t set the role from metadata.
- **Fix:** Run the trigger migration **`supabase/migrations/20260308100000_user_roles_insert_via_trigger.sql`** in the SQL Editor (step 2), or run **`supabase db push`** (step 3).

### Center user lands on `/onboarding/user` instead of `/onboarding/center`
- The app uses `useOwnsCenter()` and role checks to send center owners to center onboarding.
- Ensure:
  - The center row exists in `educational_centers` (created by `create_center_for_signup` or by the app).
  - The trigger or RPC has set `user_roles.role = 'center'` and `profiles.role = 'center'` for that user.
- After fixing the function and/or trigger, sign up again or log in again and the redirect should be correct.

### Type or table does not exist when running the SQL
- Some scripts depend on existing tables/types: `user_roles`, `profiles`, `educational_centers`, and the `app_role` type.
- If your project was created from an older schema, apply the base migrations first (e.g. run **`supabase db push`** or apply the migrations that create these objects), then run **`run_create_center_for_signup.sql`** and the trigger migration.

---

## 6. Center account not created / "Not authenticated"

If you see **"Center setup failed"** with "Not authenticated" or the center is never created:

- With **email confirmation enabled**, there is no session right after signup, so the RPC cannot run. The app now passes center name and email in signup metadata and the **trigger** creates the center.
- Run the updated trigger in the SQL Editor so it creates the center from metadata:
  - Open **`supabase/run_trigger_create_center.sql`**, copy all of it, paste into SQL Editor, and **Run**.

Then try creating a center account again (with center name and email filled). If you still see errors, run **`supabase/run_create_center_for_signup.sql`** as well (step 1).

---

## Quick reference: which file to run where

| Goal | File to run in SQL Editor |
|------|---------------------------|
| Fix "Could not find the function create_center_for_signup" / Center setup failed | `supabase/run_create_center_for_signup.sql` |
| Center not created / "Not authenticated" (e.g. with email confirmation) | `supabase/run_trigger_create_center.sql` |
| Fix user_roles RLS on signup (trigger) | `supabase/migrations/20260308100000_user_roles_insert_via_trigger.sql` |
| Apply everything (migrations) | Use Supabase CLI: `supabase db push` (no need to copy files by hand) |

After following the steps above, center signup and center onboarding should work as intended.
