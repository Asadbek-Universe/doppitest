import { FC, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Medal, Save, Users, Trophy, Crown, CheckSquare, Award } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { useOlympiadParticipantsForCenter, useUpdateParticipantScore, useUpdateParticipantStatus, useBulkUpdateParticipantStatus } from '@/hooks/useCenterData';
import { useBulkIssueCertificates, useOlympiadCertificates } from '@/hooks/useCertificates';
import { toast } from 'sonner';

interface OlympiadParticipantsManagerProps {
  olympiad: {
    id: string;
    title: string;
    status: string;
  };
  onBack: () => void;
}

type ParticipantStatus = 'registered' | 'participated' | 'disqualified';

export const OlympiadParticipantsManager: FC<OlympiadParticipantsManagerProps> = ({
  olympiad,
  onBack,
}) => {
  const { data: participants, isLoading } = useOlympiadParticipantsForCenter(olympiad.id);
  const { data: existingCertificates } = useOlympiadCertificates(olympiad.id);
  const updateScore = useUpdateParticipantScore();
  const updateStatus = useUpdateParticipantStatus();
  const bulkUpdateStatus = useBulkUpdateParticipantStatus();
  const bulkIssueCertificates = useBulkIssueCertificates();
  
  const [editedScores, setEditedScores] = useState<Record<string, { score: string; rank: string }>>({});
  const [savingId, setSavingId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Map of user_id to certificate type
  const certificateMap = new Map(existingCertificates?.map(c => [c.user_id, c.certificate_type]) || []);

  const handleScoreChange = (participantId: string, field: 'score' | 'rank', value: string) => {
    setEditedScores(prev => ({
      ...prev,
      [participantId]: {
        ...prev[participantId],
        score: prev[participantId]?.score ?? '',
        rank: prev[participantId]?.rank ?? '',
        [field]: value,
      },
    }));
  };

  const handleSave = async (participantId: string, currentScore: number | null, currentRank: number | null) => {
    const edited = editedScores[participantId];
    if (!edited) return;

    const newScore = edited.score !== '' ? parseInt(edited.score) : currentScore;
    const newRank = edited.rank !== '' ? parseInt(edited.rank) : currentRank;

    setSavingId(participantId);
    try {
      await updateScore.mutateAsync({
        registrationId: participantId,
        olympiadId: olympiad.id,
        score: newScore,
        rank: newRank,
      });
      toast.success('Score updated successfully');
      setEditedScores(prev => {
        const updated = { ...prev };
        delete updated[participantId];
        return updated;
      });
    } catch {
      toast.error('Failed to update score');
    } finally {
      setSavingId(null);
    }
  };

  const handleAutoRank = async () => {
    if (!participants || participants.length === 0) return;

    // Sort by score descending and assign ranks
    const sorted = [...participants]
      .filter(p => p.score !== null)
      .sort((a, b) => (b.score ?? 0) - (a.score ?? 0));

    try {
      for (let i = 0; i < sorted.length; i++) {
        await updateScore.mutateAsync({
          registrationId: sorted[i].id,
          olympiadId: olympiad.id,
          score: sorted[i].score,
          rank: i + 1,
        });
      }
      toast.success('Ranks calculated successfully');
    } catch {
      toast.error('Failed to calculate ranks');
    }
  };

  const getRankBadge = (rank: number | null) => {
    if (!rank) return null;
    if (rank === 1) return <Crown className="w-4 h-4 text-yellow-500" />;
    if (rank === 2) return <Medal className="w-4 h-4 text-gray-400" />;
    if (rank === 3) return <Medal className="w-4 h-4 text-amber-600" />;
    return <span className="text-muted-foreground">#{rank}</span>;
  };

  const handleStatusChange = async (participantId: string, newStatus: ParticipantStatus) => {
    try {
      await updateStatus.mutateAsync({
        registrationId: participantId,
        olympiadId: olympiad.id,
        status: newStatus,
      });
      toast.success('Status updated successfully');
    } catch {
      toast.error('Failed to update status');
    }
  };

  const statusOptions: { value: ParticipantStatus; label: string }[] = [
    { value: 'registered', label: 'Registered' },
    { value: 'participated', label: 'Participated' },
    { value: 'disqualified', label: 'Disqualified' },
  ];

  const handleSelectAll = (checked: boolean) => {
    if (checked && participants) {
      setSelectedIds(new Set(participants.map(p => p.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleSelectOne = (participantId: string, checked: boolean) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (checked) {
        newSet.add(participantId);
      } else {
        newSet.delete(participantId);
      }
      return newSet;
    });
  };

  const handleBulkStatusChange = async (newStatus: ParticipantStatus) => {
    if (selectedIds.size === 0) return;

    try {
      await bulkUpdateStatus.mutateAsync({
        registrationIds: Array.from(selectedIds),
        olympiadId: olympiad.id,
        status: newStatus,
      });
      toast.success(`Updated ${selectedIds.size} participant(s) to ${newStatus}`);
      setSelectedIds(new Set());
    } catch {
      toast.error('Failed to update status');
    }
  };

  const handleIssueCertificates = async (certificateType: 'gold' | 'silver' | 'bronze' | 'participation') => {
    if (selectedIds.size === 0 || !participants) return;

    const selectedParticipants = participants.filter(p => selectedIds.has(p.id));
    const certificates = selectedParticipants.map(p => ({
      userId: p.user_id,
      certificateType,
      rank: p.rank,
      score: p.score,
    }));

    try {
      await bulkIssueCertificates.mutateAsync({
        olympiadId: olympiad.id,
        certificates,
      });
      toast.success(`Issued ${certificates.length} ${certificateType} certificate(s)`);
      setSelectedIds(new Set());
    } catch {
      toast.error('Failed to issue certificates');
    }
  };

  const handleAutoIssueCertificates = async () => {
    if (!participants || participants.length === 0) return;

    // Only issue to participants with ranks and status 'participated'
    const eligibleParticipants = participants.filter(p => 
      p.rank !== null && p.status === 'participated'
    );

    if (eligibleParticipants.length === 0) {
      toast.error('No eligible participants found. Participants need rank and "participated" status.');
      return;
    }

    const certificates = eligibleParticipants.map(p => {
      let certificateType: 'gold' | 'silver' | 'bronze' | 'participation' = 'participation';
      if (p.rank === 1) certificateType = 'gold';
      else if (p.rank === 2) certificateType = 'silver';
      else if (p.rank === 3) certificateType = 'bronze';

      return {
        userId: p.user_id,
        certificateType,
        rank: p.rank,
        score: p.score,
      };
    });

    try {
      await bulkIssueCertificates.mutateAsync({
        olympiadId: olympiad.id,
        certificates,
      });
      toast.success(`Issued ${certificates.length} certificate(s) based on ranks`);
    } catch {
      toast.error('Failed to issue certificates');
    }
  };

  const allSelected = participants && participants.length > 0 && selectedIds.size === participants.length;
  const someSelected = selectedIds.size > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Olympiads
        </Button>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-primary" />
              {olympiad.title}
            </CardTitle>
            <CardDescription className="flex items-center gap-2 mt-1">
              <Users className="w-4 h-4" />
              {participants?.length ?? 0} participants
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {olympiad.status === 'completed' && participants && participants.length > 0 && (
              <>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleAutoRank}
                  disabled={updateScore.isPending}
                >
                  <Medal className="w-4 h-4 mr-2" />
                  Auto-Rank
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleAutoIssueCertificates}
                  disabled={bulkIssueCertificates.isPending}
                >
                  <Award className="w-4 h-4 mr-2" />
                  Auto-Issue Certificates
                </Button>
              </>
            )}
          </div>
          {someSelected && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="default" size="sm">
                  <CheckSquare className="w-4 h-4 mr-2" />
                  Bulk Actions ({selectedIds.size})
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Update Status</DropdownMenuLabel>
                {statusOptions.map((option) => (
                  <DropdownMenuItem
                    key={option.value}
                    onClick={() => handleBulkStatusChange(option.value)}
                    className={
                      option.value === 'registered' ? 'text-blue-600' :
                      option.value === 'participated' ? 'text-green-600' :
                      'text-red-600'
                    }
                  >
                    Set as {option.label}
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuLabel>Issue Certificates</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => handleIssueCertificates('gold')}>
                  🥇 Gold Medal
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleIssueCertificates('silver')}>
                  🥈 Silver Medal
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleIssueCertificates('bronze')}>
                  🥉 Bronze Medal
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleIssueCertificates('participation')}>
                  📜 Participation
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : !participants || participants.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-semibold mb-2">No Participants Yet</h3>
              <p className="text-sm text-muted-foreground">
                Participants will appear here once they register
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">
                    <Checkbox
                      checked={allSelected}
                      onCheckedChange={handleSelectAll}
                      aria-label="Select all"
                    />
                  </TableHead>
                  <TableHead className="w-12">Rank</TableHead>
                  <TableHead>Participant</TableHead>
                  <TableHead>City</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Certificate</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead>Rank</TableHead>
                  <TableHead className="w-20">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {participants.map((participant) => {
                  const edited = editedScores[participant.id];
                  const hasChanges = edited && (edited.score !== '' || edited.rank !== '');
                  const isSelected = selectedIds.has(participant.id);
                  const existingCert = certificateMap.get(participant.user_id);
                  
                  return (
                    <TableRow key={participant.id} className={isSelected ? 'bg-muted/50' : undefined}>
                      <TableCell>
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={(checked) => handleSelectOne(participant.id, !!checked)}
                          aria-label={`Select ${participant.profile?.display_name || 'participant'}`}
                        />
                      </TableCell>
                      <TableCell>
                        {getRankBadge(participant.rank)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={participant.profile?.avatar_url || undefined} />
                            <AvatarFallback>
                              {participant.profile?.display_name?.charAt(0) || 'U'}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium">
                            {participant.profile?.display_name || 'Anonymous'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {participant.profile?.city || '-'}
                      </TableCell>
                      <TableCell>
                        <Select
                          value={participant.status}
                          onValueChange={(value: ParticipantStatus) => handleStatusChange(participant.id, value)}
                          disabled={updateStatus.isPending}
                        >
                          <SelectTrigger className="w-32 h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {statusOptions.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                <span className={
                                  option.value === 'registered' ? 'text-blue-600' :
                                  option.value === 'participated' ? 'text-green-600' :
                                  'text-red-600'
                                }>
                                  {option.label}
                                </span>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        {existingCert ? (
                          <span className="text-sm">
                            {existingCert === 'gold' && '🥇'}
                            {existingCert === 'silver' && '🥈'}
                            {existingCert === 'bronze' && '🥉'}
                            {existingCert === 'participation' && '📜'}
                          </span>
                        ) : (
                          <span className="text-muted-foreground text-sm">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          className="w-24 h-8"
                          placeholder={participant.score?.toString() || '0'}
                          value={edited?.score ?? ''}
                          onChange={(e) => handleScoreChange(participant.id, 'score', e.target.value)}
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          className="w-20 h-8"
                          placeholder={participant.rank?.toString() || '-'}
                          value={edited?.rank ?? ''}
                          onChange={(e) => handleScoreChange(participant.id, 'rank', e.target.value)}
                        />
                      </TableCell>
                      <TableCell>
                        {hasChanges && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0"
                            onClick={() => handleSave(participant.id, participant.score, participant.rank)}
                            disabled={savingId === participant.id}
                          >
                            <Save className="w-4 h-4" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};
