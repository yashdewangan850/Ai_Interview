import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import AnswerBox from "../components/AnswerBox";
import QuestionCard from "../components/QuestionCard";
import SpeakButton from "../components/SpeakButton";
import { apiRequest } from "../lib/api";

function Interview() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [interview, setInterview] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [remainingSeconds, setRemainingSeconds] = useState(0);

  useEffect(() => {
    async function loadInterview() {
      try {
        const data = await apiRequest(`/interviews/${id}`);
        setInterview(data.interview);
        setAnswers(
          data.interview.answers?.length
            ? data.interview.answers
            : new Array(data.interview.questions.length).fill("")
        );
        setRemainingSeconds((data.interview.timerMinutes || 15) * 60);

        if (data.interview.status === "completed") {
          navigate(`/result/${id}`);
        }
      } catch (requestError) {
        setError(requestError.message);
      } finally {
        setLoading(false);
      }
    }

    loadInterview();
  }, [id, navigate]);

  const currentQuestion = useMemo(() => {
    return interview?.questions?.[currentIndex] || "";
  }, [interview, currentIndex]);

  useEffect(() => {
    if (!interview || interview.status === "completed" || submitting) {
      return undefined;
    }

    const interval = window.setInterval(() => {
      setRemainingSeconds((current) => {
        if (current <= 1) {
          window.clearInterval(interval);
          return 0;
        }

        return current - 1;
      });
    }, 1000);

    return () => window.clearInterval(interval);
  }, [interview, submitting]);

  useEffect(() => {
    if (!interview || submitting) {
      return;
    }

    if (remainingSeconds === 0) {
      handleSubmit(true);
    }
  }, [remainingSeconds]);

  function handleAnswerChange(value) {
    setAnswers((currentAnswers) => {
      const nextAnswers = [...currentAnswers];
      nextAnswers[currentIndex] = value;
      return nextAnswers;
    });
  }

  function handleNext() {
    setCurrentIndex((current) =>
      Math.min(current + 1, interview.questions.length - 1)
    );
  }

  function handlePrevious() {
    setCurrentIndex((current) => Math.max(current - 1, 0));
  }

  async function handleSubmit(autoSubmitted = false) {
    setSubmitting(true);
    setError(autoSubmitted ? "Time is over. Submitting your interview..." : "");

    try {
      const data = await apiRequest("/submit-interview", {
        method: "POST",
        body: JSON.stringify({
          interviewId: id,
          questions: interview.questions,
          answers,
        }),
      });

      navigate(`/result/${id}`, {
        state: { interview: data.interview },
      });
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return <p className="muted">Loading interview...</p>;
  }

  if (error && !interview) {
    return <p className="error-text">{error}</p>;
  }

  const generationWarning = interview.metadata?.generation?.warning;
  const minutes = String(Math.floor(remainingSeconds / 60)).padStart(2, "0");
  const seconds = String(remainingSeconds % 60).padStart(2, "0");

  return (
    <div className="content-stack">
      <section className="card summary-card">
        <div>
          <span className="eyebrow">Interview Session</span>
          <h1>{interview.topic}</h1>
        </div>
        <div className="summary-metrics">
          <span className="pill">{interview.category}</span>
          <span className="pill">{interview.difficulty}</span>
          <span className="pill">{interview.questionCount} questions</span>
          <span className="pill pill--timer">
            Time Left {minutes}:{seconds}
          </span>
        </div>
      </section>

      <section className="card tts-card">
        <div>
          <h2>Text To Speech</h2>
          <p className="muted">
            Use audio playback to hear the current question before answering.
          </p>
        </div>
        <SpeakButton
          text={`Interview topic ${interview.topic}. Current question. ${currentQuestion}`}
          label="Play Current Question"
        />
      </section>

      {generationWarning && (
        <section className="card warning-card">
          <p className="warning-text">{generationWarning}</p>
        </section>
      )}

      <QuestionCard
        question={currentQuestion}
        index={currentIndex}
        total={interview.questions.length}
        topic={interview.topic}
        difficulty={interview.difficulty}
      />

      <AnswerBox
        value={answers[currentIndex] || ""}
        onChange={handleAnswerChange}
      />

      {error && <p className="error-text">{error}</p>}

      <section className="card controls-card">
        <div className="progress-row">
          {interview.questions.map((question, index) => (
            <button
              key={question}
              type="button"
              className={`progress-step ${
                index === currentIndex ? "progress-step--active" : ""
              } ${answers[index]?.trim() ? "progress-step--done" : ""}`}
              onClick={() => setCurrentIndex(index)}
            >
              {index + 1}
            </button>
          ))}
        </div>

        <div className="button-row">
          <button
            className="secondary-button"
            type="button"
            onClick={handlePrevious}
            disabled={currentIndex === 0}
          >
            Previous
          </button>

          {currentIndex < interview.questions.length - 1 ? (
            <button className="primary-button" type="button" onClick={handleNext}>
              Next
            </button>
          ) : (
            <button
              className="primary-button"
              type="button"
              onClick={handleSubmit}
              disabled={submitting}
            >
              {submitting ? "Evaluating..." : "Submit Interview"}
            </button>
          )}
        </div>
      </section>
    </div>
  );
}

export default Interview;
