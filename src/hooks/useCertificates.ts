import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface Certificate {
  id: string;
  user_id: string;
  olympiad_id: string;
  certificate_type: 'gold' | 'silver' | 'bronze' | 'participation';
  rank: number | null;
  score: number | null;
  issued_at: string;
  certificate_number: string;
  olympiad?: {
    id: string;
    title: string;
    start_date: string;
    end_date: string;
    center?: {
      id: string;
      name: string;
      logo_url: string | null;
      is_verified: boolean;
    } | null;
    subject?: {
      id: string;
      name: string;
      color: string | null;
    } | null;
  };
}

// Fetch certificates for current user
export const useUserCertificates = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['user-certificates', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data: certificates, error } = await supabase
        .from('olympiad_certificates')
        .select('*')
        .eq('user_id', user.id)
        .order('issued_at', { ascending: false });

      if (error) throw error;
      if (!certificates || certificates.length === 0) return [];

      // Fetch olympiad details
      const olympiadIds = [...new Set(certificates.map(c => c.olympiad_id))];
      const { data: olympiads } = await supabase
        .from('olympiads')
        .select(`
          id,
          title,
          start_date,
          end_date,
          center:educational_centers(id, name, logo_url, is_verified),
          subject:subjects(id, name, color)
        `)
        .in('id', olympiadIds);

      const olympiadMap = new Map(olympiads?.map(o => [o.id, o]) || []);

      return certificates.map(cert => ({
        ...cert,
        olympiad: olympiadMap.get(cert.olympiad_id) || null,
      })) as Certificate[];
    },
    enabled: !!user?.id,
  });
};

// Issue certificate (for center owners)
export const useIssueCertificate = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      userId,
      olympiadId,
      certificateType,
      rank,
      score,
    }: {
      userId: string;
      olympiadId: string;
      certificateType: 'gold' | 'silver' | 'bronze' | 'participation';
      rank?: number | null;
      score?: number | null;
    }) => {
      const { data, error } = await supabase
        .from('olympiad_certificates')
        .insert({
          user_id: userId,
          olympiad_id: olympiadId,
          certificate_type: certificateType,
          rank,
          score,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['user-certificates', variables.userId] });
      queryClient.invalidateQueries({ queryKey: ['olympiad-certificates', variables.olympiadId] });
    },
  });
};

// Bulk issue certificates (for center owners)
export const useBulkIssueCertificates = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      olympiadId,
      certificates,
    }: {
      olympiadId: string;
      certificates: Array<{
        userId: string;
        certificateType: 'gold' | 'silver' | 'bronze' | 'participation';
        rank?: number | null;
        score?: number | null;
      }>;
    }) => {
      const insertData = certificates.map(cert => ({
        user_id: cert.userId,
        olympiad_id: olympiadId,
        certificate_type: cert.certificateType,
        rank: cert.rank,
        score: cert.score,
      }));

      const { error } = await supabase
        .from('olympiad_certificates')
        .upsert(insertData, { onConflict: 'user_id,olympiad_id' });

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['olympiad-certificates', variables.olympiadId] });
      // Invalidate all user certificates
      variables.certificates.forEach(cert => {
        queryClient.invalidateQueries({ queryKey: ['user-certificates', cert.userId] });
      });
    },
  });
};

// Fetch certificates for an olympiad (for center owners)
export const useOlympiadCertificates = (olympiadId: string | null | undefined) => {
  return useQuery({
    queryKey: ['olympiad-certificates', olympiadId],
    queryFn: async () => {
      if (!olympiadId) return [];

      const { data, error } = await supabase
        .from('olympiad_certificates')
        .select('*')
        .eq('olympiad_id', olympiadId);

      if (error) throw error;
      return data || [];
    },
    enabled: !!olympiadId,
  });
};
