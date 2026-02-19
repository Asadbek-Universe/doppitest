import { FC } from 'react';
import { Award, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { CertificateCard } from './CertificateCard';
import { useUserCertificates } from '@/hooks/useCertificates';

interface CertificatesSectionProps {
  showAll?: boolean;
}

export const CertificatesSection: FC<CertificatesSectionProps> = ({ showAll = false }) => {
  const { data: certificates, isLoading } = useUserCertificates();

  const displayCertificates = showAll ? certificates : certificates?.slice(0, 4);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Award className="w-6 h-6 text-primary" />
            My Certificates
          </h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2].map((i) => (
            <Skeleton key={i} className="h-40 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!certificates || certificates.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Award className="w-6 h-6 text-primary" />
            My Certificates
          </h2>
        </div>
        <div className="text-center py-12 bg-muted/30 rounded-xl border border-dashed border-border">
          <Award className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="font-semibold mb-2">No Certificates Yet</h3>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Participate in olympiads to earn certificates and showcase your achievements!
          </p>
        </div>
      </div>
    );
  }

  // Group by type for stats
  const stats = {
    gold: certificates.filter(c => c.certificate_type === 'gold').length,
    silver: certificates.filter(c => c.certificate_type === 'silver').length,
    bronze: certificates.filter(c => c.certificate_type === 'bronze').length,
    participation: certificates.filter(c => c.certificate_type === 'participation').length,
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Award className="w-6 h-6 text-primary" />
          My Certificates
        </h2>
        {!showAll && certificates.length > 4 && (
          <Button variant="ghost" className="text-primary">
            View All ({certificates.length})
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        )}
      </div>

      {/* Stats Row */}
      <div className="flex items-center gap-4 text-sm">
        {stats.gold > 0 && (
          <span className="flex items-center gap-1">
            🥇 <span className="font-semibold">{stats.gold}</span>
          </span>
        )}
        {stats.silver > 0 && (
          <span className="flex items-center gap-1">
            🥈 <span className="font-semibold">{stats.silver}</span>
          </span>
        )}
        {stats.bronze > 0 && (
          <span className="flex items-center gap-1">
            🥉 <span className="font-semibold">{stats.bronze}</span>
          </span>
        )}
        {stats.participation > 0 && (
          <span className="flex items-center gap-1">
            📜 <span className="font-semibold">{stats.participation}</span>
          </span>
        )}
      </div>

      {/* Certificates Grid */}
      <div className="grid gap-4 md:grid-cols-2">
        {displayCertificates?.map((certificate, index) => (
          <CertificateCard key={certificate.id} certificate={certificate} index={index} />
        ))}
      </div>
    </div>
  );
};
