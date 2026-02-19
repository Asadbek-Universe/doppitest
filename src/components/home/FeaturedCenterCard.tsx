import { FC } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Star, Users, MapPin, CheckCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface FeaturedCenterCardProps {
  id: string;
  name: string;
  description?: string;
  city?: string;
  followersCount: number;
  isVerified?: boolean;
  logoUrl?: string;
}

export const FeaturedCenterCard: FC<FeaturedCenterCardProps> = ({
  id,
  name,
  description,
  city,
  followersCount,
  isVerified,
  logoUrl,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2, scale: 1.02 }}
      transition={{ duration: 0.2 }}
    >
      <Link
        to={`/centers/${id}`}
        className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border hover:border-primary/30 hover:shadow-md transition-all"
      >
        {/* Logo */}
        <div className="w-12 h-12 rounded-xl shrink-0 overflow-hidden bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
          {logoUrl ? (
            <img src={logoUrl} alt={name} className="w-full h-full object-cover" />
          ) : (
            <span className="text-lg font-bold text-primary">{name.charAt(0)}</span>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5">
            <h4 className="font-semibold text-sm truncate">{name}</h4>
            {isVerified && (
              <CheckCircle className="w-4 h-4 text-primary shrink-0" />
            )}
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {city && (
              <span className="flex items-center gap-0.5">
                <MapPin className="w-3 h-3" />
                {city}
              </span>
            )}
            <span className="flex items-center gap-0.5">
              <Users className="w-3 h-3" />
              {followersCount.toLocaleString()}
            </span>
          </div>
        </div>

        {isVerified && (
          <Badge variant="verified" className="shrink-0 text-xs">
            <Star className="w-3 h-3 mr-0.5" />
            Verified
          </Badge>
        )}
      </Link>
    </motion.div>
  );
};
