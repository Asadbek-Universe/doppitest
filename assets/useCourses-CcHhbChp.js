import{a as o,g as c,h as i,s as t}from"./index-BYudmypk.js";const y=()=>o({queryKey:["subjects"],queryFn:async()=>{const{data:e,error:r}=await t.from("subjects").select("*").order("name",{ascending:!0});if(r)throw r;return e}}),d=e=>o({queryKey:["courses",e],queryFn:async()=>{let r=t.from("courses").select(`
          *,
          subjects (
            id,
            name,
            color,
            icon
          )
        `).eq("is_published",!0).eq("approval_status","published").gt("lessons_count",0).order("created_at",{ascending:!1});e&&(r=r.eq("subject_id",e));const{data:s,error:n}=await r;if(n)throw n;return s}}),f=e=>o({queryKey:["course",e],queryFn:async()=>{const{data:r,error:s}=await t.from("courses").select(`
          *,
          subjects (
            id,
            name,
            color,
            icon
          )
        `).eq("id",e).maybeSingle();if(s)throw s;return r},enabled:!!e}),q=e=>o({queryKey:["lessons",e],queryFn:async()=>{const{data:r,error:s}=await t.from("lessons").select("*").eq("course_id",e).order("order_index",{ascending:!0});if(s)throw s;const n={};return r?.forEach(a=>{const u=a.section_title||"Introduction";n[u]||(n[u]=[]),n[u].push(a)}),{lessons:r,sections:n}},enabled:!!e}),_=e=>o({queryKey:["course-reviews",e],queryFn:async()=>{const{data:r,error:s}=await t.from("course_reviews").select("*").eq("course_id",e).order("created_at",{ascending:!1});if(s)throw s;return r},enabled:!!e}),m=()=>{const e=c();return i({mutationFn:async({courseId:r,userId:s})=>{const{data:n,error:a}=await t.from("course_enrollments").insert({course_id:r,user_id:s}).select().single();if(a)throw a;return n},onSuccess:(r,s)=>{e.invalidateQueries({queryKey:["enrollment",s.courseId]})}})},w=(e,r)=>o({queryKey:["enrollment",e,r],queryFn:async()=>{if(!r)return null;const{data:s,error:n}=await t.from("course_enrollments").select("*").eq("course_id",e).eq("user_id",r).maybeSingle();if(n)throw n;return s},enabled:!!e&&!!r}),h=e=>o({queryKey:["user-enrollments",e],queryFn:async()=>{if(!e)return[];const{data:r,error:s}=await t.from("course_enrollments").select(`
          *,
          courses (
            *,
            subjects (
              id,
              name,
              color,
              icon
            )
          )
        `).eq("user_id",e).order("enrolled_at",{ascending:!1});if(s)throw s;return r},enabled:!!e}),b=e=>o({queryKey:["all-lesson-progress",e],queryFn:async()=>{if(!e)return[];const{data:r,error:s}=await t.from("lesson_progress").select(`
          *,
          lessons (
            id,
            title,
            course_id,
            duration_minutes
          )
        `).eq("user_id",e);if(s)throw s;return r},enabled:!!e}),g=e=>o({queryKey:["course-lessons-counts",e],queryFn:async()=>{if(!e.length)return{};const{data:r,error:s}=await t.from("lessons").select("id, course_id").in("course_id",e);if(s)throw s;const n={};return r?.forEach(a=>{n[a.course_id]=(n[a.course_id]||0)+1}),n},enabled:e.length>0});export{q as a,_ as b,d as c,m as d,w as e,h as f,b as g,g as h,y as i,f as u};
