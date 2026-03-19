# Changing Email Rate Limits (Users & Centers)

This guide explains how to change the **email rate limit** that applies to sign-up, password reset, and other auth emails. Both **users** (students) and **centers** use the same Supabase Auth limits.

---

## What is limited?

Supabase Auth limits how many **emails** can be sent per hour (sign-up, recover password, email change). When the limit is exceeded, users and centers see **"Email rate limit exceeded"** and must wait before trying again.

- **Default (built-in SMTP):** often 3–4 emails per hour for the whole project.
- **With custom SMTP:** you can raise the limit (e.g. 30+ per hour) and configure it in the dashboard.

---

## Option 1: Change rate limit in Supabase Dashboard (recommended)

1. Open **[Supabase Dashboard](https://supabase.com/dashboard)** and select your project.
2. In the left sidebar go to **Authentication** → **Rate limits**  
   (direct link: `https://supabase.com/dashboard/project/YOUR_PROJECT_REF/auth/rate-limits`).
3. Find **Email** / **Emails sent** (or similar).
4. Increase the value (e.g. **10** or **30** emails per hour) and save.

**Note:** If you don’t see an editable email limit, your project may be using the built-in SMTP. In that case you need to set up **Custom SMTP** (Project Settings → Auth → SMTP) to get higher or configurable limits.

---

## Option 2: Change rate limit via Management API

You can read and update auth config (including rate limits) with the Supabase Management API.

### 1. Get an access token and project ref

- **Access token:** [Dashboard → Account → Access Tokens](https://supabase.com/dashboard/account/tokens) → Generate new token.
- **Project ref:** Dashboard → **Project Settings** → **General** → Reference ID.

### 2. Get current rate limits

```bash
export SUPABASE_ACCESS_TOKEN="your-access-token"
export PROJECT_REF="your-project-ref"

curl -X GET "https://api.supabase.com/v1/projects/$PROJECT_REF/config/auth" \
  -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" \
  | jq 'to_entries | map(select(.key | startswith("rate_limit_"))) | from_entries'
```

### 3. Update rate limits

Example: set **email sent** limit to **10** per hour:

```bash
curl -X PATCH "https://api.supabase.com/v1/projects/$PROJECT_REF/config/auth" \
  -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "rate_limit_email_sent": 10
  }'
```

You can also adjust other limits in the same call, for example:

```json
{
  "rate_limit_email_sent": 10,
  "rate_limit_anonymous_users": 10,
  "rate_limit_verify": 10,
  "rate_limit_token_refresh": 10,
  "rate_limit_otp": 10
}
```

Use the same `curl` as above with the JSON you want.

---

## Option 3: Client-side cooldown (app only)

The app shows a **"Try again in Xs"** cooldown after an email rate limit error. That duration is configurable so you can shorten or lengthen how long users must wait before the button is enabled again.

- In your project root, create or edit **`.env`** (or `.env.local`).
- Add:
  - `VITE_AUTH_RATE_LIMIT_COOLDOWN_SECONDS=60`  
  - Change **60** to the number of seconds you want (e.g. **30** or **90**).
- Restart the dev server so the new value is picked up.

This does **not** change Supabase’s server-side limit; it only changes how long the sign-in/sign-up button stays disabled after a rate limit error.

---

## Summary

| What you want to change | Where to do it |
|-------------------------|----------------|
| How many emails per hour Supabase allows | Dashboard: **Authentication → Rate limits** or Management API (`rate_limit_email_sent`) |
| Higher / customizable email limits | Configure **Custom SMTP** in Project Settings → Auth, then use Dashboard or API |
| How long the “Try again in Xs” cooldown lasts in the app | Env: **`VITE_AUTH_RATE_LIMIT_COOLDOWN_SECONDS`** (default 60) |

After changing server-side limits, no app redeploy is needed. After changing the env var, restart the app so the new cooldown is used.
