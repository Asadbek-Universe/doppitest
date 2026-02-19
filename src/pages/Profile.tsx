import { FC, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate, Link } from "react-router-dom";
import { Flame, Star, FileText, GraduationCap, Coins, CheckSquare, Trophy, ChevronRight, LogIn, Edit2, MapPin, Settings, Bell, Moon, Globe, Lock, Trash2, Calendar, Clock, Users } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { StudentDashboard } from "@/components/StudentDashboard";
import { CertificatesSection } from "@/components/CertificatesSection";

import { useAuth } from "@/hooks/useAuth";
import { useProfile, useUpdateProfile } from "@/hooks/useProfile";
import { useToast } from "@/hooks/use-toast";
import { useUserOlympiadRegistrations } from "@/hooks/useOlympiadRegistration";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { SavedItemsTab } from "@/components/profile/SavedItemsTab";

const mainStats = [
  { icon: Flame, label: "days", value: "0", color: "text-streak" },
  { icon: Star, label: "points", value: "100", color: "text-coin" },
  { icon: FileText, label: "tests", value: "0", color: "text-foreground" },
  { icon: GraduationCap, label: "courses", value: "0", color: "text-foreground" },
];

const quickOverview = [
  { icon: Coins, label: "Coins", value: "100", color: "text-primary", bgColor: "bg-primary/10" },
  { icon: Flame, label: "Day Streak", value: "12", color: "text-streak", bgColor: "bg-streak/10" },
  { icon: CheckSquare, label: "Tests Done", value: "0 / 300", color: "text-accent", bgColor: "bg-accent/10" },
  { icon: Trophy, label: "Rewards", value: "0", color: "text-primary", bgColor: "bg-primary/10" },
];

const Profile: FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: profile, isLoading: profileLoading } = useProfile();
  const updateProfile = useUpdateProfile();
  const { toast } = useToast();
  const { data: olympiadRegistrations, isLoading: registrationsLoading } = useUserOlympiadRegistrations();
  const [activeTab, setActiveTab] = useState("overview");
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    display_name: "",
    bio: "",
    city: "",
  });
  
  // Settings state
  const [settings, setSettings] = useState({
    emailNotifications: true,
    pushNotifications: false,
    darkMode: false,
    language: "en",
  });

  const handleCourseClick = (courseId: string) => {
    navigate(`/courses?course=${courseId}`);
  };

  const openEditDialog = () => {
    setEditForm({
      display_name: profile?.display_name || "",
      bio: profile?.bio || "",
      city: profile?.city || "",
    });
    setIsEditOpen(true);
  };

  const handleSaveProfile = async () => {
    try {
      await updateProfile.mutateAsync(editForm);
      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully.",
      });
      setIsEditOpen(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    }
  };

  const displayName = profile?.display_name || user?.email?.split('@')[0] || 'Guest User';

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Profile Header */}
      <section className="pt-20 md:pt-24 pb-8 bg-gradient-hero">
        <div className="container px-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-6">
              {/* Avatar */}
              <motion.div
                className="w-32 h-32 rounded-full bg-gradient-accent overflow-hidden border-4 border-card shadow-lg flex items-center justify-center"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200 }}
              >
                {profile?.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-4xl font-bold text-primary-foreground">
                    {displayName.charAt(0).toUpperCase()}
                  </span>
                )}
              </motion.div>

              {/* User Info */}
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <h1 className="text-3xl font-bold text-primary">
                    {displayName}
                  </h1>
                  {user && (
                    <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                      <DialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={openEditDialog}>
                          <Edit2 className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Edit Profile</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div className="space-y-2">
                            <Label htmlFor="display_name">Display Name</Label>
                            <Input
                              id="display_name"
                              value={editForm.display_name}
                              onChange={(e) => setEditForm({ ...editForm, display_name: e.target.value })}
                              placeholder="Your display name"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="city">City</Label>
                            <Input
                              id="city"
                              value={editForm.city}
                              onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
                              placeholder="Your city"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="bio">Bio</Label>
                            <Textarea
                              id="bio"
                              value={editForm.bio}
                              onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                              placeholder="Tell us about yourself"
                              rows={3}
                            />
                          </div>
                          <Button 
                            onClick={handleSaveProfile} 
                            className="w-full"
                            disabled={updateProfile.isPending}
                          >
                            {updateProfile.isPending ? "Saving..." : "Save Changes"}
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  )}
                </div>
                <p className="text-primary/80 font-medium mb-1">
                  {user ? user.email : 'Not signed in'}
                </p>
                <div className="flex items-center gap-2 text-muted-foreground">
                  {profile?.city && (
                    <>
                      <MapPin className="w-4 h-4" />
                      <span>{profile.city}</span>
                      <span>·</span>
                    </>
                  )}
                  <span>{profile?.bio || 'Learning enthusiast'}</span>
                </div>
              </div>
            </div>

            {/* Level Card */}
            <Card className="bg-card border border-border">
              <CardContent className="p-6 text-center min-w-[120px]">
                <p className="text-sm text-muted-foreground mb-1">Level</p>
                <p className="text-4xl font-bold text-primary">1</p>
                <div className="mt-4 pt-4 border-t border-border">
                  <p className="text-sm text-muted-foreground mb-1">Rank</p>
                  <p className="text-2xl font-bold text-primary">#-</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Tabs Navigation */}
      <section className="container px-6 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-muted/50 p-1">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="dashboard">My Learning</TabsTrigger>
              <TabsTrigger value="saved">Saved</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6 space-y-8">
            {/* Main Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {mainStats.map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="bg-card border border-border">
                    <CardContent className="p-6 text-center">
                      <div className="text-4xl mb-2">
                        {stat.label === "days" && "🔥"}
                        {stat.label === "points" && "⭐"}
                        {stat.label === "tests" && "📝"}
                        {stat.label === "courses" && "🎓"}
                      </div>
                      <div className={`text-3xl font-bold ${stat.color} mb-1`}>{stat.value}</div>
                      <div className="text-sm text-muted-foreground">{stat.label}</div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>

            {/* Quick Overview */}
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-foreground">Quick Overview</h2>
                <Button variant="ghost" className="text-primary">
                  View All
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {quickOverview.map((item, index) => (
                  <motion.div
                    key={item.label}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card className="bg-card border border-border">
                      <CardContent className="p-6">
                        <div className={`w-12 h-12 rounded-xl ${item.bgColor} flex items-center justify-center mb-4`}>
                          <item.icon className={`w-6 h-6 ${item.color}`} />
                        </div>
                        <div className="text-2xl font-bold text-foreground mb-1">{item.value}</div>
                        <div className="text-sm text-muted-foreground">{item.label}</div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* My Certificates */}
            {user && <CertificatesSection />}

            {/* My Olympiad Registrations */}
            {user && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-foreground">My Olympiad Registrations</h2>
                  <Button variant="ghost" className="text-primary" onClick={() => navigate('/olympiads')}>
                    Browse Olympiads
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>

                {registrationsLoading ? (
                  <div className="grid gap-4 md:grid-cols-2">
                    {[1, 2].map((i) => (
                      <Card key={i} className="bg-card border-border animate-pulse">
                        <CardContent className="p-6">
                          <div className="h-6 bg-muted rounded w-3/4 mb-4" />
                          <div className="h-4 bg-muted rounded w-1/2 mb-2" />
                          <div className="h-4 bg-muted rounded w-1/3" />
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : olympiadRegistrations && olympiadRegistrations.length > 0 ? (
                  <div className="grid gap-4 md:grid-cols-2">
                    {olympiadRegistrations.map((reg, index) => {
                      const olympiad = reg.olympiad as any;
                      if (!olympiad) return null;
                      
                      const statusColors: Record<string, string> = {
                        registered: "bg-primary/10 text-primary",
                        completed: "bg-green-500/10 text-green-500",
                        cancelled: "bg-destructive/10 text-destructive",
                      };
                      
                      const olympiadStatusColors: Record<string, string> = {
                        upcoming: "bg-blue-500/10 text-blue-500",
                        active: "bg-green-500/10 text-green-500",
                        completed: "bg-muted text-muted-foreground",
                      };

                      return (
                        <motion.div
                          key={reg.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1 }}
                        >
                          <Card className="bg-card border-border hover:border-primary/50 transition-colors">
                            <CardContent className="p-6">
                              <div className="flex items-start justify-between mb-4">
                                <div className="flex-1">
                                  <h3 className="font-semibold text-foreground text-lg mb-1">
                                    {olympiad.title}
                                  </h3>
                                  {olympiad.center && (
                                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                                      {olympiad.center.name}
                                      {olympiad.center.is_verified && (
                                        <CheckSquare className="w-3 h-3 text-primary" />
                                      )}
                                    </p>
                                  )}
                                </div>
                                <div className="flex flex-col gap-2 items-end">
                                  <Badge className={statusColors[reg.status] || statusColors.registered}>
                                    {reg.status.charAt(0).toUpperCase() + reg.status.slice(1)}
                                  </Badge>
                                  <Badge variant="outline" className={olympiadStatusColors[olympiad.status] || ""}>
                                    {olympiad.status}
                                  </Badge>
                                </div>
                              </div>

                              <div className="space-y-2 text-sm">
                                <div className="flex items-center gap-2 text-muted-foreground">
                                  <Calendar className="w-4 h-4" />
                                  <span>
                                    {format(new Date(olympiad.start_date), "MMM d, yyyy")} - {format(new Date(olympiad.end_date), "MMM d, yyyy")}
                                  </span>
                                </div>
                                
                                {olympiad.subject && (
                                  <div className="flex items-center gap-2">
                                    <div 
                                      className="w-3 h-3 rounded-full" 
                                      style={{ backgroundColor: olympiad.subject.color || '#6366f1' }}
                                    />
                                    <span className="text-muted-foreground">{olympiad.subject.name}</span>
                                  </div>
                                )}

                                {olympiad.max_participants && (
                                  <div className="flex items-center gap-2 text-muted-foreground">
                                    <Users className="w-4 h-4" />
                                    <span>
                                      {olympiad.current_participants || 0} / {olympiad.max_participants} participants
                                    </span>
                                  </div>
                                )}

                                {olympiad.prize_description && (
                                  <div className="flex items-center gap-2 text-primary">
                                    <Trophy className="w-4 h-4" />
                                    <span className="font-medium">{olympiad.prize_description}</span>
                                  </div>
                                )}

                                <div className="flex items-center gap-2 text-muted-foreground">
                                  <Clock className="w-4 h-4" />
                                  <span>Registered {format(new Date(reg.registered_at), "MMM d, yyyy")}</span>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>
                      );
                    })}
                  </div>
                ) : (
                  <Card className="bg-card border-border">
                    <CardContent className="p-12 text-center">
                      <Trophy className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-foreground mb-2">
                        No olympiad registrations yet
                      </h3>
                      <p className="text-muted-foreground mb-4">
                        Browse available olympiads and register to compete!
                      </p>
                      <Button onClick={() => navigate('/olympiads')} className="gap-2">
                        <Trophy className="w-4 h-4" />
                        Browse Olympiads
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="dashboard" className="mt-6">
            {user ? (
              <StudentDashboard userId={user.id} onCourseClick={handleCourseClick} />
            ) : (
              <Card className="bg-card border-border">
                <CardContent className="p-12 text-center">
                  <GraduationCap className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    Sign in to view your learning dashboard
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    Track your enrolled courses, progress, and certificates
                  </p>
                  <Link to="/auth">
                    <Button className="gap-2">
                      <LogIn className="w-4 h-4" />
                      Sign In
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="saved" className="mt-6">
            <SavedItemsTab />
          </TabsContent>

          <TabsContent value="settings" className="mt-6">
            {user ? (
              <div className="grid gap-6 md:grid-cols-2">
                {/* Notifications */}
                <Card className="bg-card border-border">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Bell className="w-5 h-5 text-primary" />
                      Notifications
                    </CardTitle>
                    <CardDescription>Manage how you receive notifications</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="email-notifications" className="font-medium">Email Notifications</Label>
                        <p className="text-sm text-muted-foreground">Receive updates via email</p>
                      </div>
                      <Switch
                        id="email-notifications"
                        checked={settings.emailNotifications}
                        onCheckedChange={(checked) => setSettings({ ...settings, emailNotifications: checked })}
                      />
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="push-notifications" className="font-medium">Push Notifications</Label>
                        <p className="text-sm text-muted-foreground">Receive push notifications</p>
                      </div>
                      <Switch
                        id="push-notifications"
                        checked={settings.pushNotifications}
                        onCheckedChange={(checked) => setSettings({ ...settings, pushNotifications: checked })}
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Appearance */}
                <Card className="bg-card border-border">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Moon className="w-5 h-5 text-primary" />
                      Appearance
                    </CardTitle>
                    <CardDescription>Customize how the app looks</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="dark-mode" className="font-medium">Dark Mode</Label>
                        <p className="text-sm text-muted-foreground">Use dark theme</p>
                      </div>
                      <Switch
                        id="dark-mode"
                        checked={settings.darkMode}
                        onCheckedChange={(checked) => setSettings({ ...settings, darkMode: checked })}
                      />
                    </div>
                    <Separator />
                    <div className="space-y-2">
                      <Label htmlFor="language" className="font-medium">Language</Label>
                      <Select
                        value={settings.language}
                        onValueChange={(value) => setSettings({ ...settings, language: value })}
                      >
                        <SelectTrigger id="language">
                          <Globe className="w-4 h-4 mr-2" />
                          <SelectValue placeholder="Select language" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="en">English</SelectItem>
                          <SelectItem value="uz">O'zbekcha</SelectItem>
                          <SelectItem value="ru">Русский</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>

                {/* Security */}
                <Card className="bg-card border-border">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Lock className="w-5 h-5 text-primary" />
                      Security
                    </CardTitle>
                    <CardDescription>Manage your account security</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Button variant="outline" className="w-full justify-start">
                      <Lock className="w-4 h-4 mr-2" />
                      Change Password
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      <Settings className="w-4 h-4 mr-2" />
                      Two-Factor Authentication
                    </Button>
                  </CardContent>
                </Card>

                {/* Danger Zone */}
                <Card className="bg-card border-destructive/50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-destructive">
                      <Trash2 className="w-5 h-5" />
                      Danger Zone
                    </CardTitle>
                    <CardDescription>Irreversible actions</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button variant="destructive" className="w-full">
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete Account
                    </Button>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <Card className="bg-card border-border">
                <CardContent className="p-12 text-center">
                  <Settings className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    Sign in to manage settings
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    Access your account preferences and settings
                  </p>
                  <Link to="/auth">
                    <Button className="gap-2">
                      <LogIn className="w-4 h-4" />
                      Sign In
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </section>
    </div>
  );
};

export default Profile;
