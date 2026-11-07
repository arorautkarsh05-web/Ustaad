const pool = require('../../config/database');

exports.getCourses = async (req, res, next) => {
  try {
    const { category, difficulty } = req.query;
    let query = 'SELECT id, title, description, category, thumbnail_url, difficulty, duration_minutes, credit_reward, status FROM courses WHERE status = "published"';
    const params = [];
    if (category) { query += ' AND category = ?'; params.push(category); }
    if (difficulty) { query += ' AND difficulty = ?'; params.push(difficulty); }
    query += ' ORDER BY sort_order ASC, id ASC';

    const [courses] = await pool.query(query, params);

    // If user is mechanic, attach progress
    if (req.user?.role === 'mechanic') {
      const [profiles] = await pool.query('SELECT id FROM mechanic_profiles WHERE user_id = ?', [req.user.id]);
      if (profiles.length) {
        const [progress] = await pool.query('SELECT * FROM course_progress WHERE mechanic_id = ?', [profiles[0].id]);
        const progressMap = {};
        progress.forEach(p => { progressMap[p.course_id] = p; });
        courses.forEach(c => { c.progress = progressMap[c.id] || null; });
      }
    }

    res.json({ success: true, data: courses });
  } catch (error) { next(error); }
};

exports.getCourse = async (req, res, next) => {
  try {
    const [courses] = await pool.query('SELECT * FROM courses WHERE id = ?', [req.params.id]);
    if (!courses.length) return res.status(404).json({ success: false, message: 'Course not found' });

    // Do NOT return correct_option in questions for security (prevents cheating)
    const [questions] = await pool.query(
      'SELECT id, course_id, question_text, option_a, option_b, option_c, option_d, sort_order FROM course_questions WHERE course_id = ? ORDER BY sort_order ASC',
      [req.params.id]
    );

    courses[0].questions = questions;

    if (req.user?.role === 'mechanic') {
      const [profiles] = await pool.query('SELECT id FROM mechanic_profiles WHERE user_id = ?', [req.user.id]);
      if (profiles.length) {
        const [progress] = await pool.query('SELECT * FROM course_progress WHERE mechanic_id = ? AND course_id = ?', [profiles[0].id, req.params.id]);
        courses[0].progress = progress[0] || null;
      }
    }

    res.json({ success: true, data: courses[0] });
  } catch (error) { next(error); }
};

exports.enrolCourse = async (req, res, next) => {
  try {
    const [profiles] = await pool.query('SELECT id FROM mechanic_profiles WHERE user_id = ?', [req.user.id]);
    if (!profiles.length) return res.status(404).json({ success: false, message: 'Complete your profile first' });
    
    const mechanicId = profiles[0].id;
    const courseId = req.params.id;
    
    const [existing] = await pool.query('SELECT id FROM course_progress WHERE mechanic_id = ? AND course_id = ?', [mechanicId, courseId]);
    if (existing.length) return res.json({ success: true, message: 'Already enrolled', data: existing[0] });

    await pool.query(
      'INSERT INTO course_progress (mechanic_id, course_id, completion_status) VALUES (?, ?, "in_progress")',
      [mechanicId, courseId]
    );

    await pool.query('INSERT INTO mechanic_activities (mechanic_id, activity_type, description) VALUES (?, ?, ?)',
      [mechanicId, 'course_enrolled', `Enrolled in course ${courseId}`]);

    res.status(201).json({ success: true, message: 'Successfully enrolled in course' });
  } catch (error) { next(error); }
};

/**
 * Submits course assessment quiz and awards credits safely using ACID transaction.
 * Prevents concurrent duplicate credit awards via row locks and idempotency checks.
 */
exports.submitAssessment = async (req, res, next) => {
  const connection = await pool.getConnection();
  try {
    const [profiles] = await connection.query('SELECT * FROM mechanic_profiles WHERE user_id = ?', [req.user.id]);
    if (!profiles.length) {
      connection.release();
      return res.status(404).json({ success: false, message: 'Profile not found' });
    }
    
    const mechanic = profiles[0];
    const courseId = req.params.id;
    const { answers } = req.body;

    const [questions] = await connection.query('SELECT * FROM course_questions WHERE course_id = ?', [courseId]);
    if (!questions.length) {
      connection.release();
      return res.status(404).json({ success: false, message: 'No questions found for this course' });
    }

    let correct = 0;
    let answersMap = answers || {};
    if (Array.isArray(answers)) {
      answersMap = {};
      answers.forEach(a => { answersMap[a.question_id || a.questionId] = a.selected_option || a.selectedOption; });
    }

    questions.forEach(q => {
      if (answersMap[q.id] === q.correct_option) correct++;
    });

    const score = (correct / questions.length) * 100;
    const passed = score >= 60;
    const status = passed ? 'completed' : 'failed';

    await connection.beginTransaction();

    // Lock progress row FOR UPDATE to prevent race conditions during credit award
    const [progress] = await connection.query(
      'SELECT * FROM course_progress WHERE mechanic_id = ? AND course_id = ? FOR UPDATE',
      [mechanic.id, courseId]
    );
    
    let previouslyAwarded = false;

    if (progress.length) {
      previouslyAwarded = Boolean(progress[0].credits_awarded);
      await connection.query(
        'UPDATE course_progress SET completion_status=?, assessment_score=?, attempts=attempts+1, completed_at=? WHERE id=?',
        [status, score, passed ? new Date() : null, progress[0].id]
      );
    } else {
      await connection.query(
        'INSERT INTO course_progress (mechanic_id, course_id, completion_status, assessment_score, attempts, completed_at) VALUES (?,?,?,?,1,?)',
        [mechanic.id, courseId, status, score, passed ? new Date() : null]
      );
    }

    // Award credits strictly if passed and never awarded before
    if (passed && !previouslyAwarded) {
      // Check credit_transactions idempotency
      const activityRef = `COURSE-${courseId}`;
      const [existingCredit] = await connection.query(
        'SELECT id FROM credit_transactions WHERE mechanic_id = ? AND activity_type = "course_completion" AND activity_reference = ?',
        [mechanic.id, activityRef]
      );

      if (!existingCredit.length) {
        const [course] = await connection.query('SELECT credit_reward FROM courses WHERE id = ?', [courseId]);
        const reward = course[0]?.credit_reward || 15;
        const newBalance = mechanic.total_credits + reward;
        
        await connection.query(
          'INSERT INTO credit_transactions (mechanic_id, transaction_type, credit_amount, balance_after, activity_type, activity_reference, description) VALUES (?,?,?,?,?,?,?)',
          [mechanic.id, 'earned', reward, newBalance, 'course_completion', activityRef, `Completed course assessment: ${courseId}`]
        );
        await connection.query('UPDATE mechanic_profiles SET total_credits = ? WHERE id = ?', [newBalance, mechanic.id]);
        await connection.query('UPDATE course_progress SET credits_awarded = 1 WHERE mechanic_id = ? AND course_id = ?', [mechanic.id, courseId]);

        // Update level
        if (newBalance >= 300) await connection.query('UPDATE mechanic_profiles SET level = "champion" WHERE id = ?', [mechanic.id]);
        else if (newBalance >= 100) await connection.query('UPDATE mechanic_profiles SET level = "professional" WHERE id = ?', [mechanic.id]);

        // Award badges
        const [completedCount] = await connection.query(
          'SELECT COUNT(*) as cnt FROM course_progress WHERE mechanic_id = ? AND completion_status = "completed"',
          [mechanic.id]
        );
        if (completedCount[0].cnt === 1) {
          const [firstBadge] = await connection.query('SELECT id FROM achievement_badges WHERE badge_name = ?', ['First Steps']);
          if (firstBadge.length) {
            await connection.query('INSERT IGNORE INTO mechanic_badges (mechanic_id, badge_id) VALUES (?, ?)', [mechanic.id, firstBadge[0].id]);
          }
        }
        if (completedCount[0].cnt >= 5) {
          const [expertBadge] = await connection.query('SELECT id FROM achievement_badges WHERE badge_name = ?', ['Tyre Expert']);
          if (expertBadge.length) {
            await connection.query('INSERT IGNORE INTO mechanic_badges (mechanic_id, badge_id) VALUES (?, ?)', [mechanic.id, expertBadge[0].id]);
          }
        }
      }
    }

    await connection.commit();
    connection.release();

    res.json({
      success: true,
      message: passed ? 'Congratulations! Assessment passed.' : 'Assessment failed. Please try again.',
      data: { score: Math.round(score), correct, total: questions.length, passed, status },
    });
  } catch (error) {
    await connection.rollback();
    connection.release();
    next(error);
  }
};

exports.getProgress = async (req, res, next) => {
  try {
    const [profiles] = await pool.query('SELECT id FROM mechanic_profiles WHERE user_id = ?', [req.user.id]);
    if (!profiles.length) return res.status(404).json({ success: false, message: 'Profile not found' });

    const [progress] = await pool.query(`
      SELECT cp.*, c.title, c.category, c.difficulty, c.credit_reward
      FROM course_progress cp
      JOIN courses c ON cp.course_id = c.id
      WHERE cp.mechanic_id = ?
      ORDER BY cp.enrollment_date DESC
    `, [profiles[0].id]);

    res.json({ success: true, data: progress });
  } catch (error) { next(error); }
};
