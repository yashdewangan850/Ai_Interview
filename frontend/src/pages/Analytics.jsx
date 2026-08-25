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
    return (
      <div className="analytics-loading">
        <div className="analytics-loader" />
        <p>Loading analytics...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card analytics-error">
        <span>⚠️</span>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="content-stack analytics-page">

      {/* ================================
          HERO
      ================================= */}

      <section className="hero hero--analytics analytics-hero">
        <div className="hero-panel">

          <div className="eyebrow eyebrow--accent analytics-eyebrow">
            Analytics Console
          </div>

          <h1>
            Measure growth, identify weak areas,
            and plan your next round.
          </h1>

          <p className="hero-copy">
            This page turns interview history into a
            more professional major-project feature set
            with performance tracking and guided improvement.
          </p>

        </div>

        <div className="hero-side">

          <article className="spotlight-card spotlight-card--primary analytics-spotlight">

            <span className="spotlight-label">
              Current Streak
            </span>

            <strong>
              {insights.streakDays} day streak
            </strong>

            <p>
              {insights.completedThisWeek} interviews
              completed this week
            </p>

          </article>

        </div>
      </section>


      {/* ================================
          METRICS
      ================================= */}

      <section className="metrics-band analytics-metrics">

        <article className="metric-card metric-card--featured analytics-metric">
          <span className="metric-label">
            Interviews Created
          </span>

          <span className="metric-value">
            {analytics.totals.interviewsCreated}
          </span>
        </article>

        <article className="metric-card analytics-metric">
          <span className="metric-label">
            Completed
          </span>

          <span className="metric-value">
            {analytics.totals.interviewsCompleted}
          </span>
        </article>

        <article className="metric-card analytics-metric">
          <span className="metric-label">
            Average Score
          </span>

          <span className="metric-value">
            {analytics.totals.averageScore}
          </span>
        </article>

        <article className="metric-card analytics-metric">
          <span className="metric-label">
            Best Score
          </span>

          <span className="metric-value">
            {analytics.totals.bestScore}
          </span>
        </article>

      </section>


      {/* ================================
          MAIN LAYOUT
      ================================= */}

      <div className="major-layout analytics-layout">

        {/* LEFT COLUMN */}

        <section className="card analytics-card analytics-main-card">

          <div className="section-heading analytics-section-heading">
            <div>
              <span className="eyebrow eyebrow--accent">
                Breakdowns
              </span>

              <h2>
                Category and topic intelligence
              </h2>
            </div>
          </div>


          {/* CATEGORY */}

          <div className="stats-list analytics-stats">

            {analytics.categoryBreakdown.length ? (
              analytics.categoryBreakdown.map((item, index) => (
                <div
                  className="bar-row analytics-bar-row"
                  key={item.category}
                  style={{
                    "--analytics-delay": `${index * 100}ms`,
                  }}
                >

                  <div className="bar-row__head">
                    <strong>{item.category}</strong>

                    <span>
                      {item.attempts} attempts · Avg{" "}
                      {item.averageScore}
                    </span>
                  </div>

                  <div className="progress-bar analytics-progress">
                    <span
                      style={{
                        width: `${item.averageScore}%`,
                      }}
                    />
                  </div>

                </div>
              ))
            ) : (
              <p className="muted">
                Complete interviews to unlock category analytics.
              </p>
            )}

          </div>


          {/* DIFFICULTY + TOPICS */}

          <div className="stats-grid analytics-stats-grid">

            <article className="mini-card analytics-mini-card">

              <h3>Difficulty Mix</h3>

              <div className="stats-list">

                {Object.keys(
                  analytics.difficultyBreakdown
                ).length ? (

                  Object.entries(
                    analytics.difficultyBreakdown
                  ).map(([key, value], index) => (

                    <div
                      className="stat-row analytics-stat-row"
                      key={key}
                      style={{
                        "--analytics-delay": `${index * 80}ms`,
                      }}
                    >
                      <strong>{key}</strong>
                      <span>{value} interviews</span>
                    </div>

                  ))

                ) : (
                  <p className="muted">
                    No completed interviews yet.
                  </p>
                )}

              </div>

            </article>


            <article className="mini-card analytics-mini-card">

              <h3>Strongest Topics</h3>

              <div className="stats-list">

                {analytics.strongestTopics.length ? (

                  analytics.strongestTopics.map(
                    (item, index) => (

                      <div
                        className="stat-row analytics-stat-row"
                        key={item.topic}
                        style={{
                          "--analytics-delay": `${index * 100}ms`,
                        }}
                      >

                        <strong>{item.topic}</strong>

                        <span>
                          Avg {item.averageScore} ·{" "}
                          {item.attempts} attempts
                        </span>

                      </div>

                    )
                  )

                ) : (
                  <p className="muted">
                    Topic trends will appear after submissions.
                  </p>
                )}

              </div>

            </article>

          </div>

        </section>


        {/* RIGHT COLUMN */}

        <aside className="side-column">

          {/* ACHIEVEMENTS */}

          <section className="card insights-card analytics-side-card">

            <div className="section-heading">

              <div>
                <span className="eyebrow eyebrow--accent">
                  Advanced Feature
                </span>

                <h2>
                  Achievements & Practice Roadmap
                </h2>
              </div>

            </div>


            <div className="achievement-grid">

              {insights.achievements.map(
                (item, index) => (

                  <article
                    className={`achievement-card analytics-achievement ${
                      item.unlocked
                        ? "achievement-card--active"
                        : ""
                    }`}
                    key={item.title}
                    style={{
                      "--analytics-delay": `${index * 100}ms`,
                    }}
                  >

                    <span>{item.title}</span>

                    <strong>{item.value}</strong>

                  </article>

                )
              )}

            </div>


            <div className="practice-plan">

              {insights.practicePlan.map(
                (item, index) => (

                  <div
                    className="plan-step analytics-plan-step"
                    key={item}
                    style={{
                      "--analytics-delay": `${index * 100}ms`,
                    }}
                  >
                    <span className="plan-number">
                      {index + 1}
                    </span>

                    {item}
                  </div>

                )
              )}

            </div>

          </section>


          {/* TREND FEED */}

          <section className="card analytics-trend-card">

            <div className="section-heading">

              <div>
                <span className="eyebrow eyebrow--accent">
                  Trend Feed
                </span>

                <h2>
                  Recent score signals
                </h2>
              </div>

            </div>


            <div className="trend-list">

              {analytics.recentScores.length ? (

                analytics.recentScores.map(
                  (item, index) => (

                    <div
                      className="trend-item analytics-trend-item"
                      key={item.id}
                      style={{
                        "--analytics-delay": `${index * 100}ms`,
                      }}
                    >

                      <div>
                        <strong>{item.topic}</strong>

                        <p className="muted">
                          {item.category}
                        </p>
                      </div>

                      <span className="score-chip score-chip--active">
                        {item.score}/100
                      </span>

                    </div>

                  )
                )

              ) : (
                <p className="muted">
                  No recent scores available.
                </p>
              )}

            </div>

          </section>

        </aside>

      </div>
    </div>
  );
}

export default Analytics;