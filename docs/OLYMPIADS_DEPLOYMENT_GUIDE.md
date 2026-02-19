# Olympiads Module - Integration & Deployment Guide

## Quick Start Integration

### Step 1: Run Database Migration

```bash
# Navigate to project root
cd /Users/macbook/Desktop/imts-main

# Run migration (one-time only)
supabase db push  # or use Supabase dashboard

# Or manually execute the SQL
cat supabase/migrations/20260208_003_olympiads_engine.sql | psql your_connection_string
```

**What this creates:**
- 6 new tables (olympiad_definitions, questions, registrations, answers, leaderboard, events)
- 10+ indexes for performance
- RLS policies for security
- Validation triggers for state management
- Audit logging functions

### Step 2: Add Routes to App

In your `src/App.tsx` or router config:

```typescript
import { OlympiadPage } from '@/pages/OlympiadPage';
import { OlympiadTestEngine } from '@/pages/OlympiadTestEngine';
import { OlympiadResultsPage } from '@/pages/OlympiadResultsPage';

// Add these routes
<Route path="/olympiads" element={<OlympiadPage />} />
<Route path="/olympiad/:olympiadId/test" element={<OlympiadTestEngine />} />
<Route path="/olympiad/:olympiadId/results" element={<OlympiadResultsPage />} />
```

### Step 3: Add Center Panel Tab

In your `src/components/center/CenterPanel.tsx` or wherever you manage center tabs:

```typescript
import { OlympiadCenterPanel } from '@/components/admin/OlympiadCenterPanel';

// Add to tabs
<TabsTrigger value="olympiads">Olympiads</TabsTrigger>

<TabsContent value="olympiads">
  <OlympiadCenterPanel centerId={centerId} />
</TabsContent>
```

### Step 4: Add Admin Panel Section

In your `src/pages/AdminPanel.tsx` or admin dashboard:

```typescript
import { AdminOlympiadPanel } from '@/components/admin/AdminOlympiadPanel';

// Add to admin tabs
<TabsTrigger value="olympiads">Olympiad Management</TabsTrigger>

<TabsContent value="olympiads">
  <AdminOlympiadPanel />
</TabsContent>
```

### Step 5: Add Navigation Links

Add to your main navigation:

```typescript
<NavLink to="/olympiads" label="Olympiads" icon={<Trophy />} />
```

### Step 6: Test the Flow

**As Center:**
1. Go to Center Panel → Olympiads
2. Click "Create Olympiad"
3. Fill in details and save
4. Add questions from question bank
5. Submit for approval

**As Admin:**
1. Go to Admin Panel → Olympiad Management
2. See pending olympiads in "Pending" tab
3. Click "Approve" and then "Publish"

**As User:**
1. Go to /olympiads
2. See LIVE and PUBLISHED olympiads
3. Click "Register Now"
4. Click "Start Olympiad" when LIVE
5. Answer questions (auto-saves)
6. Submit test
7. See results and leaderboard

## File Structure

```
src/
├── hooks/
│   └── useOlympiadManagement.ts (550+ lines, all CRUD operations)
├── pages/
│   ├── OlympiadPage.tsx (User browse + register)
│   ├── OlympiadTestEngine.tsx (Timer + questions)
│   └── OlympiadResultsPage.tsx (Results + leaderboard)
├── components/
│   └── admin/
│       ├── OlympiadCenterPanel.tsx (Center management UI)
│       └── AdminOlympiadPanel.tsx (Admin dashboard)
supabase/
└── migrations/
    └── 20260208_003_olympiads_engine.sql (Database schema)
docs/
├── OLYMPIADS_COMPLETE_GUIDE.md (This comprehensive guide)
└── OLYMPIADS_DEPLOYMENT_GUIDE.md (Deployment steps)
```

## Key Features Included

### ✅ Lifecycle Management
- DRAFT → PENDING → APPROVED → PUBLISHED → LIVE → FINISHED → ARCHIVED
- State transitions enforced at database level
- Invalid transitions blocked

### ✅ Center Control
- Create olympiads in draft
- Add questions with points
- Submit for admin approval
- View across all statuses
- Can't edit once submitted

### ✅ Admin Moderation
- Review and approve/reject with reasons
- Publish to make public
- Pause/finish live olympiads
- Force finish if needed
- View participant leaderboards
- Complete audit trail

### ✅ User Experience
- Browse public olympiads
- Register when registration open
- Take test with timer
- Auto-save answers
- See results immediately
- View leaderboard
- Download certificate

### ✅ Anti-Cheating
- Device fingerprinting
- IP address tracking
- Tab switch detection
- Refresh attempt blocking
- Suspicious activity flagging
- Manual review queue

### ✅ Real-time Features
- Live participant count
- Timer countdown
- Auto-submit on timeout
- Instant scoring
- Real-time leaderboard (optional WebSocket)

### ✅ Analytics
- Rank and percentile for every user
- Accuracy percentage
- Question-by-question review
- Top scorers leaderboard
- Performance trends

## Dependencies Required

All already in your stack:
- `@tanstack/react-query` - Data fetching
- `zod` - Validation
- `shadcn/ui` - UI components
- `lucide-react` - Icons
- `supabase-js` - Database

## Environment Setup

No additional env vars needed. Uses existing:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

## Data Migration

If migrating from existing system:

```typescript
// 1. Export existing questions
const existingQuestions = await db.query('SELECT * FROM questions');

// 2. Create first olympiad
const olympiad = await createOlympiad({
  title: 'Import Test Olympiad',
  center_id: yourCenterId,
  ...otherFields
});

// 3. Link questions
await useAddQuestionsToOlympiad(olympiad.id).mutateAsync({
  questions: existingQuestions.map((q, idx) => ({
    question_id: q.id,
    order_index: idx,
    points: 1
  }))
});

// 4. Publish
await usePublishOlympiad(olympiad.id).mutateAsync();
```

## Customization Points

### Scoring Logic
Edit in `useSubmitOlympiad` hook:
```typescript
// Custom scoring function
const score = answers.reduce((sum, a) => {
  if (a.is_correct) return sum + getCustomPoints(a);
  return sum;
}, 0);
```

### Leaderboard Calculation
Edit `calculate_leaderboard` SQL function in migration for custom tie-breaking

### Anti-Cheating Sensitivity
In `OlympiadTestEngine.tsx`:
```typescript
if (tabSwitchCount >= 2) {  // Change threshold here
  handleDisqualify();
}
```

### UI Customization
All components use shadcn/ui, easy to customize:
- Colors: Update Tailwind classes
- Layout: Modify grid/flex values
- Icons: Swap lucide-react icons
- Typography: Adjust font sizes/weights

## Performance Tuning

### If slow leaderboard:
```sql
-- Add materialized view for cached results
CREATE MATERIALIZED VIEW leaderboard_cache AS
SELECT * FROM calculate_leaderboard(olympiad_id);

-- Refresh after each submission
REFRESH MATERIALIZED VIEW leaderboard_cache;
```

### If slow submission:
```typescript
// Batch answer submission instead of one-by-one
const answers = [/* all answers */];
await supabase.from('olympiad_answers').insert(answers);
```

### If high load:
- Enable read replicas for leaderboard queries
- Cache public olympiads in Redis
- Use background job for scoring
- Async leaderboard calculation

## Monitoring & Alerts

Setup alerts for:

```typescript
// 1. Suspicious activity spike
if (disqualifiedCount > threshold) {
  alertAdmin('High cheating detection rate');
}

// 2. Failed submissions
if (submissionErrors > threshold) {
  alertAdmin('Submission failures detected');
}

// 3. Olympiad issues
if (registrationCount > maxParticipants) {
  alertAdmin('Olympiad capacity exceeded');
}
```

## Troubleshooting

### Issue: RLS policies blocking access

**Solution**: Verify user role:
```typescript
const { data: profile } = await supabase
  .from('profiles')
  .select('role')
  .eq('id', user.id)
  .single();

console.log('User role:', profile.role);
```

### Issue: Answers not saving

**Solution**: Check network tab in DevTools, verify:
1. Registration ID is correct
2. Olympiad ID is correct
3. Question ID exists in olympiad_questions
4. User has SELECT permission

### Issue: Leaderboard wrong

**Solution**: Recalculate manually:
```typescript
await supabase.rpc('calculate_leaderboard', { 
  p_olympiad_id: olympiadId 
});
```

### Issue: Test won't start

**Solution**: Check olympiad status:
```typescript
const { data: olympiad } = await supabase
  .from('olympiad_definitions')
  .select('status, start_time')
  .eq('id', olympiadId)
  .single();

console.log('Status:', olympiad.status, 'Should be LIVE');
console.log('Now:', new Date().toISOString());
console.log('Start:', olympiad.start_time);
```

## Security Checklist

- [ ] RLS policies tested
- [ ] Only ADMIN can approve/reject
- [ ] Only center owner can edit own olympiads
- [ ] Only users can participate
- [ ] Answers immutable after submission
- [ ] Anti-cheating detection active
- [ ] Audit logging working
- [ ] Certificate generation secure
- [ ] No sensitive data in client logs
- [ ] HTTPS enforced in production

## Deployment Steps

### 1. Pre-deployment
```bash
npm run build  # Verify no errors
npm run lint   # Check linting
```

### 2. Database
```bash
# Backup current database
pg_dump your_db > backup_$(date +%Y%m%d).sql

# Run migration
supabase db push
```

### 3. Code
```bash
# Deploy updated code
git push origin main
# Your CI/CD will handle deployment
```

### 4. Post-deployment
```bash
# Test critical flows
npm run test:olympiads

# Monitor logs
supabase functions logs
```

### 5. Rollback (if needed)
```bash
# Revert migration
psql your_db < backup_*.sql

# Revert code
git revert HEAD
```

## Performance Baseline

After deployment, monitor:

| Metric | Target | Warning |
|--------|--------|---------|
| Browse olympiads | <500ms | >1s |
| Start test | <1s | >2s |
| Submit answer | <500ms | >1s |
| Submit test | <2s | >5s |
| Leaderboard | <1s | >3s |
| Results page | <1s | >2s |

## Support

For issues:

1. **Check logs**: `supabase functions logs`
2. **Check RLS**: Run test query in Supabase editor
3. **Check data**: Query olympiad_definitions directly
4. **Check code**: Review error messages in browser console
5. **Check permissions**: Verify user role and center ownership

## Success Criteria

✅ System is working correctly if:

- [x] Centers can create olympiads in DRAFT
- [x] Centers can add questions and submit for approval
- [x] Admin can see pending and approve/reject
- [x] Admin can publish and monitor live olympiads
- [x] Users can register and participate in LIVE olympiads
- [x] Answers auto-save without delays
- [x] Test auto-submits on timeout
- [x] Results calculated and shown immediately
- [x] Leaderboard ranks correctly
- [x] Anti-cheating flags suspicious activity
- [x] Audit log shows all actions
- [x] No broken flows or partial saves
- [x] All error messages user-friendly
- [x] Mobile responsive
- [x] Performance acceptable

## Next Steps

After deployment:

1. **Gather feedback** from centers and users
2. **Monitor analytics** for usage patterns
3. **Optimize** based on actual load
4. **Enhance** with Phase 2 features
5. **Integrate** with notifications system
6. **Add** real-time leaderboard (WebSocket)
7. **Build** performance analytics dashboard
8. **Implement** proctoring integration

---

**Deployment Date**: [Deployment Date]  
**Status**: [Production/Staging]  
**Version**: 1.0  
**Maintained By**: [Your Team]
