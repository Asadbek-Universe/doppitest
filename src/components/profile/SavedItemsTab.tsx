import { FC, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Bookmark, Loader2, LogIn, Search, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { useAuth } from "@/hooks/useAuth";
import {
  SavedItemType,
  useRemoveSavedItem,
  useSavedItemsList,
} from "@/hooks/useSavedItems";

const typeLabels: Record<SavedItemType, string> = {
  test: "Tests",
  course: "Courses",
  reel: "Reels",
  center: "Centers",
};

export const SavedItemsTab: FC = () => {
  const { user } = useAuth();
  const [typeFilter, setTypeFilter] = useState<"all" | SavedItemType>("all");
  const [query, setQuery] = useState("");

  const { data: items, isLoading, isError } = useSavedItemsList({ userId: user?.id });
  const removeSaved = useRemoveSavedItem();

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (items || []).filter((it) => {
      if (typeFilter !== "all" && it.type !== typeFilter) return false;
      if (!q) return true;
      const text =
        it.type === "center"
          ? `${it.name} ${it.city || ""}`
          : `${it.title} ${it.description || ""}`;
      return text.toLowerCase().includes(q);
    });
  }, [items, query, typeFilter]);

  if (!user) {
    return (
      <Card className="bg-card border-border">
        <CardContent className="p-12 text-center">
          <Bookmark className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">Sign in to view saved items</h3>
          <p className="text-muted-foreground mb-4">Save tests, courses, reels, and centers to revisit later.</p>
          <Link to="/auth">
            <Button className="gap-2">
              <LogIn className="w-4 h-4" />
              Sign In
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search saved items"
            className="pl-9"
          />
        </div>

        <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as any)}>
          <SelectTrigger className="w-full md:w-48">
            <SelectValue placeholder="All types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="test">Tests</SelectItem>
            <SelectItem value="course">Courses</SelectItem>
            <SelectItem value="reel">Reels</SelectItem>
            <SelectItem value="center">Centers</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : isError ? (
        <Card className="bg-card border-border">
          <CardContent className="p-10 text-center">
            <p className="text-foreground font-medium">Could not load saved items.</p>
            <p className="text-muted-foreground text-sm">Please try again.</p>
          </CardContent>
        </Card>
      ) : filtered.length === 0 ? (
        <Card className="bg-card border-border">
          <CardContent className="p-12 text-center">
            <Bookmark className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No saved items</h3>
            <p className="text-muted-foreground">Bookmark something and it will show up here.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {filtered.map((it) => {
            const title = it.type === "center" ? it.name : it.title;
            const subtitle =
              it.type === "center" ? it.city : it.description || "";

            return (
              <Card key={`${it.type}:${it.id}`} className="bg-card border-border">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="secondary">{typeLabels[it.type]}</Badge>
                      </div>
                      <p className="font-semibold text-foreground truncate">{title}</p>
                      {subtitle ? (
                        <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{subtitle}</p>
                      ) : null}
                    </div>

                    <Button
                      variant="outline"
                      size="icon"
                      disabled={removeSaved.isPending}
                      onClick={() =>
                        removeSaved.mutate({
                          userId: user.id,
                          itemType: it.type,
                          itemId: it.id,
                        })
                      }
                      aria-label="Remove from saved"
                      title="Remove"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};
