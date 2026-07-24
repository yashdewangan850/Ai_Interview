function AnswerBox({ value, onChange }) {
  return (
    <section className="card">
      <label className="field-label" htmlFor="answer">
        Your answer
      </label>
      <textarea
        id="answer"
        className="answer-box"
        placeholder="Write a thoughtful answer here. Mention concepts, examples, and trade-offs if you can."
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </section>
  );
}

export default AnswerBox;
