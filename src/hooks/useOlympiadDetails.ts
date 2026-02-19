import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useOlympiadDetails = (olympiadId: string) => {
  return useQuery({
    queryKey: ["olympiad-details", olympiadId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("olympiads")
        .select(`
          *,
          subject:subjects(id, name, color, icon),
          center:educational_centers(id, name, is_verified, logo_url, city)
        `)
        .eq("id", olympiadId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!olympiadId,
  });
};

export const useOlympiadParticipants = (olympiadId: string) => {
  return useQuery({
    queryKey: ["olympiad-participants", olympiadId],
    queryFn: async () => {
      // First get registrations
      const { data: registrations, error: regError } = await supabase
        .from("olympiad_registrations")
        .select("*")
        .eq("olympiad_id", olympiadId)
        .order("registered_at", { ascending: true });

      if (regError) throw regError;
      if (!registrations || registrations.length === 0) return [];

      // Get unique user_ids
      const userIds = [...new Set(registrations.map(r => r.user_id))];

      // Fetch profiles for these users
      const { data: profiles, error: profileError } = await supabase
        .from("profiles")
        .select("user_id, display_name, avatar_url, city")
        .in("user_id", userIds);

      if (profileError) throw profileError;

      // Map profiles to registrations
      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

      return registrations.map(reg => ({
        ...reg,
        profile: profileMap.get(reg.user_id) || null,
      }));
    },
    enabled: !!olympiadId,
  });
};
