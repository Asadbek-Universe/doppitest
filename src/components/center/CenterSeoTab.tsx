import { FC, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, TrendingUp, Eye, Zap, Plus, X, Save } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { useUpdateSeoSettings } from '@/hooks/useCenterData';
import { toast } from 'sonner';

interface SeoSettings {
  keywords: string[];
  meta_title?: string | null;
  meta_description?: string | null;
  boost_enabled: boolean;
  boost_expires_at?: string | null;
  visibility_score: number;
}

interface CenterSeoTabProps {
  centerId: string;
  seoSettings: SeoSettings | null;
  subscription: {
    seo_boost_level: number;
  } | null;
}

export const CenterSeoTab: FC<CenterSeoTabProps> = ({
  centerId,
  seoSettings,
  subscription,
}) => {
  const [keywords, setKeywords] = useState<string[]>(seoSettings?.keywords || []);
  const [newKeyword, setNewKeyword] = useState('');
  const [metaTitle, setMetaTitle] = useState(seoSettings?.meta_title || '');
  const [metaDescription, setMetaDescription] = useState(seoSettings?.meta_description || '');

  const updateSeo = useUpdateSeoSettings();

  useEffect(() => {
    if (seoSettings) {
      setKeywords(seoSettings.keywords || []);
      setMetaTitle(seoSettings.meta_title || '');
      setMetaDescription(seoSettings.meta_description || '');
    }
  }, [seoSettings]);

  const handleAddKeyword = () => {
    if (newKeyword.trim() && !keywords.includes(newKeyword.trim())) {
      setKeywords([...keywords, newKeyword.trim()]);
      setNewKeyword('');
    }
  };

  const handleRemoveKeyword = (keyword: string) => {
    setKeywords(keywords.filter((k) => k !== keyword));
  };

  const handleSave = async () => {
    try {
      await updateSeo.mutateAsync({
        centerId,
        keywords,
        meta_title: metaTitle || undefined,
        meta_description: metaDescription || undefined,
      });
      toast.success('SEO settings saved successfully');
    } catch {
      toast.error('Failed to save SEO settings');
    }
  };

  const visibilityScore = seoSettings?.visibility_score ?? 50;
  const boostLevel = subscription?.seo_boost_level ?? 0;

  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-3 gap-6">
        {/* Visibility Score */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="relative w-32 h-32 mx-auto mb-4">
                  <svg className="w-full h-full" viewBox="0 0 100 100">
                    <circle
                      className="text-muted stroke-current"
                      strokeWidth="10"
                      fill="none"
                      r="40"
                      cx="50"
                      cy="50"
                    />
                    <circle
                      className="text-primary stroke-current"
                      strokeWidth="10"
                      strokeLinecap="round"
                      fill="none"
                      r="40"
                      cx="50"
                      cy="50"
                      strokeDasharray={`${visibilityScore * 2.51} 251`}
                      transform="rotate(-90 50 50)"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-3xl font-bold">{visibilityScore}</span>
                  </div>
                </div>
                <h3 className="font-semibold">Visibility Score</h3>
                <p className="text-sm text-muted-foreground">
                  {visibilityScore < 40 ? 'Needs improvement' : visibilityScore < 70 ? 'Good' : 'Excellent'}
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Quick Stats */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                Performance
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm">Keywords Active</span>
                <Badge variant="secondary">{keywords.length}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Boost Level</span>
                <Badge className={boostLevel > 0 ? 'bg-amber-500/10 text-amber-600' : ''}>
                  {boostLevel > 0 ? `Level ${boostLevel}` : 'None'}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Boost Status</span>
                <Badge variant={seoSettings?.boost_enabled ? 'default' : 'secondary'}>
                  {seoSettings?.boost_enabled ? 'Active' : 'Inactive'}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Boost Info */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 border-amber-500/20">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Zap className="w-5 h-5 text-amber-500" />
                SEO Boost
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Boost your center's visibility in search results and recommendations.
              </p>
              {boostLevel > 0 ? (
                <div className="space-y-2">
                  <p className="text-sm font-medium">Current boost: Level {boostLevel}</p>
                  {seoSettings?.boost_expires_at && (
                    <p className="text-xs text-muted-foreground">
                      Expires: {new Date(seoSettings.boost_expires_at).toLocaleDateString()}
                    </p>
                  )}
                </div>
              ) : (
                <Button size="sm" className="w-full">
                  Upgrade Plan for Boost
                </Button>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Keywords Management */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="w-5 h-5 text-primary" />
              Keywords
            </CardTitle>
            <CardDescription>
              Add relevant keywords to help users find your center
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Add a keyword..."
                value={newKeyword}
                onChange={(e) => setNewKeyword(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddKeyword()}
              />
              <Button onClick={handleAddKeyword} size="icon">
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {keywords.map((keyword) => (
                <Badge key={keyword} variant="secondary" className="px-3 py-1">
                  {keyword}
                  <button
                    onClick={() => handleRemoveKeyword(keyword)}
                    className="ml-2 hover:text-destructive"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
              {keywords.length === 0 && (
                <p className="text-sm text-muted-foreground">No keywords added yet</p>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Meta Information */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5 text-primary" />
              Meta Information
            </CardTitle>
            <CardDescription>
              Customize how your center appears in search results
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Meta Title</Label>
              <Input
                placeholder="Your center name | Educational Platform"
                value={metaTitle}
                onChange={(e) => setMetaTitle(e.target.value)}
                maxLength={60}
              />
              <p className="text-xs text-muted-foreground">
                {metaTitle.length}/60 characters
              </p>
            </div>
            <div className="space-y-2">
              <Label>Meta Description</Label>
              <Textarea
                placeholder="A brief description of your educational center..."
                value={metaDescription}
                onChange={(e) => setMetaDescription(e.target.value)}
                maxLength={160}
                rows={3}
              />
              <p className="text-xs text-muted-foreground">
                {metaDescription.length}/160 characters
              </p>
            </div>

            {/* Preview */}
            <div className="p-4 rounded-lg bg-muted/50 space-y-1">
              <p className="text-sm font-medium text-blue-600">
                {metaTitle || 'Your Center Name'}
              </p>
              <p className="text-xs text-green-600">www.imts.uz/centers/your-center</p>
              <p className="text-xs text-muted-foreground">
                {metaDescription || 'Your center description will appear here...'}
              </p>
            </div>

            <Button onClick={handleSave} disabled={updateSeo.isPending} className="w-full">
              <Save className="w-4 h-4 mr-2" />
              {updateSeo.isPending ? 'Saving...' : 'Save SEO Settings'}
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};