import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { academyApi } from '../../api/academy.api';
import { useToast } from '../../context/ToastContext';
import { Badge } from '../../components/common/Badge';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { EmptyState } from '../../components/common/EmptyState';
import {
  BookOpen,
  Award,
  Clock,
  Sparkles,
  CheckCircle2,
  Play,
  ArrowRight,
  Filter,
  CheckCircle,
} from 'lucide-react';

export const AcademyCatalogPage = () => {
  const toast = useToast();
  const [courses, setCourses] = useState([]);
  const [progressList, setProgressList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('');

  const categories = [
    { label: 'All Modules', value: '' },
    { label: 'Product Knowledge', value: 'product_knowledge' },
    { label: 'Tyre Sizing', value: 'tyre_sizing' },
    { label: 'Tyre Maintenance', value: 'tyre_maintenance' },
    { label: 'Tyre Safety', value: 'tyre_safety' },
    { label: 'Tyre Technology', value: 'tyre_technology' },
    { label: 'Customer Handling', value: 'customer_handling' },
  ];

  const fetchAcademyData = async () => {
    try {
      setLoading(true);
      const [coursesRes, progressRes] = await Promise.all([
        academyApi.getCourses({ category: selectedCategory || undefined }),
        academyApi.getProgress(),
      ]);

      if (coursesRes.data?.success) {
        setCourses(coursesRes.data.data);
      }
      if (progressRes.data?.success) {
        setProgressList(progressRes.data.data);
      }
    } catch (err) {
      toast.error('Failed to load academy courses.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAcademyData();
  }, [selectedCategory]);

  const completedCount = progressList.filter((p) => p.completion_status === 'completed').length;
  const totalCreditsEarned = progressList
    .filter((p) => p.completion_status === 'completed')
    .reduce((acc, p) => acc + (p.credit_reward || 15), 0);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-slate-900 via-eurogrip-950 to-slate-900 p-6 sm:p-8 text-white relative overflow-hidden shadow-lg border border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center space-x-2 text-amber-400 text-xs font-bold uppercase tracking-wider mb-2">
              <Sparkles className="w-4 h-4" />
              <span>Certified Technical Training</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">Ustaad Learning Academy</h1>
            <p className="mt-1 text-slate-300 text-sm max-w-xl">
              Sharpen your tyre diagnosis, tubeless puncture repair, and radial selection skills. Earn credits and
              official Eurogrip certifications with every course.
            </p>
          </div>

          {/* Quick Metrics */}
          <div className="flex items-center space-x-3 bg-white/10 backdrop-blur-md p-3.5 rounded-2xl border border-white/10 text-xs">
            <div className="text-center px-3 border-r border-white/10">
              <span className="text-slate-400 block text-[10px] uppercase font-bold">COMPLETED</span>
              <span className="font-bold text-white text-base">{completedCount} / {courses.length}</span>
            </div>
            <div className="text-center px-3">
              <span className="text-slate-400 block text-[10px] uppercase font-bold">CREDITS WON</span>
              <span className="font-bold text-amber-400 text-base">+{totalCreditsEarned}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-2 scrollbar-none">
        {categories.map((c) => (
          <button
            key={c.value}
            type="button"
            onClick={() => setSelectedCategory(c.value)}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors border ${
              selectedCategory === c.value
                ? 'bg-eurogrip-700 text-white border-eurogrip-700 shadow-xs'
                : 'bg-white text-slate-600 border-slate-200/80 hover:bg-slate-50'
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* Courses Grid */}
      {loading ? (
        <LoadingSpinner text="Loading courses catalog..." />
      ) : courses.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="No Courses in this Category"
          description="Try selecting a different training category above."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => {
            const progress = progressList.find((p) => p.course_id === course.id);
            const isCompleted = progress?.completion_status === 'completed';
            const isEnrolled = !!progress;

            return (
              <div
                key={course.id}
                className="bg-white rounded-3xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all flex flex-col justify-between overflow-hidden"
              >
                <div className="p-6">
                  {/* Category & Badge */}
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      {course.category.replace('_', ' ')}
                    </span>
                    <Badge
                      variant={
                        course.difficulty === 'advanced'
                          ? 'purple'
                          : course.difficulty === 'intermediate'
                          ? 'warning'
                          : 'primary'
                      }
                    >
                      {course.difficulty}
                    </Badge>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 tracking-tight leading-snug">{course.title}</h3>
                  <p className="mt-2 text-xs text-slate-500 line-clamp-2 leading-relaxed">{course.description}</p>

                  {/* Course Details Info */}
                  <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-medium">
                    <span className="flex items-center">
                      <Clock className="w-3.5 h-3.5 mr-1 text-slate-400" />
                      {course.duration_minutes} mins
                    </span>
                    <span className="font-bold text-amber-600">+{course.credit_reward} Credits</span>
                  </div>
                </div>

                {/* Footer Action */}
                <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                  {isCompleted ? (
                    <div className="flex items-center space-x-1.5 text-xs font-bold text-emerald-700">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Certified ({progress.assessment_score}%)</span>
                    </div>
                  ) : isEnrolled ? (
                    <div className="flex items-center space-x-1.5 text-xs font-bold text-eurogrip-700">
                      <Play className="w-3.5 h-3.5" />
                      <span>In Progress</span>
                    </div>
                  ) : (
                    <span className="text-xs text-slate-400 font-medium">Available</span>
                  )}

                  <Link
                    to={`/academy/${course.id}`}
                    className={`inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
                      isCompleted
                        ? 'bg-emerald-100 text-emerald-900 hover:bg-emerald-200'
                        : 'bg-eurogrip-700 text-white hover:bg-eurogrip-800'
                    }`}
                  >
                    <span>{isCompleted ? 'Review' : isEnrolled ? 'Continue' : 'Start'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

