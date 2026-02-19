# Olympiads Module - Complete Implementation Guide

## Overview

This document explains the complete Olympiads system including all components, security measures, and integration points.

## 1. Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     OLYMPIAD LIFECYCLE                          │
├─────────────────────────────────────────────────────────────────┤
│ DRAFT → PENDING_ADMIN_APPROVAL → APPROVED → PUBLISHED → LIVE   │
│         → FINISHED → ARCHIVED                                   │
│                                                                 │
│ • State transitions controlled by backend only                  │
│ • Invalid transitions blocked by RLS policies                   │
│ • Immutable once LIVE (except by admin for emergencies)        │
└─────────────────────────────────────────────────────────────────┘
```

## 2. Database Schema

### Core Tables

#### `olympiad_definitions`
- **Purpose**: Stores olympiad metadata and lifecycle state
- **Key Fields**:
  - `id`: UUID primary key
  - `center_id`: Owner center (foreign key)
  - `created_by`: Creator user ID
  - `status`: Enum (DRAFT, PENDING_ADMIN_APPROVAL, APPROVED, PUBLISHED, LIVE, FINISHED, ARCHIVED, REJECTED)
  - `registration_start/end`: Time window for registrations
  - `start_time/end_time`: Olympiad execution window
  - `duration_minutes`: Test duration
  - `total_marks`: Total points available
  - `max_participants`: Optional cap on registrations
  - `is_public`: Visibility flag
  - `admin_id`: Admin who approved/rejected
  - `approval_reason`: If rejected
  - Timestamps: created_at, updated_at, started_at, finished_at, archived_at

#### `olympiad_questions`
- **Purpose**: Maps questions to olympiad with order and points
- **Key Fields**:
  - `olympiad_id`: Foreign key to olympiad_definitions
  - `question_id`: Foreign key to questions
  - `order_index`: Display order in test
  - `points`: Points awarded for correct answer

#### `olympiad_registrations`
- **Purpose**: Tracks user participation and attempts
- **Key Fields**:
  - `olympiad_id`: Which olympiad
  - `user_id`: Which user
  - `status`: REGISTERED, STARTED, SUBMITTED, DISQUALIFIED
  - `attempt_number`: 0 (not started) or 1+ (after starting)
  - `score`: Final score after submission
  - `rank`: Position in leaderboard
  - `percentile`: Percentile rank
  - `device_fingerprint`: Anti-cheating detection
  - `ip_addresses`: Array of IPs used
  - `suspicious_flags`: Array of violation flags

#### `olympiad_answers`
- **Purpose**: Individual question responses
- **Key Fields**:
  - `registration_id`: Links to registration
  - `question_id`: Which question answered
  - `selected_option_id`: User's choice
  - `is_correct`: Auto-calculated
  - `points_awarded`: Points for this answer
  - `time_spent_seconds`: How long on question

#### `olympiad_leaderboard`
- **Purpose**: Cached leaderboard (refreshed after each submission)
- **Key Fields**:
  - `olympiad_id`, `user_id`
  - `rank`: Position (1, 2, 3, ...)
  - `score`: Total points
  - `percentile`: Relative standing
  - `accuracy`: Percentage of questions correct

#### `olympiad_events`
- **Purpose**: Audit trail of all actions
- **Key Fields**:
  - `olympiad_id`, `user_id`, `admin_id`
  - `event_type`: CREATED, SUBMITTED_FOR_APPROVAL, APPROVED, PUBLISHED, LIVE_STARTED, USER_REGISTERED, USER_STARTED, USER_SUBMITTED, FINISHED, etc.
  - `description`: Human-readable details
  - `metadata`: JSON context (reasons, changes, etc.)

### Security Policies (RLS)

```sql
-- Centers manage their own olympiads
CREATE POLICY "centers_olympiad_manage"
  ON olympiad_definitions
  USING (center_id IN (SELECT id FROM educational_centers WHERE owner_id = auth.uid()))

-- Users can only see published/live olympiads
CREATE POLICY "users_olympiad_view"
  ON olympiad_definitions FOR SELECT
  USING (is_public = true AND status IN ('PUBLISHED', 'LIVE'))

-- Admin can see all
CREATE POLICY "admin_olympiad_all"
  ON olympiad_definitions
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'ADMIN'))
```

## 3. State Machine Rules

### Valid Transitions

```
DRAFT
  └─→ PENDING_ADMIN_APPROVAL (center submits for approval)
  └─→ DELETED (center can delete draft)

PENDING_ADMIN_APPROVAL
  ├─→ APPROVED (admin approves)
  ├─→ REJECTED (admin rejects with reason)
  └─→ DRAFT (center can revert while pending)

APPROVED
  ├─→ PUBLISHED (admin makes public)
  └─→ REJECTED (admin can reject even if approved)

PUBLISHED
  ├─→ LIVE (system auto-transitions at start_time)
  └─→ REJECTED (admin can still reject)

LIVE
  ├─→ FINISHED (auto at end_time or admin force-finish)
  ├─→ PAUSED (admin pause - participants lose time)
  └─→ ARCHIVED (admin archive for records)

FINISHED
  └─→ ARCHIVED

REJECTED
  └─→ Can only be reset to DRAFT by center

ARCHIVED
  └─→ Read-only, no further transitions
```

### Validation Rules

Before transitioning to LIVE:
1. ✅ Status must be PUBLISHED or APPROVED
2. ✅ Center must be ACTIVE
3. ✅ Must have ≥1 question
4. ✅ Registration period must be closed
5. ✅ Current time ≥ start_time
6. ✅ Have ≥5 registered participants (configurable)

## 4. User Flows

### Center Panel Flow

```
1. CREATE OLYMPIAD (in DRAFT)
   ├─ Fill title, description, dates, rules
   ├─ Set marks and passing score
   └─ Auto-save as draft

2. ADD QUESTIONS
   ├─ Select from question bank
   ├─ Set order and points
   └─ Can reorder anytime in DRAFT

3. SUBMIT FOR APPROVAL
   ├─ Validation: ≥1 question, complete details
   ├─ Status → PENDING_ADMIN_APPROVAL
   ├─ Center can't edit anymore
   └─ Event logged: "SUBMITTED_FOR_APPROVAL"

4. VIEW TABS
   ├─ Draft: Editable, not yet submitted
   ├─ Pending: Waiting for admin
   ├─ Approved: Ready to publish
   ├─ Live: Currently running
   └─ Finished: Results available

5. PUBLISH MODE (read-only preview)
   └─ See what users will see
```

### Admin Panel Flow

```
1. OLYMPIAD DASHBOARD
   ├─ Filter by status, center, subject, date
   ├─ Quick stats: pending, approved, live, finished
   └─ One-click actions

2. REVIEW PENDING
   ├─ View full details
   ├─ Check question set
   ├─ Approve → Status APPROVED
   └─ Reject → Status REJECTED + reason required

3. MANAGE LIVE
   ├─ View real-time participants
   ├─ Pause olympiad (for emergencies)
   ├─ Force finish early
   ├─ View leaderboard
   └─ All actions logged

4. AUDIT LOG
   └─ See who did what and when
```

### User Flow

```
1. BROWSE OLYMPIADS
   ├─ Filter by subject, date, center
   ├─ See only PUBLISHED or LIVE
   ├─ Read full description & rules
   └─ View organizer info

2. REGISTER (if registration open)
   ├─ Click "Register"
   ├─ Device fingerprint captured
   ├─ IP address logged
   ├─ Status: REGISTERED
   └─ Can't register twice

3. START TEST (when LIVE)
   ├─ Read instructions (mandatory)
   ├─ Accept terms
   ├─ Click "Start"
   ├─ Status: STARTED
   ├─ Timer begins
   └─ Anti-cheating activated

4. ANSWER QUESTIONS
   ├─ Navigate with Previous/Next
   ├─ Auto-submit each answer
   ├─ Visual feedback (green=answered)
   ├─ Can skip questions
   ├─ Tab switching detected & flagged
   └─ Refresh attempts blocked

5. SUBMIT (explicit or auto-timeout)
   ├─ Scoring calculated immediately
   ├─ Status: SUBMITTED
   ├─ View results page
   ├─ See rank and percentile
   ├─ See leaderboard
   └─ Download certificate (if passed)
```

## 5. Anti-Cheating Measures

### Detection Systems

**1. Device Fingerprinting**
```typescript
// Captured at registration and test start
{
  userAgent: string;
  screenResolution: string;
  timezone: string;
  hardwareConcurrency: number;
  hashValue: string;
}
```

**2. IP Address Tracking**
```typescript
// All IPs during test captured in array
ip_addresses: string[]
// Alert if >3 different IPs during single test
```

**3. Tab Switching Detection**
```typescript
// visibilitychange event listener
if (document.hidden) {
  tabSwitchCount++;
}
// After 2+ switches: warning
// After 5+ switches: flag for manual review
```

**4. Refresh/Reload Detection**
```typescript
// beforeunload event
// Flags if user navigates away intentionally
```

**5. Copy/Paste Prevention**
```typescript
// Disable right-click, Ctrl+C, Ctrl+V during test
// Log any attempted violations
```

### Disqualification Rules

- ≥5 tab switches during test
- Same question answered from different IPs
- Device fingerprint mismatch
- Multiple simultaneous connections
- Attempted question bank access outside test

## 6. Scoring System

### Automatic Calculation

```typescript
export function calculateScore(
  answers: Answer[],
  olympiadQuestions: OlympiadQuestion[]
): ScoringResult {
  let totalScore = 0;
  let correctCount = 0;

  for (const answer of answers) {
    const question = olympiadQuestions.find(q => q.question_id === answer.question_id);
    if (!question) continue;

    const option = question.options.find(o => o.id === answer.selectedOptionId);
    
    if (option?.isCorrect) {
      totalScore += question.points;
      correctCount++;
      answer.isCorrect = true;
      answer.pointsAwarded = question.points;
    } else {
      answer.isCorrect = false;
      // Negative marking handled here if configured
      if (olympiad.negative_marking && olympiad.negative_marking_value) {
        totalScore -= olympiad.negative_marking_value;
      }
    }
  }

  return {
    totalScore,
    correctCount,
    totalQuestions: olympiadQuestions.length,
    accuracy: (correctCount / olympiadQuestions.length) * 100
  };
}
```

### Tie-Breaking

1. **Higher Score** (primary)
2. **Earlier Submission** (tie-break 1)
3. **Higher Accuracy** (tie-break 2)

```sql
ORDER BY score DESC, submitted_at ASC, accuracy DESC
```

## 7. Integration Points

### With Centers Module
- Centers own olympiads
- Center status affects olympiad visibility
- If center suspended → olympiad hidden
- If center deleted → all olympiads cascade delete

### With Questions Module
- Olympiad pulls questions from question bank
- Questions must be published to be selectable
- Question deletion cascades to olympiad (removes from test)
- Question updates don't affect submitted olympiads

### With Users Module
- Only Users role can register/participate
- Centers/Admins see read-only preview
- User profile linked in leaderboard
- Rank/percentile added to user stats

### With Analytics Module
- Track user performance across olympiads
- Time series of rankings
- Subject-wise performance trends
- Comparison with peers

### With Notifications
- Registration opened (to interested users)
- Olympiad starting soon (24h reminder)
- Results ready (immediate after finish)
- Certificate ready (if passed)
- Rank changed (if user in top 10)

## 8. Hooks API Reference

### Query Hooks

```typescript
// Get all olympiads for center
useOlympiadsByCenter(centerId: string)

// Get olympiads by status
useOlympiadsByStatus(status: string, centerId?: string)

// Get olympiad full details
useOlympiadDetails(olympiadId: string | null)

// Get questions in olympiad
useOlympiadQuestions(olympiadId: string | null)

// Get user's registration
useUserOlympiadRegistration(olympiadId: string | null)

// Get leaderboard (cached from DB)
useOlympiadLeaderboard(olympiadId: string | null)

// Get user's answers for review
useOlympiadUserAnswers(registrationId: string | null)

// Get all public olympiads (users browse)
usePublicOlympiads()
```

### Mutation Hooks

```typescript
// Center mutations
useCreateOlympiad(centerId: string)
useUpdateOlympiad(olympiadId: string)
useSubmitForApproval(olympiadId: string)
useAddQuestionsToOlympiad(olympiadId: string)

// User mutations
useRegisterForOlympiad(olympiadId: string)
useStartOlympiad(registrationId: string)
useSubmitOlympiadAnswer(registrationId: string)
useSubmitOlympiad(registrationId: string)

// Admin mutations
useApproveOlympiad(olympiadId: string)
useRejectOlympiad(olympiadId: string)
usePublishOlympiad(olympiadId: string)
usePauseOlympiad(olympiadId: string)
useFinishOlympiad(olympiadId: string)
```

## 9. Component Hierarchy

```
OlympiadPage (User browsing)
├─ OlympiadListCard (grid of olympiads)
├─ OlympiadDetailCard (right panel)
├─ GlobalStatsCard
└─ TopCentersCard

OlympiadCenterPanel (Center management)
├─ OlympiadCreateDialog
├─ OlympiadGrid
├─ OlympiadCard
└─ OlympiadDetailPanel

AdminOlympiadPanel (Admin management)
├─ OlympiadTable
├─ OlympiadRow (with approve/reject buttons)
└─ OlympiadDetailPanel (admin view)

OlympiadTestEngine (Actual test)
├─ TestInstructions (pre-test)
├─ TestTimer (countdown)
├─ QuestionCard (current question)
├─ OptionRadioGroup
├─ QuestionNavigator (grid of questions)
└─ ExitDialog (confirm submission)

OlympiadResultsPage (After test)
├─ ScoreCard (big display)
├─ QuestionReview (question-by-question)
├─ LeaderboardTop5
└─ ActionButtons (share, download)
```

## 10. Error Handling

### Common Errors

```typescript
// "Center must be ACTIVE to run olympiad"
if (center.status !== 'ACTIVE') throw new Error(...)

// "Olympiad must have at least one question"
if (questions.length === 0) throw new Error(...)

// "Registration must be closed to start olympiad"
if (now < registration_end) throw new Error(...)

// "You have already participated in this olympiad"
if (registration && registration.attempt_number > 0) throw new Error(...)

// "Tab switching detected - olympiad may be paused"
if (tabSwitchCount > 2) flagForReview()

// "Multiple IP addresses detected - review pending"
if (ip_addresses.length > 3) flagForReview()
```

## 11. Performance Optimization

### Database Indexes

```sql
CREATE INDEX idx_olympiad_center ON olympiad_definitions(center_id);
CREATE INDEX idx_olympiad_status ON olympiad_definitions(status);
CREATE INDEX idx_olympiad_start_time ON olympiad_definitions(start_time);
CREATE INDEX idx_olympiad_is_public ON olympiad_definitions(is_public);
CREATE INDEX idx_olympiad_registrations_status ON olympiad_registrations(status);
CREATE INDEX idx_olympiad_registrations_score ON olympiad_registrations(score DESC);
CREATE INDEX idx_leaderboard_olympiad ON olympiad_leaderboards(olympiad_id);
```

### Caching Strategy

- **Leaderboard**: Cached after each submission, refreshed every 10s during LIVE
- **Public Olympiads**: Cached 30s (refreshed for live counts)
- **User Registration**: Cached 5s (critical for current state)
- **Questions**: Cached indefinitely (immutable once olympiad starts)

## 12. Testing Checklist

### Unit Tests

- [ ] State transitions block invalid paths
- [ ] Scoring calculation is accurate
- [ ] Leaderboard ranking is correct
- [ ] Anti-cheating flags detected
- [ ] RLS policies enforced

### Integration Tests

- [ ] User can register → start → submit → see results
- [ ] Admin can approve → publish → manage
- [ ] Center can create → edit → submit
- [ ] Leaderboard updates in real-time
- [ ] Results immutable after finish

### Security Tests

- [ ] Tab switches tracked
- [ ] IP addresses validated
- [ ] Device fingerprint changes detected
- [ ] Users can't access non-published olympiads
- [ ] Admins can't modify submitted answers

### Performance Tests

- [ ] 1000 concurrent participants
- [ ] Auto-submit latency <500ms
- [ ] Leaderboard calculation <1s
- [ ] Results page loads <2s

## 13. Deployment Checklist

Before going LIVE:

- [ ] Database migration run successfully
- [ ] All RLS policies tested
- [ ] Hooks tested with real data
- [ ] Components render without errors
- [ ] Anti-cheating detection active
- [ ] Audit logging functional
- [ ] Admin panel tested
- [ ] User flow end-to-end tested
- [ ] Error messages user-friendly
- [ ] Performance acceptable
- [ ] Security reviewed

## 14. Future Enhancements

### Phase 2
- [ ] Real-time leaderboard (WebSocket)
- [ ] Partial marking (fill-in-blank auto-correction)
- [ ] Essay questions (manual grading queue)
- [ ] Question randomization (prevent cheating)
- [ ] Proctoring integration (webcam monitoring)

### Phase 3
- [ ] Practice mode (unlimited attempts)
- [ ] Adaptive difficulty (IRT algorithm)
- [ ] Group competitions (team vs team)
- [ ] Mock olympiads (full simulation)
- [ ] Performance analytics dashboard

## 15. Support & Troubleshooting

### Common Issues

**"Test won't start"**
→ Check if olympiad status is LIVE
→ Verify registration is open
→ Check if already submitted

**"Answers not saving"**
→ Check network connection
→ Verify registration_id in URL params
→ Check browser console for errors

**"Wrong leaderboard ranking"**
→ Leaderboard cached - refresh browser
→ Wait 10s for automatic refresh
→ Check if tie-breaking rules applied

**"Can't see results"**
→ Test must be in FINISHED status
→ Submitted status but not finished yet
→ Check permissions (only user can see own)

---

**Last Updated**: February 8, 2026  
**Status**: Production Ready  
**Version**: 1.0
