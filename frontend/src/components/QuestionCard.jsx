import SpeakButton from "./SpeakButton";

function QuestionCard({ question, index, total, topic, difficulty }) {
  return (
    <section className="card question-card">
      <div className="question-card__meta">
        <span className="eyebrow">Question {index + 1}</span>
        <div className="question-card__actions">
          <span className="pill">{difficulty}</span>
          <SpeakButton
            text={`Question ${index + 1}. ${question}`}
            label="Read Question"
            compact
          />
        </div>
      </div>
      <h2>{question}</h2>
      <p className="muted">
        Topic: <strong>{topic}</strong> · {index + 1} of {total}
      </p>
    </section>
  );
}

export default QuestionCard;
