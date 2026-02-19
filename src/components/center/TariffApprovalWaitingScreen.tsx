import { FC } from 'react';
import { motion } from 'framer-motion';
import { Clock, Crown, Zap, Shield, CheckCircle, Building2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Navbar } from '@/components/Navbar';
import { CenterSubscriptionWithTariff } from '@/hooks/useCenterStatus';
import { format } from 'date-fns';

interface TariffApprovalWaitingScreenProps {
  centerName: string;
  subscription: CenterSubscriptionWithTariff;
}

const tierInfo = {
  free: { name: 'Bepul', icon: Shield, color: 'text-muted-foreground', bgColor: 'bg-muted/50' },
  pro: { name: 'Pro', icon: Zap, color: 'text-blue-500', bgColor: 'bg-blue-500/10' },
  enterprise: { name: 'Enterprise', icon: Crown, color: 'text-amber-500', bgColor: 'bg-amber-500/10' },
};

export const TariffApprovalWaitingScreen: FC<TariffApprovalWaitingScreenProps> = ({ 
  centerName, 
  subscription 
}) => {
  const tier = tierInfo[subscription.tier];
  const Icon = tier.icon;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-20 pb-24 md:pb-8 px-4 md:px-8 max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Status Card */}
          <Card className="border-amber-500/30 bg-amber-500/5">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="relative">
                  <div className="p-4 rounded-full bg-amber-500/10">
                    <Clock className="w-8 h-8 text-amber-500" />
                  </div>
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 rounded-full"
                  />
                </div>
                
                <div>
                  <h1 className="text-2xl font-bold mb-2">
                    Tarif so'rovi ko'rib chiqilmoqda
                  </h1>
                  <p className="text-muted-foreground max-w-md">
                    Sizning tarif so'rovingiz administratorga yuborildi. Tasdiqlashni kuting.
                  </p>
                </div>

                <Badge className="bg-amber-500/10 text-amber-600 border-amber-500">
                  Tekshiruvda
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Center Info */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Building2 className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 className="font-semibold">{centerName}</h2>
                  <p className="text-sm text-muted-foreground">Sizning markazingiz</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Selected Tariff */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 mb-4">
                <div className={`p-2 rounded-lg ${tier.bgColor}`}>
                  <Icon className={`w-5 h-5 ${tier.color}`} />
                </div>
                <div>
                  <h2 className="font-semibold">Tanlangan tarif: {tier.name}</h2>
                  <p className="text-sm text-muted-foreground">
                    {subscription.selected_at && 
                      `Tanlangan: ${format(new Date(subscription.selected_at), 'dd.MM.yyyy HH:mm')}`
                    }
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t">
                <div className="text-center p-3 rounded-lg bg-muted/30">
                  <p className="text-2xl font-bold">{subscription.max_courses}</p>
                  <p className="text-sm text-muted-foreground">Kurslar</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-muted/30">
                  <p className="text-2xl font-bold">{subscription.max_tests}</p>
                  <p className="text-sm text-muted-foreground">Testlar</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-muted/30">
                  <p className="text-2xl font-bold">{subscription.max_videos}</p>
                  <p className="text-sm text-muted-foreground">Videolar</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-muted/30">
                  <div className="flex items-center justify-center gap-1">
                    {subscription.can_create_olympiads ? (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">Olimpiadalar</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* What Happens Next */}
          <Card>
            <CardContent className="pt-6">
              <h3 className="font-semibold mb-4">Keyingi qadamlar</h3>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-amber-500/10 flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-xs font-medium text-amber-600">1</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Administrator sizning so'rovingizni ko'rib chiqadi
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-amber-500/10 flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-xs font-medium text-amber-600">2</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Tasdiqlangandan so'ng, markazingiz faollashtiriladi
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-amber-500/10 flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-xs font-medium text-amber-600">3</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Keyin kurslar, testlar va olimpiadalar yaratishingiz mumkin
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Info Note */}
          <p className="text-center text-sm text-muted-foreground">
            Savollaringiz bo'lsa, administrator bilan bog'laning.
          </p>
        </motion.div>
      </main>
    </div>
  );
};
