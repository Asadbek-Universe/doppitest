import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "sonner";

export const useOlympiadRegistration = (olympiadId: string) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: registration, isLoading } = useQuery({
    queryKey: ["olympiad-registration", olympiadId, user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data, error } = await supabase
        .from("olympiad_registrations")
        .select("*")
        .eq("olympiad_id", olympiadId)
        .eq("user_id", user.id)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id && !!olympiadId,
  });

  const registerMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error("Must be logged in to register");
      
      const { data, error } = await supabase
        .from("olympiad_registrations")
        .insert({
          olympiad_id: olympiadId,
          user_id: user.id,
          status: "registered",
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["olympiad-registration", olympiadId] });
      queryClient.invalidateQueries({ queryKey: ["user-olympiad-registrations"] });
      queryClient.invalidateQueries({ queryKey: ["upcoming-olympiads"] });
      toast.success("Successfully registered for olympiad!");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to register");
    },
  });

  const unregisterMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id || !registration?.id) throw new Error("No registration found");
      
      const { error } = await supabase
        .from("olympiad_registrations")
        .delete()
        .eq("id", registration.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["olympiad-registration", olympiadId] });
      queryClient.invalidateQueries({ queryKey: ["user-olympiad-registrations"] });
      queryClient.invalidateQueries({ queryKey: ["upcoming-olympiads"] });
      toast.success("Registration cancelled");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to cancel registration");
    },
  });

  return {
    registration,
    isLoading,
    isRegistered: !!registration,
    register: registerMutation.mutate,
    unregister: unregisterMutation.mutate,
    isRegistering: registerMutation.isPending,
    isUnregistering: unregisterMutation.isPending,
  };
};

export const useUserOlympiadRegistrations = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["user-olympiad-registrations", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from("olympiad_registrations")
        .select(`
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
        `)
        .eq("user_id", user.id)
        .order("registered_at", { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });
};
