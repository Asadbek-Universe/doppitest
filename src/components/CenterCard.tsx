import { FC } from "react";
import { motion } from "framer-motion";
import { Star, Users, MapPin, ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface CenterCardProps {
  id: string;
  name: string;
  description: string;
  location: string;
  subjects: string[];
  rating: number;
  reviewsCount: number;
  studentsCount: number;
  isVerified?: boolean;
  logoUrl?: string;
  coverUrl?: string;
}

export const CenterCard: FC<CenterCardProps> = ({
  id,
  name,
  description,
  location,
  subjects,
  rating,
  reviewsCount,
  studentsCount,
  isVerified = false,
  logoUrl,
  coverUrl,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
    >
      <Card variant="interactive" className="overflow-hidden group">
        {/* Cover Image */}
        <div className="relative h-24 overflow-hidden">
          <img
            src={coverUrl || "/placeholder.svg"}
            alt={name}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-card to-transparent" />
        </div>

        {/* Logo */}
        <div className="relative px-5 -mt-8">
          <div className="w-16 h-16 rounded-xl bg-card border-4 border-card shadow-md overflow-hidden">
            {logoUrl ? (
              <img src={logoUrl} alt={name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gradient-primary flex items-center justify-center">
                <span className="text-2xl font-bold text-primary-foreground">
                  {name.charAt(0)}
                </span>
              </div>
            )}
          </div>
        </div>

        <CardContent className="pt-3">
          {/* Name & Verified */}
          <div className="flex items-start gap-2 mb-1">
            <h3 className="font-bold text-foreground line-clamp-1 group-hover:text-primary transition-colors">
              {name}
            </h3>
            {isVerified && (
              <Badge variant="verified" className="flex items-center gap-1 shrink-0">
                <Star className="w-3 h-3" />
                Verified
              </Badge>
            )}
          </div>

          {/* Location */}
          <div className="flex items-center gap-1 text-sm text-muted-foreground mb-2">
            <MapPin className="w-3.5 h-3.5" />
            <span>{location}</span>
          </div>

          {/* Description */}
          <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
            {description}
          </p>

          {/* Subjects */}
          <div className="flex flex-wrap gap-1.5 mb-3">
            {subjects.slice(0, 3).map((subject) => (
              <Badge key={subject} variant="subject" className="text-xs">
                {subject}
              </Badge>
            ))}
            {subjects.length > 3 && (
              <Badge variant="secondary" className="text-xs">
                +{subjects.length - 3}
              </Badge>
            )}
          </div>

          {/* Stats */}
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-4">
            <div className="flex items-center gap-1">
              <Star className="w-3.5 h-3.5 text-coin fill-coin" />
              <span className="font-medium text-foreground">{rating}</span>
              <span>({reviewsCount} reviews)</span>
            </div>
            <div className="flex items-center gap-1">
              <Users className="w-3.5 h-3.5" />
              <span>{studentsCount.toLocaleString()} students</span>
            </div>
          </div>

          {/* CTA */}
          <Button variant="secondary" className="w-full group/btn">
            View Center
            <ChevronRight className="w-4 h-4 transition-transform group-hover/btn:translate-x-1" />
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
};
