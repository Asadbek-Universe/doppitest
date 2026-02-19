import { FC, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Building2,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  MapPin,
  Mail,
  Phone,
  Calendar,
  Users,
  ExternalLink,
  Search,
  Filter,
  RefreshCw,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  useAllCentersWithStatus,
  useApproveCenter,
  useRejectCenter,
} from '@/hooks/useCenterStatus';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { useQueryClient } from '@tanstack/react-query';

type CenterStatus = 'pending' | 'approved' | 'rejected' | 'active';

interface Center {
  id: string;
  name: string;
  description: string | null;
  city: string | null;
  address: string | null;
  email: string | null;
  contact_phone: string | null;
  phone: string | null;
  website: string | null;
  logo_url: string | null;
  founded_year: number | null;
  student_count: number | null;
  specializations: string[] | null;
  status: CenterStatus;
  rejection_reason: string | null;
  is_verified: boolean;
  created_at: string;
}

export const CenterApprovalPanel: FC = () => {
  const { data: centers, isLoading, refetch } = useAllCentersWithStatus();
  const approveCenter = useApproveCenter();
  const rejectCenter = useRejectCenter();
  const queryClient = useQueryClient();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedCenter, setSelectedCenter] = useState<Center | null>(null);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  const filteredCenters = centers?.filter((center: Center) => {
    const matchesSearch =
      center.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      center.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      center.city?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'all' || center.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const statusCounts = {
    all: centers?.length ?? 0,
    pending: centers?.filter((c: Center) => c.status === 'pending').length ?? 0,
    approved: centers?.filter((c: Center) => c.status === 'approved').length ?? 0,
    active: centers?.filter((c: Center) => c.status === 'active').length ?? 0,
    rejected: centers?.filter((c: Center) => c.status === 'rejected').length ?? 0,
  };

  const handleApprove = async (centerId: string) => {
    try {
      await approveCenter.mutateAsync(centerId);
      toast.success("Markaz tasdiqlandi");
      setSelectedCenter(null);
    } catch (error) {
      toast.error("Tasdiqlashda xatolik");
    }
  };

  const handleReject = async () => {
    if (!selectedCenter || !rejectionReason.trim()) {
      toast.error("Rad etish sababini kiriting");
      return;
    }

    try {
      await rejectCenter.mutateAsync({
        centerId: selectedCenter.id,
        reason: rejectionReason,
      });
      toast.success("Markaz rad etildi");
      setShowRejectDialog(false);
      setSelectedCenter(null);
      setRejectionReason('');
    } catch (error) {
      toast.error("Rad etishda xatolik");
    }
  };

  const getStatusBadge = (status: CenterStatus) => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-amber-500/10 text-amber-600 border-amber-500"><Clock className="w-3 h-3 mr-1" />Kutilmoqda</Badge>;
      case 'approved':
        return <Badge className="bg-blue-500/10 text-blue-600 border-blue-500"><CheckCircle className="w-3 h-3 mr-1" />Tasdiqlangan</Badge>;
      case 'active':
        return <Badge className="bg-green-500/10 text-green-600 border-green-500"><CheckCircle className="w-3 h-3 mr-1" />Faol</Badge>;
      case 'rejected':
        return <Badge className="bg-destructive/10 text-destructive border-destructive"><XCircle className="w-3 h-3 mr-1" />Rad etilgan</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="cursor-pointer hover:border-primary/50 transition-colors" onClick={() => setStatusFilter('all')}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Building2 className="w-5 h-5 text-primary" />
              <div>
                <p className="text-2xl font-bold">{statusCounts.all}</p>
                <p className="text-xs text-muted-foreground">Jami</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:border-amber-500/50 transition-colors" onClick={() => setStatusFilter('pending')}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-amber-500" />
              <div>
                <p className="text-2xl font-bold">{statusCounts.pending}</p>
                <p className="text-xs text-muted-foreground">Kutilmoqda</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:border-blue-500/50 transition-colors" onClick={() => setStatusFilter('approved')}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{statusCounts.approved}</p>
                <p className="text-xs text-muted-foreground">Tasdiqlangan</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:border-green-500/50 transition-colors" onClick={() => setStatusFilter('active')}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{statusCounts.active}</p>
                <p className="text-xs text-muted-foreground">Faol</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:border-destructive/50 transition-colors" onClick={() => setStatusFilter('rejected')}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <XCircle className="w-5 h-5 text-destructive" />
              <div>
                <p className="text-2xl font-bold">{statusCounts.rejected}</p>
                <p className="text-xs text-muted-foreground">Rad etilgan</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Markaz nomi, email yoki shahar bo'yicha qidirish..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Barchasi ({statusCounts.all})</SelectItem>
                <SelectItem value="pending">Kutilmoqda ({statusCounts.pending})</SelectItem>
                <SelectItem value="approved">Tasdiqlangan ({statusCounts.approved})</SelectItem>
                <SelectItem value="active">Faol ({statusCounts.active})</SelectItem>
                <SelectItem value="rejected">Rad etilgan ({statusCounts.rejected})</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={() => refetch()}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Yangilash
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Centers Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Markaz</TableHead>
                <TableHead>Shahar</TableHead>
                <TableHead>Aloqa</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Sana</TableHead>
                <TableHead className="text-right">Amallar</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    Yuklanmoqda...
                  </TableCell>
                </TableRow>
              ) : filteredCenters?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    Markazlar topilmadi
                  </TableCell>
                </TableRow>
              ) : (
                filteredCenters?.map((center: Center) => (
                  <TableRow key={center.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="w-10 h-10">
                          <AvatarImage src={center.logo_url || ''} />
                          <AvatarFallback>
                            <Building2 className="w-5 h-5" />
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{center.name}</p>
                          {center.specializations && center.specializations.length > 0 && (
                            <p className="text-xs text-muted-foreground">
                              {center.specializations.slice(0, 2).join(', ')}
                            </p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="flex items-center gap-1 text-sm">
                        <MapPin className="w-3 h-3" />
                        {center.city || '-'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm space-y-1">
                        {center.email && (
                          <span className="flex items-center gap-1">
                            <Mail className="w-3 h-3" />
                            {center.email}
                          </span>
                        )}
                        {(center.contact_phone || center.phone) && (
                          <span className="flex items-center gap-1 text-muted-foreground">
                            <Phone className="w-3 h-3" />
                            {center.contact_phone || center.phone}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(center.status)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(new Date(center.created_at), 'dd MMM yyyy')}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedCenter(center)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        {center.status === 'pending' && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-green-600 hover:text-green-700 hover:bg-green-50"
                              onClick={() => handleApprove(center.id)}
                              disabled={approveCenter.isPending}
                            >
                              <CheckCircle className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-destructive hover:text-destructive hover:bg-destructive/10"
                              onClick={() => {
                                setSelectedCenter(center);
                                setShowRejectDialog(true);
                              }}
                            >
                              <XCircle className="w-4 h-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Center Details Dialog */}
      <Dialog open={!!selectedCenter && !showRejectDialog} onOpenChange={() => setSelectedCenter(null)}>
        <DialogContent className="max-w-2xl">
          {selectedCenter && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3">
                  <Avatar className="w-12 h-12">
                    <AvatarImage src={selectedCenter.logo_url || ''} />
                    <AvatarFallback>
                      <Building2 className="w-6 h-6" />
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <span>{selectedCenter.name}</span>
                    <div className="mt-1">{getStatusBadge(selectedCenter.status)}</div>
                  </div>
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-4">
                {selectedCenter.description && (
                  <div>
                    <Label className="text-muted-foreground">Tavsif</Label>
                    <p className="mt-1">{selectedCenter.description}</p>
                  </div>
                )}

                <Separator />

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Shahar</Label>
                    <p className="mt-1 flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {selectedCenter.city || '-'}
                    </p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Manzil</Label>
                    <p className="mt-1">{selectedCenter.address || '-'}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Email</Label>
                    <p className="mt-1 flex items-center gap-1">
                      <Mail className="w-4 h-4" />
                      {selectedCenter.email || '-'}
                    </p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Telefon</Label>
                    <p className="mt-1 flex items-center gap-1">
                      <Phone className="w-4 h-4" />
                      {selectedCenter.contact_phone || selectedCenter.phone || '-'}
                    </p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Tashkil etilgan</Label>
                    <p className="mt-1 flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {selectedCenter.founded_year ? `${selectedCenter.founded_year} yil` : '-'}
                    </p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">O'quvchilar</Label>
                    <p className="mt-1 flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      {selectedCenter.student_count ?? '-'}
                    </p>
                  </div>
                </div>

                {selectedCenter.website && (
                  <div>
                    <Label className="text-muted-foreground">Veb-sayt</Label>
                    <a
                      href={selectedCenter.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-1 flex items-center gap-1 text-primary hover:underline"
                    >
                      <ExternalLink className="w-4 h-4" />
                      {selectedCenter.website}
                    </a>
                  </div>
                )}

                {selectedCenter.specializations && selectedCenter.specializations.length > 0 && (
                  <div>
                    <Label className="text-muted-foreground">Yo'nalishlar</Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {selectedCenter.specializations.map((spec, i) => (
                        <Badge key={i} variant="secondary">
                          {spec}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {selectedCenter.rejection_reason && (
                  <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20">
                    <Label className="text-destructive">Rad etish sababi</Label>
                    <p className="mt-1 text-sm">{selectedCenter.rejection_reason}</p>
                  </div>
                )}
              </div>

              {selectedCenter.status === 'pending' && (
                <DialogFooter className="gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowRejectDialog(true);
                    }}
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Rad etish
                  </Button>
                  <Button
                    onClick={() => handleApprove(selectedCenter.id)}
                    disabled={approveCenter.isPending}
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Tasdiqlash
                  </Button>
                </DialogFooter>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Markazni rad etish</DialogTitle>
            <DialogDescription>
              Rad etish sababini kiriting. Bu sabab markaz egasiga ko'rsatiladi.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Rad etish sababi *</Label>
              <Textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Masalan: Hujjatlar to'liq emas, noto'g'ri ma'lumotlar kiritilgan..."
                rows={4}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
              Bekor qilish
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={rejectCenter.isPending || !rejectionReason.trim()}
            >
              Rad etish
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
