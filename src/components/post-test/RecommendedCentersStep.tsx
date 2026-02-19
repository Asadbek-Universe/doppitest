import { FC } from "react";
import { motion } from "framer-motion";
import { Building2, Users, BookOpen, FileText, CheckCircle, ChevronRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useRecommendedCenters } from "@/hooks/usePostTestRecommendations";
import { useNavigate } from "react-router-dom";

interface TestResults {
  score: number;
  totalPoints: number;
  percentage: number;
  subjectId?: string | null;
  weakTopics: string[];
  timeSpent: number;
}

interface RecommendedCentersStepProps {
  results: TestResults;
}

export const RecommendedCentersStep: FC<RecommendedCentersStepProps> = ({
  results,
}) => {
  const navigate = useNavigate();
  const { data: centers, isLoading } = useRecommendedCenters(results);

  const handleViewCenter = (centerId: string) => {
    navigate(`/centers/${centerId}`);
  };

  const handleSubscribe = (centerId: string) => {
    // Would trigger follow action in real implementation
    navigate(`/centers/${centerId}`);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!centers || centers.length === 0) {
    return (
      <div className="text-center py-16">
        <Building2 className="w-16 h-16 text-muted-foreground/50 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-foreground mb-2">
          No Centers Available
        </h3>
        <p className="text-muted-foreground">
          We couldn't find any matching educational centers at this time.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-foreground mb-2">
          Suggested Centers
        </h2>
        <p className="text-muted-foreground">
          Discover top educational centers with courses in your areas of interest
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {centers.map((center, index) => (
          <motion.div
            key={center.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="hover:shadow-lg transition-all duration-300 h-full">
              <CardContent className="p-5 flex flex-col h-full">
                {/* Header */}
                <div className="flex items-start gap-4 mb-4">
                  <Avatar className="w-14 h-14 rounded-xl">
                    {center.logo_url && <AvatarImage src={center.logo_url} />}
                    <AvatarFallback className="rounded-xl bg-primary/10 text-primary text-lg">
                      {center.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-foreground truncate">
                        {center.name}
                      </h3>
                      {center.is_verified && (
                        <CheckCircle className="w-4 h-4 text-primary flex-shrink-0" />
                      )}
                    </div>
                    {center.city && (
                      <p className="text-sm text-muted-foreground">{center.city}</p>
                    )}
                  </div>
                </div>

                {/* Description */}
                {center.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-4 flex-1">
                    {center.description}
                  </p>
                )}

                {/* Specializations */}
                {center.specializations && center.specializations.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-4">
                    {center.specializations.slice(0, 3).map((spec) => (
                      <Badge key={spec} variant="secondary" className="text-xs">
                        {spec}
                      </Badge>
                    ))}
                    {center.specializations.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{center.specializations.length - 3}
                      </Badge>
                    )}
                  </div>
                )}

                {/* Stats */}
                <div className="grid grid-cols-3 gap-2 mb-4 py-3 bg-muted/50 rounded-lg">
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 text-muted-foreground">
                      <Users className="w-3 h-3" />
                    </div>
                    <p className="font-semibold text-foreground text-sm">
                      {center.followers_count.toLocaleString()}
                    </p>
                    <p className="text-xs text-muted-foreground">Followers</p>
                  </div>
                  <div className="text-center border-x border-border">
                    <div className="flex items-center justify-center gap-1 text-muted-foreground">
                      <BookOpen className="w-3 h-3" />
                    </div>
                    <p className="font-semibold text-foreground text-sm">
                      {center.courses_count}
                    </p>
                    <p className="text-xs text-muted-foreground">Courses</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 text-muted-foreground">
                      <FileText className="w-3 h-3" />
                    </div>
                    <p className="font-semibold text-foreground text-sm">
                      {center.tests_count}
                    </p>
                    <p className="text-xs text-muted-foreground">Tests</p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 mt-auto">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => handleViewCenter(center.id)}
                  >
                    View Center
                  </Button>
                  <Button
                    className="flex-1 gap-1"
                    onClick={() => handleSubscribe(center.id)}
                  >
                    Subscribe
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
};
