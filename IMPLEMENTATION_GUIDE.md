# Center Panel: Questions & Tests Implementation Guide

## Overview
This document describes the complete implementation of question management and course-test integration for the IMTS Center Panel.

## Problem 1: Questions Not Being Added (FIXED)

### Root Causes Addressed:
1. **Missing Error Handling** - Now provides detailed error messages
2. **Lack of Validation** - Server-side and client-side validation added
3. **Transaction Rollback** - Questions deleted if options fail
4. **RLS Policies** - Already existed but now properly tested
5. **No Ownership Verification** - Added center ownership checks

### Solution Implementation:

#### Frontend Changes (`useQuestionManagement.ts`)
```typescript
// Enhanced useCreateQuestion hook with:
- User authentication verification
- Question schema validation (Zod)
- Option schema validation (Zod)
- Test ownership verification
- Proper error messages
- Transaction-like behavior (rollback on error)
- Full question data retrieval after creation
```

#### Backend Changes (Supabase)
```sql
-- RLS Policies (already existed):
- Centers can insert questions for their tests
- Centers can update questions for their tests
- Centers can delete questions for their tests

-- New Validation Triggers:
- validate_question_fields: Checks question text and test existence
- validate_option_fields: Validates option text and question existence
- validate_question_has_correct_answer: Ensures correct answers exist
- check_test_publish: Prevents publishing tests without valid questions
```

#### UI/UX Changes (`QuestionManager.tsx`)
```typescript
- Real-time validation feedback
- Clear error messages
- Immediate UI update on successful save
- Loading states during mutation
- Empty state messaging
```

### Data Flow:
```
User Input
    ↓
Client Validation (type checking, min/max)
    ↓
Schema Validation (Zod)
    ↓
Submit Mutation (useCreateQuestion)
    ↓
Server Validation (RLS policies)
    ↓
Insert Question + Options in Atomic Operation
    ↓
Update Test Count
    ↓
Refetch Test Questions
    ↓
UI Update + Toast Success
```

### Error Handling:
- **Silent Failures**: All now produce error messages
- **Validation Errors**: Clear indication of what's wrong
- **Network Errors**: Caught and displayed
- **Permission Errors**: RLS enforces ownership
- **Data Integrity**: Cascading deletes and rollback on failure

---

## Problem 2: Tests Inside Courses (IMPLEMENTED)

### Solution Architecture:

#### Database Schema (`20260208_000000_course_tests_linking.sql`)
```sql
course_tests (
  id uuid PRIMARY KEY,
  course_id uuid FOREIGN KEY → courses(id),
  test_id uuid FOREIGN KEY → tests(id),
  test_order integer,
  test_type enum('practice', 'final', 'quiz', 'diagnostic'),
  is_required boolean,
  UNIQUE(course_id, test_id)
)

Indexes:
- course_id: Fast lookup by course
- test_id: Fast lookup by test
- (course_id, test_order): Ordered retrieval
```

#### RLS Policies:
```sql
- Centers can insert/update/delete course_tests for their courses
- All users can read course_tests
- Only course owner (via center) can modify
```

#### Hooks (`useCenterData.ts` - New Functions):
```typescript
useCourseTests(courseId)              // Fetch linked tests with full data
useAddTestToCourse()                  // Add test to course
useRemoveTestFromCourse()             // Remove test from course
useUpdateCourseTestOrder()            // Reorder tests in course
useUpdateCourseTest()                 // Update test settings (type, required)
```

#### Components:

##### CourseTestsTab.tsx (NEW)
```typescript
Features:
- Add/remove tests from course
- Change test type (practice, quiz, final, diagnostic)
- Mark tests as required for course completion
- Drag & drop reordering (UI prepared)
- Show test preview info (questions count, marks)
- Visual indicators (draft status, required status)
```

##### CourseCreationWizard.tsx (UPDATED)
```typescript
Steps:
1. Basic Info (Title, Subject, Level, Language)
2. Lessons (Modules and video content)
3. Tests ← NEW (Add assessments to course)
4. Media (Cover image)
5. Settings (Pricing)

Tests step allows:
- Select from existing tests
- Add multiple tests to course
- Configure test settings per course
- Optional - tests not required for publishing
```

### Course-Test Integration Flow:

```
Course Creation Wizard
    ↓
Step 1: Create Course (saved as draft)
    ↓
Step 2: Add Lessons to Course
    ↓
Step 3: Add Tests to Course ← NEW
    ├─ Query center's published/draft tests
    ├─ Select test
    ├─ Choose test type (practice/final/etc)
    ├─ Mark as required (optional)
    └─ Save course_tests entry
    ↓
Step 4: Add Cover Image
    ↓
Step 5: Configure Pricing
    ↓
Publish Course (tests remain in defined order)
    ↓
Students see: Lessons + Tests in order
```

### Data Structure Example:

```json
{
  "course": {
    "id": "course-123",
    "title": "Algebra 101",
    "is_published": true
  },
  "courseTests": [
    {
      "id": "ct-1",
      "course_id": "course-123",
      "test_id": "test-456",
      "test_order": 0,
      "test_type": "diagnostic",
      "is_required": false,
      "tests": {
        "id": "test-456",
        "title": "Pre-Assessment",
        "questions_count": 20,
        "is_published": true
      }
    },
    {
      "id": "ct-2",
      "course_id": "course-123",
      "test_id": "test-789",
      "test_order": 1,
      "test_type": "practice",
      "is_required": false,
      "tests": { ... }
    },
    {
      "id": "ct-3",
      "course_id": "course-123",
      "test_id": "test-101",
      "test_order": 2,
      "test_type": "final",
      "is_required": true,
      "tests": { ... }
    }
  ]
}
```

---

## Security Implementation

### 1. Role-Based Access Control (RBAC)

**Policies Enforced**:
```
Admin: Full access to all questions, tests, courses
Center Owner: Access to own center's questions, tests, courses
Regular User: View-only access (solved tests, enrolled courses)
```

**Implementation**:
- RLS policies check `has_role()` or center ownership
- `public.has_role(auth.uid(), 'admin')` for admin checks
- `center_id IN (SELECT id FROM educational_centers WHERE owner_id = auth.uid())` for ownership

### 2. Data Ownership Validation

#### Questions:
```sql
-- User can create question only if they own the test's center
EXISTS (
  SELECT 1 FROM public.tests t
  WHERE t.id = question.test_id
    AND t.center_id IN (
      SELECT id FROM public.educational_centers
      WHERE owner_id = auth.uid()
    )
)
```

#### Tests:
```sql
-- Test ownership enforced at tests table level
-- Center owner verified before any test operation
```

#### Courses:
```sql
-- Course ownership enforced via center_id
-- Only center owner can modify course
```

### 3. Frontend Permission Checks

```typescript
// useQuestionManagement.ts
- Check user is authenticated
- Verify center ownership (optional, server validates)

// CourseTestsTab.tsx
- Only show tests center has created
- Only show "Add" button if tests are available
- Only show edit/delete for center's own tests

// CenterPanel.tsx
- Check user has center role
- Redirect if not authorized
```

### 4. Validation Rules

**Questions**:
```
✓ Question text: 1-2000 chars, required
✓ Options: 2-6, all must have text
✓ Correct answer: Exactly 1 per question
✓ Points: 1-100, required
✓ Difficulty: easy/medium/hard, optional
✓ Test ownership: Must belong to center
```

**Tests**:
```
✓ Cannot publish without questions
✓ Cannot publish without valid answers
✓ Cannot publish with incomplete questions
✓ Must belong to center that created it
```

**Courses**:
```
✓ Can have 0+ tests (optional)
✓ Each test linked only once per course
✓ Test order must be unique within course
✓ All linked tests must exist
```

---

## Validation & Error Handling

### Error Types & Messages:

#### Question Creation Errors:
```
"Question text is required" → Input validation
"Question text must be less than 2000 characters" → Length validation
"At least 2 options are required" → Option count validation
"At least one correct answer must be marked" → Correct answer validation
"Please mark at least one correct answer" → Client validation
"Correct answer option cannot be empty" → Data integrity
"Failed to create question: {details}" → Server error
```

#### Test Publishing Errors:
```
"Add at least one question before publishing" → Validation in UI
"Cannot remove the last correct answer from a published test" → DB trigger
```

#### Course-Test Errors:
```
"This test is already added to the course" → Duplicate prevention
"Test not found" → Missing data
"Failed to add test to course" → Server error
```

### Logging & Audit:

```sql
-- question_audit_log table tracks:
- What action (INSERT/UPDATE/DELETE)
- Which table affected
- Old vs new data (JSONB)
- Who made change (user_id)
- When change occurred
- Indexed for efficient queries
```

---

## Performance Optimizations

### Query Optimization:

```typescript
// Fetch with selections (only needed fields)
.select(`
  id,
  test_id,
  question_text,
  explanation,
  question_options(id, option_text, is_correct)
`)

// Index usage:
- questions(test_id): Fast lookup by test
- question_options(question_id): Fast lookup by question
- course_tests(course_id, test_order): Ordered retrieval
- course_tests(test_id): Prevent duplicates
```

### Caching Strategy:

```typescript
// React Query settings:
- staleTime: 30s (data considered fresh)
- gcTime: 5 min (cache retained for 5 min)
- Invalidate on mutations for fresh data
```

---

## Testing Checklist

### Unit Tests:
- [ ] Question creation with valid data
- [ ] Question validation errors caught
- [ ] Question deletion updates count
- [ ] Options saved correctly
- [ ] Test ordering works
- [ ] Course-test linking works

### Integration Tests:
- [ ] Full question workflow (create → view → delete)
- [ ] Test publication validation
- [ ] Course creation with tests
- [ ] Permission checks (ownership)
- [ ] RLS policies enforced

### E2E Tests:
- [ ] Center creates test
- [ ] Center adds questions (success)
- [ ] Center publishes test
- [ ] Center creates course
- [ ] Center adds tests to course
- [ ] Student sees course with tests
- [ ] Student takes tests

### Security Tests:
- [ ] User cannot add questions to another center's test
- [ ] User cannot delete another center's test
- [ ] User cannot see unpublished tests
- [ ] Admin can see all tests

---

## Migration Strategy

### Deployment Order:
1. Deploy database migrations:
   - 20260208_000000_course_tests_linking.sql
   - 20260208_000001_question_validation_triggers.sql

2. Deploy backend changes:
   - hooks/useQuestionManagement.ts (enhanced)
   - hooks/useCenterData.ts (new course-test functions)
   - components/QuestionManager.tsx (updated)

3. Deploy UI components:
   - components/center/CourseTestsTab.tsx (new)
   - components/center/CourseCreationWizard.tsx (updated with Tests step)
   - pages/center-panel/CenterTestsSection.tsx (updated)

4. Test in staging environment

5. Deploy to production

---

## Future Enhancements

1. **Drag-and-Drop Reordering** - UI prepared, needs React DnD integration
2. **Question Bulk Import** - CSV/JSON import
3. **Question Bank** - Reusable questions across tests
4. **Randomization** - Already in DB schema (shuffle_questions)
5. **Time Limits** - Per test and per question
6. **Partial Credit** - Multiple correct answers per question
7. **Analytics** - Question difficulty, average score, misconceptions
8. **Adaptive Testing** - Dynamic question selection based on performance

---

## Files Modified/Created

### New Files:
```
supabase/migrations/20260208_000000_course_tests_linking.sql
supabase/migrations/20260208_000001_question_validation_triggers.sql
src/components/center/CourseTestsTab.tsx
```

### Modified Files:
```
src/hooks/useQuestionManagement.ts (enhanced validation)
src/hooks/useCenterData.ts (added course-test functions)
src/components/QuestionManager.tsx (better error handling)
src/components/center/CourseCreationWizard.tsx (added Tests step)
src/pages/center-panel/CenterTestsSection.tsx (pass centerId)
```

---

## Support & Troubleshooting

### Common Issues:

**Q: Questions not saving**
- A: Check console for validation errors
- A: Verify test exists and you own it
- A: Check Supabase RLS policies are enabled
- A: Verify all required fields are filled

**Q: Test cannot be published**
- A: Add at least one question with a correct answer
- A: Check all questions have valid options
- A: Ensure questions belong to the test

**Q: Tests not appearing in course**
- A: Refresh the page
- A: Check test is published or draft
- A: Verify course_tests join table has entries
- A: Check center_id matches

**Q: Permission denied errors**
- A: Verify you're logged in as center owner
- A: Check center status is ACTIVE
- A: Verify test/course belongs to your center

---

## Contact & Support

For issues or questions about the implementation:
1. Check this documentation
2. Review migration files for schema
3. Check test cases in the codebase
4. Contact the development team
