# Center Panel System Architecture

## Executive Summary

This document defines the architecture of a rock-solid, enterprise-grade Center Panel system that:
- Enforces strict role and status validation
- Never allows broken data flows
- Scales to new features and payment systems
- Keeps Admin in full control
- Provides Centers with clarity and confidence

---

## 1. Core Principles

### 1.1 Single Source of Truth
- **Backend-driven state** - UI is presentation layer only
- **All business logic in Supabase** (RLS, triggers, validation)
- **Frontend validates** for UX only, backend enforces for data integrity
- **No optimistic updates** without server confirmation (except UI loading states)

### 1.2 Strict Enforcement
- **Role-based access control** - Admin can do everything, Center/User have restrictions
- **Status-based access** - Only ACTIVE centers access full panel
- **Ownership verification** - Center can only see/modify their own content
- **No silent failures** - Every error is caught, logged, and shown to user

### 1.3 Data Integrity
- **No broken flows** - Publish rules prevent incomplete content
- **No partial saves** - Operations are atomic (all-or-nothing)
- **Audit logs** - Every critical action is logged with who/what/when
- **Cascade integrity** - Related records are consistent

### 1.4 User Experience
- **Instant feedback** - All actions show loading → success/error
- **Clear status** - Every item labeled as Draft/Pending/Published
- **Guided workflows** - Multi-step wizards with validation
- **No blank screens** - Empty states have helpful CTAs

---

## 2. Center Lifecycle

### 2.1 Status Flow

```
┌─────────────┐      Admin Review      ┌──────────────────┐
│ REGISTERED  │  ──────────────>  │ PENDING_ADMIN_APPROVAL │
└─────────────┘                   └──────────────────┘
                                        │
                                        │ (Auto-approve or manual)
                                        v
┌─────────────┐      User Selects   ┌────────────┐
│  APPROVED   │  <──────────────  │TARIFF_SELECTED │
└─────────────┘                   └────────────┘
     │                                 │
     │ (Auto-approve or manual)        │
     v                                 v
┌────────────────┐                ┌─────────────────────┐
│    ACTIVE      │  <──────────  │ WAITING_TARIFF_APPROVAL │
└────────────────┘               └─────────────────────┘
```

### 2.2 Access Rules by Status

```
REGISTERED              → Status screen (accept T&C)
                        → Cannot access panel
                        → Wait for admin approval

PENDING_ADMIN_APPROVAL  → Status screen (waiting screen)
                        → Admin reviews
                        → Cannot access panel

APPROVED               → Tariff selection screen
                        → Cannot create content yet
                        → Select plan

TARIFF_SELECTED        → Status screen (waiting approval)
                        → Cannot create content yet
                        → Admin reviews tariff

WAITING_TARIFF_APPROVAL → Status screen (waiting screen)
                        → Cannot create content yet
                        → Admin reviews

ACTIVE                 → ✅ FULL ACCESS to Center Panel
                        → Can create courses/tests/etc
                        → Can publish content
                        → Can view analytics
```

### 2.3 Implementation

**Database:**
```sql
ALTER TABLE educational_centers
  ADD COLUMN status text NOT NULL 
    DEFAULT 'REGISTERED'
    CHECK (status IN ('REGISTERED', 'PENDING_ADMIN_APPROVAL', 
                      'APPROVED', 'TARIFF_SELECTED', 
                      'WAITING_TARIFF_APPROVAL', 'ACTIVE', 'REJECTED'));
```

**Route Guards:**
```typescript
// Frontend: Route guard checks status
if (center.status !== 'ACTIVE') {
  redirect to /center/status/${center.status}
}

// Backend: Every query filters by status
WHERE center.status = 'ACTIVE'
```

---

## 3. Data Model

### 3.1 Core Entities

```
educational_centers (Root)
├── id (uuid, PK)
├── owner_id (uuid, FK → profiles)
├── status (enum: REGISTERED...ACTIVE)
├── created_at, updated_at, deleted_at
├── metadata (JSONB for future fields)
│
├─> courses (center_id, PK)
│   ├── id (uuid, PK)
│   ├── center_id (uuid, FK)
│   ├── status (DRAFT, PUBLISHED)
│   ├── visibility (PUBLIC, PRIVATE)
│   ├── created_at, updated_at
│   │
│   ├─> lessons
│   │   ├── id, course_id, order_index
│   │   └── content (video, text, etc)
│   │
│   └─> course_tests
│       ├── id, course_id, test_id
│       ├── test_order, test_type
│       └── is_required
│
├─> tests (center_id, PK)
│   ├── id (uuid, PK)
│   ├── center_id (uuid, FK)
│   ├── status (DRAFT, PUBLISHED)
│   ├── created_at, updated_at
│   │
│   └─> questions
│       ├── id, test_id, order_index
│       ├── text, explanation, points
│       │
│       └─> question_options
│           ├── id, question_id
│           ├── text, is_correct
│
├─> olympiads (center_id, PK)
│   ├── id, center_id
│   ├── status (DRAFT, PENDING_ADMIN_APPROVAL, PUBLISHED)
│   ├── admin_id (who approved)
│   ├── approval_reason
│   ├── created_at, updated_at
│   │
│   ├─> olympiad_registrations
│   │   ├── user_id, olympiad_id
│   │   ├── status (REGISTERED, QUALIFIED, COMPLETED)
│   │
│   └─> olympiad_questions
│       └── Similar to test questions
│
├─> center_reels (center_id, PK)
│   ├── id, center_id
│   ├── status (DRAFT, PUBLISHED)
│   ├── created_at, updated_at
│   └── metadata (URL, thumbnail, etc)
│
└─> center_students (center_id, PK)
    ├── user_id, center_id
    ├── enrolled_at
    └── status (ACTIVE, SUSPENDED)

center_approvals (Audit Trail)
├── id (uuid, PK)
├── center_id (uuid, FK)
├── action_type (enum: CENTER_REGISTRATION, TARIFF_SELECTION, OLYMPIAD_APPROVAL)
├── status (PENDING, APPROVED, REJECTED)
├── admin_id (who approved/rejected)
├── reason
├── requested_at, reviewed_at
└── metadata (JSONB: what data was submitted)

audit_logs (Compliance)
├── id (uuid, PK)
├── center_id (uuid, FK)
├── table_name (courses, tests, questions, etc)
├── action (INSERT, UPDATE, DELETE)
├── record_id (uuid)
├── old_data, new_data (JSONB)
├── user_id (who made change)
├── created_at
└── reason (optional: why was this changed)
```

---

## 4. API Response Pattern

### 4.1 Standardized Response Format

Every API response follows this pattern:

```typescript
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, any>;
  };
  metadata?: {
    timestamp: ISO8601;
    requestId: string;
    version: string;
  };
}

// Success
{
  "success": true,
  "data": { ... },
  "metadata": { "timestamp": "2026-02-08T12:34:56Z", ... }
}

// Error
{
  "success": false,
  "error": {
    "code": "CENTER_NOT_ACTIVE",
    "message": "Center must be in ACTIVE status to create content",
    "details": { "currentStatus": "PENDING_ADMIN_APPROVAL" }
  }
}
```

### 4.2 Error Codes

```
// Authentication
AUTH_REQUIRED           - User not logged in
AUTH_EXPIRED           - Session expired
AUTH_INVALID           - Invalid token

// Authorization
PERMISSION_DENIED      - User lacks permission
OWNERSHIP_VIOLATION    - User doesn't own resource
ROLE_INSUFFICIENT      - Role doesn't allow action

// Center Status
CENTER_NOT_ACTIVE      - Center status doesn't allow access
CENTER_SUSPENDED       - Center is suspended
CENTER_NOT_FOUND       - Center doesn't exist

// Validation
VALIDATION_ERROR       - Input validation failed
MISSING_REQUIRED       - Required field missing
INVALID_STATE          - Action not valid in current state

// Content Rules
CANNOT_PUBLISH_EMPTY   - Content has no items
INVALID_CONTENT        - Content violates rules
DUPLICATE_ENTRY        - Entry already exists

// Database
DATABASE_ERROR         - Database operation failed
CONSTRAINT_VIOLATION   - Constraint violated
TRANSACTION_FAILED     - Transaction rolled back

// System
INTERNAL_ERROR         - Unexpected error
RATE_LIMITED           - Too many requests
SERVICE_UNAVAILABLE    - Service temporarily down
```

---

## 5. Enforcement Layers

### 5.1 Frontend (UX Layer)
- Validates input (type, length, format)
- Shows loading states
- Displays error messages
- Redirects based on status
- Prevents invalid actions (disable buttons, etc)

### 5.2 API/Hook Layer (Business Logic)
- Checks user authentication
- Validates center status
- Verifies ownership
- Applies business rules (can publish? has required fields?)
- Returns structured errors

### 5.3 Database Layer (Data Integrity)
- RLS policies enforce access
- Triggers validate state changes
- Constraints prevent invalid data
- Cascade deletes maintain consistency
- Audit logs record changes

### 5.4 Example: Publishing a Course

```
User clicks "Publish" button
    ↓
1. Frontend validates:
   - Course has title
   - At least 1 lesson
   - All lessons have content
   ↓
2. API layer checks:
   - User is authenticated
   - Center is ACTIVE
   - User owns course
   - Course has required fields
   - Tests inside course are valid
   ↓
3. Database layer:
   - RLS allows update
   - Trigger validates state
   - Constraint checks status enum
   - Audit log records change
   ↓
4. Response:
   - Success: { success: true, data: { course } }
   - Error: { success: false, error: { code, message } }
   ↓
5. UI:
   - Update course status in list
   - Show success notification
   - On error: show error notification
```

---

## 6. Module Integration Points

### 6.1 Module Interfaces

Each module (Courses, Tests, Olympiads, Reels) follows this interface:

```typescript
interface Module {
  // Data fetching
  fetch(centerId: string): Promise<Item[]>;
  fetchOne(id: string): Promise<Item | null>;
  
  // CRUD operations
  create(centerId: string, data: CreateInput): Promise<Item>;
  update(id: string, data: UpdateInput): Promise<Item>;
  delete(id: string): Promise<void>;
  
  // Status operations
  publish(id: string): Promise<Item>;
  unpublish(id: string): Promise<Item>;
  draft(id: string): Promise<Item>;
  
  // Validation
  canPublish(item: Item): { valid: boolean; errors: string[] };
  validate(data: CreateInput): ValidationResult;
  
  // Relationships
  getRelated(id: string): Promise<RelatedItems>;
  setRelated(id: string, related: RelatedItems): Promise<void>;
}
```

### 6.2 Module Dependencies

```
Courses
  ├─ Depends on: Lessons, Tests (optional)
  ├─ Depends on: Subjects, Users
  └─ Used by: Analytics, Feed

Tests
  ├─ Depends on: Questions
  ├─ Can be: Standalone OR Inside Course
  ├─ Depends on: Subjects
  └─ Used by: Analytics, Certificates

Questions
  ├─ Depends on: Tests (or Olympiads)
  ├─ Depends on: Options
  └─ Used by: Analytics, Difficulty tracking

Olympiads
  ├─ Depends on: Questions
  ├─ Requires: Admin approval
  ├─ Depends on: Registrations
  └─ Used by: Gamification, Leaderboards

Reels
  ├─ Depends on: Media/CDN
  ├─ Depends on: Subjects
  └─ Used by: Feed, Engagement

Analytics
  ├─ Consumes: All modules
  ├─ Tracks: Engagement, Performance
  └─ Used by: Center Dashboard, Admin

Admin Approvals
  ├─ Controls: Centers, Olympiads
  ├─ Uses: Audit logs
  └─ Impacts: All modules
```

---

## 7. Content Creation & Publishing Rules

### 7.1 Course Publishing Rules

```
Can PUBLISH course if:
  ✓ center.status === 'ACTIVE'
  ✓ course.title exists and not empty
  ✓ course.description exists
  ✓ course.subject_id exists
  ✓ course.thumbnail_url exists
  ✓ At least 1 lesson exists
  ✓ Each lesson has title and content (video OR description)
  ✓ All course_tests are valid (if any exist)

Cannot PUBLISH if:
  ✗ Any test inside course is DRAFT
  ✗ Any test inside course has 0 questions
  ✗ Any test inside course has questions without correct answers
  ✗ Required fields are missing

On Publish:
  → Set status = 'PUBLISHED'
  → Set published_at = NOW()
  → Audit log: { action: 'PUBLISH', data: { course_id, published_at } }
```

### 7.2 Test Publishing Rules

```
Can PUBLISH test if:
  ✓ center.status === 'ACTIVE'
  ✓ test.title exists
  ✓ At least 1 question exists
  ✓ Each question has text
  ✓ Each question has 2+ options
  ✓ Each question has exactly 1 correct answer
  ✓ Each question has points > 0

Cannot PUBLISH if:
  ✗ 0 questions
  ✗ Any question missing correct answer
  ✗ Any question has invalid options

On Publish:
  → Set status = 'PUBLISHED'
  → Calculate total_marks = SUM(questions.points)
  → Audit log: { action: 'PUBLISH', total_questions, total_marks }
```

### 7.3 Question Saving Rules

```
On CREATE:
  ✓ Validate question_text (1-2000 chars)
  ✓ Validate points (1-100)
  ✓ Validate 2-6 options exist
  ✓ Validate exactly 1 correct answer
  ✓ Check center ownership of test
  
  → Save question (immediately)
  → Save options (immediately)
  → Update test.questions_count
  → Return question with all data
  
  On SUCCESS:
  → Toast: "Question added"
  → Refetch questions
  → UI updates instantly
  
  On ERROR:
  → Toast: Specific error message
  → Rollback any partial saves
  → Log error for debugging

On DELETE:
  → Delete question
  → Delete all related options (cascade)
  → Update test.questions_count
  → Audit log: { action: 'DELETE', question_id }

On UPDATE:
  → Validate new data
  → Update fields
  → Audit log: { action: 'UPDATE', changes: { old, new } }
```

---

## 8. Admin Approval Workflow

### 8.1 Approval Types

```
1. CENTER_REGISTRATION
   - Trigger: Center registration completes
   - Admin reviews: Basic info, documents
   - Action: APPROVE → status = APPROVED
           REJECT  → status = REJECTED (with reason)

2. TARIFF_SELECTION
   - Trigger: Center selects pricing plan
   - Admin reviews: Plan limits, pricing
   - Action: APPROVE → status = ACTIVE (center unlocked!)
           REJECT  → status = APPROVED (go back to tariff selection)

3. OLYMPIAD_LAUNCH
   - Trigger: Center publishes olympiad
   - Admin reviews: Questions, rules, prizes
   - Action: APPROVE → olympiad visible to users
           REJECT  → status = DRAFT (must fix)
           REQUEST_CHANGES → message sent to center

4. CONTENT_SUSPENSION
   - Trigger: Manual admin action
   - Reason: Inappropriate content, copyright, etc
   - Action: SUSPEND course/test/reel
           UNSUSPEND after review
```

### 8.2 Approval Data

```
center_approvals:
  - id (uuid)
  - center_id (uuid) → FK
  - action_type (enum above)
  - status (PENDING, APPROVED, REJECTED)
  - admin_id (uuid) → who reviewed
  - reason (text) → approval/rejection reason
  - requested_at (timestamp)
  - reviewed_at (timestamp)
  - metadata (JSONB) → what was submitted
  - response_message (text) → message to center
```

### 8.3 Admin Actions

```
# View pending approvals
GET /admin/approvals?status=PENDING

# Approve
POST /admin/approvals/:id/approve
{
  "reason": "Documentation verified",
  "metadata": { ... }
}

# Reject
POST /admin/approvals/:id/reject
{
  "reason": "Invalid pricing plan",
  "message": "Pricing plan selected doesn't match guidelines. Please..."
}

# Request changes
POST /admin/approvals/:id/request-changes
{
  "message": "Please add more questions to the olympiad"
}
```

---

## 9. Audit & Compliance

### 9.1 Audit Log Schema

```
audit_logs:
  - id (uuid, PK)
  - center_id (uuid, FK)
  - table_name (courses, tests, questions, olympiads, etc)
  - action (INSERT, UPDATE, DELETE, PUBLISH, UNPUBLISH)
  - record_id (uuid) → what was modified
  - old_data (JSONB) → before state
  - new_data (JSONB) → after state
  - user_id (uuid) → who made change
  - ip_address (text) → from where
  - user_agent (text) → what device
  - created_at (timestamp)
  - reason (text, optional) → why was this changed
```

### 9.2 What Gets Logged

```
✓ All CREATE, UPDATE, DELETE operations
✓ All status changes (DRAFT → PUBLISHED, etc)
✓ All admin approvals/rejections
✓ Center status transitions
✓ User logins (in separate auth_logs table)
✓ Mass operations (bulk delete, etc)

✗ Read operations (SELECT) - too much noise
✗ Failed validation attempts
```

### 9.3 Compliance Queries

```
# Who published this course?
SELECT * FROM audit_logs
WHERE table_name = 'courses'
  AND record_id = course_id
  AND action = 'PUBLISH'
ORDER BY created_at DESC
LIMIT 1;

# What changed in this course?
SELECT * FROM audit_logs
WHERE table_name = 'courses'
  AND record_id = course_id
ORDER BY created_at DESC;

# Suspicious activity check
SELECT user_id, COUNT(*) as changes
FROM audit_logs
WHERE created_at > NOW() - INTERVAL '1 hour'
GROUP BY user_id
HAVING COUNT(*) > 100;
```

---

## 10. Error Handling & Recovery

### 10.1 Frontend Error Boundaries

```typescript
// Wrap each module section with error boundary
<ErrorBoundary module="Courses" fallback={<CoursesError />}>
  <CoursesSection />
</ErrorBoundary>

// Shows:
// - Error message
// - Retry button
// - Report issue link
// - Log captured for debugging
```

### 10.2 API Error Handling

```typescript
// Every mutation catches and structures errors
try {
  const result = await publishCourse(courseId);
  return { success: true, data: result };
} catch (error) {
  // Map Supabase errors to app errors
  if (error.code === '23505') {
    return {
      success: false,
      error: {
        code: 'DUPLICATE_ENTRY',
        message: 'A course with this name already exists'
      }
    };
  }
  
  // Log unknown errors
  logError(error, { context: 'publishCourse', courseId });
  
  return {
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: 'Failed to publish course'
    }
  };
}
```

### 10.3 Recovery Strategies

```
On Network Error:
  → Show "Connection lost" banner
  → Retry button
  → Queue operations for retry when online
  → Sync on reconnection

On Validation Error:
  → Show specific field errors
  → Highlight problematic fields
  → Suggest fixes

On Permission Error:
  → Show "Access denied" message
  → Offer to logout/re-login
  → Contact support link

On Database Error:
  → Show "Server error" message
  → Log for debugging
  → Offer to retry
  → Contact support if persists

On Conflict (Race Condition):
  → Refresh data from server
  → Show conflict dialog
  → Let user choose: Keep new, Keep old, Review both
```

---

## 11. Scalability & Extension

### 11.1 Adding New Modules

To add a new module (e.g., "Assignments"):

1. **Create table** with standard columns
   ```sql
   CREATE TABLE assignments (
     id uuid PRIMARY KEY,
     center_id uuid NOT NULL REFERENCES educational_centers(id),
     status text NOT NULL DEFAULT 'DRAFT',
     created_at, updated_at, deleted_at
   );
   ```

2. **Add RLS policies**
   ```sql
   -- Centers can view/edit their own
   CREATE POLICY "centers_assignments"
   ON assignments
   FOR SELECT USING (...)
   ```

3. **Create hooks** (use same pattern as courses/tests)
   ```typescript
   export const useAssignments = (centerId) => { ... }
   export const useCreateAssignment = () => { ... }
   export const usePublishAssignment = () => { ... }
   ```

4. **Create UI component** (follow same structure)
   ```
   AssignmentsTab.tsx
   AssignmentCard.tsx
   AssignmentForm.tsx
   ```

5. **Add to navigation**
   ```tsx
   <CenterPanelNav>
     <NavItem href="/assignments" icon={FileText}>Assignments</NavItem>
   </CenterPanelNav>
   ```

6. **Add to admin panel** (if approval needed)

### 11.2 Adding Payment Integration

To add payments later:

1. **Add fields to center**
   ```sql
   ALTER TABLE educational_centers
   ADD COLUMN subscription_tier TEXT,
   ADD COLUMN payment_status TEXT,
   ADD COLUMN billing_date TIMESTAMP;
   ```

2. **Create webhooks** for Stripe/payment provider
   ```
   POST /webhooks/payment/charge-succeeded
   POST /webhooks/payment/subscription-updated
   POST /webhooks/payment/charge-failed
   ```

3. **Add hooks** for payment operations
   ```typescript
   useUpgradeSubscription()
   useCancelSubscription()
   useUpdatePaymentMethod()
   ```

4. **Add UI** for payment flows
   ```
   PaymentMethods.tsx
   SubscriptionUpgrade.tsx
   BillingHistory.tsx
   ```

5. **Update status validation**
   ```typescript
   if (payment_status !== 'ACTIVE') {
     // Limit features or show upgrade prompt
   }
   ```

### 11.3 Adding Gamification

To add gamification (badges, leaderboards):

1. **Create tables**
   ```sql
   CREATE TABLE achievements (...)
   CREATE TABLE user_achievements (...)
   CREATE TABLE leaderboards (...)
   ```

2. **Add tracking hooks**
   ```typescript
   useUserAchievements()
   useLeaderboard()
   trackUserAction() // Internal
   ```

3. **Add UI components**
   ```
   AchievementBadge.tsx
   Leaderboard.tsx
   UserStats.tsx
   ```

4. **Reuse existing data**
   ```
   Same analytics data
   Same user profiles
   Same center tracking
   ```

---

## 12. Development Patterns

### 12.1 Hook Pattern (Data Layer)

```typescript
// 1. Query hook (read data)
export const useModuleItems = (centerId: string) => {
  return useQuery({
    queryKey: ['module-items', centerId],
    queryFn: async () => {
      if (!centerId) return [];
      const { data, error } = await supabase
        .from('module_items')
        .select('*')
        .eq('center_id', centerId);
      if (error) throw new Error(error.message);
      return data;
    },
    enabled: !!centerId,
  });
};

// 2. Mutation hook (write data)
export const useCreateModuleItem = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async (input: CreateInput) => {
      // Validate
      if (!user?.id) throw new Error('Not authenticated');
      
      const validation = validateInput(input);
      if (!validation.valid) {
        throw new Error(validation.errors[0]);
      }
      
      // Create
      const { data, error } = await supabase
        .from('module_items')
        .insert({ ...input, created_by: user.id })
        .select()
        .single();
      
      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: (data, variables) => {
      // Invalidate queries to refetch
      queryClient.invalidateQueries({
        queryKey: ['module-items', variables.centerId]
      });
    },
    onError: (error) => {
      console.error('Create failed:', error);
      // Error toast shown in component
    },
  });
};
```

### 12.2 Component Pattern (UI Layer)

```typescript
// 1. Container component (handles data fetching, state)
const ModuleContainer: FC<{ centerId: string }> = ({ centerId }) => {
  const { data: items, isLoading, error } = useModuleItems(centerId);
  
  if (isLoading) return <LoadingState />;
  if (error) return <ErrorState error={error} />;
  if (!items?.length) return <EmptyState />;
  
  return <ModuleList items={items} />;
};

// 2. Presenter component (just renders, no logic)
const ModuleList: FC<{ items: Item[] }> = ({ items }) => {
  return (
    <div className="grid">
      {items.map(item => (
        <ModuleCard key={item.id} item={item} />
      ))}
    </div>
  );
};

// 3. Item component (individual item)
const ModuleCard: FC<{ item: Item }> = ({ item }) => {
  const updateMutation = useUpdateModuleItem();
  const deleteMutation = useDeleteModuleItem();
  
  return (
    <Card>
      <CardContent>
        <h3>{item.title}</h3>
        <p>{item.description}</p>
        <Badge>{item.status}</Badge>
        <Button 
          onClick={() => updateMutation.mutate({ id: item.id, ... })}
          disabled={updateMutation.isPending}
        >
          {updateMutation.isPending ? 'Saving...' : 'Edit'}
        </Button>
      </CardContent>
    </Card>
  );
};
```

---

## 13. Database Layer Implementation

All rules enforced at DB level (not just app):

```sql
-- 1. Status validation trigger
CREATE FUNCTION validate_center_status()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status NOT IN ('REGISTERED', 'PENDING_ADMIN_APPROVAL', 
                        'APPROVED', 'TARIFF_SELECTED', 
                        'WAITING_TARIFF_APPROVAL', 'ACTIVE', 'REJECTED') THEN
    RAISE EXCEPTION 'Invalid center status';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Publish validation trigger (can't publish incomplete content)
CREATE FUNCTION validate_course_publish()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'PUBLISHED' AND OLD.status != 'PUBLISHED' THEN
    -- Check has lessons
    IF NOT EXISTS (SELECT 1 FROM lessons WHERE course_id = NEW.id) THEN
      RAISE EXCEPTION 'Course must have at least one lesson';
    END IF;
    
    -- Check tests (if any) are valid
    IF EXISTS (
      SELECT 1 FROM course_tests ct
      JOIN tests t ON t.id = ct.test_id
      WHERE ct.course_id = NEW.id
      AND (t.status != 'PUBLISHED' OR t.questions_count = 0)
    ) THEN
      RAISE EXCEPTION 'All tests must be published with questions';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Audit logging trigger
CREATE FUNCTION log_audit()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO audit_logs 
    (table_name, action, record_id, old_data, new_data, user_id)
  VALUES (
    TG_TABLE_NAME,
    TG_OP,
    COALESCE(NEW.id, OLD.id),
    to_jsonb(OLD),
    to_jsonb(NEW),
    current_user_id()
  );
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- 4. RLS policies enforce ownership
CREATE POLICY "Centers can only see own content"
ON courses
FOR SELECT
USING (
  center_id IN (
    SELECT id FROM educational_centers
    WHERE owner_id = auth.uid()
  )
);
```

---

## 14. Testing Strategy

### 14.1 Test Categories

```
Unit Tests:
  - Validation functions
  - Data transformations
  - Error handling
  
Integration Tests:
  - Hooks with Supabase
  - Component rendering
  - Form submissions
  
E2E Tests:
  - Full workflows (course creation → publish)
  - Status transitions (DRAFT → PUBLISHED)
  - Admin approvals
  - Error recovery

Performance Tests:
  - Query speed (should be <500ms)
  - Load 1000 items smoothly
  - Memory usage under load
```

---

## 15. Migration & Rollout

### 15.1 Deployment Order

1. **Database** (migrations first)
   - Create new tables
   - Add columns
   - Set up RLS
   - Create triggers

2. **Backend** (API layer)
   - Deploy hooks
   - Deploy validation
   - Deploy approval workflows

3. **Frontend** (UI layer)
   - Deploy components
   - Deploy status guards
   - Deploy error boundaries

4. **Admin** (management layer)
   - Deploy admin panel updates
   - Deploy approval workflows

5. **Test & Monitor**
   - Run test suite
   - Monitor error rates
   - Check performance
   - Gradually roll out to users

---

## 16. Checklist for Rock-Solid System

- [ ] Status enforcement at all 3 layers (frontend/API/DB)
- [ ] No broken content possible (validation rules)
- [ ] All errors caught and shown to user
- [ ] Audit logs track all critical actions
- [ ] Admin panel has full control
- [ ] Every module follows same patterns
- [ ] Easy to add new modules
- [ ] Payment system can be plugged in
- [ ] Documentation complete
- [ ] Tests cover critical paths
- [ ] Performance acceptable
- [ ] Monitoring in place

---

This architecture is **production-ready**, **maintainable**, and **extensible**. Every principle prevents broken flows while keeping the system simple to understand and extend.
