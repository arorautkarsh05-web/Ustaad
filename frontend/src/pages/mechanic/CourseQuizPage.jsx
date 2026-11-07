import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { academyApi } from '../../api/academy.api';
import { useToast } from '../../context/ToastContext';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import {
  FileQuestion,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Award,
  Sparkles,
  ArrowRight,
  RotateCw,
} from 'lucide-react';

export const CourseQuizPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);

  const fetchCourseQuestions = async () => {
    try {
      setLoading(true);
      const res = await academyApi.getCourse(id);
      if (res.data?.success) {
        setCourse(res.data.data);
      }
    } catch (err) {
      toast.error('Failed to load course questions.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourseQuestions();
  }, [id]);

  const handleSelectOption = (questionId, option) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: option,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const questions = course?.questions || [];
    const answeredCount = Object.keys(answers).length;

    if (answeredCount < questions.length) {
      toast.warning(`Please answer all ${questions.length} questions before submitting.`);
      return;
    }

    try {
      setSubmitting(true);
      const res = await academyApi.submitAssessment(id, answers);
      if (res.data?.success && res.data.data) {
        setResult(res.data.data);
        if (res.data.data.passed) {
          toast.success(`Congratulations! Passed with ${res.data.data.score}%`);
        } else {
          toast.error(`Score: ${res.data.data.score}%. 70% required to pass.`);
        }
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit quiz.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <LoadingSpinner text="Preparing assessment questions..." />;
  }

  const questions = course?.questions || [];

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Link
        to={`/academy/${id}`}
        className="inline-flex items-center text-xs font-semibold text-slate-500 hover:text-slate-800"
      >
        <ArrowLeft className="w-4 h-4 mr-1.5" />
        <span>Back to Course Module</span>
      </Link>

      {result ? (
        /* Quiz Result Card */
        <div className="bg-white rounded-3xl p-8 border border-slate-200/80 shadow-xl text-center space-y-6">
          <div
            className={`w-20 h-20 rounded-3xl flex items-center justify-center mx-auto shadow-sm ${
              result.passed
                ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                : 'bg-rose-50 text-rose-600 border border-rose-100'
            }`}
          >
            {result.passed ? <CheckCircle2 className="w-10 h-10" /> : <XCircle className="w-10 h-10" />}
          </div>

          <div>
            <span
              className={`text-xs font-bold uppercase tracking-widest block mb-1 ${
                result.passed ? 'text-emerald-700' : 'text-rose-700'
              }`}
            >
              {result.passed ? 'ASSESSMENT PASSED' : 'NEEDS IMPROVEMENT'}
            </span>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Your Score: {result.score}%</h1>
            <p className="mt-1 text-sm text-slate-500 max-w-sm mx-auto">
              {result.passed
                ? `Well done, Ustaad! You have officially passed the certification and earned +${course.credit_reward} credits.`
                : 'You scored below the 70% passing threshold. Review the learning materials and try again.'}
            </p>
          </div>

          {result.passed && result.credits_awarded && (
            <div className="inline-flex items-center space-x-2 px-4 py-2 bg-amber-50 border border-amber-200 text-amber-900 rounded-full text-xs font-bold">
              <Sparkles className="w-4 h-4 text-amber-600" />
              <span>+{course.credit_reward} Ustaad Credits Deposited!</span>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Link
              to="/academy"
              className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-semibold text-xs hover:bg-slate-50 transition-colors"
            >
              Browse More Courses
            </Link>

            <button
              type="button"
              onClick={() => {
                setResult(null);
                setAnswers({});
              }}
              className="inline-flex items-center space-x-1.5 bg-eurogrip-700 hover:bg-eurogrip-800 text-white font-bold px-5 py-2.5 rounded-xl text-xs transition-colors shadow-sm"
            >
              <RotateCw className="w-3.5 h-3.5" />
              <span>Retake Quiz</span>
            </button>
          </div>
        </div>
      ) : (
        /* Quiz Form */
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6">
          <div className="border-b border-slate-100 pb-5">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
              Certification Assessment
            </span>
            <h1 className="text-xl font-black text-slate-900 tracking-tight">{course.title}</h1>
            <p className="mt-1 text-xs text-slate-500">
              Answer all questions below. You must score at least 70% to pass and unlock reward credits.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {questions.map((q, qIndex) => (
              <div key={q.id} className="p-5 rounded-2xl bg-slate-50/80 border border-slate-200/70 space-y-3">
                <div className="flex items-start space-x-3">
                  <span className="w-6 h-6 rounded-lg bg-eurogrip-700 text-white font-bold text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                    {qIndex + 1}
                  </span>
                  <p className="text-sm font-bold text-slate-900 leading-snug">{q.question_text}</p>
                </div>

                <div className="grid grid-cols-1 gap-2 pt-2 pl-9">
                  {['a', 'b', 'c', 'd'].map((opt) => {
                    const text = q[`option_${opt}`];
                    if (!text) return null;
                    const isSelected = answers[q.id] === opt;

                    return (
                      <label
                        key={opt}
                        onClick={() => handleSelectOption(q.id, opt)}
                        className={`flex items-center p-3 rounded-xl border text-xs font-medium cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-eurogrip-50 border-eurogrip-700 text-eurogrip-950 font-semibold shadow-2xs'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <div
                          className={`w-4 h-4 rounded-full border flex items-center justify-center mr-3 ${
                            isSelected ? 'border-eurogrip-700 bg-eurogrip-700' : 'border-slate-300 bg-white'
                          }`}
                        >
                          {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                        </div>
                        <span className="uppercase font-bold text-slate-400 mr-2">{opt}.</span>
                        <span>{text}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            ))}

            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs text-slate-500 font-medium">
                {Object.keys(answers).length} of {questions.length} questions answered
              </span>

              <button
                type="submit"
                disabled={submitting || Object.keys(answers).length !== questions.length}
                className="inline-flex items-center space-x-2 bg-eurogrip-700 hover:bg-eurogrip-800 text-white font-bold px-6 py-2.5 rounded-xl text-xs transition-colors shadow-sm disabled:opacity-50"
              >
                <span>{submitting ? 'Grading Assessment...' : 'Submit Assessment'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
