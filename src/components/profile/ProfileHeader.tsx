import { FC, useState } from "react";
import { motion } from "framer-motion";
import {
  Flame,
  Star,
  Coins,
  Calendar,
  Award,
  Edit2,
  MapPin,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { useProfile, useUpdateProfile } from "@/hooks/useProfile";
import { useUserProgress } from "@/hooks/useUserProgress";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";

export const ProfileHeader: FC = () => {
  const { user } = useAuth();
  const { data: profile, isLoading: profileLoading } = useProfile();
  const { data: progress, isLoading: progressLoading } = useUserProgress();
  const updateProfile = useUpdateProfile();
  const { toast } = useToast();
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editForm, setEditForm] = useState({ display_name: "", bio: "", city: "" });

  const displayName = profile?.display_name || user?.email?.split("@")[0] || "Guest";
  const joinDate = profile?.created_at
    ? format(new Date(profile.created_at), "MMM d, yyyy")
    : "—";
  const level = progress?.level ?? 1;
  const xp = progress?.totalCoins ?? 0;
  const streak = progress?.dayStreak ?? 0;

  const openEdit = () => {
    setEditForm({
      display_name: profile?.display_name || "",
      bio: profile?.bio || "",
      city: profile?.city || "",
    });
    setIsEditOpen(true);
  };

  const handleSave = async () => {
    try {
      await updateProfile.mutateAsync(editForm);
      toast({ title: "Profile updated", description: "Your profile has been saved." });
      setIsEditOpen(false);
    } catch {
      toast({
        title: "Error",
        description: "Failed to update profile.",
        variant: "destructive",
      });
    }
  };

  if (!user) return null;

  return (
    <section className="pt-20 md:pt-24 pb-8 bg-gradient-to-b from-primary/5 via-background to-background">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col md:flex-row md:items-start gap-6 md:gap-8">
          {/* Avatar */}
          <motion.div
            className="relative flex-shrink-0"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 200 }}
          >
            <div className="w-28 h-28 md:w-36 md:h-36 rounded-2xl overflow-hidden border-4 border-background shadow-xl bg-muted flex items-center justify-center">
              {profileLoading ? (
                <Skeleton className="w-full h-full" />
              ) : profile?.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-4xl md:text-5xl font-bold text-primary">
                  {displayName.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1 px-2 py-1 rounded-full bg-background border shadow-md">
              <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
              <span className="text-sm font-bold">Level {level}</span>
            </div>
          </motion.div>

          {/* Info + Stats */}
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Personal profile</p>
            <div className="flex flex-wrap items-center gap-2 mb-1">
              {profileLoading ? (
                <Skeleton className="h-9 w-48" />
              ) : (
                <h1 className="text-2xl md:text-3xl font-bold text-foreground truncate">
                  {displayName}
                </h1>
              )}
              <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={openEdit}>
                    <Edit2 className="h-4 w-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Edit profile</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>Display name</Label>
                      <Input
                        value={editForm.display_name}
                        onChange={(e) => setEditForm({ ...editForm, display_name: e.target.value })}
                        placeholder="Your name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>City</Label>
                      <Input
                        value={editForm.city}
                        onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
                        placeholder="City"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Short bio</Label>
                      <Textarea
                        value={editForm.bio}
                        onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                        placeholder="A short bio..."
                        rows={3}
                      />
                    </div>
                    <Button onClick={handleSave} className="w-full" disabled={updateProfile.isPending}>
                      {updateProfile.isPending ? "Saving..." : "Save"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            <p className="text-muted-foreground text-sm mb-2">{user.email}</p>
            <p className="text-foreground/90 text-sm mb-4 line-clamp-2">
              {profile?.bio || "Learning enthusiast. Start courses and tests to build your profile."}
            </p>
            {profile?.city && (
              <p className="flex items-center gap-1 text-sm text-muted-foreground mb-4">
                <MapPin className="w-4 h-4" />
                {profile.city}
              </p>
            )}

            {/* Badges row */}
            <div className="flex flex-wrap gap-3">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-orange-500/10 text-orange-600 dark:text-orange-400">
                <Flame className="w-4 h-4" />
                <span className="text-sm font-semibold">{streak} day streak</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <Coins className="w-4 h-4" />
                <span className="text-sm font-semibold">{xp.toLocaleString()} XP</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted text-muted-foreground">
                <Calendar className="w-4 h-4" />
                <span className="text-sm">Joined {joinDate}</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 text-primary">
                <Award className="w-4 h-4" />
                <span className="text-sm font-medium">Rank #—</span>
              </div>
            </div>
          </div>

          {/* Level card */}
          <Card className="flex-shrink-0 w-full md:w-40 border-border bg-card/50">
            <CardContent className="p-5 text-center">
              {progressLoading ? (
                <Skeleton className="h-16 w-full mb-2" />
              ) : (
                <>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Level</p>
                  <p className="text-4xl font-bold text-primary">{level}</p>
                  <p className="text-xs text-muted-foreground mt-2">Global rank</p>
                  <p className="text-xl font-bold text-foreground">#—</p>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};
