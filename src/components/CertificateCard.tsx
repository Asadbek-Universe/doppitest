import { FC, useState } from 'react';
import { motion } from 'framer-motion';
import { Award, Trophy, Medal, Star, Calendar, CheckCircle2, Download, Share2, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { toast } from 'sonner';
import jsPDF from 'jspdf';

interface CertificateCardProps {
  certificate: {
    id: string;
    certificate_type: 'gold' | 'silver' | 'bronze' | 'participation';
    rank: number | null;
    score: number | null;
    issued_at: string;
    certificate_number: string;
    olympiad?: {
      title: string;
      start_date: string;
      end_date: string;
      center?: {
        name: string;
        logo_url: string | null;
        is_verified: boolean;
      } | null;
      subject?: {
        name: string;
        color: string | null;
      } | null;
    } | null;
  };
  index?: number;
}

const certificateStyles = {
  gold: {
    bg: 'from-yellow-500/20 via-amber-400/10 to-yellow-600/20',
    border: 'border-yellow-500/50',
    icon: Trophy,
    iconColor: 'text-yellow-500',
    badge: 'bg-yellow-500/20 text-yellow-600 border-yellow-500/30',
    label: '🥇 Gold Medal',
    pdfColors: [255, 215, 0] as [number, number, number],
  },
  silver: {
    bg: 'from-gray-400/20 via-slate-300/10 to-gray-500/20',
    border: 'border-gray-400/50',
    icon: Medal,
    iconColor: 'text-gray-400',
    badge: 'bg-gray-400/20 text-gray-500 border-gray-400/30',
    label: '🥈 Silver Medal',
    pdfColors: [192, 192, 192] as [number, number, number],
  },
  bronze: {
    bg: 'from-amber-700/20 via-orange-600/10 to-amber-800/20',
    border: 'border-amber-700/50',
    icon: Medal,
    iconColor: 'text-amber-700',
    badge: 'bg-amber-700/20 text-amber-700 border-amber-700/30',
    label: '🥉 Bronze Medal',
    pdfColors: [205, 127, 50] as [number, number, number],
  },
  participation: {
    bg: 'from-primary/10 via-primary/5 to-primary/10',
    border: 'border-primary/30',
    icon: Award,
    iconColor: 'text-primary',
    badge: 'bg-primary/10 text-primary border-primary/30',
    label: '📜 Participation',
    pdfColors: [70, 130, 180] as [number, number, number],
  },
};

export const CertificateCard: FC<CertificateCardProps> = ({ certificate, index = 0 }) => {
  const [isDownloading, setIsDownloading] = useState(false);
  const style = certificateStyles[certificate.certificate_type] || certificateStyles.participation;
  const Icon = style.icon;

  const generatePDF = async () => {
    setIsDownloading(true);
    
    try {
      const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4',
      });

      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const colors = style.pdfColors;

      // Fill background
      doc.setFillColor(250, 250, 255);
      doc.rect(0, 0, pageWidth, pageHeight, 'F');

      // Decorative border
      doc.setDrawColor(colors[0], colors[1], colors[2]);
      doc.setLineWidth(3);
      doc.rect(10, 10, pageWidth - 20, pageHeight - 20, 'S');
      
      doc.setLineWidth(1);
      doc.rect(15, 15, pageWidth - 30, pageHeight - 30, 'S');

      // Corner decorations
      const cornerSize = 15;
      doc.setFillColor(colors[0], colors[1], colors[2]);
      doc.triangle(10, 10, 10 + cornerSize, 10, 10, 10 + cornerSize, 'F');
      doc.triangle(pageWidth - 10, 10, pageWidth - 10 - cornerSize, 10, pageWidth - 10, 10 + cornerSize, 'F');
      doc.triangle(10, pageHeight - 10, 10 + cornerSize, pageHeight - 10, 10, pageHeight - 10 - cornerSize, 'F');
      doc.triangle(pageWidth - 10, pageHeight - 10, pageWidth - 10 - cornerSize, pageHeight - 10, pageWidth - 10, pageHeight - 10 - cornerSize, 'F');

      // Header
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(36);
      doc.setTextColor(colors[0], colors[1], colors[2]);
      doc.text('CERTIFICATE', pageWidth / 2, 40, { align: 'center' });

      doc.setFontSize(18);
      doc.setTextColor(100, 100, 100);
      doc.text('OF ACHIEVEMENT', pageWidth / 2, 52, { align: 'center' });

      // Medal type
      const medalLabels: Record<string, string> = {
        gold: '★ GOLD MEDAL ★',
        silver: '★ SILVER MEDAL ★',
        bronze: '★ BRONZE MEDAL ★',
        participation: '★ PARTICIPATION ★',
      };
      
      doc.setFontSize(24);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(colors[0], colors[1], colors[2]);
      doc.text(medalLabels[certificate.certificate_type] || '★ CERTIFICATE ★', pageWidth / 2, 72, { align: 'center' });

      // "This is to certify that"
      doc.setFontSize(14);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(80, 80, 80);
      doc.text('This is to certify that the certificate holder', pageWidth / 2, 95, { align: 'center' });

      doc.setFontSize(14);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(80, 80, 80);
      doc.text('has successfully participated in', pageWidth / 2, 110, { align: 'center' });

      // Olympiad Title
      doc.setFontSize(22);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(40, 40, 40);
      const olympiadTitle = certificate.olympiad?.title || 'Olympiad Competition';
      doc.text(olympiadTitle, pageWidth / 2, 128, { align: 'center' });

      // Subject
      if (certificate.olympiad?.subject?.name) {
        doc.setFontSize(14);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(colors[0], colors[1], colors[2]);
        doc.text(`Subject: ${certificate.olympiad.subject.name}`, pageWidth / 2, 142, { align: 'center' });
      }

      // Rank and Score
      let yPosition = 156;
      const hasRank = certificate.rank !== null;
      const hasScore = certificate.score !== null;
      
      if (hasRank && hasScore) {
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(colors[0], colors[1], colors[2]);
        doc.text(`Rank: #${certificate.rank}`, pageWidth / 2 - 40, yPosition, { align: 'center' });
        doc.text(`Score: ${certificate.score}`, pageWidth / 2 + 40, yPosition, { align: 'center' });
      } else if (hasRank) {
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(colors[0], colors[1], colors[2]);
        doc.text(`Rank: #${certificate.rank}`, pageWidth / 2, yPosition, { align: 'center' });
      } else if (hasScore) {
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(colors[0], colors[1], colors[2]);
        doc.text(`Score: ${certificate.score}`, pageWidth / 2, yPosition, { align: 'center' });
      }

      // Organized by
      yPosition = 172;
      if (certificate.olympiad?.center?.name) {
        doc.setFontSize(12);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(80, 80, 80);
        doc.text('Organized by', pageWidth / 2, yPosition, { align: 'center' });
        
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(60, 60, 60);
        doc.text(certificate.olympiad.center.name, pageWidth / 2, yPosition + 8, { align: 'center' });
      }

      // Certificate number and date
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(120, 120, 120);
      
      const issueDate = format(new Date(certificate.issued_at), 'MMMM dd, yyyy');
      doc.text(`Certificate No: ${certificate.certificate_number}`, 30, pageHeight - 25);
      doc.text(`Issued on: ${issueDate}`, pageWidth - 30, pageHeight - 25, { align: 'right' });

      // Save
      const fileName = `certificate-${certificate.certificate_number}.pdf`;
      doc.save(fileName);
      
      toast.success('Certificate downloaded successfully!');
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Failed to generate certificate PDF');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleShare = async () => {
    const shareText = `I earned a ${style.label} in ${certificate.olympiad?.title || 'an Olympiad'}! 🎉`;
    const shareData = {
      title: `${style.label} - ${certificate.olympiad?.title}`,
      text: shareText,
      url: window.location.href,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(shareText);
        toast.success('Achievement copied to clipboard!');
      }
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        toast.error('Failed to share');
      }
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
    >
      <Card className={`overflow-hidden border-2 ${style.border} hover:shadow-lg transition-shadow`}>
        <div className={`h-2 bg-gradient-to-r ${style.bg}`} />
        <CardContent className="p-5">
          <div className="flex items-start gap-4">
            {/* Certificate Icon */}
            <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${style.bg} flex items-center justify-center shrink-0`}>
              <Icon className={`w-7 h-7 ${style.iconColor}`} />
            </div>

            {/* Certificate Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="outline" className={style.badge}>
                  {style.label}
                </Badge>
                {certificate.rank && certificate.rank <= 3 && (
                  <Badge variant="secondary" className="text-xs">
                    Rank #{certificate.rank}
                  </Badge>
                )}
              </div>

              <h3 className="font-semibold text-foreground truncate">
                {certificate.olympiad?.title || 'Olympiad'}
              </h3>

              {certificate.olympiad?.center && (
                <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                  {certificate.olympiad.center.name}
                  {certificate.olympiad.center.is_verified && (
                    <CheckCircle2 className="w-3 h-3 text-primary" />
                  )}
                </p>
              )}

              <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  <span>
                    {certificate.olympiad?.end_date 
                      ? format(new Date(certificate.olympiad.end_date), 'MMM yyyy')
                      : format(new Date(certificate.issued_at), 'MMM yyyy')
                    }
                  </span>
                </div>
                {certificate.score !== null && (
                  <div className="flex items-center gap-1">
                    <Star className="w-3 h-3" />
                    <span>{certificate.score} pts</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Certificate Number and Actions */}
          <div className="mt-4 pt-3 border-t border-border flex items-center justify-between">
            <p className="text-xs text-muted-foreground font-mono">
              {certificate.certificate_number}
            </p>
            <div className="flex items-center gap-1">
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 w-8 p-0"
                onClick={handleShare}
                title="Share certificate"
              >
                <Share2 className="w-4 h-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 w-8 p-0"
                onClick={generatePDF}
                disabled={isDownloading}
                title="Download as PDF"
              >
                {isDownloading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};