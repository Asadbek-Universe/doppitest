# Center Panel Enterprise Architecture - Implementation Guide

## Overview

This guide explains how to implement the rock-solid Center Panel architecture across all modules. The system is designed to prevent broken flows, ensure data integrity, and scale to new features.

**Key Files Created:**
1. `/docs/SYSTEM_ARCHITECTURE.md` - Complete system design (16 sections, production-ready)
2. `/supabase/migrations/20260208_002_center_panel_infrastructure.sql` - Database schema
3. `/src/lib/api-response.ts` - Standardized API response patterns
4. `/src/lib/status-enforcement.ts` - Status validation and enforcement
5. `/src/hooks/useCourseManagement.ts` - Example module hooks with all patterns

---

## Part 1: Understanding the Three-Layer Enforcement

### Layer 1: Frontend (UX)
```typescript
// Validates for user experience
- Show loading states
- Display error messages
- Disable buttons when not allowed
- Redirect based on status
```

### Layer 2: API/Hooks (Business Logic)
```typescript
// Enforces business rules
- Check user authentication
- Verify center status
- Validate ownership
- Apply business rules
- Return structured errors
```

### Layer 3: Database (Data Integrity)
```typescript
-- Enforces at data level
- RLS policies prevent access
- Triggers validate state changes
- Constraints prevent invalid data
- Cascade deletes maintain consistency
```

**Example: Publishing a Course**
```
User clicks "Publish" button
    ↓
Frontend validates (has title, lessons, etc)
    ↓
API checks auth, status, ownership
    ↓
Trigger validates publication rules
    ↓
Constraint checks status is valid enum
    ↓
Audit log records the action
```

---

## Part 2: Status Enforcement System

### Center Status Flow

```
START → REGISTERED
  ↓ (Admin approves)
PENDING_ADMIN_APPROVAL
  ↓ (Auto-approved or manual)
APPROVED
  ↓ (Center selects tariff)
TARIFF_SELECTED
  ↓ (Admin reviews tariff)
WAITING_TARIFF_APPROVAL
  ↓ (Admin approves)
ACTIVE ← Can create content here!
```

### Accessing Status Enforcement

```typescript
// In a React component
import { useIsCenterActive, useCanAccess } from '@/lib/status-enforcement';

function CoursesTab() {
  const { isActive, status, access } = useIsCenterActive();
  const canCreate = useCanAccess('createContent');
  
  if (!isActive) {
    return <StatusWaitingScreen status={status} />;
  }
  
  if (!canCreate) {
    return <FeatureLockedScreen />;
  }
  
  return <CoursesList />;
}
```

### Adding Status Checks to Mutations

```typescript
// In a hook mutation
export function useCreateCourse() {
  return useMutation({
    mutationFn: async (input) => {
      // 1. Check auth
      if (!user?.id) throw new Error('Not authenticated');
      
      // 2. Check center is ACTIVE
      const guardError = await guardRequireActiveCenter(user.id, 'createCourse');
      if (guardError) throw new Error(guardError.error?.message);
      
      // 3. Validate input
      courseCreateSchema.parse(input);
      
      // 4. Create in database
      return supabase.from('courses').insert({ ... });
    }
  });
}
```

---

## Part 3: API Response Patterns

### Every Response is Consistent

```typescript
// Success
{
  "success": true,
  "data": { ... },
  "metadata": { timestamp, requestId, version }
}

// Error
{
  "success": false,
  "error": {
    "code": "CENTER_NOT_ACTIVE",
    "message": "Your center must be ACTIVE to create content",
    "details": { currentStatus: "PENDING_ADMIN_APPROVAL" }
  }
}
```

### Creating Responses

```typescript
import { 
  createSuccessResponse, 
  createErrorResponse,
  ErrorCode 
} from '@/lib/api-response';

// Success
const result = createSuccessResponse({ courseId: '123' });

// Error
const error = createErrorResponse(
  ErrorCode.CENTER_NOT_ACTIVE,
  { currentStatus: 'PENDING_ADMIN_APPROVAL' }
);
```

### Error Codes Reference

```typescript
// Authentication
AUTH_REQUIRED           // User not logged in
AUTH_EXPIRED            // Session expired
AUTH_INVALID            // Invalid credentials

// Authorization
PERMISSION_DENIED       // Insufficient permissions
OWNERSHIP_VIOLATION     // User doesn't own resource
ROLE_INSUFFICIENT       // Role not allowed

// Center Status
CENTER_NOT_ACTIVE       // Must be ACTIVE for this
CENTER_SUSPENDED        // Center suspended
CENTER_NOT_FOUND        // Center doesn't exist

// Validation
VALIDATION_ERROR        // Input invalid
MISSING_REQUIRED        // Required field missing
INVALID_STATE           // Action not valid now

// Content Rules
CANNOT_PUBLISH_EMPTY    // Missing required items
INVALID_CONTENT         // Content violates rules
DUPLICATE_ENTRY         // Entry already exists

// Database
DATABASE_ERROR          // Query failed
CONSTRAINT_VIOLATION    // Constraint violated
TRANSACTION_FAILED      // Transaction rolled back

// System
INTERNAL_ERROR          // Unexpected error
RATE_LIMITED            // Too many requests
SERVICE_UNAVAILABLE     // Service down
```

---

## Part 4: Building a New Module

To add a new module (e.g., Assignments), follow these 8 steps:

### Step 1: Create Database Table

```sql
CREATE TABLE assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  center_id UUID NOT NULL REFERENCES educational_centers(id),
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'DRAFT'
    CHECK (status IN ('DRAFT', 'PUBLISHED')),
  published_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_assignments_center ON assignments(center_id);
CREATE INDEX idx_assignments_status ON assignments(status);
```

### Step 2: Add RLS Policies

```sql
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;

-- Centers can manage own
CREATE POLICY "Centers can manage own assignments"
ON assignments
USING (
  center_id IN (
    SELECT id FROM educational_centers
    WHERE owner_id = auth.uid()
  )
)
WITH CHECK (
  center_id IN (
    SELECT id FROM educational_centers
    WHERE owner_id = auth.uid()
  )
);

-- Users can view published
CREATE POLICY "Users can view published assignments"
ON assignments FOR SELECT
USING (status = 'PUBLISHED');
```

### Step 3: Add Audit Trigger

```sql
DROP TRIGGER IF EXISTS audit_assignments ON assignments;
CREATE TRIGGER audit_assignments 
AFTER INSERT OR UPDATE OR DELETE ON assignments
FOR EACH ROW EXECUTE FUNCTION audit_trigger();
```

### Step 4: Create Validation Schemas

```typescript
// src/hooks/useAssignmentManagement.ts

import { z } from 'zod';

const assignmentCreateSchema = z.object({
  title: z.string().min(3).max(100),
  description: z.string().min(10).max(500),
  due_date: z.string().datetime().optional(),
});

type AssignmentCreateInput = z.infer<typeof assignmentCreateSchema>;
```

### Step 5: Create Query Hooks

```typescript
export function useMyAssignments() {
  const { user } = useAuth();
  const { data: center } = useMyCenterData();

  return useQuery({
    queryKey: ['my-assignments', center?.id],
    queryFn: async () => {
      if (!center?.id) return [];

      const { data, error } = await supabase
        .from('assignments')
        .select('*')
        .eq('center_id', center.id)
        .order('created_at', { ascending: false });

      if (error) throw new Error(error.message);
      return data;
    },
    enabled: !!center?.id,
  });
}
```

### Step 6: Create Mutation Hooks

```typescript
export function useCreateAssignment() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { data: center } = useMyCenterData();

  return useMutation({
    mutationFn: async (input: AssignmentCreateInput) => {
      // 1. Auth check
      if (!user?.id) throw new Error('Not authenticated');
      if (!center?.id) throw new Error('Center not found');

      // 2. Validate input
      try {
        assignmentCreateSchema.parse(input);
      } catch (error) {
        if (error instanceof z.ZodError) {
          throw new Error(
            error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join('; ')
          );
        }
        throw error;
      }

      // 3. Status enforcement
      const guardError = await guardRequireActiveCenter(user.id, 'createAssignment');
      if (guardError) throw new Error(guardError.error?.message);

      // 4. Create
      const { data, error } = await supabase
        .from('assignments')
        .insert({
          center_id: center.id,
          ...input,
          status: 'DRAFT',
        })
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data;
    },

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-assignments'] });
    },
  });
}
```

### Step 7: Create UI Component

```typescript
// src/components/center/AssignmentsTab.tsx

import { useMyAssignments, useCreateAssignment } from '@/hooks/useAssignmentManagement';
import { useCanAccess } from '@/lib/status-enforcement';

export function AssignmentsTab() {
  const canCreate = useCanAccess('createContent');
  const { data: assignments, isLoading } = useMyAssignments();
  const createMutation = useCreateAssignment();

  if (isLoading) return <LoadingState />;
  if (!assignments?.length) return <EmptyState />;

  return (
    <div>
      {canCreate && (
        <Button onClick={() => createMutation.mutate({ ... })}>
          New Assignment
        </Button>
      )}
      
      {assignments.map(assignment => (
        <AssignmentCard key={assignment.id} assignment={assignment} />
      ))}
    </div>
  );
}
```

### Step 8: Add to Navigation

```typescript
// In CenterPanel.tsx or navigation component

import { AssignmentsTab } from '@/components/center/AssignmentsTab';

<CenterPanelNav>
  <NavItem href="/assignments" icon={FileText}>
    Assignments
  </NavItem>
</CenterPanelNav>

// Route handler
<Route path="/assignments" element={<AssignmentsTab />} />
```

---

## Part 5: Publishing Rules & Validation

### Publishing a Course (Real Example)

```typescript
export function usePublishCourse() {
  return useMutation({
    mutationFn: async (courseId: string) => {
      // 1. Permission check
      const guardError = await guardCanPublish(courseId, user.id);
      if (guardError) throw new Error(guardError.error?.message);

      // 2. Fetch with all relationships
      const { data: course } = await supabase
        .from('courses')
        .select(`
          *,
          lessons(*),
          course_tests(tests(*))
        `)
        .eq('id', courseId)
        .single();

      // 3. Validate rules
      const errors = [];
      
      if (!course.title) errors.push('Course must have a title');
      if (!course.description) errors.push('Course must have a description');
      if (!course.lessons?.length) errors.push('Course must have at least one lesson');
      
      // Check all tests
      if (course.course_tests) {
        for (const ct of course.course_tests) {
          if (ct.tests.status !== 'PUBLISHED') {
            errors.push(`Test "${ct.tests.title}" is not published`);
          }
          if (ct.tests.questions_count === 0) {
            errors.push(`Test "${ct.tests.title}" has no questions`);
          }
        }
      }

      if (errors.length > 0) {
        throw new Error(errors.join('\n'));
      }

      // 4. Publish
      const { data, error } = await supabase
        .from('courses')
        .update({
          status: 'PUBLISHED',
          published_at: new Date().toISOString(),
        })
        .eq('id', courseId)
        .select()
        .single();

      if (error) throw new Error(error.message);

      // 5. Audit log
      await supabase.from('audit_logs').insert({
        table_name: 'courses',
        action: 'PUBLISH',
        record_id: courseId,
        user_id: user.id,
      });

      return data;
    },
  });
}
```

### Publishing a Test

```typescript
// Must have:
// ✓ Center is ACTIVE
// ✓ Test has title
// ✓ At least 1 question
// ✓ Each question has 2+ options
// ✓ Each question has exactly 1 correct answer
// ✓ Each question has points > 0

// Cannot publish if:
// ✗ 0 questions
// ✗ Any question missing correct answer
// ✗ Any question missing title
```

---

## Part 6: Admin Approval Workflows

### Approving a Center

```typescript
import { approveCenterRegistration } from '@/lib/status-enforcement';

// In admin panel
async function handleApproveCenter(centerId: string) {
  const response = await approveCenterRegistration(
    centerId,
    adminId,
    'All documents verified'
  );
  
  if (response.success) {
    toast('Center approved! They can now select a tariff.');
  } else {
    toast(`Error: ${response.error?.message}`);
  }
}
```

### Rejecting a Center

```typescript
import { rejectCenterRegistration } from '@/lib/status-enforcement';

async function handleRejectCenter(centerId: string) {
  const response = await rejectCenterRegistration(
    centerId,
    adminId,
    'Education license is not valid for this region'
  );
  
  if (response.success) {
    toast('Center rejected. They have been notified.');
  }
}
```

### Approving Olympiad

```typescript
// In olympiad approval flow
async function approveOlympiad(olympiadId: string) {
  const { error } = await supabase
    .from('olympiads')
    .update({
      status: 'PUBLISHED',
      admin_approved_by: adminId,
      approval_reason: 'Questions reviewed and approved',
      approved_at: new Date().toISOString(),
    })
    .eq('id', olympiadId);

  // Log
  await supabase.from('center_approvals').insert({
    center_id: centerIdFromOlympiad,
    action_type: 'OLYMPIAD_APPROVAL',
    status: 'APPROVED',
    admin_id: adminId,
    reason: 'Olympiad published',
  });
}
```

---

## Part 7: Error Handling in Components

### Using Try-Catch with API Responses

```typescript
function CourseForm() {
  const createMutation = useCreateCourse();

  async function handleSubmit(data) {
    try {
      await createMutation.mutateAsync(data);
      toast('Course created!');
    } catch (error) {
      // Error message is already formatted by mutation
      const message = error instanceof Error 
        ? error.message 
        : 'Failed to create course';
      toast(message, { type: 'error' });
    }
  }
}
```

### Using Error Boundaries

```typescript
// src/components/ErrorBoundary.tsx

export class ErrorBoundary extends React.Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-container">
          <h2>Something went wrong</h2>
          <p>{this.state.error?.message}</p>
          <Button onClick={() => window.location.reload()}>
            Reload
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}

// Wrap sections
<ErrorBoundary>
  <CoursesTab />
</ErrorBoundary>
```

### Displaying Field Errors

```typescript
function CourseForm() {
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (data) => {
    try {
      setFieldErrors({}); // Clear previous
      await createMutation.mutateAsync(data);
    } catch (error) {
      // Try to parse as validation error
      if (error.message.includes(':')) {
        const errors: Record<string, string> = {};
        error.message.split(';').forEach(err => {
          const [field, msg] = err.split(':');
          errors[field.trim()] = msg.trim();
        });
        setFieldErrors(errors);
      } else {
        toast(error.message, { type: 'error' });
      }
    }
  };

  return (
    <form>
      <Input 
        name="title" 
        error={fieldErrors.title}
      />
      {fieldErrors.title && (
        <span className="text-red-500">{fieldErrors.title}</span>
      )}
    </form>
  );
}
```

---

## Part 8: Audit Logging & Compliance

### What Gets Logged Automatically

```typescript
// Every INSERT/UPDATE/DELETE on core tables logs:
- table_name: "courses"
- action: "INSERT", "UPDATE", or "DELETE"
- record_id: the course ID
- old_data: previous values
- new_data: new values
- user_id: who made change
- created_at: when it happened
```

### Querying Audit Logs

```typescript
// See course history
const { data: history } = await supabase
  .from('audit_logs')
  .select('*')
  .eq('table_name', 'courses')
  .eq('record_id', courseId)
  .order('created_at', { ascending: false });

// See all changes by user
const { data: userActions } = await supabase
  .from('audit_logs')
  .select('*')
  .eq('user_id', userId)
  .gte('created_at', oneWeekAgo)
  .order('created_at', { ascending: false });

// Detect suspicious activity
const { data: suspicious } = await supabase
  .from('audit_logs')
  .select('*')
  .gte('created_at', oneHourAgo)
  .order('created_at', { ascending: false })
  .limit(1000);

// Count changes
const changes = suspicious.reduce((acc, log) => {
  acc[log.user_id] = (acc[log.user_id] || 0) + 1;
  return acc;
}, {});

const problematicUsers = Object.entries(changes)
  .filter(([_, count]) => count > 100)
  .map(([userId, _]) => userId);
```

---

## Part 9: Database Migrations

### Running Migrations

```bash
# Create migration
supabase migration new add_assignments_table

# Edit the migration file
# Then apply locally
supabase migration up

# When ready for production
supabase db push
```

### Migration Checklist

- [ ] Table created with center_id FK
- [ ] Indexes created for performance
- [ ] RLS policies added
- [ ] Audit trigger applied
- [ ] Status enum validated if applicable
- [ ] Constraints added
- [ ] Documentation updated
- [ ] Tested locally
- [ ] Code review completed

---

## Part 10: Testing Checklist

Before launching a new feature:

### Unit Tests
- [ ] Validation schemas work correctly
- [ ] Error messages are clear
- [ ] Status checks reject unauthorized access

### Integration Tests
- [ ] Can create item in DRAFT status
- [ ] Cannot create when center is not ACTIVE
- [ ] Publish validation catches incomplete items
- [ ] Cannot publish without required fields
- [ ] Ownership verification works

### E2E Tests
- [ ] Full flow: create → edit → publish
- [ ] Publishing with invalid state shows error
- [ ] Status transition blocks operations
- [ ] Audit log records all actions
- [ ] Error boundaries display correctly

### Manual QA
- [ ] All error messages are clear
- [ ] Loading states show
- [ ] Success notifications appear
- [ ] Buttons disable when not allowed
- [ ] Form validation shows errors

---

## Part 11: Performance Optimization

### Query Optimization

```typescript
// BAD: Multiple queries
const courses = await supabase.from('courses').select('*').eq('center_id', id);
const lessons = await supabase.from('lessons').select('*');
const tests = await supabase.from('tests').select('*');

// GOOD: Single query with relationships
const { data } = await supabase
  .from('courses')
  .select(`
    *,
    lessons(*),
    course_tests(*, tests(*))
  `)
  .eq('center_id', id);
```

### Caching Strategy

```typescript
// Use React Query defaults
useQuery({
  queryKey: ['courses', centerId],
  queryFn: async () => { ... },
  // Default: staleTime 0, gcTime 5 minutes
});

// Cache for longer if data changes infrequently
useQuery({
  queryKey: ['center-settings'],
  queryFn: async () => { ... },
  staleTime: 1000 * 60 * 5, // 5 minutes
  gcTime: 1000 * 60 * 30, // 30 minutes
});
```

### Pagination

```typescript
export function useCoursesPage(page: number) {
  const pageSize = 20;
  const offset = (page - 1) * pageSize;

  return useQuery({
    queryKey: ['courses', page],
    queryFn: async () => {
      const { data, error, count } = await supabase
        .from('courses')
        .select('*', { count: 'exact' })
        .range(offset, offset + pageSize - 1)
        .order('created_at', { ascending: false });

      if (error) throw new Error(error.message);
      return { data, total: count };
    },
  });
}
```

---

## Part 12: Common Patterns

### Delete with Confirmation

```typescript
function CourseCard({ course }: { course: Course }) {
  const [showConfirm, setShowConfirm] = useState(false);
  const deleteMutation = useDeleteCourse();

  if (showConfirm) {
    return (
      <Dialog open={true} onOpenChange={setShowConfirm}>
        <DialogContent>
          <h2>Delete Course?</h2>
          <p>This action cannot be undone.</p>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowConfirm(false)}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive"
              onClick={() => deleteMutation.mutate(course.id)}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Card>
      <CardContent>
        <h3>{course.title}</h3>
        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => setShowConfirm(true)}
        >
          Delete
        </Button>
      </CardContent>
    </Card>
  );
}
```

### Optimistic Update

```typescript
// When user experience is more important
function CourseCard({ course }: { course: Course }) {
  const queryClient = useQueryClient();
  const updateMutation = useUpdateCourse();

  const handlePublish = async () => {
    // Optimistically update UI
    queryClient.setQueryData(['course', course.id], {
      ...course,
      status: 'PUBLISHED',
    });

    // Make request
    updateMutation.mutate(
      { courseId: course.id, data: { status: 'PUBLISHED' } },
      {
        onError: () => {
          // Rollback on error
          queryClient.invalidateQueries({
            queryKey: ['course', course.id],
          });
        },
      }
    );
  };
}
```

---

## Quick Reference

### Creating a Course
```typescript
const createMutation = useCreateCourse();
await createMutation.mutateAsync({
  title: "Python Basics",
  description: "Learn Python from scratch",
  level: "BEGINNER",
  language: "en"
});
```

### Publishing a Course
```typescript
const publishMutation = usePublishCourse();
await publishMutation.mutateAsync(courseId);
```

### Adding Test to Course
```typescript
const addTestMutation = useAddTestToCourse();
await addTestMutation.mutateAsync({
  courseId,
  testId,
  testType: 'practice',
  isRequired: false
});
```

### Checking Center Status
```typescript
const { isActive, status, access } = useIsCenterActive();
if (!isActive) {
  return <StatusPage status={status} />;
}
```

### Handling Errors
```typescript
try {
  await operation();
  toast('Success!');
} catch (error) {
  const message = error instanceof Error 
    ? error.message 
    : 'An error occurred';
  toast(message, { type: 'error' });
}
```

---

## Next Steps

1. **Apply Migrations** - Run database migration
2. **Create Status Pages** - Build REGISTERED, APPROVED, etc. status screens
3. **Build Remaining Modules** - Olympiads, Reels, Students using same pattern
4. **Create Admin Panel** - Approvals, audit logs, user management
5. **Add Tests** - Unit, integration, E2E tests
6. **Deploy** - Stage → Production with monitoring

---

## Files to Review

- **System Architecture**: `/docs/SYSTEM_ARCHITECTURE.md`
- **Database Schema**: `/supabase/migrations/20260208_002_center_panel_infrastructure.sql`
- **API Responses**: `/src/lib/api-response.ts`
- **Status Enforcement**: `/src/lib/status-enforcement.ts`
- **Example Module**: `/src/hooks/useCourseManagement.ts`

---

## Support

For questions about:
- **Architecture decisions** → See `/docs/SYSTEM_ARCHITECTURE.md`
- **API patterns** → See `/src/lib/api-response.ts`
- **Status flows** → See `/src/lib/status-enforcement.ts`
- **Module structure** → See `/src/hooks/useCourseManagement.ts`
