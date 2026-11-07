import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { academyApi } from '../../api/academy.api';
import { useToast } from '../../context/ToastContext';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Badge } from '../../components/common/Badge';
import {
  BookOpen,
  ArrowLeft,
  Clock,
  Award,
  CheckCircle2,
  FileQuestion,
  Play,
  RotateCw,
  Sparkles,
} from 'lucide-react';

export const CourseDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);

  const fetchCourse = async () => {
    try {
      setLoading(true);
      const res = await academyApi.getCourse(id);
      if (res.data?.success) {
        setCourse(res.data.data);
      }
    } catch (err) {
      toast.error('Failed to load course details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourse();
  }, [id]);

  const handleEnrol = async () => {
    try {
      setEnrolling(true);
      const res = await academyApi.enrolCourse(id);
      if (res.data?.success) {
        toast.success('Successfully enrolled in training module!');
        fetchCourse();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to enrol.');
    } finally {
      setEnrolling(false);
    }
  };

  if (loading) {
    return <LoadingSpinner text="Retrieving training module..." />;
  }

  if (!course) {
    return (
      <div className="text-center py-12">
        <p className="text-sm text-slate-500">Course module not found.</p>
        <Link to="/academy" className="mt-4 inline-block text-xs font-bold text-eurogrip-700">
          Back to Academy
        </Link>
      </div>
    );
  }

  const progress = course.progress;
  const isEnrolled = !!progress;
  const isCompleted = progress?.completion_status === 'completed';

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Link
        to="/academy"
        className="inline-flex items-center text-xs font-semibold text-slate-500 hover:text-slate-800"
      >
        <ArrowLeft className="w-4 h-4 mr-1.5" />
        <span>Back to Academy Catalog</span>
      </Link>

      {/* Main Course Content Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div>
            <div className="flex items-center space-x-2 text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
              <span>{course.category?.replace('_', ' ')}</span>
              <span>•</span>
              <span className="capitalize">{course.difficulty}</span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">{course.title}</h1>
          </div>

          <div className="flex items-center space-x-2">
            <span className="px-3 py-1 bg-amber-50 border border-amber-200 text-amber-900 font-bold text-xs rounded-xl">
              +{course.credit_reward} Credits
            </span>
          </div>
        </div>

        {/* Video / Content Embed */}
        <div className="aspect-video w-full rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 shadow-inner flex items-center justify-center">
          {course.content_url?.includes('youtube') || course.content_url?.includes('embed') ? (
            <iframe
              src={course.content_url}
              title={course.title}
              className="w-full h-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <div className="text-center p-6 text-slate-400 space-y-2">
              <Play className="w-12 h-12 mx-auto text-amber-400 mb-2" />
              <p className="text-sm font-semibold text-white">Interactive Training Video Module</p>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Review the training material below before taking the quiz to receive your verified certification.
              </p>
            </div>
          )}
        </div>

        {/* Description & Learning Objectives */}
        <div className="space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">About this Course</h2>
          <p className="text-sm text-slate-700 leading-relaxed">{course.description}</p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs">
              <span className="text-slate-400 block text-[10px] uppercase font-bold">ESTIMATED TIME</span>
              <span className="font-bold text-slate-800 mt-0.5 block">{course.duration_minutes} Minutes</span>
            </div>
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs">
              <span className="text-slate-400 block text-[10px] uppercase font-bold">ASSESSMENT</span>
              <span className="font-bold text-slate-800 mt-0.5 block">
                {course.questions?.length || 2} Multiple Choice Questions
              </span>
            </div>
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs">
              <span className="text-slate-400 block text-[10px] uppercase font-bold">PASSING CRITERIA</span>
              <span className="font-bold text-emerald-700 mt-0.5 block">70% Score Required</span>
            </div>
          </div>
        </div>

        {/* Enrollment / Assessment Action Bar */}
        <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          {isCompleted ? (
            <div className="flex items-center space-x-2.5">
              <CheckCircle2 className="w-6 h-6 text-emerald-600 flex-shrink-0" />
              <div>
                <p className="text-xs font-bold text-emerald-900">Module Passed & Certified</p>
                <p className="text-[11px] text-emerald-700">
                  You scored {progress.assessment_score}% and earned {course.credit_reward} Ustaad credits!
                </p>
              </div>
            </div>
          ) : isEnrolled ? (
            <div>
              <p className="text-xs font-bold text-slate-800">You are enrolled in this course</p>
              <p className="text-[11px] text-slate-500">
                Ready to test your knowledge? Take the quiz to claim your credits.
              </p>
            </div>
          ) : (
            <div>
              <p className="text-xs font-bold text-slate-800">Enrolment is free for registered Ustaads</p>
              <p className="text-[11px] text-slate-500">Complete the course to upgrade your ranking tier.</p>
            </div>
          )}

          <div>
            {!isEnrolled ? (
              <button
                type="button"
                onClick={handleEnrol}
                disabled={enrolling}
                className="bg-eurogrip-700 hover:bg-eurogrip-800 text-white font-bold px-6 py-2.5 rounded-xl text-xs transition-colors shadow-sm disabled:opacity-50"
              >
                {enrolling ? 'Enrolling...' : 'Enrol in Course'}
              </button>
            ) : (
              <Link
                to={`/academy/${course.id}/quiz`}
                className="inline-flex items-center space-x-2 bg-amber-400 hover:bg-amber-500 text-slate-950 font-bold px-6 py-2.5 rounded-xl text-xs transition-colors shadow-sm"
              >
                <FileQuestion className="w-4 h-4" />
                <span>{isCompleted ? 'Retake Quiz' : 'Take Certification Quiz'}</span>
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

