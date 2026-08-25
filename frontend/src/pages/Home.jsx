import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { apiRequest } from "../lib/api";
import { buildDashboardInsights } from "../lib/insights";

const INITIAL_FORM = {
  topic: "",
  category: "technical",
  difficulty: "medium",
  questionCount: 5,
  timerMinutes: 15,
};

function Home() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [form, setForm] = useState(INITIAL_FORM);
  const [recentInterviews, setRecentInterviews] = useState([]);
  const [dailyQuiz, setDailyQuiz] = useState(null);
  const [dailyQuizAttempts, setDailyQuizAttempts] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [dashboardLoading, setDashboardLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadDashboard() {
      try {
        const [
          interviewsData,
          analyticsData,
          dailyQuizData,
          dailyQuizHistory,
        ] = await Promise.all([
          apiRequest("/interviews?limit=8"),
          apiRequest("/analytics"),
          apiRequest("/daily-quiz/today"),
          apiRequest("/daily-quiz/attempts?limit=4"),
        ]);
        setRecentInterviews(interviewsData.interviews || []);
        setAnalytics(analyticsData.analytics || null);
        setDailyQuiz(dailyQuizData.quiz ? dailyQuizData : null);
        setDailyQuizAttempts(dailyQuizHistory.attempts || []);
      } catch (requestError) {
        setError(requestError.message);
      } finally {
        setDashboardLoading(false);
      }
    }

    loadDashboard();
  }, []);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const data = await apiRequest("/generate-interview", {
        method: "POST",
        body: JSON.stringify({
          topic: form.topic,
          category: form.category,
          difficulty: form.difficulty,
          questionCount: Number(form.questionCount),
          timerMinutes: Number(form.timerMinutes),
        }),
      });

      navigate(`/interview/${data.interview.id}`);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }

  function updateField(field, value) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function applyRecommendation(recommendation) {
    setForm((current) => ({
      ...current,
      ...recommendation,
    }));
  }

  async function handleDeleteInterview(interviewId) {
    const shouldDelete = window.confirm(
      "Delete this interview session from your dashboard?"
    );

    if (!shouldDelete) {
      return;
    }

    try {
      setError("");
      await apiRequest(`/interviews/${interviewId}`, {
        method: "DELETE",
      });

      setRecentInterviews((current) =>
        current.filter((interview) => interview.id !== interviewId)
      );
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  const insights = useMemo(
    () => buildDashboardInsights(analytics, recentInterviews),
    [analytics, recentInterviews]
  );

  return (
    <div className="dashboard-stack home-animated">
      <section className="hero hero--command home-hero">
        <div className="hero-panel">
          <div className="eyebrow eyebrow--accent">Professional Interview Lab</div>
          <h1>
            Build interview confidence with a cleaner, smarter student platform.
          </h1>
          <p className="hero-copy">
            Generate targeted practice rounds, track readiness in one place, and
            use AI-powered feedback with a more polished major-project workflow.
          </p>
          <div className="hero-actions">
            <Link className="primary-button" to="/analytics">
              Open Analytics
            </Link>
            <Link className="secondary-button" to="/daily-quiz">
              Open Daily Quiz
            </Link>
            <button
              className="secondary-button"
              type="button"
              onClick={() => applyRecommendation(insights.recommendation)}
            >
              Use Smart Recommendation
            </button>
          </div>
        </div>

        <div className="hero-side">
          <article className="spotlight-card spotlight-card--primary">
            <span className="spotlight-label">Current Streak</span>
            <strong>{insights.streakDays} day streak</strong>
            <p>{insights.completedThisWeek} completed interviews in the last 7 days</p>
          </article>
          <article className="spotlight-card">
            <span className="spotlight-label">Student</span>
            <strong>{user?.name || "Student"}</strong>
            <p>{analytics?.totals?.interviewsCompleted ?? 0} completed sessions</p>
          </article>
        </div>
      </section>

      <section className="metrics-band home-metrics">
        <article className="metric-card metric-card--featured">
          <span className="metric-label">Average Score</span>
          <span className="metric-value">{analytics?.totals?.averageScore ?? 0}</span>
        </article>
        <article className="metric-card">
          <span className="metric-label">Best Score</span>
          <span className="metric-value">{analytics?.totals?.bestScore ?? 0}</span>
        </article>
        <article className="metric-card">
          <span className="metric-label">Completed</span>
          <span className="metric-value">
            {analytics?.totals?.interviewsCompleted ?? 0}
          </span>
        </article>
        <article className="metric-card">
          <span className="metric-label">Strongest Topic</span>
          <span className="metric-value metric-value--small">
            {insights.strongestTopic}
          </span>
        </article>
      </section>

      <div className="major-layout">
        <section className="card form-card home-card">
          <div className="section-heading">
            <div>
              <span className="eyebrow eyebrow--accent">Launch Interview</span>
              <h2>Create a professional practice session</h2>
            </div>
            <div className="section-badge">
              <span>Recommended:</span>
              <strong>{insights.recommendation.category}</strong>
            </div>
          </div>

          <form className="form-grid" onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="field-label" htmlFor="topic">
                Interview topic
              </label>
              <input
                id="topic"
                className="text-input"
                type="text"
                value={form.topic}
                onChange={(event) => updateField("topic", event.target.value)}
                placeholder="React performance, DBMS indexing, Operating Systems..."
                required
              />
            </div>

            <div className="form-row form-row--triple">
              <div className="form-group">
                <label className="field-label" htmlFor="category">
                  Category
                </label>
                <select
                  id="category"
                  className="text-input"
                  value={form.category}
                  onChange={(event) => updateField("category", event.target.value)}
                >
                  <option value="technical">Technical</option>
                  <option value="subject">Subject</option>
                  <option value="behavioral">Behavioral</option>
                  <option value="hr">HR</option>
                  <option value="system-design">System Design</option>
                </select>
              </div>

              <div className="form-group">
                <label className="field-label" htmlFor="difficulty">
                  Difficulty
                </label>
                <select
                  id="difficulty"
                  className="text-input"
                  value={form.difficulty}
                  onChange={(event) =>
                    updateField("difficulty", event.target.value)
                  }
                >
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>

              <div className="form-group">
                <label className="field-label" htmlFor="questionCount">
                  Questions
                </label>
                <input
                  id="questionCount"
                  className="text-input"
                  type="number"
                  min="1"
                  max="30"
                  value={form.questionCount}
                  onChange={(event) =>
                    updateField("questionCount", event.target.value)
                  }
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="field-label" htmlFor="timerMinutes">
                  Session timer
                </label>
                <select
                  id="timerMinutes"
                  className="text-input"
                  value={form.timerMinutes}
                  onChange={(event) => updateField("timerMinutes", event.target.value)}
                >
                  <option value="10">10 minutes</option>
                  <option value="15">15 minutes</option>
                  <option value="20">20 minutes</option>
                  <option value="30">30 minutes</option>
                  <option value="45">45 minutes</option>
                  <option value="60">60 minutes</option>
                </select>
              </div>
              <div className="form-group">
                <label className="field-label" htmlFor="readiness">
                  Active streak
                </label>
                <input
                  id="readiness"
                  className="text-input"
                  type="text"
                  value={`${insights.streakDays} day streak`}
                  disabled
                />
              </div>
            </div>

            {error && <p className="error-text">{error}</p>}

            <div className="button-row">
              <button className="primary-button" type="submit" disabled={loading}>
                {loading ? "Generating..." : "Start Interview"}
              </button>
              <button
                className="secondary-button"
                type="button"
                onClick={() => applyRecommendation(insights.recommendation)}
              >
                Fill Recommended Setup
              </button>
            </div>
          </form>
        </section>

        <aside className="side-column">
          <section className="card insights-card home-card">
            <div className="section-heading">
              <div>
                <span className="eyebrow eyebrow--accent">Advanced Feature</span>
                <h2>Practice Streak & Milestones</h2>
              </div>
            </div>
            <div className="insight-list">
              <div className="insight-row">
                <span>Current Streak</span>
                <strong>{insights.streakDays} day(s)</strong>
              </div>
              <div className="insight-row">
                <span>Completed This Week</span>
                <strong>{insights.completedThisWeek}</strong>
              </div>
              <div className="insight-row">
                <span>Focus Area</span>
                <strong>{insights.weakestCategory}</strong>
              </div>
            </div>

            <div className="achievement-grid">
              {insights.achievements.map((item) => (
                <article
                  className={`achievement-card ${
                    item.unlocked ? "achievement-card--active" : ""
                  }`}
                  key={item.title}
                >
                  <span>{item.title}</span>
                  <strong>{item.value}</strong>
                </article>
              ))}
            </div>

            <div className="practice-plan">
              <h3>Suggested Next Steps</h3>
              {insights.practicePlan.map((item) => (
                <div className="plan-step" key={item}>
                  {item}
                </div>
              ))}
            </div>
          </section>

          <section className="card dashboard-card dashboard-card--elevated home-card">
            <div className="section-heading">
              <div>
                <span className="eyebrow eyebrow--accent">Daily Quiz</span>
                <h2>Today's 5-question challenge</h2>
              </div>
              <Link className="secondary-button" to="/daily-quiz">
                {dailyQuiz?.attempt ? "View Attempt" : "Start Quiz"}
              </Link>
            </div>

            <div className="insight-list">
              <div className="insight-row">
                <span>Status</span>
                <strong>
                  {dailyQuiz?.attempt ? "Completed today" : "Waiting for attempt"}
                </strong>
              </div>
              <div className="insight-row">
                <span>Today's Score</span>
                <strong>
                  {dailyQuiz?.attempt ? `${dailyQuiz.attempt.score}/100` : "Not attempted"}
                </strong>
              </div>
              <div className="insight-row">
                <span>Questions</span>
                <strong>{dailyQuiz?.quiz?.questionCount || 5}</strong>
              </div>
            </div>

            <div className="practice-plan">
              {dailyQuizAttempts.length ? (
                dailyQuizAttempts.map((item) => (
                  <div className="plan-step" key={item.id}>
                    {item.quizDate}: {item.score}/100 with {item.correctCount}/5 correct
                  </div>
                ))
              ) : (
                <div className="plan-step">
                  Attempt the daily quiz to start building quiz history in your dashboard.
                </div>
              )}
            </div>
          </section>

          <section className="card dashboard-card dashboard-card--elevated">
            <div className="section-heading">
              <div>
                <span className="eyebrow eyebrow--accent">Recent Sessions</span>
                <h2>Personal interview history</h2>
              </div>
            </div>

            {dashboardLoading ? (
              <p className="muted">Loading dashboard...</p>
            ) : recentInterviews.length === 0 ? (
              <p className="muted">
                No interviews yet. Launch your first session to see your score
                history and readiness suggestions.
              </p>
            ) : (
              <div className="dashboard-list">
                {recentInterviews.map((interview) => (
                  <article className="session-card" key={interview.id}>
                    <div className="session-card__top">
                      <div>
                        <h3>{interview.topic}</h3>
                        <p className="muted">
                          {interview.category} · {interview.difficulty}
                        </p>
                      </div>
                      <span
                        className={`score-chip ${
                          interview.evaluation ? "score-chip--active" : ""
                        }`}
                      >
                        {interview.evaluation
                          ? `${interview.evaluation.score}/100`
                          : "Pending"}
                      </span>
                    </div>
                    <div className="session-meta">
                      <span>{interview.questionCount} questions</span>
                      <span>{interview.timerMinutes} min</span>
                    </div>
                    <div className="session-actions">
                      <Link
                        className="secondary-button"
                        to={
                          interview.status === "completed"
                            ? `/result/${interview.id}`
                            : `/interview/${interview.id}`
                        }
                      >
                        {interview.status === "completed" ? "View Result" : "Resume"}
                      </Link>
                      <button
                        className="danger-button"
                        type="button"
                        onClick={() => handleDeleteInterview(interview.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </aside>
      </div>
    </div>
  );
}

export default Home;
