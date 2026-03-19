import { FC, useEffect, useState } from "react";
import {
  Bell,
  Moon,
  Globe,
  Lock,
  User,
  Shield,
  Loader2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTheme } from "next-themes";
import { useToast } from "@/hooks/use-toast";
import { useProfile, useUpdateProfile } from "@/hooks/useProfile";
import { useLanguage } from "@/context/LanguageContext";
import { useTranslation } from "react-i18next";

export const ProfileSettings: FC = () => {
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();
  const [emailNotif, setEmailNotif] = useState(true);
  const [pushNotif, setPushNotif] = useState(false);
  const { data: profile } = useProfile();
  const updateProfile = useUpdateProfile();
  const { language, setLanguage } = useLanguage();
  const { t } = useTranslation();
  const [localLanguage, setLocalLanguage] = useState(language);
  const [savingLang, setSavingLang] = useState(false);

  useEffect(() => {
    if (profile?.preferred_language) {
      setLocalLanguage(profile.preferred_language);
      setLanguage(profile.preferred_language as any);
    }
  }, [profile?.preferred_language, setLanguage]);

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5 text-primary" />
            {t("settings.account")}
          </CardTitle>
          <CardDescription>{t("settings.accountDesc")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {t("settings.accountInfo")}
          </p>
        </CardContent>
      </Card>

      <Card className="border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-primary" />
            {t("settings.notifications")}
          </CardTitle>
          <CardDescription>{t("settings.notificationsDesc")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label className="font-medium">{t("settings.emailNotif")}</Label>
              <p className="text-sm text-muted-foreground">
                {t("settings.emailNotifDesc")}
              </p>
            </div>
            <Switch
              checked={emailNotif}
              onCheckedChange={setEmailNotif}
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label className="font-medium">{t("settings.pushNotif")}</Label>
              <p className="text-sm text-muted-foreground">
                {t("settings.pushNotifDesc")}
              </p>
            </div>
            <Switch
              checked={pushNotif}
              onCheckedChange={setPushNotif}
            />
          </div>
        </CardContent>
      </Card>

      <Card className="border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="w-5 h-5 text-primary" />
            {t("settings.security")}
          </CardTitle>
          <CardDescription>{t("settings.securityDesc")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={() =>
              toast({
                title: t("settings.changePasswordToastTitle"),
                description: t("settings.changePasswordToastDesc"),
              })
            }
          >
            <Lock className="w-4 h-4 mr-2" />
            {t("settings.changePassword")}
          </Button>
          <Button
            variant="outline"
            className="w-full justify-start opacity-75"
            disabled
          >
            <Shield className="w-4 h-4 mr-2" />
            {t("settings.twoFactor")}
          </Button>
        </CardContent>
      </Card>

      <Card className="border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Moon className="w-5 h-5 text-primary" />
            {t("settings.appearance")}
          </CardTitle>
          <CardDescription>{t("settings.appearanceDesc")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label className="font-medium">{t("settings.darkMode")}</Label>
              <p className="text-sm text-muted-foreground">
                {t("settings.darkModeDesc")}
              </p>
            </div>
            <Switch
              checked={theme === "dark"}
              onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
            />
          </div>
        </CardContent>
      </Card>

      <Card className="border-border md:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="w-5 h-5 text-primary" />
            {t("settings.language")}
          </CardTitle>
          <CardDescription>{t("settings.languageDesc")}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="w-full max-w-xs">
            <Select
              value={localLanguage}
              onValueChange={async (val) => {
                setLocalLanguage(val);
                setLanguage(val as any);
                try {
                  setSavingLang(true);
                  await updateProfile.mutateAsync({ preferred_language: val });
                  toast({
                    title: t("settings.languageUpdatedTitle"),
                    description: t("settings.languageUpdatedDesc"),
                  });
                } catch (err: any) {
                  toast({
                    title: t("settings.languageUpdateErrorTitle"),
                    description:
                      err?.message ?? t("settings.languageUpdateErrorDesc"),
                    variant: "destructive",
                  });
                } finally {
                  setSavingLang(false);
                }
              }}
            >
              <SelectTrigger className="w-full">
                <Globe className="w-4 h-4 mr-2" />
                <SelectValue placeholder={t("settings.languagePlaceholder")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">{t("settings.languageEn")}</SelectItem>
                <SelectItem value="uz">{t("settings.languageUz")}</SelectItem>
                <SelectItem value="ru">{t("settings.languageRu")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {savingLang && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="h-3 w-3 animate-spin" />
              {t("settings.saving")}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
