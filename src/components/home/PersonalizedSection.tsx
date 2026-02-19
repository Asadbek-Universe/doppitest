import { FC } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { 
  Sparkles, 
  Target, 
  BookOpen, 
  Trophy, 
  GraduationCap,
  ArrowRight,
  Zap
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { usePersonalizedGreeting } from "@/hooks/usePersonalizedFeed";
import { useAuth } from "@/hooks/useAuth";

const purposeIcons: Record<string, React.ReactNode> = {
  "Olimpiadaga tayyorlanish": <Trophy className="w-4 h-4" />,
  "Maktab fanlarini mustahkamlash": <BookOpen className="w-4 h-4" />,
  "DTM/Test tayyorgarlik": <Target className="w-4 h-4" />,
  "Yangi ko'nikmalar o'rganish": <Sparkles className="w-4 h-4" />,
  "Chet tili o'rganish": <GraduationCap className="w-4 h-4" />,
};

const purposeColors: Record<string, string> = {
  "Olimpiadaga tayyorlanish": "bg-amber-500/10 text-amber-600 border-amber-500/20",
  "Maktab fanlarini mustahkamlash": "bg-blue-500/10 text-blue-600 border-blue-500/20",
  "DTM/Test tayyorgarlik": "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  "Yangi ko'nikmalar o'rganish": "bg-purple-500/10 text-purple-600 border-purple-500/20",
  "Chet tili o'rganish": "bg-pink-500/10 text-pink-600 border-pink-500/20",
};

interface PersonalizedSectionProps {
  avatarUrl?: string | null;
}

export const PersonalizedSection: FC<PersonalizedSectionProps> = ({ avatarUrl }) => {
  const { user } = useAuth();
  const { greeting, name, motivation, grade, purpose, hasProfile } = usePersonalizedGreeting();

  if (!user || !hasProfile) return null;

  return (
    <motion.section
      className="mb-8"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="overflow-hidden border-primary/10 bg-gradient-to-br from-primary/5 via-background to-accent/5">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            {/* Avatar and Greeting */}
            <div className="flex items-center gap-4 flex-1">
              <Avatar className="w-14 h-14 border-2 border-primary/20 shadow-lg">
                <AvatarImage src={avatarUrl || undefined} alt={name} />
                <AvatarFallback className="bg-primary/10 text-primary font-bold text-lg">
                  {name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="text-xl font-bold">
                    {greeting}, <span className="text-primary">{name}</span>!
                  </h2>
                  <Zap className="w-5 h-5 text-amber-500" />
                </div>
                
                <p className="text-muted-foreground text-sm">
                  {motivation}
                </p>
              </div>
            </div>

            {/* Tags */}
            <div className="flex flex-wrap items-center gap-2">
              {grade && (
                <Badge variant="outline" className="bg-background/50">
                  <GraduationCap className="w-3 h-3 mr-1" />
                  {grade}
                </Badge>
              )}
              
              {purpose && (
                <Badge 
                  variant="outline" 
                  className={purposeColors[purpose] || "bg-primary/10 text-primary"}
                >
                  {purposeIcons[purpose]}
                  <span className="ml-1 hidden sm:inline">{purpose}</span>
                </Badge>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="mt-4 pt-4 border-t border-border/50">
            <div className="flex flex-wrap gap-2">
              <Button variant="default" size="sm" asChild className="gap-1">
                <Link to="/tests">
                  <Target className="w-4 h-4" />
                  Test yechish
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </Button>
              
              {purpose === "Olimpiadaga tayyorlanish" && (
                <Button variant="outline" size="sm" asChild className="gap-1">
                  <Link to="/olympiads">
                    <Trophy className="w-4 h-4" />
                    Olimpiadalar
                  </Link>
                </Button>
              )}
              
              <Button variant="ghost" size="sm" asChild className="gap-1">
                <Link to="/courses">
                  <BookOpen className="w-4 h-4" />
                  Kurslar
                </Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.section>
  );
};
