import { useEffect, useState } from "react";
import { canUseTts, speakText, stopSpeaking } from "../lib/tts";

function SpeakButton({ text, label = "Read aloud", compact = false }) {
  const [supported, setSupported] = useState(false);
  const [speaking, setSpeaking] = useState(false);

  useEffect(() => {
    setSupported(canUseTts());

    if (!canUseTts()) {
      return undefined;
    }

    const handleChange = () => {
      setSpeaking(window.speechSynthesis.speaking);
    };

    window.speechSynthesis.addEventListener?.("voiceschanged", handleChange);

    return () => {
      window.speechSynthesis.removeEventListener?.("voiceschanged", handleChange);
    };
  }, []);

  if (!supported) {
    return null;
  }

  function handleClick() {
    if (speaking) {
      stopSpeaking();
      setSpeaking(false);
      return;
    }

    const started = speakText(text);
    setSpeaking(started);

    if (started) {
      window.setTimeout(() => {
        setSpeaking(window.speechSynthesis.speaking);
      }, 150);
    }
  }

  return (
    <button
      className={`tts-button ${compact ? "tts-button--compact" : ""}`}
      type="button"
      onClick={handleClick}
    >
      {speaking ? "Stop Audio" : label}
    </button>
  );
}

export default SpeakButton;
