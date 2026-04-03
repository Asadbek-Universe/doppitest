import{b as l,g as m,a as g,h as c,i as n,s as o}from"./index-D3sSRaik.js";const f=e=>{const{user:i}=l(),t=m(),{data:a,isLoading:y}=g({queryKey:["olympiad-registration",e,i?.id],queryFn:async()=>{if(!i?.id)return null;const{data:r,error:s}=await o.from("olympiad_registrations").select("*").eq("olympiad_id",e).eq("user_id",i.id).maybeSingle();if(s)throw s;return r},enabled:!!i?.id&&!!e}),u=c({mutationFn:async()=>{if(!i?.id)throw new Error("Must be logged in to register");const{data:r,error:s}=await o.from("olympiad_registrations").insert({olympiad_id:e,user_id:i.id,status:"registered"}).select().single();if(s)throw s;return r},onSuccess:()=>{t.invalidateQueries({queryKey:["olympiad-registration",e]}),t.invalidateQueries({queryKey:["user-olympiad-registrations"]}),t.invalidateQueries({queryKey:["upcoming-olympiads"]}),n.success("Successfully registered for olympiad!")},onError:r=>{n.error(r.message||"Failed to register")}}),d=c({mutationFn:async()=>{if(!i?.id||!a?.id)throw new Error("No registration found");const{error:r}=await o.from("olympiad_registrations").delete().eq("id",a.id);if(r)throw r},onSuccess:()=>{t.invalidateQueries({queryKey:["olympiad-registration",e]}),t.invalidateQueries({queryKey:["user-olympiad-registrations"]}),t.invalidateQueries({queryKey:["upcoming-olympiads"]}),n.success("Registration cancelled")},onError:r=>{n.error(r.message||"Failed to cancel registration")}});return{registration:a,isLoading:y,isRegistered:!!a,register:u.mutate,unregister:d.mutate,isRegistering:u.isPending,isUnregistering:d.isPending}},_=()=>{const{user:e}=l();return g({queryKey:["user-olympiad-registrations",e?.id],queryFn:async()=>{if(!e?.id)return[];const{data:i,error:t}=await o.from("olympiad_registrations").select(`
          *,
          olympiad:olympiads(
            id,
            title,
            start_date,
            end_date,
            status,
            prize_description,
            max_participants,
            current_participants,
            subject:subjects(name, color),
            center:educational_centers(name, is_verified)
          )
        `).eq("user_id",e.id).order("registered_at",{ascending:!1});if(t)throw t;return i},enabled:!!e?.id})};export{_ as a,f as u};
