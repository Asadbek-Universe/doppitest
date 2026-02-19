# Quick Start: Center Panel Architecture

**TL;DR** - Copy-paste templates to build features that never break.

---

## 🚀 Creating a New Module in 5 Minutes

### 1. Database Table
```sql
CREATE TABLE assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  center_id UUID NOT NULL REFERENCES educational_centers(id),
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'DRAFT'
    CHECK (status IN ('DRAFT', 'PUBLISHED')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_assignments_center ON assignments(center_id);
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;

-- Centers can manage own
CREATE POLICY "centers_assignments_manage" ON assignments
USING (center_id IN (SELECT id FROM educational_centers WHERE owner_id = auth.uid()))
WITH CHECK (center_id IN (SELECT id FROM educational_centers WHERE owner_id = auth.uid()));

-- Users can view published
CREATE POLICY "users_assignments_view" ON assignments FOR SELECT
USING (status = 'PUBLISHED');

-- Audit logging
DROP TRIGGER IF EXISTS audit_assignments ON assignments;
CREATE TRIGGER audit_assignments AFTER INSERT OR UPDATE OR DELETE ON assignments
FOR EACH ROW EXECUTE FUNCTION audit_trigger();
```

### 2. Validation Schemas
```typescript
// src/hooks/useAssignmentManagement.ts
import { z } from 'zod';

const assignmentCreateSchema = z.object({
  title: z.string().min(3, 'Min 3 chars').max(100),
  description: z.string().min(10).max(500),
});

type AssignmentCreateInput = z.infer<typeof assignmentCreateSchema>;
```

### 3. Query Hook
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

### 4. Create Mutation
```typescript
export function useCreateAssignment() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { data: center } = useMyCenterData();

  return useMutation({
    mutationFn: async (input: AssignmentCreateInput) => {
      if (!user?.id) throw new Error('Not authenticated');
      if (!center?.id) throw new Error('Center not found');

      // Validate
      assignmentCreateSchema.parse(input);

      // Status check
      const guard = await guardRequireActiveCenter(user.id, 'createAssignment');
      if (guard) throw new Error(guard.error?.message);

      // Create
      const { data, error } = await supabase
        .from('assignments')
        .insert({ center_id: center.id, ...input, status: 'DRAFT' })
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

### 5. UI Component
```typescript
// src/components/center/AssignmentsTab.tsx
import { useMyAssignments, useCreateAssignment } from '@/hooks/useAssignmentManagement';
import { useCanAccess } from '@/lib/status-enforcement';

export function AssignmentsTab() {
  const canCreate = useCanAccess('createContent');
  const { data: assignments, isLoading } = useMyAssignments();
  const createMutation = useCreateAssignment();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  if (isLoading) return <LoadingState />;

  return (
    <div>
      {canCreate && (
        <form onSubmit={(e) => {
          e.preventDefault();
          try {
            createMutation.mutate({ title, description });
            setTitle('');
            setDescription('');
          } catch (error) {
            toast(error.message, { type: 'error' });
          }
        }}>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" />
          <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description" />
          <Button disabled={createMutation.isPending}>
            {createMutation.isPending ? 'Creating...' : 'Create'}
          </Button>
        </form>
      )}

      {assignments?.length === 0 && !canCreate ? (
        <EmptyState message="No assignments yet" />
      ) : (
        <div className="grid">
          {assignments?.map((a) => (
            <Card key={a.id}>
              <h3>{a.title}</h3>
              <p>{a.description}</p>
              <Badge>{a.status}</Badge>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
```

### 6. Add to Navigation
```typescript
// In CenterPanel.tsx
import { AssignmentsTab } from '@/components/center/AssignmentsTab';

export function CenterPanel() {
  return (
    <>
      <CenterPanelNav>
        <NavItem href="/assignments" icon={FileText}>Assignments</NavItem>
      </CenterPanelNav>
      
      <Routes>
        <Route path="/assignments" element={<AssignmentsTab />} />
      </Routes>
    </>
  );
}
```

**Done! New module with full validation, error handling, status enforcement, and audit logging.**

---

## 🛡️ Error Handling Patterns

### Pattern 1: Try-Catch
```typescript
try {
  await createMutation.mutateAsync(data);
  toast('Success!');
} catch (error) {
  const msg = error instanceof Error ? error.message : 'Failed';
  toast(msg, { type: 'error' });
}
```

### Pattern 2: Error Boundary
```typescript
<ErrorBoundary module="Assignments">
  <AssignmentsTab />
</ErrorBoundary>
```

### Pattern 3: Field Errors
```typescript
const [errors, setErrors] = useState<Record<string, string>>({});

try {
  setErrors({});
  await createMutation.mutateAsync(data);
} catch (error) {
  if (error.message.includes(':')) {
    const fieldErrors: Record<string, string> = {};
    error.message.split(';').forEach(e => {
      const [field, msg] = e.split(':');
      fieldErrors[field.trim()] = msg.trim();
    });
    setErrors(fieldErrors);
  }
}

return (
  <div>
    <Input error={errors.title} />
    {errors.title && <span className="text-red-500">{errors.title}</span>}
  </div>
);
```

### Pattern 4: API Response Handling
```typescript
import { createSuccessResponse, createErrorResponse, ErrorCode } from '@/lib/api-response';

async function createAssignment(data) {
  try {
    const result = await supabase.from('assignments').insert(data).select().single();
    return createSuccessResponse(result);
  } catch (error) {
    return createErrorResponse(ErrorCode.DATABASE_ERROR, { original: error.message });
  }
}
```

---

## 🔐 Status Enforcement Patterns

### Check if Center is Active
```typescript
import { useIsCenterActive } from '@/lib/status-enforcement';

function MyComponent() {
  const { isActive, status, access } = useIsCenterActive();

  if (!isActive) {
    return <StatusWaitingPage status={status} />;
  }

  return <Content />;
}
```

### Check Specific Feature Access
```typescript
import { useCanAccess } from '@/lib/status-enforcement';

function CoursesTab() {
  const canCreate = useCanAccess('createContent');
  const canPublish = useCanAccess('publishContent');

  if (!canCreate) return <FeatureLockedScreen />;

  return (
    <>
      <Button>New Course</Button>
      {canPublish && <PublishButton />}
    </>
  );
}
```

### Guard Mutation Functions
```typescript
import { guardRequireActiveCenter, guardCanPublish } from '@/lib/status-enforcement';

// In mutation
const guard = await guardRequireActiveCenter(userId, 'createContent');
if (guard) throw new Error(guard.error?.message);

// Or for specific operations
const guard = await guardCanPublish(contentId, userId);
if (guard) throw new Error(guard.error?.message);
```

---

## 📊 Common Operations

### Fetch Data
```typescript
// Courses for my center
const { data: courses } = useMyCourses();

// Specific course details
const { data: course } = useCourseDetails(courseId);

// Tests in a course
const { data: tests } = useCourseTests(courseId);

// Lessons in a course
const { data: lessons } = useCourseLessons(courseId);
```

### Create/Update/Delete
```typescript
// Create
const createMutation = useCreateCourse();
createMutation.mutate({ title: '...', description: '...' });

// Update
const updateMutation = useUpdateCourse();
updateMutation.mutate({ courseId, data: { title: '...' } });

// Publish
const publishMutation = usePublishCourse();
publishMutation.mutate(courseId);

// Delete
const deleteMutation = useDeleteCourse();
deleteMutation.mutate(courseId);
```

### Handle Mutations
```typescript
const mutation = useSomeMutation();

// Pending state
{mutation.isPending && <LoadingState />}

// Success
{mutation.isSuccess && <SuccessMessage />}

// Error
{mutation.isError && <ErrorMessage error={mutation.error} />}

// Disabled during mutation
<Button disabled={mutation.isPending}>Submit</Button>
```

---

## 📝 Validation Patterns

### Quick Validation
```typescript
import { z } from 'zod';

const schema = z.object({
  email: z.string().email('Invalid email'),
  age: z.number().min(18, 'Must be 18+'),
  terms: z.boolean().refine(v => v === true, 'Must accept terms'),
});

try {
  schema.parse(data);
} catch (error) {
  if (error instanceof z.ZodError) {
    error.errors.forEach(e => {
      console.log(`${e.path.join('.')}: ${e.message}`);
    });
  }
}
```

### Publishing Validation
```typescript
function validateCanPublish(item, rules) {
  const errors = [];

  if (rules.hasTitle && !item.title?.trim()) {
    errors.push('Title is required');
  }

  if (rules.minItems && (!item.items || item.items.length < rules.minItems)) {
    errors.push(`Must have at least ${rules.minItems} items`);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

// Use it
const validation = validateCanPublish(course, {
  hasTitle: true,
  minItems: 1,
});

if (!validation.valid) {
  throw new Error(validation.errors.join('\n'));
}
```

---

## 🔍 Debugging Tips

### Check Center Status
```typescript
// See current center status
const { data: center } = await supabase
  .from('educational_centers')
  .select('*')
  .eq('owner_id', userId)
  .single();

console.log('Center status:', center.status);
```

### View Audit Logs
```typescript
// See all changes to a course
const { data: logs } = await supabase
  .from('audit_logs')
  .select('*')
  .eq('table_name', 'courses')
  .eq('record_id', courseId)
  .order('created_at', { ascending: false });

logs.forEach(log => {
  console.log(`${log.action} by ${log.user_id} at ${log.created_at}`);
  console.log('Old:', log.old_data);
  console.log('New:', log.new_data);
});
```

### Test RLS Policy
```typescript
// Check if RLS is working
// 1. Log in as center owner
// 2. Query own courses - should work
const { data: owned } = await supabase
  .from('courses')
  .select('*')
  .eq('center_id', centerId);

console.log('Owned courses:', owned); // Should have data

// 3. Try to query other center's courses - should fail or empty
// This should be blocked by RLS
```

### Simulate Errors
```typescript
// Test error handling
throw new Error('Course must have a title');
// → Should show in UI as validation error

throw new Error('Center must be ACTIVE to create content');
// → Should show status page

throw new Error('You do not own this course');
// → Should show permission denied
```

---

## 📚 File Reference

| Need | File | Function |
|------|------|----------|
| Create response | `/src/lib/api-response.ts` | `createSuccessResponse`, `createErrorResponse` |
| Check status | `/src/lib/status-enforcement.ts` | `useIsCenterActive`, `useCanAccess` |
| Error codes | `/src/lib/api-response.ts` | `ErrorCode` enum |
| Example module | `/src/hooks/useCourseManagement.ts` | All patterns |
| Database schema | `/supabase/migrations/20260208_002_...sql` | Table definitions |
| Full guide | `/docs/IMPLEMENTATION_GUIDE_V2.md` | Complete reference |

---

## 💡 Pro Tips

1. **Always check status first** - Add guard before any operation
2. **Let database validate** - RLS blocks what UI allows through
3. **Clear error messages** - Users should know why action failed
4. **Log everything** - Audit logs catch issues fast
5. **Test the happy path first** - Then test error cases
6. **Use TypeScript** - Catches errors before runtime
7. **Validate on backend** - Never trust frontend
8. **Invalidate queries** - Force refetch after mutations

---

## ✅ Checklist Before Shipping

- [ ] All inputs validated (frontend + backend)
- [ ] Status check in mutation function
- [ ] Error message is user-friendly
- [ ] Audit log fires on action
- [ ] Tests cover happy path
- [ ] Tests cover error path
- [ ] RLS policy prevents unauthorized access
- [ ] No console errors or warnings
- [ ] Loading states show
- [ ] Success notification shows
- [ ] Error notification shows
- [ ] Buttons disable during mutation
- [ ] Form resets on success

---

**Start building. The architecture handles the rest.**
