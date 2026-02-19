import { FC, useState } from 'react';
import { motion } from 'framer-motion';
import { Building2, MapPin, Phone, Mail, Globe, CheckCircle, Edit, Crown, Zap, Shield } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useUpdateCenter, useRequestPlanUpgrade } from '@/hooks/useCenterData';
import { toast } from 'sonner';
import { SubscriptionPlansDialog } from './SubscriptionPlansDialog';

interface CenterProfileTabProps {
  center: {
    id: string;
    name: string;
    description?: string | null;
    address?: string | null;
    city?: string | null;
    phone?: string | null;
    email?: string | null;
    website?: string | null;
    logo_url?: string | null;
    is_verified?: boolean | null;
  };
  subscription: {
    tier: string;
    max_courses: number;
    max_tests: number;
    max_videos: number;
    can_create_olympiads: boolean;
    seo_boost_level: number;
    expires_at?: string | null;
  } | null;
  coursesCount: number;
  testsCount: number;
  reelsCount: number;
}

const tierConfig = {
  free: { label: 'Free', icon: Shield, color: 'bg-muted text-muted-foreground' },
  pro: { label: 'Pro', icon: Zap, color: 'bg-blue-500/10 text-blue-600' },
  enterprise: { label: 'Enterprise', icon: Crown, color: 'bg-amber-500/10 text-amber-600' },
};

export const CenterProfileTab: FC<CenterProfileTabProps> = ({
  center,
  subscription,
  coursesCount,
  testsCount,
  reelsCount,
}) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [plansDialogOpen, setPlansDialogOpen] = useState(false);
  const [form, setForm] = useState({
    name: center.name,
    description: center.description || '',
    address: center.address || '',
    city: center.city || '',
    phone: center.phone || '',
    email: center.email || '',
    website: center.website || '',
  });

  const updateCenter = useUpdateCenter();
  const requestUpgrade = useRequestPlanUpgrade();

  const handleUpdate = async () => {
    try {
      await updateCenter.mutateAsync({ centerId: center.id, ...form });
      toast.success('Profile updated successfully');
      setDialogOpen(false);
    } catch {
      toast.error('Failed to update profile');
    }
  };

  const tier = subscription?.tier as keyof typeof tierConfig || 'free';
  const tierInfo = tierConfig[tier];
  const TierIcon = tierInfo.icon;

  const usageLimits = [
    { label: 'Courses', current: coursesCount, max: subscription?.max_courses ?? 3 },
    { label: 'Tests', current: testsCount, max: subscription?.max_tests ?? 5 },
    { label: 'Short Videos', current: reelsCount, max: subscription?.max_videos ?? 10 },
  ];

  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-2 gap-6">
        {/* Organization Info */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card>
            <CardHeader className="flex flex-row items-start justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-primary" />
                  Organization Info
                </CardTitle>
                <CardDescription>Your center's public information</CardDescription>
              </div>
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Edit className="w-4 h-4 mr-2" />
                    Edit
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg">
                  <DialogHeader>
                    <DialogTitle>Edit Organization Info</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                    <div className="space-y-2">
                      <Label>Center Name</Label>
                      <Input
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Description</Label>
                      <Textarea
                        value={form.description}
                        onChange={(e) => setForm({ ...form, description: e.target.value })}
                        rows={4}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>City</Label>
                        <Input
                          value={form.city}
                          onChange={(e) => setForm({ ...form, city: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Phone</Label>
                        <Input
                          value={form.phone}
                          onChange={(e) => setForm({ ...form, phone: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Address</Label>
                      <Input
                        value={form.address}
                        onChange={(e) => setForm({ ...form, address: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Email</Label>
                      <Input
                        type="email"
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Website</Label>
                      <Input
                        value={form.website}
                        onChange={(e) => setForm({ ...form, website: e.target.value })}
                      />
                    </div>
                    <Button onClick={handleUpdate} disabled={updateCenter.isPending} className="w-full">
                      {updateCenter.isPending ? 'Saving...' : 'Save Changes'}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center">
                  {center.logo_url ? (
                    <img src={center.logo_url} alt={center.name} className="w-full h-full rounded-xl object-cover" />
                  ) : (
                    <Building2 className="w-8 h-8 text-primary" />
                  )}
                </div>
                <div>
                  <h3 className="font-semibold text-lg flex items-center gap-2">
                    {center.name}
                    {center.is_verified && (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    )}
                  </h3>
                  {center.city && (
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {center.city}
                    </p>
                  )}
                </div>
              </div>

              {center.description && (
                <p className="text-sm text-muted-foreground">{center.description}</p>
              )}

              <div className="space-y-2 text-sm">
                {center.address && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="w-4 h-4" />
                    {center.address}
                  </div>
                )}
                {center.phone && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Phone className="w-4 h-4" />
                    {center.phone}
                  </div>
                )}
                {center.email && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Mail className="w-4 h-4" />
                    {center.email}
                  </div>
                )}
                {center.website && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Globe className="w-4 h-4" />
                    <a href={center.website} target="_blank" rel="noopener noreferrer" className="hover:underline">
                      {center.website}
                    </a>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Subscription & Limits */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TierIcon className="w-5 h-5 text-primary" />
                Subscription & Limits
              </CardTitle>
              <CardDescription>Your current plan and usage</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between p-4 rounded-xl bg-muted/50">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${tierInfo.color}`}>
                    <TierIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-semibold">{tierInfo.label} Plan</p>
                    {subscription?.expires_at && (
                      <p className="text-xs text-muted-foreground">
                        Expires: {new Date(subscription.expires_at).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>
                <Button size="sm" variant="outline" onClick={() => setPlansDialogOpen(true)}>
                  Tarifni o'zgartirish
                </Button>
              </div>

              <div className="space-y-4">
                <h4 className="text-sm font-medium">Usage Limits</h4>
                {usageLimits.map((limit) => (
                  <div key={limit.label} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>{limit.label}</span>
                      <span className="text-muted-foreground">
                        {limit.current} / {limit.max}
                      </span>
                    </div>
                    <Progress value={(limit.current / limit.max) * 100} className="h-2" />
                  </div>
                ))}
              </div>

              <div className="space-y-2">
                <h4 className="text-sm font-medium">Features</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className={`flex items-center gap-2 ${subscription?.can_create_olympiads ? 'text-green-600' : 'text-muted-foreground'}`}>
                    <CheckCircle className="w-4 h-4" />
                    Create Olympiads
                  </div>
                  <div className={`flex items-center gap-2 ${(subscription?.seo_boost_level ?? 0) > 0 ? 'text-green-600' : 'text-muted-foreground'}`}>
                    <CheckCircle className="w-4 h-4" />
                    SEO Boost (Lvl {subscription?.seo_boost_level ?? 0})
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <SubscriptionPlansDialog
        open={plansDialogOpen}
        onOpenChange={setPlansDialogOpen}
        currentTier={tier}
        onSelectPlan={async (planId) => {
          try {
            await requestUpgrade.mutateAsync({
              centerId: center.id,
              requestedTier: planId,
            });
            toast.success("Tarif so'rovi muvaffaqiyatli yuborildi. Administrator tez orada bog'lanadi.");
            setPlansDialogOpen(false);
          } catch {
            toast.error("So'rov yuborishda xatolik yuz berdi");
          }
        }}
        isLoading={requestUpgrade.isPending}
      />
    </div>
  );
};