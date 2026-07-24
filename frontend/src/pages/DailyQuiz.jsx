import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { apiRequest } from "../lib/api";

function formatQuizDate(value) {
  if (!value) {
    return "Today";
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(`${value}T00:00:00`));
}

function DailyQuiz() {
  const [quiz, setQuiz] = useState(null);
  const [attempt, setAttempt] = useState(null);
  const [answers, setAnswers] = useState(Array(5).fill(null));
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadQuiz() {
      try {
        const data = await apiRequest("/daily-quiz/today");
        setQuiz(data.quiz);
        setAttempt(data.attempt || null);
        setAnswers(
          data.attempt?.answers?.length
            ? data.attempt.answers
            : Array(data.quiz?.questionCount || 5).fill(null)
        );
      } catch (requestError) {
        setError(requestError.message);
      } finally {
        setLoading(false);
      }
    }

    loadQuiz();
  }, []);

  function chooseOption(questionIndex, optionIndex) {
    if (attempt) {
      return;
    }

    setAnswers((current) =>
      current.map((value, index) => (index === questionIndex ? optionIndex : value))
    );
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (answers.some((answer) => answer === null || answer === undefined)) {
      setError("Please select one option for all 5 daily quiz questions.");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const data = await apiRequest("/daily-quiz/submit", {
        method: "POST",
        body: JSON.stringify({ answers }),
      });
      setQuiz(data.quiz);
      setAttempt(data.attempt);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSubmitting(false);
    }
  }

  const scoreLabel = useMemo(() => {
    if (!attempt) {
      return "";
    }

    if (attempt.score >= 80) {
      return "Excellent";
    }

    if (attempt.score >= 60) {
      return "Strong";
    }

    if (attempt.score >= 40) {
      return "Good start";
    }

    return "Keep practicing";
  }, [attempt]);

  if (loading) {
    return <p className="muted">Loading daily quiz...</p>;
  }

  if (error && !quiz) {
    return <p className="error-text">{error}</p>;
  }

  return (
    <div className="content-stack">
      <section className="hero hero--analytics">
        <div className="hero-panel">
          <div className="eyebrow eyebrow--accent">Daily Challenge</div>
          <h1>Daily Quiz</h1>
          <p className="hero-copy">
            A fresh 5-question research-focused quiz is generated once per day with
            four options per question. The questions now prefer newer AI, systems,
            privacy, agent, and advanced computing topics instead of only basic
            fundamentals.
          </p>
          <div className="hero-actions">
            <span className="pill">{formatQuizDate(quiz?.quizDate)}</span>
            <span className="pill">
              {quiz?.questionCount || 5} questions
            </span>
            {attempt && (
              <span className="score-chip score-chip--active">
                {attempt.score}/100
              </span>
            )}
          </div>
        </div>

        <div className="hero-side">
          <article className="spotlight-card spotlight-card--primary">
            <span className="spotlight-label">Attempt Status</span>
            <strong>{attempt ? "Completed" : "Not attempted yet"}</strong>
            <p>
              {attempt
                ? `You answered ${attempt.correctCount} out of ${quiz?.questionCount || 5} correctly.`
                : "Complete today's quiz to store the score in your dashboard."}
            </p>
          </article>
        </div>
      </section>

      {error && <p className="error-text">{error}</p>}

      {attempt ? (
        <>
          <section className="metrics-band">
            <article className="metric-card metric-card--featured">
              <span className="metric-label">Score</span>
              <span className="metric-value">{attempt.score}</span>
            </article>
            <article className="metric-card">
              <span className="metric-label">Correct Answers</span>
              <span className="metric-value">{attempt.correctCount}</span>
            </article>
            <article className="metric-card">
              <span className="metric-label">Status</span>
              <span className="metric-value metric-value--small">{scoreLabel}</span>
            </article>
            <article className="metric-card">
              <span className="metric-label">Saved To</span>
              <span className="metric-value metric-value--small">Dashboard</span>
            </article>
          </section>

          <section className="card">
            <div className="section-heading">
              <div>
                <span className="eyebrow eyebrow--accent">Review</span>
                <h2>Today's quiz breakdown</h2>
              </div>
              <Link className="secondary-button" to="/">
                Back to Dashboard
              </Link>
            </div>

            <div className="quiz-list">
              {attempt.review.map((item) => (
                <article className="quiz-question quiz-question--review" key={item.id}>
                  <div className="review-head">
                    <h3>
                      Question {item.id}: {item.question}
                    </h3>
                    <span
                      className={`score-chip ${
                        item.isCorrect ? "score-chip--active" : ""
                      }`}
                    >
                      {item.isCorrect ? "Correct" : "Incorrect"}
                    </span>
                  </div>
                  <div className="option-grid">
                    {item.options.map((option, optionIndex) => {
                      const isSelected = item.selectedOption === optionIndex;
                      const isCorrect = item.correctOption === optionIndex;
                      const className = [
                        "option-card",
                        isSelected ? "option-card--selected" : "",
                        isCorrect ? "option-card--correct" : "",
                        isSelected && !isCorrect ? "option-card--incorrect" : "",
                      ]
                        .filter(Boolean)
                        .join(" ");

                      return (
                        <div className={className} key={option}>
                          <span>{String.fromCharCode(65 + optionIndex)}</span>
                          <strong>{option}</strong>
                        </div>
                      );
                    })}
                  </div>
                  <p className="muted">{item.explanation}</p>
                </article>
              ))}
            </div>
          </section>
        </>
      ) : (
        <section className="card">
          <div className="section-heading">
            <div>
              <span className="eyebrow eyebrow--accent">Attempt Quiz</span>
              <h2>Answer all 5 questions</h2>
            </div>
          </div>

          <form className="quiz-list" onSubmit={handleSubmit}>
            {quiz?.questions?.map((item, questionIndex) => (
              <article className="quiz-question" key={item.id}>
                <h3>
                  Question {item.id}: {item.question}
                </h3>
                <div className="option-grid">
                  {item.options.map((option, optionIndex) => {
                    const isActive = answers[questionIndex] === optionIndex;

                    return (
                      <button
                        className={`option-card ${
                          isActive ? "option-card--selected" : ""
                        }`}
                        type="button"
                        key={`${item.id}-${optionIndex}`}
                        onClick={() => chooseOption(questionIndex, optionIndex)}
                      >
                        <span>{String.fromCharCode(65 + optionIndex)}</span>
                        <strong>{option}</strong>
                      </button>
                    );
                  })}
                </div>
              </article>
            ))}

            <div className="button-row">
              <button className="primary-button" type="submit" disabled={submitting}>
                {submitting ? "Submitting..." : "Submit Daily Quiz"}
              </button>
              <Link className="secondary-button" to="/">
                Back to Dashboard
              </Link>
            </div>
          </form>
        </section>
      )}
    </div>
  );
}

export default DailyQuiz;
