import { FC, useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Crown, 
  Zap, 
  Shield, 
  Check, 
  X, 
  Building2, 
  Clock,
  MessageSquare,
  Loader2,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { usePendingTariffRequests, useApproveTariff, useRejectTariff } from '@/hooks/useTariffApproval';
import { format } from 'date-fns';
import { toast } from 'sonner';

const tierInfo = {
  free: { name: 'Bepul', icon: Shield, color: 'text-muted-foreground', bgColor: 'bg-muted/50' },
  pro: { name: 'Pro', icon: Zap, color: 'text-blue-500', bgColor: 'bg-blue-500/10' },
  enterprise: { name: 'Enterprise', icon: Crown, color: 'text-amber-500', bgColor: 'bg-amber-500/10' },
};

export const TariffApprovalPanel: FC = () => {
  const { data: pendingRequests, isLoading } = usePendingTariffRequests();
  const approveTariff = useApproveTariff();
  const rejectTariff = useRejectTariff();

  const [selectedRequest, setSelectedRequest] = useState<typeof pendingRequests extends (infer T)[] | undefined ? T : never | null>(null);
  const [approvalDialog, setApprovalDialog] = useState(false);
  const [rejectionDialog, setRejectionDialog] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [modifiedTier, setModifiedTier] = useState<'free' | 'pro' | 'enterprise' | null>(null);
  const [adminNotes, setAdminNotes] = useState('');

  const handleApprove = async () => {
    if (!selectedRequest) return;

    try {
      await approveTariff.mutateAsync({
        centerId: selectedRequest.center_id,
        subscriptionId: selectedRequest.id,
        modifiedTier: modifiedTier || undefined,
        adminNotes: adminNotes || undefined,
      });
      toast.success('Tarif tasdiqlandi va markaz faollashtirildi');
      setApprovalDialog(false);
      setSelectedRequest(null);
      setModifiedTier(null);
      setAdminNotes('');
    } catch {
      toast.error('Tarifni tasdiqlashda xatolik yuz berdi');
    }
  };

  const handleReject = async () => {
    if (!selectedRequest || !rejectionReason.trim()) {
      toast.error('Iltimos, rad etish sababini kiriting');
      return;
    }

    try {
      await rejectTariff.mutateAsync({
        centerId: selectedRequest.center_id,
        subscriptionId: selectedRequest.id,
        reason: rejectionReason,
      });
      toast.success('Tarif so\'rovi rad etildi');
      setRejectionDialog(false);
      setSelectedRequest(null);
      setRejectionReason('');
    } catch {
      toast.error('Rad etishda xatolik yuz berdi');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!pendingRequests?.length) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="flex flex-col items-center text-center text-muted-foreground">
            <Check className="w-12 h-12 mb-4 text-green-500" />
            <p className="font-medium">Kutilayotgan tarif so'rovlari yo'q</p>
            <p className="text-sm">Barcha so'rovlar ko'rib chiqilgan</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Tarif so'rovlari</h2>
        <Badge variant="secondary">{pendingRequests.length} kutilmoqda</Badge>
      </div>

      <div className="grid gap-4">
        {pendingRequests.map((request, index) => {
          const tier = tierInfo[request.tier as keyof typeof tierInfo] || tierInfo.free;
          const Icon = tier.icon;

          return (
            <motion.div
              key={request.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className="hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className={`p-3 rounded-lg ${tier.bgColor}`}>
                        <Icon className={`w-6 h-6 ${tier.color}`} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold">
                            {request.educational_centers?.name || 'Unknown Center'}
                          </h3>
                          <Badge className={tier.bgColor + ' ' + tier.color + ' border-0'}>
                            {tier.name}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Building2 className="w-4 h-4" />
                            {request.educational_centers?.city || 'N/A'}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {request.selected_at && format(new Date(request.selected_at), 'dd.MM.yyyy HH:mm')}
                          </span>
                        </div>
                        <div className="flex gap-4 mt-2 text-sm">
                          <span>Kurslar: <strong>{request.max_courses}</strong></span>
                          <span>Testlar: <strong>{request.max_tests}</strong></span>
                          <span>Videolar: <strong>{request.max_videos}</strong></span>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedRequest(request);
                          setRejectionDialog(true);
                        }}
                      >
                        <X className="w-4 h-4 mr-1" />
                        Rad etish
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => {
                          setSelectedRequest(request);
                          setModifiedTier(null);
                          setAdminNotes('');
                          setApprovalDialog(true);
                        }}
                      >
                        <Check className="w-4 h-4 mr-1" />
                        Tasdiqlash
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Approval Dialog */}
      <Dialog open={approvalDialog} onOpenChange={setApprovalDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tarifni tasdiqlash</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 rounded-lg bg-muted/50">
              <p className="font-medium mb-1">{selectedRequest?.educational_centers?.name}</p>
              <p className="text-sm text-muted-foreground">
                Tanlangan tarif: {selectedRequest?.tier && tierInfo[selectedRequest.tier as keyof typeof tierInfo]?.name}
              </p>
            </div>

            <div className="space-y-2">
              <Label>Tarifni o'zgartirish (ixtiyoriy)</Label>
              <Select 
                value={modifiedTier || ''} 
                onValueChange={(value) => setModifiedTier(value as 'free' | 'pro' | 'enterprise')}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Asl tarifni saqlash" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="free">Bepul</SelectItem>
                  <SelectItem value="pro">Pro</SelectItem>
                  <SelectItem value="enterprise">Enterprise</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Admin izohi (ixtiyoriy)</Label>
              <Textarea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="Qo'shimcha izohlar..."
              />
            </div>

            <div className="flex gap-2 pt-4">
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={() => setApprovalDialog(false)}
              >
                Bekor qilish
              </Button>
              <Button 
                className="flex-1"
                onClick={handleApprove}
                disabled={approveTariff.isPending}
              >
                {approveTariff.isPending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Check className="w-4 h-4 mr-2" />
                )}
                Tasdiqlash
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Rejection Alert Dialog */}
      <AlertDialog open={rejectionDialog} onOpenChange={setRejectionDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tarif so'rovini rad etish</AlertDialogTitle>
            <AlertDialogDescription>
              Iltimos, rad etish sababini kiriting. Bu markaz egasiga ko'rsatiladi.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Rad etish sababi..."
              rows={4}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setRejectionReason('')}>Bekor qilish</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleReject}
              disabled={!rejectionReason.trim() || rejectTariff.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {rejectTariff.isPending ? 'Yuklanmoqda...' : 'Rad etish'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
