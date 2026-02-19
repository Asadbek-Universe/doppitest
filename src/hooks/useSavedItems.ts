import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type SavedItemType = "test" | "course" | "reel" | "center";

type SavedItemRow = {
  id: string;
  user_id: string;
  item_type: SavedItemType;
  item_id: string;
  created_at: string;
};

export const useIsSavedItem = (params: {
  userId?: string;
  itemType: SavedItemType;
  itemId: string;
}) => {
  const { userId, itemType, itemId } = params;

  return useQuery({
    queryKey: ["saved-item", userId, itemType, itemId],
    enabled: !!userId && !!itemId,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("saved_items")
        .select("id")
        .eq("user_id", userId)
        .eq("item_type", itemType)
        .eq("item_id", itemId)
        .maybeSingle();

      if (error) throw error;
      return !!data;
    },
  });
};

export const useToggleSavedItem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      userId: string;
      itemType: SavedItemType;
      itemId: string;
    }) => {
      const { userId, itemType, itemId } = params;

      const { data: existing, error: existingError } = await (supabase as any)
        .from("saved_items")
        .select("id")
        .eq("user_id", userId)
        .eq("item_type", itemType)
        .eq("item_id", itemId)
        .maybeSingle();

      if (existingError) throw existingError;

      if (existing?.id) {
        const { error: delError } = await (supabase as any)
          .from("saved_items")
          .delete()
          .eq("id", existing.id);
        if (delError) throw delError;
        return { saved: false as const };
      }

      const { error: insError } = await (supabase as any)
        .from("saved_items")
        .insert({
          user_id: userId,
          item_type: itemType,
          item_id: itemId,
        } satisfies Omit<SavedItemRow, "id" | "created_at">);
      if (insError) throw insError;
      return { saved: true as const };
    },
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({
        queryKey: ["saved-item", vars.userId, vars.itemType, vars.itemId],
      });

      queryClient.invalidateQueries({
        queryKey: ["saved-items", vars.userId],
      });
    },
  });
};

export type SavedItemsListItem =
  | {
      type: "test";
      id: string;
      createdAt: string;
      title: string;
      description?: string | null;
    }
  | {
      type: "course";
      id: string;
      createdAt: string;
      title: string;
      description?: string | null;
    }
  | {
      type: "reel";
      id: string;
      createdAt: string;
      title: string;
      description?: string | null;
    }
  | {
      type: "center";
      id: string;
      createdAt: string;
      name: string;
      city?: string | null;
    };

export const useSavedItemsList = (params: { userId?: string }) => {
  const { userId } = params;

  return useQuery({
    queryKey: ["saved-items", userId],
    enabled: !!userId,
    queryFn: async (): Promise<SavedItemsListItem[]> => {
      const { data: saved, error } = await (supabase as any)
        .from("saved_items")
        .select("item_type,item_id,created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const rows = (saved || []) as Array<{
        item_type: SavedItemType;
        item_id: string;
        created_at: string;
      }>;

      if (rows.length === 0) return [];

      const idsByType = rows.reduce(
        (acc, r) => {
          acc[r.item_type].push(r.item_id);
          return acc;
        },
        {
          test: [] as string[],
          course: [] as string[],
          reel: [] as string[],
          center: [] as string[],
        }
      );

      const [testsRes, coursesRes, reelsRes, centersRes] = await Promise.all([
        idsByType.test.length
          ? (supabase as any)
              .from("tests")
              .select("id,title,description")
              .in("id", idsByType.test)
          : Promise.resolve({ data: [] as any[], error: null as any }),
        idsByType.course.length
          ? (supabase as any)
              .from("courses")
              .select("id,title,description")
              .in("id", idsByType.course)
          : Promise.resolve({ data: [] as any[], error: null as any }),
        idsByType.reel.length
          ? (supabase as any)
              .from("center_reels")
              .select("id,title,description")
              .in("id", idsByType.reel)
          : Promise.resolve({ data: [] as any[], error: null as any }),
        idsByType.center.length
          ? (supabase as any)
              .from("educational_centers")
              .select("id,name,city")
              .in("id", idsByType.center)
          : Promise.resolve({ data: [] as any[], error: null as any }),
      ]);

      if (testsRes.error) throw testsRes.error;
      if (coursesRes.error) throw coursesRes.error;
      if (reelsRes.error) throw reelsRes.error;
      if (centersRes.error) throw centersRes.error;

      const testsById: Map<string, any> = new Map(
        (testsRes.data || []).map((t: any) => [t.id as string, t])
      );
      const coursesById: Map<string, any> = new Map(
        (coursesRes.data || []).map((c: any) => [c.id as string, c])
      );
      const reelsById: Map<string, any> = new Map(
        (reelsRes.data || []).map((r: any) => [r.id as string, r])
      );
      const centersById: Map<string, any> = new Map(
        (centersRes.data || []).map((c: any) => [c.id as string, c])
      );

      const merged: SavedItemsListItem[] = [];
      for (const r of rows) {
        if (r.item_type === "test") {
          const t = testsById.get(r.item_id);
          if (!t) continue;
          merged.push({
            type: "test",
            id: t.id,
            createdAt: r.created_at,
            title: t.title,
            description: t.description,
          });
        } else if (r.item_type === "course") {
          const c = coursesById.get(r.item_id);
          if (!c) continue;
          merged.push({
            type: "course",
            id: c.id,
            createdAt: r.created_at,
            title: c.title,
            description: c.description,
          });
        } else if (r.item_type === "reel") {
          const rr = reelsById.get(r.item_id);
          if (!rr) continue;
          merged.push({
            type: "reel",
            id: rr.id,
            createdAt: r.created_at,
            title: rr.title,
            description: rr.description,
          });
        } else if (r.item_type === "center") {
          const cc = centersById.get(r.item_id);
          if (!cc) continue;
          merged.push({
            type: "center",
            id: cc.id,
            createdAt: r.created_at,
            name: cc.name,
            city: cc.city,
          });
        }
      }

      return merged;
    },
  });
};

export const useRemoveSavedItem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { userId: string; itemType: SavedItemType; itemId: string }) => {
      const { userId, itemType, itemId } = params;
      const { error } = await (supabase as any)
        .from("saved_items")
        .delete()
        .eq("user_id", userId)
        .eq("item_type", itemType)
        .eq("item_id", itemId);

      if (error) throw error;
      return true;
    },
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: ["saved-items", vars.userId] });
      queryClient.invalidateQueries({
        queryKey: ["saved-item", vars.userId, vars.itemType, vars.itemId],
      });
    },
  });
};
