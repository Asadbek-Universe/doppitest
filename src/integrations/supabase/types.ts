export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      activity_logs: {
        Row: {
          action_type: string
          created_at: string
          details: Json | null
          entity_id: string | null
          entity_type: string
          id: string
          ip_address: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action_type: string
          created_at?: string
          details?: Json | null
          entity_id?: string | null
          entity_type: string
          id?: string
          ip_address?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action_type?: string
          created_at?: string
          details?: Json | null
          entity_id?: string | null
          entity_type?: string
          id?: string
          ip_address?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      center_analytics: {
        Row: {
          center_id: string
          course_views: number
          created_at: string
          date: string
          enrollments: number
          id: string
          profile_views: number
          revenue: number
          test_completions: number
          test_views: number
          video_views: number
        }
        Insert: {
          center_id: string
          course_views?: number
          created_at?: string
          date?: string
          enrollments?: number
          id?: string
          profile_views?: number
          revenue?: number
          test_completions?: number
          test_views?: number
          video_views?: number
        }
        Update: {
          center_id?: string
          course_views?: number
          created_at?: string
          date?: string
          enrollments?: number
          id?: string
          profile_views?: number
          revenue?: number
          test_completions?: number
          test_views?: number
          video_views?: number
        }
        Relationships: [
          {
            foreignKeyName: "center_analytics_center_id_fkey"
            columns: ["center_id"]
            isOneToOne: false
            referencedRelation: "educational_centers"
            referencedColumns: ["id"]
          },
        ]
      }
      center_followers: {
        Row: {
          center_id: string
          followed_at: string
          id: string
          user_id: string
        }
        Insert: {
          center_id: string
          followed_at?: string
          id?: string
          user_id: string
        }
        Update: {
          center_id?: string
          followed_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "center_followers_center_id_fkey"
            columns: ["center_id"]
            isOneToOne: false
            referencedRelation: "educational_centers"
            referencedColumns: ["id"]
          },
        ]
      }
      center_reels: {
        Row: {
          center_id: string
          created_at: string
          description: string | null
          duration_seconds: number | null
          grades: string[] | null
          id: string
          is_published: boolean
          likes_count: number
          subject_id: string | null
          thumbnail_url: string | null
          title: string
          updated_at: string
          video_url: string
          views_count: number
          approval_status: string
          rejection_reason: string | null
          approved_at: string | null
          approved_by: string | null
          submitted_for_approval_at: string | null
        }
        Insert: {
          center_id: string
          created_at?: string
          description?: string | null
          duration_seconds?: number | null
          grades?: string[] | null
          id?: string
          is_published?: boolean
          likes_count?: number
          subject_id?: string | null
          thumbnail_url?: string | null
          title: string
          updated_at?: string
          video_url: string
          views_count?: number
          approval_status?: string
          rejection_reason?: string | null
          approved_at?: string | null
          approved_by?: string | null
          submitted_for_approval_at?: string | null
        }
        Update: {
          center_id?: string
          created_at?: string
          description?: string | null
          duration_seconds?: number | null
          grades?: string[] | null
          id?: string
          is_published?: boolean
          likes_count?: number
          subject_id?: string | null
          thumbnail_url?: string | null
          title?: string
          updated_at?: string
          video_url?: string
          views_count?: number
          approval_status?: string
          rejection_reason?: string | null
          approved_at?: string | null
          approved_by?: string | null
          submitted_for_approval_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "center_reels_center_id_fkey"
            columns: ["center_id"]
            isOneToOne: false
            referencedRelation: "educational_centers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "center_reels_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      center_seo_settings: {
        Row: {
          boost_enabled: boolean
          boost_expires_at: string | null
          center_id: string
          created_at: string
          id: string
          keywords: string[] | null
          meta_description: string | null
          meta_title: string | null
          updated_at: string
          visibility_score: number
        }
        Insert: {
          boost_enabled?: boolean
          boost_expires_at?: string | null
          center_id: string
          created_at?: string
          id?: string
          keywords?: string[] | null
          meta_description?: string | null
          meta_title?: string | null
          updated_at?: string
          visibility_score?: number
        }
        Update: {
          boost_enabled?: boolean
          boost_expires_at?: string | null
          center_id?: string
          created_at?: string
          id?: string
          keywords?: string[] | null
          meta_description?: string | null
          meta_title?: string | null
          updated_at?: string
          visibility_score?: number
        }
        Relationships: [
          {
            foreignKeyName: "center_seo_settings_center_id_fkey"
            columns: ["center_id"]
            isOneToOne: true
            referencedRelation: "educational_centers"
            referencedColumns: ["id"]
          },
        ]
      }
      center_subscriptions: {
        Row: {
          admin_notes: string | null
          can_create_olympiads: boolean
          center_id: string
          created_at: string
          expires_at: string | null
          id: string
          is_active: boolean
          max_courses: number
          max_tests: number
          max_videos: number
          selected_at: string | null
          seo_boost_level: number
          started_at: string
          tariff_approved_at: string | null
          tariff_approved_by: string | null
          tariff_selected: boolean
          tier: Database["public"]["Enums"]["subscription_tier"]
          updated_at: string
        }
        Insert: {
          admin_notes?: string | null
          can_create_olympiads?: boolean
          center_id: string
          created_at?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          max_courses?: number
          max_tests?: number
          max_videos?: number
          selected_at?: string | null
          seo_boost_level?: number
          started_at?: string
          tariff_approved_at?: string | null
          tariff_approved_by?: string | null
          tariff_selected?: boolean
          tier?: Database["public"]["Enums"]["subscription_tier"]
          updated_at?: string
        }
        Update: {
          admin_notes?: string | null
          can_create_olympiads?: boolean
          center_id?: string
          created_at?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          max_courses?: number
          max_tests?: number
          max_videos?: number
          selected_at?: string | null
          seo_boost_level?: number
          started_at?: string
          tariff_approved_at?: string | null
          tariff_approved_by?: string | null
          tariff_selected?: boolean
          tier?: Database["public"]["Enums"]["subscription_tier"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "center_subscriptions_center_id_fkey"
            columns: ["center_id"]
            isOneToOne: true
            referencedRelation: "educational_centers"
            referencedColumns: ["id"]
          },
        ]
      }
      course_enrollments: {
        Row: {
          center_id: string | null
          completed_at: string | null
          course_id: string
          enrolled_at: string
          id: string
          user_id: string
        }
        Insert: {
          center_id?: string | null
          completed_at?: string | null
          course_id: string
          enrolled_at?: string
          id?: string
          user_id: string
        }
        Update: {
          center_id?: string | null
          completed_at?: string | null
          course_id?: string
          enrolled_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_enrollments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_enrollments_center_id_fkey"
            columns: ["center_id"]
            isOneToOne: false
            referencedRelation: "educational_centers"
            referencedColumns: ["id"]
          },
        ]
      }
      course_modules: {
        Row: {
          id: string
          course_id: string
          title: string
          order_index: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          course_id: string
          title: string
          order_index?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          course_id?: string
          title?: string
          order_index?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_modules_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      course_notes: {
        Row: {
          created_at: string
          id: string
          lesson_id: string
          note_text: string
          timestamp_seconds: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          lesson_id: string
          note_text: string
          timestamp_seconds?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          lesson_id?: string
          note_text?: string
          timestamp_seconds?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_notes_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      course_reviews: {
        Row: {
          course_id: string
          created_at: string
          id: string
          likes_count: number | null
          rating: number
          review_text: string | null
          user_id: string
        }
        Insert: {
          course_id: string
          created_at?: string
          id?: string
          likes_count?: number | null
          rating: number
          review_text?: string | null
          user_id: string
        }
        Update: {
          course_id?: string
          created_at?: string
          id?: string
          likes_count?: number | null
          rating?: number
          review_text?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_reviews_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      courses: {
        Row: {
          center_id: string | null
          created_at: string
          description: string | null
          duration_minutes: number | null
          id: string
          instructor_avatar: string | null
          instructor_bio: string | null
          instructor_name: string
          is_free: boolean | null
          is_published: boolean
          language: string | null
          learning_outcomes: string[] | null
          lessons_count: number | null
          level: string | null
          price: number | null
          rating: number | null
          requirements: string[] | null
          students_count: number | null
          subject_id: string | null
          tags: string[] | null
          thumbnail_url: string | null
          title: string
          updated_at: string
          approval_status: string
          rejection_reason: string | null
          approved_at: string | null
          approved_by: string | null
          submitted_for_approval_at: string | null
        }
        Insert: {
          center_id?: string | null
          created_at?: string
          description?: string | null
          duration_minutes?: number | null
          id?: string
          instructor_avatar?: string | null
          instructor_bio?: string | null
          instructor_name?: string
          is_free?: boolean | null
          is_published?: boolean
          language?: string | null
          learning_outcomes?: string[] | null
          lessons_count?: number | null
          level?: string | null
          price?: number | null
          rating?: number | null
          requirements?: string[] | null
          students_count?: number | null
          subject_id?: string | null
          tags?: string[] | null
          thumbnail_url?: string | null
          title: string
          updated_at?: string
          approval_status?: string
          rejection_reason?: string | null
          approved_at?: string | null
          approved_by?: string | null
          submitted_for_approval_at?: string | null
        }
        Update: {
          center_id?: string | null
          created_at?: string
          description?: string | null
          duration_minutes?: number | null
          id?: string
          instructor_avatar?: string | null
          instructor_bio?: string | null
          instructor_name?: string
          is_free?: boolean | null
          is_published?: boolean
          language?: string | null
          learning_outcomes?: string[] | null
          lessons_count?: number | null
          level?: string | null
          price?: number | null
          rating?: number | null
          requirements?: string[] | null
          students_count?: number | null
          subject_id?: string | null
          tags?: string[] | null
          thumbnail_url?: string | null
          title?: string
          updated_at?: string
          approval_status?: string
          rejection_reason?: string | null
          approved_at?: string | null
          approved_by?: string | null
          submitted_for_approval_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "courses_center_id_fkey"
            columns: ["center_id"]
            isOneToOne: false
            referencedRelation: "educational_centers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "courses_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      educational_centers: {
        Row: {
          address: string | null
          approved_at: string | null
          approved_by: string | null
          banner_url: string | null
          city: string | null
          contact_phone: string | null
          created_at: string
          description: string | null
          email: string | null
          followers_count: number
          founded_year: number | null
          grades_served: string[] | null
          id: string
          is_verified: boolean | null
          languages_supported: string[] | null
          logo_url: string | null
          name: string
          onboarding_completed: boolean | null
          owner_id: string | null
          phone: string | null
          rejection_reason: string | null
          social_links: Json | null
          specializations: string[] | null
          status: Database["public"]["Enums"]["center_status"]
          student_count: number | null
          teachers_count: number | null
          updated_at: string
          website: string | null
        }
        Insert: {
          address?: string | null
          approved_at?: string | null
          approved_by?: string | null
          banner_url?: string | null
          city?: string | null
          contact_phone?: string | null
          created_at?: string
          description?: string | null
          email?: string | null
          followers_count?: number
          founded_year?: number | null
          grades_served?: string[] | null
          id?: string
          is_verified?: boolean | null
          languages_supported?: string[] | null
          logo_url?: string | null
          name: string
          onboarding_completed?: boolean | null
          owner_id?: string | null
          phone?: string | null
          rejection_reason?: string | null
          social_links?: Json | null
          specializations?: string[] | null
          status?: Database["public"]["Enums"]["center_status"]
          student_count?: number | null
          teachers_count?: number | null
          updated_at?: string
          website?: string | null
        }
        Update: {
          address?: string | null
          approved_at?: string | null
          approved_by?: string | null
          banner_url?: string | null
          city?: string | null
          contact_phone?: string | null
          created_at?: string
          description?: string | null
          email?: string | null
          followers_count?: number
          founded_year?: number | null
          grades_served?: string[] | null
          id?: string
          is_verified?: boolean | null
          languages_supported?: string[] | null
          logo_url?: string | null
          name?: string
          onboarding_completed?: boolean | null
          owner_id?: string | null
          phone?: string | null
          rejection_reason?: string | null
          social_links?: Json | null
          specializations?: string[] | null
          status?: Database["public"]["Enums"]["center_status"]
          student_count?: number | null
          teachers_count?: number | null
          updated_at?: string
          website?: string | null
        }
        Relationships: []
      }
      game_scores: {
        Row: {
          created_at: string
          difficulty_reached: number
          game_type: string
          id: string
          max_streak: number
          questions_answered: number
          score: number
          time_played_seconds: number
          user_id: string
        }
        Insert: {
          created_at?: string
          difficulty_reached?: number
          game_type?: string
          id?: string
          max_streak?: number
          questions_answered?: number
          score?: number
          time_played_seconds?: number
          user_id: string
        }
        Update: {
          created_at?: string
          difficulty_reached?: number
          game_type?: string
          id?: string
          max_streak?: number
          questions_answered?: number
          score?: number
          time_played_seconds?: number
          user_id?: string
        }
        Relationships: []
      }
      lesson_progress: {
        Row: {
          completed_at: string | null
          course_id: string
          id: string
          is_completed: boolean | null
          lesson_id: string
          user_id: string
          watched_seconds: number | null
        }
        Insert: {
          completed_at?: string | null
          course_id: string
          id?: string
          is_completed?: boolean | null
          lesson_id: string
          user_id: string
          watched_seconds?: number | null
        }
        Update: {
          completed_at?: string | null
          course_id?: string
          id?: string
          is_completed?: boolean | null
          lesson_id?: string
          user_id?: string
          watched_seconds?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "lesson_progress_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_progress_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      lessons: {
        Row: {
          course_id: string
          created_at: string
          description: string | null
          duration_minutes: number | null
          id: string
          is_free: boolean | null
          order_index: number
          section_title: string
          title: string
          video_url: string | null
        }
        Insert: {
          course_id: string
          created_at?: string
          description?: string | null
          duration_minutes?: number | null
          id?: string
          is_free?: boolean | null
          order_index?: number
          section_title?: string
          title: string
          video_url?: string | null
        }
        Update: {
          course_id?: string
          created_at?: string
          description?: string | null
          duration_minutes?: number | null
          id?: string
          is_free?: boolean | null
          order_index?: number
          section_title?: string
          title?: string
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lessons_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      olympiad_certificates: {
        Row: {
          certificate_number: string | null
          certificate_type: string
          id: string
          issued_at: string
          olympiad_id: string
          rank: number | null
          score: number | null
          user_id: string
        }
        Insert: {
          certificate_number?: string | null
          certificate_type?: string
          id?: string
          issued_at?: string
          olympiad_id: string
          rank?: number | null
          score?: number | null
          user_id: string
        }
        Update: {
          certificate_number?: string | null
          certificate_type?: string
          id?: string
          issued_at?: string
          olympiad_id?: string
          rank?: number | null
          score?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "olympiad_certificates_olympiad_id_fkey"
            columns: ["olympiad_id"]
            isOneToOne: false
            referencedRelation: "olympiads"
            referencedColumns: ["id"]
          },
        ]
      }
      olympiad_registrations: {
        Row: {
          id: string
          olympiad_id: string
          rank: number | null
          registered_at: string
          score: number | null
          status: string
          user_id: string
        }
        Insert: {
          id?: string
          olympiad_id: string
          rank?: number | null
          registered_at?: string
          score?: number | null
          status?: string
          user_id: string
        }
        Update: {
          id?: string
          olympiad_id?: string
          rank?: number | null
          registered_at?: string
          score?: number | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "olympiad_registrations_olympiad_id_fkey"
            columns: ["olympiad_id"]
            isOneToOne: false
            referencedRelation: "olympiads"
            referencedColumns: ["id"]
          },
        ]
      }
      olympiad_attempts: {
        Row: {
          id: string
          olympiad_id: string
          user_id: string
          started_at: string
          completed_at: string | null
          time_spent_seconds: number | null
          score: number | null
          total_points: number | null
          correct_count: number | null
          wrong_count: number | null
          status: string
          answers_snapshot: unknown
        }
        Insert: {
          id?: string
          olympiad_id: string
          user_id: string
          started_at?: string
          completed_at?: string | null
          time_spent_seconds?: number | null
          score?: number | null
          total_points?: number | null
          correct_count?: number | null
          wrong_count?: number | null
          status?: string
          answers_snapshot?: unknown
        }
        Update: {
          id?: string
          olympiad_id?: string
          user_id?: string
          started_at?: string
          completed_at?: string | null
          time_spent_seconds?: number | null
          score?: number | null
          total_points?: number | null
          correct_count?: number | null
          wrong_count?: number | null
          status?: string
          answers_snapshot?: unknown
        }
        Relationships: [
          {
            foreignKeyName: "olympiad_attempts_olympiad_id_fkey"
            columns: ["olympiad_id"]
            isOneToOne: false
            referencedRelation: "olympiads"
            referencedColumns: ["id"]
          },
        ]
      }
      olympiad_questions: {
        Row: {
          id: string
          olympiad_id: string
          question_type: string
          question_text: string
          image_url: string | null
          options: unknown
          correct_answer: unknown
          points: number
          topic: string | null
          difficulty: string | null
          explanation: string | null
          section: string | null
          order_index: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          olympiad_id: string
          question_type: string
          question_text: string
          image_url?: string | null
          options?: unknown
          correct_answer?: unknown
          points?: number
          topic?: string | null
          difficulty?: string | null
          explanation?: string | null
          section?: string | null
          order_index?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          olympiad_id?: string
          question_type?: string
          question_text?: string
          image_url?: string | null
          options?: unknown
          correct_answer?: unknown
          points?: number
          topic?: string | null
          difficulty?: string | null
          explanation?: string | null
          section?: string | null
          order_index?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "olympiad_questions_olympiad_id_fkey"
            columns: ["olympiad_id"]
            isOneToOne: false
            referencedRelation: "olympiads"
            referencedColumns: ["id"]
          },
        ]
      }
      olympiads: {
        Row: {
          approval_status: string
          approved_at: string | null
          approved_by: string | null
          center_id: string | null
          created_at: string
          current_participants: number | null
          description: string | null
          end_date: string
          entry_code: string | null
          id: string
          is_public: boolean
          is_published: boolean
          max_participants: number | null
          prize_description: string | null
          registration_deadline: string | null
          rejection_reason: string | null
          rules: string | null
          start_date: string
          status: string
          subject_id: string | null
          submitted_for_approval_at: string | null
          title: string
          updated_at: string
          grade: string | null
          language: string | null
          difficulty_level: string | null
          thumbnail_url: string | null
          banner_url: string | null
          registration_start_date: string | null
          duration_minutes: number | null
          auto_submit_when_time_ends: boolean | null
          allow_back_navigation: boolean | null
          shuffle_questions: boolean | null
          shuffle_options: boolean | null
          show_results_immediately: boolean | null
          show_correct_after_submit: boolean | null
          anti_cheat_disable_copy_paste: boolean | null
        }
        Insert: {
          approval_status?: string
          approved_at?: string | null
          approved_by?: string | null
          center_id?: string | null
          created_at?: string
          current_participants?: number | null
          description?: string | null
          end_date: string
          entry_code?: string | null
          id?: string
          is_public?: boolean
          is_published?: boolean
          max_participants?: number | null
          prize_description?: string | null
          registration_deadline?: string | null
          rejection_reason?: string | null
          rules?: string | null
          start_date: string
          status?: string
          subject_id?: string | null
          submitted_for_approval_at?: string | null
          title: string
          updated_at?: string
          grade?: string | null
          language?: string | null
          difficulty_level?: string | null
          thumbnail_url?: string | null
          banner_url?: string | null
          registration_start_date?: string | null
          duration_minutes?: number | null
          auto_submit_when_time_ends?: boolean | null
          allow_back_navigation?: boolean | null
          shuffle_questions?: boolean | null
          shuffle_options?: boolean | null
          show_results_immediately?: boolean | null
          show_correct_after_submit?: boolean | null
          anti_cheat_disable_copy_paste?: boolean | null
        }
        Update: {
          approval_status?: string
          approved_at?: string | null
          approved_by?: string | null
          center_id?: string | null
          created_at?: string
          current_participants?: number | null
          description?: string | null
          end_date?: string
          entry_code?: string | null
          id?: string
          is_public?: boolean
          is_published?: boolean
          max_participants?: number | null
          prize_description?: string | null
          registration_deadline?: string | null
          rejection_reason?: string | null
          rules?: string | null
          start_date?: string
          status?: string
          subject_id?: string | null
          submitted_for_approval_at?: string | null
          title?: string
          updated_at?: string
          grade?: string | null
          language?: string | null
          difficulty_level?: string | null
          thumbnail_url?: string | null
          banner_url?: string | null
          registration_start_date?: string | null
          duration_minutes?: number | null
          auto_submit_when_time_ends?: boolean | null
          allow_back_navigation?: boolean | null
          shuffle_questions?: boolean | null
          shuffle_options?: boolean | null
          show_results_immediately?: boolean | null
          show_correct_after_submit?: boolean | null
          anti_cheat_disable_copy_paste?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "olympiads_center_id_fkey"
            columns: ["center_id"]
            isOneToOne: false
            referencedRelation: "educational_centers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "olympiads_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          blocked_at: string | null
          center_name: string | null
          city: string | null
          created_at: string
          display_name: string | null
          gender: string | null
          goals: string | null
          grade: string | null
          id: string
          interests: string[] | null
          last_activity_at: string | null
          onboarding_completed: boolean | null
          phone: string | null
          preferred_language: string | null
          preparing_for_olympiads: boolean | null
          purpose: string | null
          school: string | null
          studies_at_center: boolean | null
          study_time_per_day_minutes: number | null
          updated_at: string
          user_id: string
          weak_subjects: string[] | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          blocked_at?: string | null
          center_name?: string | null
          city?: string | null
          created_at?: string
          display_name?: string | null
          gender?: string | null
          goals?: string | null
          grade?: string | null
          id?: string
          interests?: string[] | null
          last_activity_at?: string | null
          onboarding_completed?: boolean | null
          phone?: string | null
          preferred_language?: string | null
          preparing_for_olympiads?: boolean | null
          purpose?: string | null
          school?: string | null
          studies_at_center?: boolean | null
          study_time_per_day_minutes?: number | null
          updated_at?: string
          user_id: string
          weak_subjects?: string[] | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          blocked_at?: string | null
          center_name?: string | null
          city?: string | null
          created_at?: string
          display_name?: string | null
          gender?: string | null
          goals?: string | null
          grade?: string | null
          id?: string
          interests?: string[] | null
          last_activity_at?: string | null
          onboarding_completed?: boolean | null
          phone?: string | null
          preferred_language?: string | null
          preparing_for_olympiads?: boolean | null
          purpose?: string | null
          school?: string | null
          studies_at_center?: boolean | null
          study_time_per_day_minutes?: number | null
          updated_at?: string
          user_id?: string
          weak_subjects?: string[] | null
        }
        Relationships: []
      }
      question_bookmarks: {
        Row: {
          created_at: string
          id: string
          question_id: string
          test_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          question_id: string
          test_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          question_id?: string
          test_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "question_bookmarks_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "question_bookmarks_test_id_fkey"
            columns: ["test_id"]
            isOneToOne: false
            referencedRelation: "tests"
            referencedColumns: ["id"]
          },
        ]
      }
      question_options: {
        Row: {
          id: string
          is_correct: boolean
          option_letter: string
          option_text: string
          order_index: number
          question_id: string
        }
        Insert: {
          id?: string
          is_correct?: boolean
          option_letter: string
          option_text: string
          order_index?: number
          question_id: string
        }
        Update: {
          id?: string
          is_correct?: boolean
          option_letter?: string
          option_text?: string
          order_index?: number
          question_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "question_options_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
        ]
      }
      questions: {
        Row: {
          created_at: string
          explanation: string | null
          id: string
          order_index: number
          points: number
          question_text: string
          question_type: string
          test_id: string
          topic: string | null
        }
        Insert: {
          created_at?: string
          explanation?: string | null
          id?: string
          order_index?: number
          points?: number
          question_text: string
          question_type?: string
          test_id: string
          topic?: string | null
        }
        Update: {
          created_at?: string
          explanation?: string | null
          id?: string
          order_index?: number
          points?: number
          question_text?: string
          question_type?: string
          test_id?: string
          topic?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "questions_test_id_fkey"
            columns: ["test_id"]
            isOneToOne: false
            referencedRelation: "tests"
            referencedColumns: ["id"]
          },
        ]
      }
      saved_items: {
        Row: {
          created_at: string
          id: string
          item_id: string
          item_type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          item_id: string
          item_type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          item_id?: string
          item_type?: string
          user_id?: string
        }
        Relationships: []
      }
      subjects: {
        Row: {
          color: string | null
          created_at: string
          icon: string | null
          id: string
          name: string
          name_uz: string | null
        }
        Insert: {
          color?: string | null
          created_at?: string
          icon?: string | null
          id?: string
          name: string
          name_uz?: string | null
        }
        Update: {
          color?: string | null
          created_at?: string
          icon?: string | null
          id?: string
          name?: string
          name_uz?: string | null
        }
        Relationships: []
      }
      test_attempts: {
        Row: {
          completed_at: string | null
          correct_answers: number | null
          id: string
          score: number | null
          skipped_answers: number | null
          started_at: string
          status: string
          test_id: string
          time_spent_seconds: number | null
          total_points: number | null
          user_id: string
          wrong_answers: number | null
        }
        Insert: {
          completed_at?: string | null
          correct_answers?: number | null
          id?: string
          score?: number | null
          skipped_answers?: number | null
          started_at?: string
          status?: string
          test_id: string
          time_spent_seconds?: number | null
          total_points?: number | null
          user_id: string
          wrong_answers?: number | null
        }
        Update: {
          completed_at?: string | null
          correct_answers?: number | null
          id?: string
          score?: number | null
          skipped_answers?: number | null
          started_at?: string
          status?: string
          test_id?: string
          time_spent_seconds?: number | null
          total_points?: number | null
          user_id?: string
          wrong_answers?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "test_attempts_test_id_fkey"
            columns: ["test_id"]
            isOneToOne: false
            referencedRelation: "tests"
            referencedColumns: ["id"]
          },
        ]
      }
      tests: {
        Row: {
          author_avatar: string | null
          author_name: string | null
          center_id: string | null
          completions: number | null
          created_at: string
          description: string | null
          difficulty: number
          duration_minutes: number
          id: string
          is_free: boolean | null
          is_official: boolean | null
          is_published: boolean
          max_attempts: number | null
          passing_score_percent: number | null
          price: number | null
          questions_count: number
          rating: number | null
          shuffle_questions: boolean
          subject_id: string | null
          tags: string[] | null
          title: string
          total_marks: number | null
          updated_at: string
          approval_status: string
          rejection_reason: string | null
          approved_at: string | null
          approved_by: string | null
          submitted_for_approval_at: string | null
        }
        Insert: {
          author_avatar?: string | null
          author_name?: string | null
          center_id?: string | null
          completions?: number | null
          created_at?: string
          description?: string | null
          difficulty?: number
          duration_minutes?: number
          id?: string
          is_free?: boolean | null
          is_official?: boolean | null
          is_published?: boolean
          max_attempts?: number | null
          passing_score_percent?: number | null
          price?: number | null
          questions_count?: number
          rating?: number | null
          shuffle_questions?: boolean
          subject_id?: string | null
          tags?: string[] | null
          title: string
          total_marks?: number | null
          updated_at?: string
          approval_status?: string
          rejection_reason?: string | null
          approved_at?: string | null
          approved_by?: string | null
          submitted_for_approval_at?: string | null
        }
        Update: {
          author_avatar?: string | null
          author_name?: string | null
          center_id?: string | null
          completions?: number | null
          created_at?: string
          description?: string | null
          difficulty?: number
          duration_minutes?: number
          id?: string
          is_free?: boolean | null
          is_official?: boolean | null
          is_published?: boolean
          max_attempts?: number | null
          passing_score_percent?: number | null
          price?: number | null
          questions_count?: number
          rating?: number | null
          shuffle_questions?: boolean
          subject_id?: string | null
          tags?: string[] | null
          title?: string
          total_marks?: number | null
          updated_at?: string
          approval_status?: string
          rejection_reason?: string | null
          approved_at?: string | null
          approved_by?: string | null
          submitted_for_approval_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tests_center_id_fkey"
            columns: ["center_id"]
            isOneToOne: false
            referencedRelation: "educational_centers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tests_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      user_achievements: {
        Row: {
          achievement_id: string
          id: string
          unlocked_at: string
          user_id: string
        }
        Insert: {
          achievement_id: string
          id?: string
          unlocked_at?: string
          user_id: string
        }
        Update: {
          achievement_id?: string
          id?: string
          unlocked_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_answers: {
        Row: {
          answered_at: string | null
          attempt_id: string
          id: string
          is_correct: boolean | null
          is_marked_for_review: boolean | null
          question_id: string
          selected_option_id: string | null
        }
        Insert: {
          answered_at?: string | null
          attempt_id: string
          id?: string
          is_correct?: boolean | null
          is_marked_for_review?: boolean | null
          question_id: string
          selected_option_id?: string | null
        }
        Update: {
          answered_at?: string | null
          attempt_id?: string
          id?: string
          is_correct?: boolean | null
          is_marked_for_review?: boolean | null
          question_id?: string
          selected_option_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_answers_attempt_id_fkey"
            columns: ["attempt_id"]
            isOneToOne: false
            referencedRelation: "test_attempts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_answers_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_answers_selected_option_id_fkey"
            columns: ["selected_option_id"]
            isOneToOne: false
            referencedRelation: "question_options"
            referencedColumns: ["id"]
          },
        ]
      }
      user_goals: {
        Row: {
          completed_at: string | null
          created_at: string
          current_value: number
          deadline: string | null
          goal_type: string
          id: string
          is_completed: boolean
          subject_id: string | null
          target_value: number
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          current_value?: number
          deadline?: string | null
          goal_type?: string
          id?: string
          is_completed?: boolean
          subject_id?: string | null
          target_value: number
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          current_value?: number
          deadline?: string | null
          goal_type?: string
          id?: string
          is_completed?: boolean
          subject_id?: string | null
          target_value?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_goals_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
          admin_role: Database["public"]["Enums"]["admin_role"] | null
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
          admin_role?: Database["public"]["Enums"]["admin_role"] | null
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
          admin_role?: Database["public"]["Enums"]["admin_role"] | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      center_owner_can_update: {
        Args: {
          center_row: Database["public"]["Tables"]["educational_centers"]["Row"]
          user_uuid: string
        }
        Returns: boolean
      }
      get_center_status: {
        Args: { center_uuid: string }
        Returns: Database["public"]["Enums"]["center_status"]
      }
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "center" | "user"
      admin_role: "super_admin" | "moderator" | "content_reviewer" | "finance_admin"
      center_status: "pending" | "approved" | "rejected" | "active" | "suspended"
      subscription_tier: "free" | "pro" | "enterprise"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "center", "user"],
      center_status: ["pending", "approved", "rejected", "active"],
      subscription_tier: ["free", "pro", "enterprise"],
    },
  },
} as const
