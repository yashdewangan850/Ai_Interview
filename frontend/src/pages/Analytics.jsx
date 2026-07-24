import { useEffect, useMemo, useState } from "react";
import { apiRequest } from "../lib/api";
import { buildDashboardInsights } from "../lib/insights";

function Analytics() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadAnalytics() {
      try {
        const data = await apiRequest("/analytics");
        setAnalytics(data.analytics);
      } catch (requestError) {
        setError(requestError.message);
      } finally {
        setLoading(false);
      }
    }

    loadAnalytics();
  }, []);

  const insights = useMemo(
    () => buildDashboardInsights(analytics, []),
    [analytics]
  );

  if (loading) {
    return <p className="muted">Loading analytics...</p>;
  }

  if (error) {
    return <p className="error-text">{error}</p>;
  }

  return (
    <div className="content-stack">
      <section className="hero hero--analytics">
        <div className="hero-panel">
          <div className="eyebrow eyebrow--accent">Analytics Console</div>
          <h1>Measure growth, identify weak areas, and plan your next round.</h1>
          <p className="hero-copy">
            This page turns interview history into a more professional major-project
            feature set with performance tracking and guided improvement.
          </p>
        </div>
        <div className="hero-side">
          <article className="spotlight-card spotlight-card--primary">
            <span className="spotlight-label">Current Streak</span>
            <strong>{insights.streakDays} day streak</strong>
            <p>{insights.completedThisWeek} interviews completed this week</p>
          </article>
        </div>
      </section>

      <section className="metrics-band">
        <article className="metric-card metric-card--featured">
          <span className="metric-label">Interviews Created</span>
          <span className="metric-value">{analytics.totals.interviewsCreated}</span>
        </article>
        <article className="metric-card">
          <span className="metric-label">Completed</span>
          <span className="metric-value">{analytics.totals.interviewsCompleted}</span>
        </article>
        <article className="metric-card">
          <span className="metric-label">Average Score</span>
          <span className="metric-value">{analytics.totals.averageScore}</span>
        </article>
        <article className="metric-card">
          <span className="metric-label">Best Score</span>
          <span className="metric-value">{analytics.totals.bestScore}</span>
        </article>
      </section>

      <div className="major-layout">
        <section className="card analytics-card">
          <div className="section-heading">
            <div>
              <span className="eyebrow eyebrow--accent">Breakdowns</span>
              <h2>Category and topic intelligence</h2>
            </div>
          </div>

          <div className="stats-list">
            {analytics.categoryBreakdown.length ? (
              analytics.categoryBreakdown.map((item) => (
                <div className="bar-row" key={item.category}>
                  <div className="bar-row__head">
                    <strong>{item.category}</strong>
                    <span>
                      {item.attempts} attempts · Avg {item.averageScore}
                    </span>
                  </div>
                  <div className="progress-bar">
                    <span style={{ width: `${item.averageScore}%` }} />
                  </div>
                </div>
              ))
            ) : (
              <p className="muted">Complete interviews to unlock category analytics.</p>
            )}
          </div>

          <div className="stats-grid">
            <article className="mini-card">
              <h3>Difficulty Mix</h3>
              <div className="stats-list">
                {Object.keys(analytics.difficultyBreakdown).length ? (
                  Object.entries(analytics.difficultyBreakdown).map(([key, value]) => (
                    <div className="stat-row" key={key}>
                      <strong>{key}</strong>
                      <span>{value} interviews</span>
                    </div>
                  ))
                ) : (
                  <p className="muted">No completed interviews yet.</p>
                )}
              </div>
            </article>

            <article className="mini-card">
              <h3>Strongest Topics</h3>
              <div className="stats-list">
                {analytics.strongestTopics.length ? (
                  analytics.strongestTopics.map((item) => (
                    <div className="stat-row" key={item.topic}>
                      <strong>{item.topic}</strong>
                      <span>
                        Avg {item.averageScore} · {item.attempts} attempts
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="muted">Topic trends will appear after submissions.</p>
                )}
              </div>
            </article>
          </div>
        </section>

        <aside className="side-column">
          <section className="card insights-card">
            <div className="section-heading">
              <div>
                <span className="eyebrow eyebrow--accent">Advanced Feature</span>
                <h2>Achievements & Practice Roadmap</h2>
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
              {insights.practicePlan.map((item) => (
                <div className="plan-step" key={item}>
                  {item}
                </div>
              ))}
            </div>
          </section>

          <section className="card">
            <div className="section-heading">
              <div>
                <span className="eyebrow eyebrow--accent">Trend Feed</span>
                <h2>Recent score signals</h2>
              </div>
            </div>
            <div className="trend-list">
              {analytics.recentScores.length ? (
                analytics.recentScores.map((item) => (
                  <div className="trend-item" key={item.id}>
                    <div>
                      <strong>{item.topic}</strong>
                      <p className="muted">{item.category}</p>
                    </div>
                    <span className="score-chip score-chip--active">
                      {item.score}/100
                    </span>
                  </div>
                ))
              ) : (
                <p className="muted">No recent scores available.</p>
              )}
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}

export default Analytics;
