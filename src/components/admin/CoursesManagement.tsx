import { FC, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  BookOpen,
  Search,
  Filter,
  Eye,
  Star,
  Users,
  Clock,
  Trash2,
  GraduationCap,
  DollarSign,
  Gift,
  TrendingUp,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { TablePagination } from '@/components/TablePagination';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Subject {
  id?: string;
  name: string;
  color?: string | null;
}

interface Course {
  id: string;
  title: string;
  description: string | null;
  instructor_name: string;
  instructor_avatar: string | null;
  thumbnail_url: string | null;
  students_count: number | null;
  rating: number | null;
  duration_minutes: number | null;
  lessons_count: number | null;
  is_free: boolean | null;
  price: number | null;
  created_at: string;
  subjects: Subject | null;
}

interface CoursesManagementProps {
  courses: Course[] | undefined;
  selectedCourses: Set<string>;
  onToggleCourse: (courseId: string) => void;
  onToggleAll: () => void;
  onBulkDelete: () => void;
  onViewCourse?: (course: Course) => void;
}

const ITEMS_PER_PAGE = 10;

export const CoursesManagement: FC<CoursesManagementProps> = ({
  courses,
  selectedCourses,
  onToggleCourse,
  onToggleAll,
  onBulkDelete,
  onViewCourse,
}) => {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [subjectFilter, setSubjectFilter] = useState<string>('all');
  const [page, setPage] = useState(1);

  // Get unique subjects for filter (using name as key since id may not be available)
  const availableSubjects = useMemo(() => {
    const subjectsMap = new Map<string, Subject>();
    courses?.forEach((c) => {
      if (c.subjects) {
        subjectsMap.set(c.subjects.name, c.subjects);
      }
    });
    return Array.from(subjectsMap.values());
  }, [courses]);

  const filteredCourses = useMemo(() => {
    return courses?.filter((c) => {
      const matchesSearch =
        !search ||
        c.title.toLowerCase().includes(search.toLowerCase()) ||
        c.instructor_name?.toLowerCase().includes(search.toLowerCase()) ||
        c.subjects?.name?.toLowerCase().includes(search.toLowerCase());
      const matchesType =
        typeFilter === 'all' ||
        (typeFilter === 'free' && c.is_free) ||
        (typeFilter === 'paid' && !c.is_free);
      const matchesSubject =
        subjectFilter === 'all' || c.subjects?.name === subjectFilter;
      return matchesSearch && matchesType && matchesSubject;
    });
  }, [courses, search, typeFilter, subjectFilter]);

  const totalPages = Math.ceil((filteredCourses?.length || 0) / ITEMS_PER_PAGE);
  const paginatedCourses = useMemo(() => {
    const start = (page - 1) * ITEMS_PER_PAGE;
    return filteredCourses?.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredCourses, page]);

  // Stats
  const totalCourses = courses?.length || 0;
  const freeCourses = courses?.filter((c) => c.is_free).length || 0;
  const paidCourses = courses?.filter((c) => !c.is_free).length || 0;
  const totalStudents = courses?.reduce((acc, c) => acc + (c.students_count || 0), 0) || 0;

  const getInitials = (name: string | null) => {
    if (!name) return 'C';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formatDuration = (minutes: number | null) => {
    if (!minutes) return '—';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours === 0) return `${mins}m`;
    if (mins === 0) return `${hours}h`;
    return `${hours}h ${mins}m`;
  };

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const handleTypeFilterChange = (value: string) => {
    setTypeFilter(value);
    setPage(1);
  };

  const handleSubjectFilterChange = (value: string) => {
    setSubjectFilter(value);
    setPage(1);
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards - Sticky */}
      <div className="sticky top-16 z-10 bg-background/95 backdrop-blur-sm pb-4 -mx-1 px-1 pt-1">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0 }}
          >
            <Card className="border-none shadow-md bg-gradient-to-br from-card to-muted/30">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <BookOpen className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{totalCourses}</p>
                    <p className="text-xs text-muted-foreground">Total Courses</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
          >
            <Card className="border-none shadow-md bg-gradient-to-br from-card to-green-500/5">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center">
                    <Gift className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{freeCourses}</p>
                    <p className="text-xs text-muted-foreground">Free Courses</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="border-none shadow-md bg-gradient-to-br from-card to-amber-500/5">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                    <DollarSign className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{paidCourses}</p>
                    <p className="text-xs text-muted-foreground">Paid Courses</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            <Card className="border-none shadow-md bg-gradient-to-br from-card to-primary/5">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{totalStudents.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">Total Enrollments</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>

      {/* Main Card */}
      <Card className="border-none shadow-lg">
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <GraduationCap className="w-5 h-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">Course Management</CardTitle>
                <p className="text-sm text-muted-foreground">
                  {filteredCourses?.length || 0} courses found
                </p>
              </div>
            </div>
            {selectedCourses.size > 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center gap-3 px-4 py-2 bg-destructive/5 rounded-lg border border-destructive/20"
              >
                <span className="text-sm font-medium text-destructive">
                  {selectedCourses.size} selected
                </span>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={onBulkDelete}
                >
                  <Trash2 className="w-4 h-4 mr-1.5" />
                  Delete
                </Button>
              </motion.div>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Search & Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by title, instructor, or subject..."
                value={search}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-10 bg-muted/50 border-transparent focus:border-primary/30 focus:bg-card transition-colors"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-muted-foreground hidden sm:block" />
              <Select value={typeFilter} onValueChange={handleTypeFilterChange}>
                <SelectTrigger className="w-full sm:w-32 bg-muted/50 border-transparent">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="free">
                    <div className="flex items-center gap-2">
                      <Gift className="w-3.5 h-3.5 text-green-600" />
                      Free
                    </div>
                  </SelectItem>
                  <SelectItem value="paid">
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-3.5 h-3.5 text-amber-600" />
                      Paid
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              <Select value={subjectFilter} onValueChange={handleSubjectFilterChange}>
                <SelectTrigger className="w-full sm:w-36 bg-muted/50 border-transparent">
                  <SelectValue placeholder="Subject" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Subjects</SelectItem>
                  {availableSubjects.map((subject) => (
                    <SelectItem key={subject.name} value={subject.name}>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: subject.color || '#6366f1' }}
                        />
                        {subject.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Table */}
          <div className="rounded-xl border border-border/50 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30 hover:bg-muted/30">
                  <TableHead className="w-12">
                    <Checkbox
                      checked={paginatedCourses?.length ? selectedCourses.size === paginatedCourses.length : false}
                      onCheckedChange={onToggleAll}
                    />
                  </TableHead>
                  <TableHead className="font-semibold">Course</TableHead>
                  <TableHead className="font-semibold hidden md:table-cell">Subject</TableHead>
                  <TableHead className="font-semibold hidden lg:table-cell">Duration</TableHead>
                  <TableHead className="font-semibold">Students</TableHead>
                  <TableHead className="font-semibold hidden sm:table-cell">Rating</TableHead>
                  <TableHead className="font-semibold text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedCourses?.map((course, idx) => (
                  <motion.tr
                    key={course.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: idx * 0.02 }}
                    className="group border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted"
                  >
                    <TableCell>
                      <Checkbox
                        checked={selectedCourses.has(course.id)}
                        onCheckedChange={() => onToggleCourse(course.id)}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="w-10 h-10 rounded-lg border-2 border-background shadow-sm">
                          <AvatarImage src={course.thumbnail_url || undefined} className="object-cover" />
                          <AvatarFallback className="rounded-lg bg-primary/10 text-primary text-xs font-medium">
                            {getInitials(course.title)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-foreground truncate max-w-[200px]">
                              {course.title}
                            </p>
                            {course.is_free ? (
                              <Badge variant="outline" className="bg-green-500/10 text-green-700 border-green-200 text-[10px] px-1.5">
                                Free
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="bg-amber-500/10 text-amber-700 border-amber-200 text-[10px] px-1.5">
                                {course.price?.toLocaleString() || 'Paid'}
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground truncate">
                            by {course.instructor_name}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {course.subjects ? (
                        <Badge
                          variant="outline"
                          className="gap-1.5"
                          style={{
                            backgroundColor: `${course.subjects.color}15`,
                            borderColor: `${course.subjects.color}30`,
                            color: course.subjects.color || undefined,
                          }}
                        >
                          <div
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: course.subjects.color || '#6366f1' }}
                          />
                          {course.subjects.name}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Clock className="w-3.5 h-3.5" />
                        <span className="text-sm">{formatDuration(course.duration_minutes)}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-muted-foreground" />
                        <span className="font-medium">{course.students_count || 0}</span>
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      {course.rating ? (
                        <div className="flex items-center gap-1">
                          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                          <span className="text-sm font-medium">{course.rating.toFixed(1)}</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 px-3 text-muted-foreground hover:text-foreground"
                          onClick={() => onViewCourse?.(course)}
                        >
                          <Eye className="w-4 h-4 mr-1.5" />
                          View
                        </Button>
                      </div>
                    </TableCell>
                  </motion.tr>
                ))}
                {(!paginatedCourses || paginatedCourses.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={7} className="h-32">
                      <div className="flex flex-col items-center justify-center text-center">
                        <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
                          <BookOpen className="w-6 h-6 text-muted-foreground" />
                        </div>
                        <p className="font-medium text-foreground">No courses found</p>
                        <p className="text-sm text-muted-foreground">
                          Try adjusting your search or filter
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          <TablePagination
            currentPage={page}
            totalPages={totalPages}
            totalItems={filteredCourses?.length || 0}
            itemsPerPage={ITEMS_PER_PAGE}
            onPageChange={setPage}
          />
        </CardContent>
      </Card>
    </div>
  );
};
