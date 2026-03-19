import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BookOpen, Mail, Lock, Eye, EyeOff, ArrowLeft, GraduationCap, Trophy, Users, Building2, User } from 'lucide-react';
import doppiLogo from '@/assets/doppi-logo.png';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { supabase } from '@/integrations/supabase/client';
import { z } from 'zod';

type UserType = 'student' | 'center';

const userTypes: { value: UserType; label: string; icon: React.ElementType; description: string }[] = [
  { value: 'student', label: 'Student', icon: User, description: 'Learn and take tests' },
  { value: 'center', label: 'Center', icon: Building2, description: 'Manage courses & tests' },
];

const authSchema = z.object({
  email: z.string().trim().email({ message: "Invalid email address" }).max(255, { message: "Email too long" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }).max(72, { message: "Password too long" }),
});

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [selectedUserType, setSelectedUserType] = useState<UserType>('student');
  const [centerName, setCenterName] = useState('');
  
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, signUp, signIn } = useAuth();
  const { data: userRole, isLoading: roleLoading } = useUserRole();
  const [justSignedUp, setJustSignedUp] = useState(false);
  const [checkingOnboarding, setCheckingOnboarding] = useState(false);

  useEffect(() => {
    const checkOnboardingAndRedirect = async () => {
      if (!user || roleLoading) return;

      if (justSignedUp) {
        navigate(userRole === 'center' ? '/onboarding/center' : '/onboarding/user');
        return;
      }

      setCheckingOnboarding(true);
      
      try {
        const effectiveRole = userRole ?? null;

        if (effectiveRole === 'center') {
          const { data: center } = await supabase
            .from('educational_centers')
            .select('onboarding_completed')
            .eq('owner_id', user.id)
            .maybeSingle();
          
          if (!center || !center.onboarding_completed) {
            navigate('/onboarding/center');
          } else {
            navigate('/center-panel');
          }
          return;
        }

        if (effectiveRole === 'admin') {
          navigate('/admin');
          return;
        }

        // When role is null or 'user', check if they own a center (e.g. just signed up as center) so we send them to center onboarding
        if (effectiveRole === null || effectiveRole === 'user') {
          const { data: ownedCenter } = await supabase
            .from('educational_centers')
            .select('onboarding_completed')
            .eq('owner_id', user.id)
            .maybeSingle();
          if (ownedCenter) {
            if (!ownedCenter.onboarding_completed) {
              navigate('/onboarding/center');
            } else {
              navigate('/center-panel');
            }
            return;
          }
        }

        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('onboarding_completed')
          .eq('user_id', user.id)
          .maybeSingle();

        if (profileError) {
          console.warn("Failed to fetch profile onboarding status:", profileError);
        }

        if (!profile || !profile.onboarding_completed) {
          navigate('/onboarding/user');
        } else {
          navigate('/dashboard');
        }
      } finally {
        setCheckingOnboarding(false);
      }
    };

    checkOnboardingAndRedirect();
  }, [user, userRole, roleLoading, navigate, justSignedUp]);

  const validateForm = () => {
    try {
      authSchema.parse({ email, password });
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: { email?: string; password?: string } = {};
        error.errors.forEach((err) => {
          if (err.path[0] === 'email') fieldErrors.email = err.message;
          if (err.path[0] === 'password') fieldErrors.password = err.message;
        });
        setErrors(fieldErrors);
      }
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsLoading(true);

    try {
      if (isLogin) {
        const { error } = await signIn(email, password);
        if (error) {
          const msg = error.message || '';
          if (msg.includes('Invalid login credentials')) {
            toast({
              title: "Login Failed",
              description: "Invalid email or password. Please try again.",
              variant: "destructive",
            });
          } else if (/rate limit|too many requests/i.test(msg)) {
            toast({
              title: "Try again shortly",
              description: "Please wait a moment and try again.",
              variant: "destructive",
            });
          } else {
            toast({
              title: "Error",
              description: error.message,
              variant: "destructive",
            });
          }
        } else {
          toast({
            title: "Welcome back!",
            description: "You have successfully logged in.",
          });
        }
      } else {
        if (selectedUserType === 'center' && !centerName.trim()) {
          toast({
            title: "Center name required",
            description: "Please enter your center name to continue.",
            variant: "destructive",
          });
          return;
        }

        const { error, user: createdUser, requiresConfirmation, session } = await signUp(
          email,
          password,
          selectedUserType,
          selectedUserType === 'center' ? { centerName: centerName.trim(), centerEmail: email.trim() } : undefined
        );
        if (error) {
          const msg = error.message || '';
          if (msg.includes('already registered')) {
            toast({
              title: "Account Exists",
              description: "This email is already registered. Please log in instead.",
              variant: "destructive",
            });
          } else if (/rate limit|too many requests/i.test(msg)) {
            toast({
              title: "Try again shortly",
              description: "Please wait a moment and try again.",
              variant: "destructive",
            });
          } else {
            toast({
              title: "Error",
              description: error.message,
              variant: "destructive",
            });
          }
        } else {
          let centerCreated = true;
          if (selectedUserType === 'center' && createdUser) {
            if (session) {
              const { error: centerError } = await supabase.rpc('create_center_for_signup', {
                center_email: email.trim(),
                center_name: centerName.trim(),
              });

              if (centerError) {
                centerCreated = false;
                const friendlyMessage = centerError.code === '42501'
                  ? 'Permission denied. Please try again or contact support.'
                  : centerError.code === '23505'
                    ? 'A center with this name or owner already exists.'
                    : centerError.message || 'Could not create center record.';
                toast({
                  title: "Center setup failed",
                  description: friendlyMessage,
                  variant: "destructive",
                });
              }
            }
            // When no session (email confirmation required), trigger already created the center from metadata
          }

          if (centerCreated || selectedUserType !== 'center') {
            await supabase.auth.signOut();
            toast({
              title: "Account Created!",
              description: requiresConfirmation
                ? "Please check your email and confirm your account to sign in."
                : "Please log in to continue.",
            });
            navigate('/auth');
          }
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  const features = [
    { icon: GraduationCap, title: "500+ Courses", description: "Expert-led video lessons" },
    { icon: Trophy, title: "Earn Certificates", description: "Prove your skills" },
    { icon: Users, title: "10K+ Students", description: "Join our community" },
  ];

  return (
    <div className="min-h-screen bg-gradient-hero flex">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-primary p-12 flex-col justify-between relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-64 h-64 rounded-full bg-white/20 blur-3xl" />
          <div className="absolute bottom-20 right-20 w-96 h-96 rounded-full bg-white/10 blur-3xl" />
        </div>
        
        <div className="relative z-10">
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3"
          >
            <img src={doppiLogo} alt="Doppi" className="h-12 w-12 rounded-full object-contain ring-2 ring-white/30" />
            <span className="text-2xl font-bold text-white">Doppi</span>
          </motion.div>
        </div>

        <div className="relative z-10 space-y-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h1 className="text-4xl font-bold text-white mb-4">
              Start Your Learning Journey Today
            </h1>
            <p className="text-white/80 text-lg">
              Access premium courses, track your progress, and earn certificates to boost your career.
            </p>
          </motion.div>

          <div className="grid gap-4">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + index * 0.1 }}
                className="flex items-center gap-4 bg-white/10 backdrop-blur-sm rounded-xl p-4"
              >
                <div className="p-2 bg-white/20 rounded-lg">
                  <feature.icon className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">{feature.title}</h3>
                  <p className="text-sm text-white/70">{feature.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="relative z-10 text-white/60 text-sm">
          © 2024 Doppi. All rights reserved.
        </div>
      </div>

      {/* Right side - Form */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md"
        >
          <Button
            variant="ghost"
            onClick={() => navigate('/')}
            className="mb-6 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Button>

          <Card className="border-0 shadow-lg">
            <CardHeader className="space-y-1 pb-4">
              <div className="lg:hidden flex items-center gap-2 mb-4">
                <img src={doppiLogo} alt="Doppi" className="h-9 w-9 rounded-full object-contain" />
                <span className="text-xl font-bold text-primary">Doppi</span>
              </div>
              
              {/* Role Selector */}
              <div className="flex gap-2 p-1 bg-muted rounded-lg mb-4">
                {userTypes.map((type) => {
                  const Icon = type.icon;
                  return (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => setSelectedUserType(type.value)}
                      className={`flex-1 flex flex-col items-center gap-1 py-2 px-3 rounded-md transition-all text-sm ${
                        selectedUserType === type.value
                          ? 'bg-background shadow-sm text-foreground'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      <span className="font-medium">{type.label}</span>
                    </button>
                  );
                })}
              </div>
              
              <CardTitle className="text-2xl font-bold">
                {isLogin ? 'Welcome back' : 'Create an account'}
              </CardTitle>
              <CardDescription>
                {isLogin 
                  ? `Sign in as ${selectedUserType === 'student' ? 'a student' : 'an educational center'}` 
                  : `Create your ${selectedUserType} account`}
              </CardDescription>
            </CardHeader>
            
            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-4">
                {!isLogin && selectedUserType === 'center' && (
                  <div className="space-y-2">
                    <Label htmlFor="center-name">Center name</Label>
                    <Input
                      id="center-name"
                      placeholder="Your center's name"
                      value={centerName}
                      onChange={(e) => setCenterName(e.target.value)}
                    />
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className={`pl-10 ${errors.email ? 'border-destructive' : ''}`}
                      required
                    />
                  </div>
                  {errors.email && (
                    <p className="text-sm text-destructive">{errors.email}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className={`pl-10 pr-10 ${errors.password ? 'border-destructive' : ''}`}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-sm text-destructive">{errors.password}</p>
                  )}
                </div>
              </CardContent>
              
              <CardFooter className="flex flex-col gap-4">
                <Button 
                  type="submit" 
                  className="w-full bg-gradient-primary hover:opacity-90 transition-opacity"
                  disabled={isLoading}
                >
                  {isLoading ? 'Please wait...' : isLogin ? 'Sign In' : 'Create Account'}
                </Button>
                
                <p className="text-sm text-muted-foreground text-center">
                  {isLogin ? "Don't have an account? " : "Already have an account? "}
                  <button
                    type="button"
                    onClick={() => {
                      setIsLogin(!isLogin);
                      setErrors({});
                    }}
                    className="text-primary hover:underline font-medium"
                  >
                    {isLogin ? 'Sign up' : 'Sign in'}
                  </button>
                </p>
              </CardFooter>
            </form>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default Auth;
