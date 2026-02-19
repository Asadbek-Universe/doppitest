import { FC, useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Crown, Zap, Shield, Sparkles } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
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
    name: 'Free',
    description: 'Get started with basic features',
    price: "0 so'm",
    priceNote: 'forever',
    icon: Shield,
    color: 'text-muted-foreground',
    bgGradient: 'from-muted/50 to-muted/30',
    features: [
      { label: 'Courses', value: '3' },
      { label: 'Tests', value: '5' },
      { label: 'Short Videos', value: '10' },
      { label: 'Create Olympiads', value: false },
      { label: 'SEO Boost', value: false },
      { label: 'Priority Support', value: false },
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    description: 'Perfect for growing centers',
    price: "299,000 so'm",
    priceNote: 'per month',
    icon: Zap,
    color: 'text-blue-500',
    bgGradient: 'from-blue-500/10 to-blue-600/5',
    popular: true,
    features: [
      { label: 'Courses', value: '15' },
      { label: 'Tests', value: '30' },
      { label: 'Short Videos', value: '50' },
      { label: 'Create Olympiads', value: true },
      { label: 'SEO Boost', value: 'Level 1' },
      { label: 'Priority Support', value: false },
    ],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    description: 'For large organizations',
    price: "799,000 so'm",
    priceNote: 'per month',
    icon: Crown,
    color: 'text-amber-500',
    bgGradient: 'from-amber-500/10 to-orange-500/5',
    features: [
      { label: 'Courses', value: 'Unlimited' },
      { label: 'Tests', value: 'Unlimited' },
      { label: 'Short Videos', value: 'Unlimited' },
      { label: 'Create Olympiads', value: true },
      { label: 'SEO Boost', value: 'Level 3' },
      { label: 'Priority Support', value: true },
    ],
  },
];

interface SubscriptionPlansDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentTier: string;
  onSelectPlan: (planId: string) => void;
  isLoading?: boolean;
}

export const SubscriptionPlansDialog: FC<SubscriptionPlansDialogProps> = ({
  open,
  onOpenChange,
  currentTier,
  onSelectPlan,
  isLoading,
}) => {
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  const handleSelectPlan = (planId: string) => {
    if (planId === currentTier) {
      toast.info("Bu sizning hozirgi tarifingiz");
      return;
    }
    setSelectedPlan(planId);
  };

  const handleConfirmUpgrade = () => {
    if (selectedPlan) {
      onSelectPlan(selectedPlan);
    }
  };

  const getPlanIndex = (tier: string) => plans.findIndex(p => p.id === tier);
  const currentPlanIndex = getPlanIndex(currentTier);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-primary" />
            Tarif Rejalarini Tanlang
          </DialogTitle>
          <DialogDescription>
            O'quv markazingiz uchun eng mos tarifni tanlang
          </DialogDescription>
        </DialogHeader>

        <div className="grid md:grid-cols-3 gap-4 mt-6">
          {plans.map((plan, index) => {
            const Icon = plan.icon;
            const isCurrentPlan = plan.id === currentTier;
            const isDowngrade = index < currentPlanIndex;
            const isSelected = selectedPlan === plan.id;

            return (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={cn(
                  'relative rounded-xl border-2 p-5 transition-all cursor-pointer',
                  isSelected && 'border-primary ring-2 ring-primary/20',
                  isCurrentPlan && 'border-green-500/50 bg-green-500/5',
                  !isSelected && !isCurrentPlan && 'border-border hover:border-primary/50',
                  plan.popular && !isCurrentPlan && !isSelected && 'border-blue-500/30'
                )}
                onClick={() => handleSelectPlan(plan.id)}
              >
                {plan.popular && (
                  <Badge className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-blue-500">
                    Mashhur
                  </Badge>
                )}
                {isCurrentPlan && (
                  <Badge className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-green-500">
                    Hozirgi tarif
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

                <Button
                  className="w-full mt-6"
                  variant={isCurrentPlan ? 'outline' : isSelected ? 'default' : 'secondary'}
                  disabled={isCurrentPlan || isLoading}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSelectPlan(plan.id);
                  }}
                >
                  {isCurrentPlan
                    ? 'Hozirgi tarif'
                    : isDowngrade
                    ? 'Pasaytirish'
                    : isSelected
                    ? 'Tanlangan'
                    : 'Tanlash'}
                </Button>
              </motion.div>
            );
          })}
        </div>

        {selectedPlan && selectedPlan !== currentTier && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 p-4 rounded-lg bg-primary/5 border border-primary/20"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">
                  {plans.find(p => p.id === selectedPlan)?.name} tarifiga o'tish
                </p>
                <p className="text-sm text-muted-foreground">
                  Tarifni o'zgartirish uchun administrator bilan bog'laning
                </p>
              </div>
              <Button onClick={handleConfirmUpgrade} disabled={isLoading}>
                {isLoading ? "Yuborilmoqda..." : "So'rov yuborish"}
              </Button>
            </div>
          </motion.div>
        )}
      </DialogContent>
    </Dialog>
  );
};
