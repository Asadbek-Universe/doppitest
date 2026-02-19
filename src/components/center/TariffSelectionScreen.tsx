import { FC, useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Crown, Zap, Shield, Sparkles, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Navbar } from '@/components/Navbar';
import { useSelectTariff, CenterSubscriptionWithTariff } from '@/hooks/useCenterStatus';
import { toast } from 'sonner';

interface Plan {
  id: 'free' | 'pro' | 'enterprise';
  name: string;
  description: string;
  price: string;
  priceNote?: string;
  icon: typeof Shield;
  color: string;
  bgGradient: string;
  features: {
    label: string;
    value: string | boolean;
  }[];
  popular?: boolean;
}

const plans: Plan[] = [
  {
    id: 'free',
    name: 'Bepul',
    description: 'Boshlang\'ich imkoniyatlar',
    price: "0 so'm",
    priceNote: 'abadiy',
    icon: Shield,
    color: 'text-muted-foreground',
    bgGradient: 'from-muted/50 to-muted/30',
    features: [
      { label: 'Kurslar', value: '3' },
      { label: 'Testlar', value: '5' },
      { label: 'Qisqa videolar', value: '10' },
      { label: 'Olimpiada yaratish', value: false },
      { label: 'SEO yordami', value: false },
      { label: 'Ustuvor yordam', value: false },
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    description: "O'sib borayotgan markazlar uchun",
    price: "299,000 so'm",
    priceNote: 'oyiga',
    icon: Zap,
    color: 'text-blue-500',
    bgGradient: 'from-blue-500/10 to-blue-600/5',
    popular: true,
    features: [
      { label: 'Kurslar', value: '15' },
      { label: 'Testlar', value: '30' },
      { label: 'Qisqa videolar', value: '50' },
      { label: 'Olimpiada yaratish', value: true },
      { label: 'SEO yordami', value: '1-daraja' },
      { label: 'Ustuvor yordam', value: false },
    ],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    description: 'Yirik tashkilotlar uchun',
    price: "799,000 so'm",
    priceNote: 'oyiga',
    icon: Crown,
    color: 'text-amber-500',
    bgGradient: 'from-amber-500/10 to-orange-500/5',
    features: [
      { label: 'Kurslar', value: 'Cheksiz' },
      { label: 'Testlar', value: 'Cheksiz' },
      { label: 'Qisqa videolar', value: 'Cheksiz' },
      { label: 'Olimpiada yaratish', value: true },
      { label: 'SEO yordami', value: '3-daraja' },
      { label: 'Ustuvor yordam', value: true },
    ],
  },
];

interface TariffSelectionScreenProps {
  centerName: string;
  subscription: CenterSubscriptionWithTariff;
}

export const TariffSelectionScreen: FC<TariffSelectionScreenProps> = ({ centerName, subscription }) => {
  const [selectedPlan, setSelectedPlan] = useState<'free' | 'pro' | 'enterprise' | null>(null);
  const selectTariff = useSelectTariff();

  const handleSelectPlan = async () => {
    if (!selectedPlan) {
      toast.error("Iltimos, tarifni tanlang");
      return;
    }

    try {
      await selectTariff.mutateAsync({
        subscriptionId: subscription.id,
        tier: selectedPlan,
      });
      toast.success("Tarif muvaffaqiyatli tanlandi!");
      // Page will automatically update due to query invalidation
    } catch (error) {
      toast.error("Tarifni tanlashda xatolik yuz berdi");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-20 pb-24 md:pb-8 px-4 md:px-8 max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
        >
          {/* Header */}
          <div className="text-center space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/10 text-green-600">
              <Check className="w-5 h-5" />
              <span className="font-medium">Markazingiz tasdiqlandi!</span>
            </div>
            
            <h1 className="text-3xl font-bold">
              Tarifingizni tanlang
            </h1>
            <p className="text-muted-foreground max-w-xl mx-auto">
              "{centerName}" uchun eng mos tarifni tanlang. Keyinchalik tarifni o'zgartirishingiz mumkin.
            </p>
          </div>

          {/* Plans Grid */}
          <div className="grid md:grid-cols-3 gap-6">
            {plans.map((plan, index) => {
              const Icon = plan.icon;
              const isSelected = selectedPlan === plan.id;

              return (
                <motion.div
                  key={plan.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={cn(
                    'relative rounded-xl border-2 p-6 transition-all cursor-pointer hover:shadow-lg',
                    isSelected && 'border-primary ring-2 ring-primary/20 shadow-lg',
                    !isSelected && 'border-border hover:border-primary/50',
                    plan.popular && !isSelected && 'border-blue-500/30'
                  )}
                  onClick={() => setSelectedPlan(plan.id)}
                >
                  {plan.popular && (
                    <Badge className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-blue-500">
                      Mashhur
                    </Badge>
                  )}

                  <div className={cn('p-3 rounded-lg w-fit mb-4 bg-gradient-to-br', plan.bgGradient)}>
                    <Icon className={cn('w-6 h-6', plan.color)} />
                  </div>

                  <h3 className="text-xl font-bold mb-1">{plan.name}</h3>
                  <p className="text-sm text-muted-foreground mb-4">{plan.description}</p>

                  <div className="mb-6">
                    <span className="text-2xl font-bold">{plan.price}</span>
                    {plan.priceNote && (
                      <span className="text-sm text-muted-foreground ml-1">/ {plan.priceNote}</span>
                    )}
                  </div>

                  <div className="space-y-3">
                    {plan.features.map((feature) => (
                      <div key={feature.label} className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">{feature.label}</span>
                        {typeof feature.value === 'boolean' ? (
                          <Check
                            className={cn(
                              'w-4 h-4',
                              feature.value ? 'text-green-500' : 'text-muted-foreground/30'
                            )}
                          />
                        ) : (
                          <span className="font-medium">{feature.value}</span>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="mt-6">
                    <div
                      className={cn(
                        'w-full h-10 rounded-md flex items-center justify-center font-medium transition-colors',
                        isSelected
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-muted-foreground'
                      )}
                    >
                      {isSelected ? 'Tanlangan' : 'Tanlash'}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Confirm Button */}
          <div className="flex justify-center">
            <Button
              size="lg"
              className="min-w-[200px]"
              onClick={handleSelectPlan}
              disabled={!selectedPlan || selectTariff.isPending}
            >
              {selectTariff.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Yuklanmoqda...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Davom etish
                </>
              )}
            </Button>
          </div>

          {/* Info Note */}
          <p className="text-center text-sm text-muted-foreground">
            Pro va Enterprise tariflar uchun to'lov administrator bilan bog'lanib amalga oshiriladi.
            <br />
            Bepul tarifni tanlasangiz, darhol platformadan foydalanishni boshlashingiz mumkin.
          </p>
        </motion.div>
      </main>
    </div>
  );
};
