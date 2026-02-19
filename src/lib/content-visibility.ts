/**
 * Content visibility helpers
 * 
 * Content must meet minimum requirements to be publicly visible:
 * - Tests: at least 1 question AND is_published = true
 * - Courses: at least 1 lesson AND is_published = true
 * - Olympiads: is_published = true AND is_public = true
 * - Reels: is_published = true
 */

export type ContentStatus = 'published' | 'draft' | 'incomplete';

export interface TestContent {
  is_published?: boolean;
  questions_count?: number;
}

export interface CourseContent {
  is_published?: boolean;
  lessons_count?: number | null;
  title?: string;
  description?: string | null;
}

export interface OlympiadContent {
  is_published?: boolean;
  is_public?: boolean;
  title?: string;
}

export interface ReelContent {
  is_published?: boolean;
}

/**
 * Get the visibility status of a test
 */
export function getTestStatus(test: TestContent): ContentStatus {
  if (!test.questions_count || test.questions_count === 0) {
    return 'incomplete';
  }
  if (!test.is_published) {
    return 'draft';
  }
  return 'published';
}

/**
 * Get the visibility status of a course
 */
export function getCourseStatus(course: CourseContent): ContentStatus {
  if (!course.lessons_count || course.lessons_count === 0) {
    return 'incomplete';
  }
  if (!course.is_published) {
    return 'draft';
  }
  return 'published';
}

/**
 * Get the visibility status of an olympiad
 */
export function getOlympiadStatus(olympiad: OlympiadContent): ContentStatus {
  if (!olympiad.title) {
    return 'incomplete';
  }
  if (!olympiad.is_published) {
    return 'draft';
  }
  return 'published';
}

/**
 * Get the visibility status of a reel
 */
export function getReelStatus(reel: ReelContent): ContentStatus {
  if (!reel.is_published) {
    return 'draft';
  }
  return 'published';
}

/**
 * Get a human-readable label for content status
 */
export function getStatusLabel(status: ContentStatus): string {
  switch (status) {
    case 'incomplete':
      return 'Incomplete';
    case 'draft':
      return 'Draft';
    case 'published':
      return 'Published';
  }
}

/**
 * Get the CTA text for completing content setup
 */
export function getSetupCTA(contentType: 'test' | 'course' | 'olympiad' | 'reel', status: ContentStatus): string | null {
  if (status === 'published') return null;
  
  switch (contentType) {
    case 'test':
      return status === 'incomplete' ? 'Add questions' : 'Publish test';
    case 'course':
      return status === 'incomplete' ? 'Add lessons' : 'Publish course';
    case 'olympiad':
      return status === 'draft' ? 'Publish olympiad' : 'Complete setup';
    case 'reel':
      return 'Publish reel';
    default:
      return 'Complete setup';
  }
}

/**
 * Check if content is visible to public (non-owners)
 */
export function isPubliclyVisible(status: ContentStatus): boolean {
  return status === 'published';
}
