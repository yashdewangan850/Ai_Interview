import { useRef, useState } from "react";

function AnswerBox({ value, onChange }) {
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);

  const startListening = () => {
    const SpeechRecognition =
      window.SpeechRecognition ||
      window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert(
        "Speech recognition is not supported. Please use Google Chrome."
      );
      return;
    }

    const recognition = new SpeechRecognition();

    recognition.lang = "en-US";
    recognition.continuous = true;
    recognition.interimResults = false;

    recognition.onstart = () => {
      console.log("Microphone started");
      setIsListening(true);
    };

    recognition.onresult = (event) => {
      let text = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          text += event.results[i][0].transcript;
        }
      }

      if (text.trim()) {
        onChange(
          value
            ? `${value} ${text.trim()}`
            : text.trim()
        );
      }
    };

    recognition.onerror = (event) => {
      console.error("Speech error:", event.error);

      if (event.error === "not-allowed") {
        alert("Please allow microphone permission.");
      } else {
        alert(`Speech recognition error: ${event.error}`);
      }

      setIsListening(false);
    };

    recognition.onend = () => {
      console.log("Microphone stopped");
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }

    setIsListening(false);
  };

  return (
    <section className="card">
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "10px",
        }}
      >
        <label className="field-label" htmlFor="answer">
          Your answer
        </label>

        <button
          type="button"
          className="primary-button"
          onClick={
            isListening
              ? stopListening
              : startListening
          }
        >
          {isListening
            ? "🛑 Stop"
            : "🎤 Speak"}
        </button>
      </div>

      <textarea
        id="answer"
        className="answer-box"
        placeholder={
          isListening
            ? "Listening... Speak now"
            : "Write your answer or click Speak"
        }
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
      />

      {isListening && (
        <p style={{ marginTop: "8px" }}>
          🔴 Listening... Please speak.
        </p>
      )}
    </section>
  );
}

export default AnswerBox;