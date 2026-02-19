# Olympiads Module - Quick Reference Card

## 🚀 5-Minute Setup

```bash
# 1. Run migration
supabase db push

# 2. Add routes to App.tsx
import { OlympiadPage } from '@/pages/OlympiadPage';
import { OlympiadTestEngine } from '@/pages/OlympiadTestEngine';
import { OlympiadResultsPage } from '@/pages/OlympiadResultsPage';

# 3. Add components
<Route path="/olympiads" element={<OlympiadPage />} />
<Route path="/olympiad/:olympiadId/test" element={<OlympiadTestEngine />} />
<Route path="/olympiad/:olympiadId/results" element={<OlympiadResultsPage />} />

# 4. Add navigation link
<NavLink to="/olympiads" icon={<Trophy />} />

# 5. Test!
# Center: Create → Admin: Approve → User: Participate → See Results ✅
```

---

## 📂 File Reference

| File | Lines | Purpose |
|------|-------|---------|
| `supabase/migrations/20260208_003_olympiads_engine.sql` | 431 | Database schema |
| `src/hooks/useOlympiadManagement.ts` | 958 | All CRUD operations |
| `src/components/admin/OlympiadCenterPanel.tsx` | 497 | Center UI |
| `src/components/admin/AdminOlympiadPanel.tsx` | 472 | Admin dashboard |
| `src/pages/OlympiadPage.tsx` | 496 | User browse page |
| `src/pages/OlympiadTestEngine.tsx` | 450 | Test interface |
| `src/pages/OlympiadResultsPage.tsx` | 338 | Results display |
| `docs/OLYMPIADS_COMPLETE_GUIDE.md` | 619 | Full documentation |
| `docs/OLYMPIADS_DEPLOYMENT_GUIDE.md` | 458 | Setup & troubleshooting |

---

## 🔄 State Machine

```
DRAFT (Center edits)
  ↓ [Submit for Approval]
PENDING_ADMIN_APPROVAL (Admin reviews)
  ↓ [Approve]
APPROVED (Admin publishes)
  ↓ [Publish]
PUBLISHED (Waiting for start time)
  ↓ [Auto at start_time]
LIVE (Active competition)
  ↓ [Auto at end_time OR admin finish]
FINISHED (Results available)
  ↓ [Archive]
ARCHIVED (Read-only)

[REJECT] → Status becomes REJECTED (resubmit to DRAFT)
[PAUSE] → On LIVE (emergency only)
```

---

## 🪝 Hooks Cheat Sheet

### Get Data
```typescript
// Centers
const { data } = useOlympiadsByCenter(centerId);

// Users  
const { data } = usePublicOlympiads();
const { data } = useOlympiadLeaderboard(olympiadId);

// Admin
const { data } = useOlympiadsByStatus('PENDING_ADMIN_APPROVAL');
```

### Create/Update
```typescript
// Centers
const create = useCreateOlympiad(centerId);
await create.mutateAsync({ title, description, ... });

const update = useUpdateOlympiad(olympiadId);
await update.mutateAsync({ title, ... });

const submit = useSubmitForApproval(olympiadId);
await submit.mutateAsync();

// Users
const register = useRegisterForOlympiad(olympiadId);
await register.mutateAsync();

const answer = useSubmitOlympiadAnswer(registrationId);
await answer.mutateAsync({ question_id, selected_option_id, ... });

// Admin
const approve = useApproveOlympiad(olympiadId);
await approve.mutateAsync();

const reject = useRejectOlympiad(olympiadId);
await reject.mutateAsync("Reason for rejection");
```

---

## 🎯 User Flows

### CENTER FLOW
```
1. Center Panel → Olympiads tab
2. Click "Create Olympiad"
3. Fill form (title, dates, marks, etc.)
4. Add questions from bank
5. Click "Submit for Approval"
6. Wait for admin approval
7. Admin publishes (makes public)
8. View participants during LIVE
9. See results after FINISHED
```

### ADMIN FLOW
```
1. Admin Panel → Olympiad Management
2. See pending in "Pending" tab
3. Click "View" to check details
4. Click "Approve" if good
5. Click "Publish" to make public
6. Monitor in "Live" tab during event
7. Can pause if emergency
8. Can force finish if needed
9. View final leaderboard in "Finished" tab
```

### USER FLOW
```
1. Go to /olympiads page
2. Browse LIVE/upcoming olympiads
3. Click to view details
4. Click "Register Now"
5. When LIVE, click "Start Olympiad"
6. Answer questions with timer
7. Click "Submit Test" when done
8. See results page with rank
9. View leaderboard
10. Download certificate (if passed)
```

---

## 🔒 Security Rules

### Who Can Do What

| Action | Center | User | Admin |
|--------|--------|------|-------|
| Create olympiad | ✅ (own) | ❌ | ❌ |
| Edit olympiad | ✅ (own DRAFT) | ❌ | ✅ (any) |
| Submit for approval | ✅ (own) | ❌ | ❌ |
| Approve/Reject | ❌ | ❌ | ✅ |
| Publish | ❌ | ❌ | ✅ |
| Browse public | ✅ (read-only) | ✅ | ✅ |
| Register | ❌ | ✅ (LIVE only) | ❌ |
| Participate | ❌ | ✅ (LIVE only) | ❌ |
| Pause/Finish | ❌ | ❌ | ✅ (emergency) |
| View all | ❌ | ❌ | ✅ |
| View results | (own) | ✅ (own) | ✅ |

---

## 🎨 Component Structure

```
OlympiadPage (user browse)
├─ OlympiadListCard
├─ OlympiadDetailCard
├─ GlobalStatsCard
└─ TopCentersCard

OlympiadCenterPanel (center management)
├─ OlympiadCreateDialog
├─ OlympiadGrid
├─ OlympiadCard
└─ OlympiadDetailPanel

AdminOlympiadPanel (admin dashboard)
├─ OlympiadTable
├─ OlympiadRow
└─ OlympiadDetailPanel

OlympiadTestEngine (test taking)
├─ TestInstructions
├─ TestTimer
├─ QuestionCard
├─ OptionRadioGroup
├─ QuestionNavigator
└─ ExitDialog

OlympiadResultsPage (results)
├─ ScoreCard
├─ QuestionReview
├─ LeaderboardTop5
└─ ActionButtons
```

---

## ⚡ Performance Tips

### Optimize Queries
```typescript
// Cache leaderboard (only refresh after submission)
const { data } = useOlympiadLeaderboard(olympiadId);
// Cached for 10s during LIVE

// Use pagination for large lists
const [page, setPage] = useState(0);
const { data } = useOlympiadsByStatus(status, { offset: page * 20, limit: 20 });
```

### Reduce Re-renders
```typescript
// Memoize callbacks
const handleSubmit = useCallback(() => {
  submitMutation.mutate();
}, [submitMutation]);

// Memoize components
export const OlympiadCard = memo(({ olympiad }) => ...);
```

### Database Optimization
```sql
-- Add index for faster queries
CREATE INDEX idx_olympiad_start_time ON olympiad_definitions(start_time);

-- Use MATERIALIZED VIEW for cached leaderboard
CREATE MATERIALIZED VIEW leaderboard_cache AS
  SELECT * FROM calculate_leaderboard('olympiad_id');
```

---

## 🚨 Common Issues & Solutions

### Issue: Test won't start
```typescript
// Check olympiad status
const { data: olympiad } = await supabase
  .from('olympiad_definitions')
  .select('status, start_time')
  .eq('id', olympiadId)
  .single();

// Must be LIVE: status = 'LIVE' AND now >= start_time
```

### Issue: Answers not saving
```typescript
// Verify registration_id exists
const { data: registration } = await supabase
  .from('olympiad_registrations')
  .select('*')
  .eq('id', registrationId)
  .single();

// Check network tab for failed requests
// Verify user has INSERT permission
```

### Issue: Wrong leaderboard ranking
```typescript
// Recalculate manually
await supabase.rpc('calculate_leaderboard', { 
  p_olympiad_id: olympiadId 
});

// Check if tied scores - tie-breaking order:
// 1. Higher score 2. Earlier submission 3. Higher accuracy
```

---

## 📊 Database Tables

### olympiad_definitions
```
id, center_id, created_by, title, description, status,
registration_start, registration_end, start_time, end_time,
duration_minutes, total_marks, max_participants, is_public,
admin_id, rejection_reason, approved_at, published_at
```

### olympiad_registrations
```
id, olympiad_id, user_id, status, attempt_number, score, rank, percentile
```

### olympiad_answers
```
id, registration_id, question_id, selected_option_id, is_correct, points_awarded
```

### olympiad_leaderboard
```
olympiad_id, user_id, rank, score, percentile
```

---

## 🎓 Key Concepts

**Lifecycle**: State machine for olympiad progression  
**Stateless**: Each test submission creates immutable record  
**Deterministic**: Scoring calculated same way every time  
**Auditable**: Every action logged with timestamp + user  
**Secure**: RLS policies enforce all access rules  
**Real-time**: Live updates without page refresh  
**Scalable**: Indexed queries, cached results  

---

## ✅ Pre-Deployment Checklist

- [ ] Database migration run successfully
- [ ] All routes added to App.tsx
- [ ] Components imported correctly
- [ ] Navigation links added
- [ ] RLS policies working (test in Supabase)
- [ ] Hooks tested with real data
- [ ] Center can create olympiad
- [ ] Admin can approve/publish
- [ ] User can register and participate
- [ ] Results calculated correctly
- [ ] Anti-cheating detection working
- [ ] Error messages display properly
- [ ] Mobile responsive (test on phone)
- [ ] Performance acceptable (<2s load time)
- [ ] Security reviewed

---

## 🔗 Important Links

**Architecture**: See `docs/OLYMPIADS_COMPLETE_GUIDE.md`  
**Deployment**: See `docs/OLYMPIADS_DEPLOYMENT_GUIDE.md`  
**Database**: `supabase/migrations/20260208_003_olympiads_engine.sql`  
**Hooks**: `src/hooks/useOlympiadManagement.ts`  
**Components**: `src/components/admin/` and `src/pages/`  

---

## 📞 Support

**Issue?** Check the troubleshooting section above.  
**Question?** Review the complete guide.  
**Stuck?** Check browser console, network tab, database logs.  

---

**Status**: ✅ Production Ready  
**Version**: 1.0  
**Last Updated**: Feb 8, 2026  

**🚀 Ready to deploy!**
