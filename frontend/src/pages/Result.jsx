import { useEffect, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import SpeakButton from "../components/SpeakButton";
import { apiRequest } from "../lib/api";
import { downloadInterviewPdf } from "../lib/report";

function Result() {
  const { id } = useParams();
  const location = useLocation();

  const [interview, setInterview] = useState(
    location.state?.interview || null
  );

  const [loading, setLoading] = useState(
    !location.state?.interview
  );

  const [error, setError] = useState("");

  useEffect(() => {
    async function loadInterview() {
      if (interview) {
        return;
      }

      try {
        const data = await apiRequest(`/interviews/${id}`);
        setInterview(data.interview);
      } catch (requestError) {
        setError(requestError.message);
      } finally {
        setLoading(false);
      }
    }

    loadInterview();
  }, [id, interview]);

  if (loading) {
    return (
      <div className="result-loading">
        <div className="result-loader"></div>
        <p>Loading your interview result...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card result-error">
        <span>⚠️</span>
        <p>{error}</p>
      </div>
    );
  }

  if (!interview?.evaluation) {
    return (
      <div className="card result-empty result-card-animated">
        <div className="empty-result-icon">📝</div>

        <h2>Interview not submitted</h2>

        <p className="muted">
          This interview has not been submitted yet.
        </p>

        <Link
          className="primary-button"
          to={`/interview/${id}`}
        >
          Continue Interview →
        </Link>
      </div>
    );
  }

  const { evaluation } = interview;

  const generationWarning =
    interview.metadata?.generation?.warning;

  const evaluationWarning =
    evaluation.meta?.warning;

  const isEstimatedScore =
    evaluation.meta?.source === "fallback";

  const score = Number(evaluation.score || 0);

  return (
    <div className="content-stack result-page-animated">

      {/* =========================================
          RESULT HERO
      ========================================= */}

      <section className="card result-hero result-hero-animated">

        <div className="result-title">
          <span className="eyebrow">Interview Result</span>

          <h1>{interview.topic}</h1>

          <p className="muted">
            Category: {interview.category} · Difficulty:{" "}
            {interview.difficulty} ·{" "}
            {interview.questionCount} questions ·{" "}
            {interview.timerMinutes} min timer
          </p>
        </div>

        {/* SCORE */}
        <div className="score-panel score-panel-animated">
          <div className="score-ring">
            <span className="score-value">
              {score}
            </span>

            <span className="score-label">
              {isEstimatedScore
                ? "estimated"
                : "out of 100"}
            </span>
          </div>
        </div>
      </section>

      {/* =========================================
          WARNINGS
      ========================================= */}

      {(generationWarning || evaluationWarning) && (
        <section className="card warning-card result-warning">
          {generationWarning && (
            <p className="warning-text">
              ⚠️ {generationWarning}
            </p>
          )}

          {evaluationWarning && (
            <p className="warning-text">
              ⚠️ {evaluationWarning}
            </p>
          )}
        </section>
      )}

      {/* =========================================
          FEEDBACK GRID
      ========================================= */}

      <section className="result-grid">

        {/* FEEDBACK */}
        <article className="card result-info-card result-card-animated">
          <div className="result-card-icon">💬</div>

          <h2>Feedback</h2>

          <p className="feedback-copy">
            {evaluation.feedback}
          </p>

          <div className="panel-actions">
            <SpeakButton
              text={evaluation.feedback}
              label="Read Feedback"
              compact
            />
          </div>
        </article>

        {/* STRENGTHS */}
        <article className="card result-info-card result-card-animated">
          <div className="result-card-icon">💪</div>

          <h2>Strengths</h2>

          <ul className="result-list">
            {evaluation.strengths.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </article>

        {/* WEAKNESSES */}
        <article className="card result-info-card result-card-animated">
          <div className="result-card-icon">🎯</div>

          <h2>Weaknesses</h2>

          <ul className="result-list">
            {evaluation.weaknesses.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </article>

        {/* SUGGESTIONS */}
        <article className="card result-info-card result-card-animated">
          <div className="result-card-icon">🚀</div>

          <h2>Suggestions</h2>

          <ul className="result-list">
            {evaluation.suggestions.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </article>

      </section>

      {/* =========================================
          ANSWER REVIEW
      ========================================= */}

      <section className="card answer-review-card result-card-animated">

        <div className="section-header">

          <div>
            <span className="eyebrow">
              Answer Review
            </span>

            <h2>
              Questions and responses
            </h2>
          </div>

          <div className="result-actions">

            <button
              className="primary-button result-action-button"
              type="button"
              onClick={() =>
                downloadInterviewPdf(interview)
              }
            >
              📄 Download PDF
            </button>

            <Link
              className="secondary-button result-action-button"
              to="/"
            >
              Start Another
            </Link>

          </div>
        </div>

        {/* QUESTIONS */}
        <div className="review-list">

          {interview.questions.map(
            (question, index) => (

              <article
                className="review-item review-item-animated"
                key={question}
              >

                {/* QUESTION */}
                <div className="review-head">

                  <div className="question-number">
                    Q{index + 1}
                  </div>

                  <h3>{question}</h3>

                  <SpeakButton
                    text={`Question ${
                      index + 1
                    }. ${question}`}
                    label="Read Question"
                    compact
                  />

                </div>

                {/* USER ANSWER */}
                <div className="answer-panel result-answer-panel">

                  <div className="answer-panel-heading">
                    <span className="answer-label">
                      Your answer
                    </span>

                    <span className="answer-status">
                      ✓ Submitted
                    </span>
                  </div>

                  <p>
                    {interview.answers[index] ||
                      "No answer provided."}
                  </p>

                  <div className="panel-actions">
                    <SpeakButton
                      text={
                        interview.answers[index] ||
                        "No answer provided."
                      }
                      label="Read Your Answer"
                      compact
                    />
                  </div>

                </div>

                {/* AI REFERENCE */}
                <div className="answer-panel answer-panel--reference result-reference-panel">

                  <div className="answer-panel-heading">
                    <span className="answer-label">
                      AI reference answer
                    </span>

                    <span className="ai-label">
                      ✨ AI
                    </span>
                  </div>

                  <p>
                    {evaluation.referenceAnswers?.[
                      index
                    ] ||
                      "No reference answer available."}
                  </p>

                  <div className="panel-actions">
                    <SpeakButton
                      text={
                        evaluation.referenceAnswers?.[
                          index
                        ] ||
                        "No reference answer available."
                      }
                      label="Read Reference"
                      compact
                    />
                  </div>

                </div>

              </article>
            )
          )}

        </div>
      </section>
    </div>
  );
}

export default Result;