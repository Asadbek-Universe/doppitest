import { FC } from 'react';
import { motion } from 'framer-motion';
import { Clock, Building2, Mail, Phone, MapPin, Calendar, User, FileText, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Navbar } from '@/components/Navbar';
import { format } from 'date-fns';

interface CenterPendingScreenProps {
  center: {
    id: string;
    name: string;
    description?: string | null;
    city?: string | null;
    address?: string | null;
    email?: string | null;
    contact_phone?: string | null;
    website?: string | null;
    founded_year?: number | null;
    student_count?: number | null;
    specializations?: string[] | null;
    logo_url?: string | null;
    created_at: string;
  };
}

export const CenterPendingScreen: FC<CenterPendingScreenProps> = ({ center }) => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-20 pb-24 md:pb-8 px-4 md:px-8 max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Status Banner */}
          <Card className="border-amber-500/50 bg-gradient-to-r from-amber-500/10 to-orange-500/5">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="p-4 rounded-full bg-amber-500/20">
                  <Clock className="w-8 h-8 text-amber-500" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h1 className="text-2xl font-bold">Tekshiruv kutilmoqda</h1>
                    <Badge className="bg-amber-500/20 text-amber-600 border-amber-500">
                      Pending
                    </Badge>
                  </div>
                  <p className="text-muted-foreground">
                    Sizning o'quv markazingiz "{center.name}" hozirda administrator tomonidan tekshirilmoqda. 
                    Bu jarayon odatda 1-2 ish kuni ichida yakunlanadi.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Tasdiqlash jarayoni</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-white text-sm font-bold">
                    ✓
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">Ro'yxatdan o'tish</p>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(center.created_at), 'dd MMM yyyy, HH:mm')}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 rounded-full bg-amber-500 flex items-center justify-center">
                    <Clock className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">Administrator tekshiruvi</p>
                    <p className="text-sm text-muted-foreground">Hozirda davom etmoqda...</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground text-sm">
                    3
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-muted-foreground">Tarif tanlash</p>
                    <p className="text-sm text-muted-foreground">Tasdiqlangandan keyin</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground text-sm">
                    4
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-muted-foreground">Faollashtirish</p>
                    <p className="text-sm text-muted-foreground">To'liq kirish huquqi</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Center Info Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Building2 className="w-5 h-5" />
                Yuborilgan ma'lumotlar
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                {center.logo_url ? (
                  <img src={center.logo_url} alt={center.name} className="w-16 h-16 rounded-lg object-cover" />
                ) : (
                  <div className="w-16 h-16 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Building2 className="w-8 h-8 text-primary" />
                  </div>
                )}
                <div>
                  <h3 className="font-semibold text-lg">{center.name}</h3>
                  {center.city && (
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {center.city}
                    </p>
                  )}
                </div>
              </div>

              {center.description && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm font-medium mb-1">Tavsif</p>
                    <p className="text-sm text-muted-foreground">{center.description}</p>
                  </div>
                </>
              )}

              <Separator />

              <div className="grid grid-cols-2 gap-4 text-sm">
                {center.email && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Mail className="w-4 h-4" />
                    {center.email}
                  </div>
                )}
                {center.contact_phone && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Phone className="w-4 h-4" />
                    {center.contact_phone}
                  </div>
                )}
                {center.founded_year && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="w-4 h-4" />
                    {center.founded_year} yildan beri
                  </div>
                )}
                {center.student_count && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <User className="w-4 h-4" />
                    {center.student_count} ta o'quvchi
                  </div>
                )}
              </div>

              {center.specializations && center.specializations.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm font-medium mb-2">Yo'nalishlar</p>
                    <div className="flex flex-wrap gap-2">
                      {center.specializations.map((spec, i) => (
                        <Badge key={i} variant="secondary">{spec}</Badge>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Contact Support */}
          <Card className="border-dashed">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <FileText className="w-5 h-5 text-muted-foreground mt-0.5" />
                <div className="flex-1">
                  <p className="font-medium mb-1">Savollaringiz bormi?</p>
                  <p className="text-sm text-muted-foreground mb-3">
                    Agar tekshiruv jarayoni haqida savollaringiz bo'lsa yoki ma'lumotlaringizni yangilashingiz kerak bo'lsa, 
                    qo'llab-quvvatlash xizmatiga murojaat qiling.
                  </p>
                  <div className="flex gap-4 text-sm">
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
        </motion.div>
      </main>
    </div>
  );
};
