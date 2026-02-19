import { FC } from "react";
import { motion } from "framer-motion";
import { Trophy, Calendar, Users, Clock, MapPin, Check, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format, formatDistanceToNow } from "date-fns";
import { useOlympiadRegistration } from "@/hooks/useOlympiadRegistration";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";

interface OlympiadCardProps {
  id: string;
  title: string;
  subject?: { name: string; color?: string };
  center?: { name: string; is_verified?: boolean };
  startDate: string;
  endDate: string;
  maxParticipants?: number;
  currentParticipants?: number;
  prizeDescription?: string;
  status: string;
}

export const OlympiadCard: FC<OlympiadCardProps> = ({
  id,
  title,
  subject,
  center,
  startDate,
  endDate,
  maxParticipants,
  currentParticipants,
  prizeDescription,
  status,
}) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { 
    isRegistered, 
    register, 
    unregister, 
    isRegistering, 
    isUnregistering,
    isLoading 
  } = useOlympiadRegistration(id);
  
  const startsIn = formatDistanceToNow(new Date(startDate), { addSuffix: true });
  const isUpcoming = new Date(startDate) > new Date();
  const isFull = maxParticipants ? (currentParticipants || 0) >= maxParticipants : false;

  const handleRegisterClick = () => {
    if (!user) {
      navigate("/auth");
      return;
    }
    
    if (isRegistered) {
      unregister();
    } else {
      register();
    }
  };

  const getButtonContent = () => {
    if (isLoading || isRegistering || isUnregistering) {
      return <Loader2 className="w-4 h-4 animate-spin" />;
    }
    
    if (!isUpcoming) {
      return "View Results";
    }
    
    if (isRegistered) {
      return (
        <>
          <Check className="w-4 h-4 mr-1" />
          Registered
        </>
      );
    }
    
    if (isFull) {
      return "Registration Full";
    }
    
    return "Register Now";
  };

  const handleCardClick = () => {
    navigate(`/olympiads/${id}`);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
    >
      <Card variant="interactive" className="overflow-hidden group cursor-pointer" onClick={handleCardClick}>
        <div className="h-2 bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600" />
        <CardContent className="pt-4">
          {/* Header */}
          <div className="flex items-start justify-between gap-2 mb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-amber-500/10">
                <Trophy className="w-5 h-5 text-amber-500" />
              </div>
              {subject && (
                <Badge variant="subject">{subject.name}</Badge>
              )}
            </div>
            <div className="flex items-center gap-1">
              {isRegistered && (
                <Badge variant="default" className="bg-green-500/10 text-green-600 border-green-500/20">
                  <Check className="w-3 h-3 mr-1" />
                  Joined
                </Badge>
              )}
              <Badge 
                variant={isUpcoming ? "default" : "secondary"}
                className={isUpcoming ? "bg-green-500/10 text-green-600" : ""}
              >
                {isUpcoming ? "Upcoming" : status}
              </Badge>
            </div>
          </div>

          {/* Title */}
          <h3 className="font-bold text-foreground mb-2 line-clamp-2 group-hover:text-primary transition-colors">
            {title}
          </h3>

          {/* Center */}
          {center && (
            <p className="text-sm text-muted-foreground mb-3 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5" />
              {center.name}
            </p>
          )}

          {/* Stats */}
          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground mb-3">
            <div className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              <span>{format(new Date(startDate), "MMM d, yyyy")}</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              <span>{startsIn}</span>
            </div>
            {maxParticipants && (
              <div className="flex items-center gap-1">
                <Users className="w-3.5 h-3.5" />
                <span className={isFull ? "text-destructive" : ""}>
                  {currentParticipants || 0}/{maxParticipants}
                </span>
              </div>
            )}
          </div>

          {/* Prize */}
          {prizeDescription && (
            <div className="p-2 rounded-lg bg-amber-500/5 border border-amber-500/20 mb-4">
              <p className="text-xs text-amber-600 dark:text-amber-400 line-clamp-2">
                🏆 {prizeDescription}
              </p>
            </div>
          )}

          {/* CTA */}
          <Button 
            variant={isRegistered ? "outline" : "secondary"} 
            className={`w-full ${isRegistered ? "border-green-500/50 text-green-600 hover:bg-green-500/10" : ""}`}
            onClick={(e) => {
              e.stopPropagation();
              handleRegisterClick();
            }}
            disabled={isLoading || isRegistering || isUnregistering || (!isRegistered && isFull && isUpcoming)}
          >
            {getButtonContent()}
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
};
