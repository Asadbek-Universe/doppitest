import { FC } from 'react';
import { motion } from 'framer-motion';
import { XCircle, AlertTriangle, Mail, Phone, RefreshCcw, Building2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Navbar } from '@/components/Navbar';
import { useAuth } from '@/hooks/useAuth';

interface CenterRejectedScreenProps {
  center: {
    id: string;
    name: string;
    rejection_reason?: string | null;
  };
}

export const CenterRejectedScreen: FC<CenterRejectedScreenProps> = ({ center }) => {
  const { signOut } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-20 pb-24 md:pb-8 px-4 md:px-8 max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Rejection Banner */}
          <Card className="border-destructive/50 bg-gradient-to-r from-destructive/10 to-destructive/5">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="p-4 rounded-full bg-destructive/20">
                  <XCircle className="w-8 h-8 text-destructive" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h1 className="text-2xl font-bold">Arizangiz rad etildi</h1>
                    <Badge variant="destructive">
                      Rejected
                    </Badge>
                  </div>
                  <p className="text-muted-foreground">
                    Afsuski, "{center.name}" o'quv markazi arizasi rad etildi.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Rejection Reason */}
          {center.rejection_reason && (
            <Alert variant="destructive" className="border-destructive/30">
              <AlertTriangle className="h-5 w-5" />
              <AlertTitle>Rad etish sababi</AlertTitle>
              <AlertDescription className="mt-2">
                {center.rejection_reason}
              </AlertDescription>
            </Alert>
          )}

          {/* Next Steps */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Keyingi qadamlar</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary text-sm font-medium">
                    1
                  </div>
                  <div>
                    <p className="font-medium">Rad etish sababini ko'rib chiqing</p>
                    <p className="text-sm text-muted-foreground">
                      Qo'llab-quvvatlash xizmati bilan bog'lanib, batafsil ma'lumot oling
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary text-sm font-medium">
                    2
                  </div>
                  <div>
                    <p className="font-medium">Ma'lumotlarni to'g'rilang</p>
                    <p className="text-sm text-muted-foreground">
                      Agar xato ma'lumotlar yuborilgan bo'lsa, yangi ariza bilan murojaat qilishingiz mumkin
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary text-sm font-medium">
                    3
                  </div>
                  <div>
                    <p className="font-medium">Qayta ariza bering</p>
                    <p className="text-sm text-muted-foreground">
                      Yangi hisob yaratib, to'g'ri ma'lumotlar bilan qayta ro'yxatdan o'ting
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contact Support */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-full bg-muted">
                  <Building2 className="w-6 h-6 text-muted-foreground" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold mb-1">Qo'llab-quvvatlash xizmati</p>
                  <p className="text-sm text-muted-foreground mb-4">
                    Rad etish sabablari haqida batafsil ma'lumot olish yoki yangi ariza berish uchun biz bilan bog'laning.
                  </p>
                  <div className="flex flex-wrap gap-4 text-sm">
                    <span className="flex items-center gap-1 text-muted-foreground">
                      <Mail className="w-4 h-4" />
                      support@doppi.uz
                    </span>
                    <span className="flex items-center gap-1 text-muted-foreground">
                      <Phone className="w-4 h-4" />
                      +998 90 123 45 67
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => signOut()}>
              Chiqish
            </Button>
            <Button className="flex-1" onClick={() => window.location.href = 'mailto:support@doppi.uz'}>
              <Mail className="w-4 h-4 mr-2" />
              Bog'lanish
            </Button>
          </div>
        </motion.div>
      </main>
    </div>
  );
};
