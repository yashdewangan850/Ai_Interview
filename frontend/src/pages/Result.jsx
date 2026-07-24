import { useEffect, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import SpeakButton from "../components/SpeakButton";
import { apiRequest } from "../lib/api";
import { downloadInterviewPdf } from "../lib/report";

function Result() {
  const { id } = useParams();
  const location = useLocation();
  const [interview, setInterview] = useState(location.state?.interview || null);
  const [loading, setLoading] = useState(!location.state?.interview);
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
    return <p className="muted">Loading result...</p>;
  }

  if (error) {
    return <p className="error-text">{error}</p>;
  }

  if (!interview?.evaluation) {
    return (
      <div className="card">
        <p className="muted">This interview has not been submitted yet.</p>
        <Link className="primary-button" to={`/interview/${id}`}>
          Continue Interview
        </Link>
      </div>
    );
  }

  const { evaluation } = interview;
  const generationWarning = interview.metadata?.generation?.warning;
  const evaluationWarning = evaluation.meta?.warning;
  const isEstimatedScore = evaluation.meta?.source === "fallback";

  return (
    <div className="content-stack">
      <section className="card result-hero">
        <div>
          <span className="eyebrow">Interview Result</span>
          <h1>{interview.topic}</h1>
          <p className="muted">
            Category: {interview.category} · Difficulty: {interview.difficulty} ·{" "}
            {interview.questionCount} questions · {interview.timerMinutes} min timer
          </p>
        </div>
        <div className="score-panel">
          <span className="score-value">{evaluation.score}</span>
          <span className="score-label">
            {isEstimatedScore ? "estimated score" : "out of 100"}
          </span>
        </div>
      </section>

      {(generationWarning || evaluationWarning) && (
        <section className="card warning-card">
          {generationWarning && <p className="warning-text">{generationWarning}</p>}
          {evaluationWarning && <p className="warning-text">{evaluationWarning}</p>}
        </section>
      )}

      <section className="result-grid">
        <article className="card">
          <h2>Feedback</h2>
          <p className="feedback-copy">{evaluation.feedback}</p>
          <div className="panel-actions">
            <SpeakButton text={evaluation.feedback} label="Read Feedback" compact />
          </div>
        </article>

        <article className="card">
          <h2>Strengths</h2>
          <ul className="result-list">
            {evaluation.strengths.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </article>

        <article className="card">
          <h2>Weaknesses</h2>
          <ul className="result-list">
            {evaluation.weaknesses.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </article>

        <article className="card">
          <h2>Suggestions</h2>
          <ul className="result-list">
            {evaluation.suggestions.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </article>
      </section>

      <section className="card">
        <div className="section-header">
          <div>
            <span className="eyebrow">Answer Review</span>
            <h2>Questions and responses</h2>
          </div>
          <div className="result-actions">
            <button
              className="primary-button"
              type="button"
              onClick={() => downloadInterviewPdf(interview)}
            >
              Download PDF
            </button>
            <Link className="secondary-button" to="/">
              Start Another
            </Link>
          </div>
        </div>

        <div className="review-list">
          {interview.questions.map((question, index) => (
            <article className="review-item" key={question}>
              <div className="review-head">
                <h3>
                  Q{index + 1}. {question}
                </h3>
                <SpeakButton
                  text={`Question ${index + 1}. ${question}`}
                  label="Read Question"
                  compact
                />
              </div>
              <div className="answer-panel">
                <span className="answer-label">Your answer</span>
                <p>{interview.answers[index] || "No answer provided."}</p>
                <div className="panel-actions">
                  <SpeakButton
                    text={interview.answers[index] || "No answer provided."}
                    label="Read Your Answer"
                    compact
                  />
                </div>
              </div>
              <div className="answer-panel answer-panel--reference">
                <span className="answer-label">AI reference answer</span>
                <p>
                  {evaluation.referenceAnswers?.[index] ||
                    "No reference answer available."}
                </p>
                <div className="panel-actions">
                  <SpeakButton
                    text={
                      evaluation.referenceAnswers?.[index] ||
                      "No reference answer available."
                    }
                    label="Read Reference"
                    compact
                  />
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

export default Result;
