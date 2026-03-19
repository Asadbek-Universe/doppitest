import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

// Fetch all centers for admin
export const useAllCenters = () => {
  return useQuery({
    queryKey: ['all-centers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('educational_centers')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching centers:', error);
        return [];
      }

      return data || [];
    },
  });
};

// Fetch center details
export const useCenterDetails = (centerId: string | null) => {
  return useQuery({
    queryKey: ['center-details', centerId],
    queryFn: async () => {
      if (!centerId) return null;

      const { data, error } = await supabase
        .from('educational_centers')
        .select('*')
        .eq('id', centerId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching center details:', error);
        return null;
      }

      return data;
    },
    enabled: !!centerId,
  });
};

// Fetch center courses
export const useCenterCourses = (centerId: string | null) => {
  return useQuery({
    queryKey: ['center-courses', centerId],
    queryFn: async () => {
      if (!centerId) return [];

      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .eq('center_id', centerId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching center courses:', error);
        return [];
      }

      return data || [];
    },
    enabled: !!centerId,
  });
};

// Fetch center tests
export const useCenterTests = (centerId: string | null) => {
  return useQuery({
    queryKey: ['center-tests', centerId],
    queryFn: async () => {
      if (!centerId) return [];

      const { data, error } = await supabase
        .from('tests')
        .select('*')
        .eq('center_id', centerId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching center tests:', error);
        return [];
      }

      return data || [];
    },
    enabled: !!centerId,
  });
};

// Create course (centerId passed in mutation payload)
export const useCreateCourse = (centerIdParam?: string) => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (payload: any) => {
      if (!user?.id) throw new Error('User not authenticated');

      const { data, error } = await (supabase as any)
        .from('courses')
        .insert({
          title: payload.title || 'Untitled Course',
          description: payload.description || null,
          subject_id: payload.subject_id || null,
          instructor_name: payload.instructor_name || 'IMTS Team',
          instructor_avatar: payload.instructor_avatar || null,
          instructor_bio: payload.instructor_bio || null,
          thumbnail_url: payload.thumbnail_url || null,
          rating: 0,
          students_count: 0,
          lessons_count: 0,
          duration_minutes: payload.duration_minutes || 0,
          is_free: payload.is_free !== false,
          price: payload.price || 0,
          tags: payload.tags || [],
          learning_outcomes: payload.learning_outcomes || [],
          requirements: payload.requirements || [],
        } as any)
        .select()
        .maybeSingle();

      if (error) {
        console.error('Course creation error:', error);
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['center-courses'] });
    },
  });
};

// Create test (centerId passed in mutation payload)
export const useCreateTest = (centerIdParam?: string) => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (payload: any) => {
      if (!user?.id) throw new Error('User not authenticated');

      const { data, error } = await (supabase as any)
        .from('tests')
        .insert({
          title: payload.title || 'Untitled Test',
          description: payload.description || null,
          subject_id: payload.subject_id || null,
          difficulty: payload.difficulty || 2,
          duration_minutes: payload.duration_minutes || 30,
          questions_count: payload.questions_count || 0,
          is_official: false,
          is_free: payload.is_free !== false,
          price: payload.price || 0,
          author_name: 'IMTS Team',
          author_avatar: null,
          completions: 0,
          rating: 0,
          tags: payload.tags || [],
        } as any)
        .select()
        .maybeSingle();

      if (error) {
        console.error('Test creation error:', error);
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['center-tests'] });
    },
  });
};

// Update course
export const useUpdateCourse = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (payload: any) => {
      if (!user?.id) throw new Error('User not authenticated');

      const courseId = payload.courseId || payload.id;
      if (!courseId) throw new Error('Course ID is required');

      // Build update object with valid course columns
      const updateData: any = {};
      if (payload.title !== undefined) updateData.title = payload.title;
      if (payload.description !== undefined) updateData.description = payload.description;
      if (payload.subject_id !== undefined) updateData.subject_id = payload.subject_id;
      if (payload.instructor_name !== undefined) updateData.instructor_name = payload.instructor_name;
      if (payload.instructor_avatar !== undefined) updateData.instructor_avatar = payload.instructor_avatar;
      if (payload.instructor_bio !== undefined) updateData.instructor_bio = payload.instructor_bio;
      if (payload.thumbnail_url !== undefined) updateData.thumbnail_url = payload.thumbnail_url;
      if (payload.is_free !== undefined) updateData.is_free = payload.is_free;
      if (payload.price !== undefined) updateData.price = payload.price;
      if (payload.tags !== undefined) updateData.tags = payload.tags;
      if (payload.learning_outcomes !== undefined) updateData.learning_outcomes = payload.learning_outcomes;
      if (payload.requirements !== undefined) updateData.requirements = payload.requirements;
      if (payload.level !== undefined) updateData.level = payload.level;
      if (payload.language !== undefined) updateData.language = payload.language;
      if (payload.is_published !== undefined) updateData.is_published = payload.is_published;

      const { data, error } = await (supabase as any)
        .from('courses')
        .update(updateData)
        .eq('id', courseId)
        .select()
        .maybeSingle();

      if (error) {
        console.error('Course update error:', error);
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['center-courses'] });
      queryClient.invalidateQueries({ queryKey: ['course-details'] });
    },
  });
};

// Update test
export const useUpdateTest = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (payload: any) => {
      if (!user?.id) throw new Error('User not authenticated');

      const testId = payload.testId || payload.id;
      if (!testId) throw new Error('Test ID is required');

      // Build update object with valid test columns
      const updateData: any = {};
      if (payload.title !== undefined) updateData.title = payload.title;
      if (payload.description !== undefined) updateData.description = payload.description;
      if (payload.subject_id !== undefined) updateData.subject_id = payload.subject_id;
      if (payload.difficulty !== undefined) updateData.difficulty = payload.difficulty;
      if (payload.duration_minutes !== undefined) updateData.duration_minutes = payload.duration_minutes;
      if (payload.questions_count !== undefined) updateData.questions_count = payload.questions_count;
      if (payload.is_free !== undefined) updateData.is_free = payload.is_free;
      if (payload.price !== undefined) updateData.price = payload.price;
      if (payload.tags !== undefined) updateData.tags = payload.tags;
      if (payload.is_published !== undefined) updateData.is_published = payload.is_published;
      if (payload.shuffle_questions !== undefined) updateData.shuffle_questions = payload.shuffle_questions;
      if (payload.max_attempts !== undefined) updateData.max_attempts = payload.max_attempts;
      if (payload.passing_score_percent !== undefined) updateData.passing_score_percent = payload.passing_score_percent;

      const { data, error } = await (supabase as any)
        .from('tests')
        .update(updateData)
        .eq('id', testId)
        .select()
        .maybeSingle();

      if (error) {
        console.error('Test update error:', error);
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['center-tests'] });
      queryClient.invalidateQueries({ queryKey: ['test-details'] });
    },
  });
};

// Delete course
export const useDeleteCourse = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (courseId: string) => {
      const { error } = await supabase
        .from('courses')
        .delete()
        .eq('id', courseId);

      if (error) {
        throw error;
      }

      return courseId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['center-courses'] });
    },
  });
};

// Delete test
export const useDeleteTest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (testId: string) => {
      const { error } = await supabase
        .from('tests')
        .delete()
        .eq('id', testId);

      if (error) {
        throw error;
      }

      return testId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['center-tests'] });
    },
  });
};

// Publish course
export const usePublishCourse = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (courseId: string) => {
      const { data, error } = await supabase
        .from('courses')
        .update({
          status: 'PUBLISHED',
          published_at: new Date().toISOString(),
        })
        .eq('id', courseId)
        .select()
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['center-courses'] });
    },
  });
};

// Publish test
export const usePublishTest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (testId: string) => {
      const { data, error } = await supabase
        .from('tests')
        .update({
          status: 'PUBLISHED',
          published_at: new Date().toISOString(),
        })
        .eq('id', testId)
        .select()
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['center-tests'] });
    },
  });
};

// Create center (used during onboarding / center panel)
export const useCreateCenter = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (centerData: { name: string; [key: string]: unknown }) => {
      if (!user?.id) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('educational_centers')
        .insert({
          name: centerData.name,
          owner_id: user.id,
          status: 'pending',
          onboarding_completed: false,
        })
        .select()
        .maybeSingle();

      if (error) {
        const msg = error.message || 'Failed to create center';
        if (error.code === '23505') throw new Error('You already have a center linked to this account.');
        throw new Error(msg);
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-centers'] });
      queryClient.invalidateQueries({ queryKey: ['my-center'] });
    },
  });
};

// Fetch the center owned by the current user
export const useMyCenter = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['my-center', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from('educational_centers')
        .select('*')
        .eq('owner_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Error fetching my center:', error);
        return null;
      }

      return data;
    },
    enabled: !!user?.id,
  });
};

// My center courses
export const useMyCenterCourses = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['my-center-courses', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data: center } = await supabase
        .from('educational_centers')
        .select('id')
        .eq('owner_id', user.id)
        .maybeSingle();

      if (!center) return [];

      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .eq('center_id', center.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching my center courses:', error);
        return [];
      }

      return data || [];
    },
    enabled: !!user?.id,
  });
};

// My center tests
export const useMyCenterTests = (centerId?: string | null) => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['my-center-tests', user?.id],
    queryFn: async () => {
      // If a centerId is passed, use it; otherwise fallback to current user's center
      let cid = centerId;
      if (!cid) {
        if (!user?.id) return [];
        const { data: center } = await supabase
          .from('educational_centers')
          .select('id')
          .eq('owner_id', user.id)
          .maybeSingle();
        cid = center?.id || null;
      }

      if (!cid) return [];

      const { data, error } = await supabase
        .from('tests')
        .select('*')
        .eq('center_id', cid)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching my center tests:', error);
        return [];
      }

      return data || [];
    },
    enabled: !!user?.id,
  });
};

// My center enrollments (students) – works with or without course_enrollments.center_id
export const useMyCenterEnrollments = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['my-center-enrollments', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data: center } = await supabase
        .from('educational_centers')
        .select('id')
        .eq('owner_id', user.id)
        .maybeSingle();

      if (!center) return [];

      let data: unknown[] | null = null;
      let error: { message: string } | null = null;

      const byCenterId = await supabase
        .from('course_enrollments')
        .select('*')
        .eq('center_id', center.id)
        .order('created_at', { ascending: false });

      if (byCenterId.error) {
        const { data: courseIds } = await supabase
          .from('courses')
          .select('id')
          .eq('center_id', center.id);
        const ids = (courseIds ?? []).map((c) => c.id);
        if (ids.length === 0) return [];
        const byCourse = await supabase
          .from('course_enrollments')
          .select('*')
          .in('course_id', ids)
          .order('created_at', { ascending: false });
        if (byCourse.error) {
          console.error('Error fetching my center enrollments:', byCourse.error);
          return [];
        }
        data = byCourse.data;
      } else {
        data = byCenterId.data;
      }

      return data ?? [];
    },
    enabled: !!user?.id,
  });
};

// Course-tests linking helpers (graceful if migration not deployed)
export const useCourseTests = (courseId: string | null) => {
  return useQuery({
    queryKey: ['course-tests', courseId],
    queryFn: async () => {
      if (!courseId) return [];
      try {
        const { data, error } = await supabase
          .from('course_tests')
          .select('*')
          .eq('course_id', courseId)
          .order('test_order', { ascending: true });

        if (error) {
          console.warn('course_tests table may not exist yet:', error.message);
          return [];
        }

        return data || [];
      } catch (e) {
        console.warn('Error querying course_tests:', e);
        return [];
      }
    },
    enabled: !!courseId,
  });
};

export const useAddTestToCourse = (courseId?: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { testId: string; testType?: string; order?: number; courseId?: string }) => {
      const cid = courseId || payload.courseId;
      if (!cid) throw new Error('courseId required');
      try {
        const { data, error } = await supabase
          .from('course_tests')
          .insert({
            course_id: cid,
            test_id: payload.testId,
            test_order: payload.order ?? 0,
            test_type: payload.testType ?? 'optional',
          })
          .select()
          .maybeSingle();

        if (error) {
          throw error;
        }

        return data;
      } catch (e) {
        throw new Error('Failed to add test to course (migration may be missing)');
      }
    },
    onSuccess: (_data, variables) => {
      const cid = courseId || (variables as any)?.courseId;
      if (cid) queryClient.invalidateQueries({ queryKey: ['course-tests', cid] });
    },
  });
};

export const useRemoveTestFromCourse = (courseId?: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { testId?: string; courseId?: string; courseTestId?: string }) => {
      try {
        const cid = courseId || payload.courseId;
        if (payload.courseTestId) {
          const { error } = await supabase.from('course_tests').delete().eq('id', payload.courseTestId);
          if (error) throw error;
          return payload.courseTestId;
        }
        if (!cid || !payload.testId) throw new Error('Missing identifiers');
        const { error } = await supabase.from('course_tests').delete().eq('course_id', cid).eq('test_id', payload.testId);
        if (error) throw error;
        return payload.testId;
      } catch (e) {
        throw new Error('Failed to remove test from course (migration may be missing)');
      }
    },
    onSuccess: (_data, variables) => {
      const cid = courseId || (variables as any)?.courseId;
      if (cid) queryClient.invalidateQueries({ queryKey: ['course-tests', cid] });
    },
  });
};

export const useUpdateCourseTestOrder = (courseId?: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (items: Array<{ id: string; test_order: number; courseId?: string }>) => {
      try {
        // Bulk update not supported in all SDKs; update sequentially
        for (const item of items) {
          const { error } = await supabase.from('course_tests').update({ test_order: item.test_order }).eq('id', item.id);
          if (error) throw error;
        }
        return items;
      } catch (e) {
        throw new Error('Failed to update course test order (migration may be missing)');
      }
    },
    onSuccess: (_data, variables) => {
      const cid = courseId || (variables as any)?.[0]?.courseId;
      if (cid) queryClient.invalidateQueries({ queryKey: ['course-tests', cid] });
    },
  });
};

export const useUpdateCourseTest = (courseId?: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      try {
        const { data: resp, error } = await supabase.from('course_tests').update(data).eq('id', id).select().maybeSingle();
        if (error) throw error;
        return resp;
      } catch (e) {
        throw new Error('Failed to update course test (migration may be missing)');
      }
    },
    onSuccess: (_data, variables) => {
      const cid = courseId || (variables as any)?.courseId;
      if (cid) queryClient.invalidateQueries({ queryKey: ['course-tests', cid] });
    },
  });
};

// Course lessons helpers
export const useCourseLessons = (courseId: string | null) => {
  return useQuery({
    queryKey: ['course-lessons', courseId],
    queryFn: async () => {
      if (!courseId) return [];
      const { data, error } = await supabase
        .from('lessons')
        .select('*')
        .eq('course_id', courseId)
        .order('order_index', { ascending: true });
      if (error) {
        console.warn('Error fetching lessons:', error.message);
        return [];
      }
      return data || [];
    },
    enabled: !!courseId,
  });
};

export const useCreateLesson = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: any) => {
      const courseId = payload.course_id || payload.courseId;
      if (!courseId) throw new Error('Course ID is required');

      const lessonData: any = {
        course_id: courseId,
        section_title: payload.section_title || 'Introduction',
        title: payload.title || 'Untitled Lesson',
        description: payload.description || null,
        video_url: payload.video_url || null,
        duration_minutes: payload.duration_minutes || 0,
        order_index: payload.order_index || 0,
        is_free: payload.is_free || false,
      };

      const { data: row, error } = await (supabase as any).from('lessons').insert(lessonData).select().maybeSingle();
      if (error) {
        console.error('Lesson creation error:', error);
        throw error;
      }
      return row;
    },
    onSuccess: (_data, variables) => {
      const courseId = (variables as any)?.course_id || (variables as any)?.courseId;
      if (courseId) queryClient.invalidateQueries({ queryKey: ['course-lessons', courseId] });
    },
  });
};

export const useUpdateLesson = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ lessonId, data }: { lessonId: string; data: any }) => {
      const { data: row, error } = await supabase.from('lessons').update(data).eq('id', lessonId).select().maybeSingle();
      if (error) throw error;
      return row;
    },
    onSuccess: (_data) => {
      queryClient.invalidateQueries({ queryKey: ['course-lessons'] });
    },
  });
};

export const useDeleteLesson = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (lessonId: string) => {
      const { error } = await supabase.from('lessons').delete().eq('id', lessonId);
      if (error) throw error;
      return lessonId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['course-lessons'] });
    },
  });
};

// Center analytics – per-day timeseries from center_analytics
export const useCenterAnalytics = (centerId?: string | null, days: number = 30) => {
  return useQuery({
    queryKey: ['center-analytics', centerId, days],
    queryFn: async () => {
      if (!centerId) return [];

      const from = new Date();
      from.setDate(from.getDate() - days + 1);

      const { data, error } = await supabase
        .from('center_analytics')
        .select('*')
        .eq('center_id', centerId)
        .gte('date', from.toISOString().split('T')[0])
        .order('date', { ascending: true });

      if (error) throw error;
      return data ?? [];
    },
    enabled: !!centerId,
  });
};

// Olympiads
export const useCreateOlympiad = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      center_id: string;
      title: string;
      description?: string;
      subject_id?: string;
      grade?: string;
      language?: string;
      difficulty_level?: string;
      thumbnail_url?: string;
      banner_url?: string;
      start_date: string;
      end_date: string;
      registration_start_date?: string;
      registration_deadline?: string;
      max_participants?: number;
      entry_code?: string;
      is_public?: boolean;
      duration_minutes?: number;
      auto_submit_when_time_ends?: boolean;
      allow_back_navigation?: boolean;
      shuffle_questions?: boolean;
      shuffle_options?: boolean;
      show_results_immediately?: boolean;
      show_correct_after_submit?: boolean;
      anti_cheat_disable_copy_paste?: boolean;
      prize_description?: string;
      rules?: string;
    }) => {
      const { data: row, error } = await supabase
        .from('olympiads')
        .insert({
          center_id: data.center_id,
          title: data.title,
          description: data.description ?? null,
          subject_id: data.subject_id || null,
          grade: data.grade ?? null,
          language: data.language ?? 'en',
          difficulty_level: data.difficulty_level ?? null,
          thumbnail_url: data.thumbnail_url ?? null,
          banner_url: data.banner_url ?? null,
          start_date: data.start_date,
          end_date: data.end_date,
          registration_start_date: data.registration_start_date ?? null,
          registration_deadline: data.registration_deadline ?? null,
          max_participants: data.max_participants ?? null,
          entry_code: data.entry_code ?? null,
          is_public: data.is_public ?? true,
          duration_minutes: data.duration_minutes ?? null,
          auto_submit_when_time_ends: data.auto_submit_when_time_ends ?? true,
          allow_back_navigation: data.allow_back_navigation ?? true,
          shuffle_questions: data.shuffle_questions ?? true,
          shuffle_options: data.shuffle_options ?? true,
          show_results_immediately: data.show_results_immediately ?? false,
          show_correct_after_submit: data.show_correct_after_submit ?? false,
          anti_cheat_disable_copy_paste: data.anti_cheat_disable_copy_paste ?? true,
          prize_description: data.prize_description ?? null,
          rules: data.rules ?? null,
          approval_status: 'draft',
          status: 'draft',
        })
        .select('id')
        .single();
      if (error) throw error;
      return { id: row.id, ...data };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['center-olympiads'] });
    },
  });
};

export const useCenterOlympiads = (centerId?: string | null) => {
  return useQuery({
    queryKey: ['center-olympiads', centerId],
    queryFn: async () => {
      if (!centerId) return [];
      const { data, error } = await supabase
        .from('olympiads')
        .select('*, subjects(name)')
        .eq('center_id', centerId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []).map((o) => ({ ...o, current_participants: o.current_participants ?? 0 }));
    },
    enabled: !!centerId,
  });
};

export const useOlympiadParticipantsForCenter = (olympiadId?: string | null) => {
  return useQuery({
    queryKey: ['olympiad-participants', olympiadId],
    queryFn: async () => {
      if (!olympiadId) return [];
      const { data: regs, error } = await supabase
        .from('olympiad_registrations')
        .select('id, user_id, registered_at, status, score, rank')
        .eq('olympiad_id', olympiadId)
        .order('registered_at', { ascending: false });
      if (error) throw error;
      const userIds = [...new Set((regs ?? []).map((r) => r.user_id))];
      let names: Record<string, string> = {};
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, display_name')
          .in('user_id', userIds);
        names = (profiles ?? []).reduce((acc, p) => {
          acc[p.user_id] = p.display_name || 'Unknown';
          return acc;
        }, {} as Record<string, string>);
      }
      return (regs ?? []).map((r) => ({ ...r, display_name: names[r.user_id] ?? 'Unknown' }));
    },
    enabled: !!olympiadId,
  });
};

export const useUpdateParticipantScore = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { registrationId: string; olympiadId: string; score: number | null; rank: number | null }) => {
      const { error } = await supabase
        .from('olympiad_registrations')
        .update({ score: payload.score, rank: payload.rank })
        .eq('id', payload.registrationId)
        .eq('olympiad_id', payload.olympiadId);
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['olympiad-participants', variables.olympiadId] });
    },
  });
};

export const useUpdateParticipantStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { registrationId: string; olympiadId: string; status: string }) => {
      const { error } = await supabase
        .from('olympiad_registrations')
        .update({ status: payload.status })
        .eq('id', payload.registrationId)
        .eq('olympiad_id', payload.olympiadId);
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['olympiad-participants', variables.olympiadId] });
    },
  });
};

export const useBulkUpdateParticipantStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { registrationIds: string[]; olympiadId: string; status: string }) => {
      if (payload.registrationIds.length === 0) return;
      const { error } = await supabase
        .from('olympiad_registrations')
        .update({ status: payload.status })
        .eq('olympiad_id', payload.olympiadId)
        .in('id', payload.registrationIds);
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['olympiad-participants', variables.olympiadId] });
    },
  });
};

// Reels
export const useCreateReel = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      center_id,
      title,
      description,
      video_url,
      thumbnail_url,
      duration_seconds,
      subject_id,
      grades,
    }: {
      center_id: string;
      title: string;
      description?: string;
      video_url: string;
      thumbnail_url?: string;
      duration_seconds?: number;
      subject_id?: string;
      grades?: string[];
    }) => {
      const { data, error } = await supabase
        .from('center_reels')
        .insert({
          center_id,
          title,
          description: description ?? null,
          video_url,
          thumbnail_url: thumbnail_url ?? null,
          duration_seconds: duration_seconds ?? null,
          subject_id: subject_id ?? null,
          grades: grades ?? [],
          is_published: false,
          approval_status: 'draft',
          views_count: 0,
          likes_count: 0,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['center-reels', variables.center_id] });
    },
  });
};

export const useUpdateReel = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      reelId,
      centerId,
      title,
      description,
      video_url,
      thumbnail_url,
      duration_seconds,
      subject_id,
      grades,
    }: {
      reelId: string;
      centerId: string;
      title?: string;
      description?: string;
      video_url?: string;
      thumbnail_url?: string;
      duration_seconds?: number;
      subject_id?: string;
      grades?: string[];
    }) => {
      const updates: Record<string, unknown> = {};
      if (title !== undefined) updates.title = title;
      if (description !== undefined) updates.description = description;
      if (video_url !== undefined) updates.video_url = video_url;
      if (thumbnail_url !== undefined) updates.thumbnail_url = thumbnail_url;
      if (duration_seconds !== undefined) updates.duration_seconds = duration_seconds;
      if (subject_id !== undefined) updates.subject_id = subject_id;
      if (grades !== undefined) updates.grades = grades;

      const { data, error } = await supabase
        .from('center_reels')
        .update(updates)
        .eq('id', reelId)
        .eq('center_id', centerId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['center-reels', variables.centerId] });
    },
  });
};

export const useDeleteReel = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ reelId, centerId }: { reelId: string; centerId: string }) => {
      const { error } = await supabase
        .from('center_reels')
        .delete()
        .eq('id', reelId)
        .eq('center_id', centerId);
      if (error) throw error;
      return reelId;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['center-reels', variables.centerId] });
    },
  });
};

export const useCenterReels = (centerId?: string | null) => {
  return useQuery({
    queryKey: ['center-reels', centerId],
    queryFn: async () => {
      if (!centerId) return [];
      const { data, error } = await supabase
        .from('center_reels')
        .select('*, subjects(name)')
        .eq('center_id', centerId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!centerId,
  });
};

// Profile/Subscription
export const useUpdateCenter = () => {
  return useMutation({
    mutationFn: async (data: any) => data,
  });
};

export const useRequestPlanUpgrade = () => {
  return useMutation({
    mutationFn: async (data: any) => data,
  });
};

export const useCenterSubscription = (centerId?: string | null) => {
  return useQuery({
    queryKey: ['center-subscription', centerId],
    queryFn: async () => {
      if (!centerId) return null;
      const { data, error } = await supabase
        .from('center_subscriptions')
        .select('*')
        .eq('center_id', centerId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!centerId,
  });
};

// SEO
export const useCenterSeoSettings = (centerId?: string | null) => {
  return useQuery({
    queryKey: ['center-seo', centerId],
    queryFn: async () => ({}),
    enabled: !!centerId,
  });
};

export const useUpdateSeoSettings = () => {
  return useMutation({
    mutationFn: async (data: any) => data,
  });
};
