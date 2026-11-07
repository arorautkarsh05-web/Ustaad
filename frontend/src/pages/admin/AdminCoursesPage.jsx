import React, { useState, useEffect } from 'react';
import { academyApi } from '../../api/academy.api';
import { adminApi } from '../../api/admin.api';
import { useToast } from '../../context/ToastContext';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import {
  BookOpen,
  Plus,
  Clock,
  Award,
  FileQuestion,
  CheckCircle2,
  Edit2,
} from 'lucide-react';

export const AdminCoursesPage = () => {
  const toast = useToast();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  // Add course modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('product_knowledge');
  const [contentUrl, setContentUrl] = useState('https://www.youtube.com/embed/dQw4w9WgXcQ');
  const [difficulty, setDifficulty] = useState('beginner');
  const [duration, setDuration] = useState(30);
  const [creditReward, setCreditReward] = useState(15);
  const [savingCourse, setSavingCourse] = useState(false);

  // Add question modal
  const [questionModalCourse, setQuestionModalCourse] = useState(null);
  const [questionText, setQuestionText] = useState('');
  const [optA, setOptA] = useState('');
  const [optB, setOptB] = useState('');
  const [optC, setOptC] = useState('');
  const [optD, setOptD] = useState('');
  const [correctOpt, setCorrectOpt] = useState('a');
  const [savingQuestion, setSavingQuestion] = useState(false);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const res = await academyApi.getCourses();
      if (res.data?.success) {
        setCourses(res.data.data);
      }
    } catch (err) {
      toast.error('Failed to load courses.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  const handleCreateCourse = async (e) => {
    e.preventDefault();
    try {
      setSavingCourse(true);
      const res = await adminApi.createCourse({
        title,
        description,
        category,
        content_url: contentUrl,
        difficulty,
        duration_minutes: parseInt(duration, 10),
        credit_reward: parseInt(creditReward, 10),
        status: 'published',
      });

      if (res.data?.success) {
        toast.success('Course created and published successfully!');
        setShowAddModal(false);
        setTitle('');
        setDescription('');
        fetchCourses();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create course.');
    } finally {
      setSavingCourse(false);
    }
  };

  const handleAddQuestion = async (e) => {
    e.preventDefault();
    if (!questionModalCourse) return;

    try {
      setSavingQuestion(true);
      const res = await adminApi.addCourseQuestion(questionModalCourse.id, {
        question_text: questionText,
        option_a: optA,
        option_b: optB,
        option_c: optC || null,
        option_d: optD || null,
        correct_option: correctOpt,
      });

      if (res.data?.success) {
        toast.success('Assessment question added successfully!');
        setQuestionModalCourse(null);
        setQuestionText('');
        setOptA('');
        setOptB('');
        setOptC('');
        setOptD('');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add question.');
    } finally {
      setSavingQuestion(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Academy Course Management</h1>
          <p className="mt-1 text-sm text-slate-500">
            Author and publish technical curriculum, set video modules, and manage certification assessment quizzes.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center space-x-2 bg-eurogrip-700 hover:bg-eurogrip-800 text-white font-bold px-4 py-2.5 rounded-xl text-xs transition-colors shadow-sm self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Course</span>
        </button>
      </div>

      {/* Courses List */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12">
            <LoadingSpinner text="Retrieving training modules..." />
          </div>
        ) : courses.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">No courses published yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-6">Course Title</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4">Difficulty</th>
                  <th className="py-3.5 px-4">Duration</th>
                  <th className="py-3.5 px-4">Credit Reward</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {courses.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-4 px-6 font-bold text-slate-900">{c.title}</td>
                    <td className="py-4 px-4 text-slate-500 capitalize">{c.category?.replace('_', ' ')}</td>
                    <td className="py-4 px-4">
                      <Badge variant={c.difficulty === 'advanced' ? 'purple' : 'primary'}>{c.difficulty}</Badge>
                    </td>
                    <td className="py-4 px-4 text-slate-600">{c.duration_minutes} mins</td>
                    <td className="py-4 px-4 font-bold text-amber-600 font-mono">+{c.credit_reward} pts</td>
                    <td className="py-4 px-4">
                      <Badge variant="success">{c.status || 'published'}</Badge>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <button
                        type="button"
                        onClick={() => setQuestionModalCourse(c)}
                        className="px-2.5 py-1 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold text-[11px] inline-flex items-center space-x-1"
                      >
                        <FileQuestion className="w-3.5 h-3.5 text-eurogrip-700" />
                        <span>Add Question</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Course Modal */}
      {showAddModal && (
        <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Create Technical Module">
          <form onSubmit={handleCreateCourse} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Module Title *</label>
              <input
                type="text"
                required
                placeholder="e.g. Tubeless Tyre Valve Replacement"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Description *</label>
              <textarea
                rows={2}
                required
                placeholder="Detailed curriculum overview..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white"
                >
                  <option value="product_knowledge">Product Knowledge</option>
                  <option value="tyre_sizing">Tyre Sizing</option>
                  <option value="tyre_maintenance">Tyre Maintenance</option>
                  <option value="tyre_safety">Tyre Safety</option>
                  <option value="tyre_technology">Tyre Technology</option>
                  <option value="customer_handling">Customer Handling</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Difficulty</label>
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white"
                >
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Duration (Minutes)</label>
                <input
                  type="number"
                  min={5}
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Credit Reward (+)</label>
                <input
                  type="number"
                  min={5}
                  value={creditReward}
                  onChange={(e) => setCreditReward(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold text-amber-600"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Embed Video URL</label>
              <input
                type="text"
                placeholder="https://www.youtube.com/embed/..."
                value={contentUrl}
                onChange={(e) => setContentUrl(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-mono"
              />
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-2">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={savingCourse}
                className="bg-eurogrip-700 hover:bg-eurogrip-800 text-white font-bold px-5 py-2 rounded-xl shadow-xs disabled:opacity-50"
              >
                {savingCourse ? 'Saving...' : 'Publish Course'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Add Question Modal */}
      {questionModalCourse && (
        <Modal
          isOpen={!!questionModalCourse}
          onClose={() => setQuestionModalCourse(null)}
          title={`Add Assessment Question to ${questionModalCourse.title}`}
        >
          <form onSubmit={handleAddQuestion} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Question Text *</label>
              <textarea
                rows={2}
                required
                placeholder="e.g. What is the recommended tyre pressure for commuter motorcycles?"
                value={questionText}
                onChange={(e) => setQuestionText(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Option A *</label>
                <input
                  type="text"
                  required
                  value={optA}
                  onChange={(e) => setOptA(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Option B *</label>
                <input
                  type="text"
                  required
                  value={optB}
                  onChange={(e) => setOptB(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Option C</label>
                <input
                  type="text"
                  value={optC}
                  onChange={(e) => setOptC(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Option D</label>
                <input
                  type="text"
                  value={optD}
                  onChange={(e) => setOptD(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Correct Answer</label>
              <select
                value={correctOpt}
                onChange={(e) => setCorrectOpt(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white font-bold text-emerald-700"
              >
                <option value="a">Option A is Correct</option>
                <option value="b">Option B is Correct</option>
                <option value="c">Option C is Correct</option>
                <option value="d">Option D is Correct</option>
              </select>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-2">
              <button
                type="button"
                onClick={() => setQuestionModalCourse(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={savingQuestion}
                className="bg-eurogrip-700 hover:bg-eurogrip-800 text-white font-bold px-5 py-2 rounded-xl shadow-xs disabled:opacity-50"
              >
                {savingQuestion ? 'Adding...' : 'Save Question'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

