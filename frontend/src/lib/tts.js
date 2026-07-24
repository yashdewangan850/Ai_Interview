const FEMALE_VOICE_HINTS = [
  "zira",
  "aria",
  "jenny",
  "samantha",
  "ava",
  "female",
  "susan",
  "karen",
  "moira",
  "serena",
  "emma",
  "linda",
  "heera",
  "raveena",
];

function scoreVoice(voice, preferredLang) {
  const name = `${voice.name || ""} ${voice.voiceURI || ""}`.toLowerCase();
  const lang = (voice.lang || "").toLowerCase();
  let score = 0;

  if (preferredLang && lang.startsWith(preferredLang.toLowerCase())) {
    score += 6;
  } else if (lang.startsWith("en")) {
    score += 3;
  }

  if (voice.localService) {
    score += 2;
  }

  if (FEMALE_VOICE_HINTS.some((hint) => name.includes(hint))) {
    score += 10;
  }

  if (name.includes("google")) {
    score += 2;
  }

  if (name.includes("microsoft")) {
    score += 2;
  }

  return score;
}

export function canUseTts() {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

export function getPreferredVoice(preferredLang = "en-US") {
  if (!canUseTts()) {
    return null;
  }

  const voices = window.speechSynthesis.getVoices();

  if (!voices.length) {
    return null;
  }

  return [...voices].sort(
    (left, right) => scoreVoice(right, preferredLang) - scoreVoice(left, preferredLang)
  )[0];
}

export function stopSpeaking() {
  if (canUseTts()) {
    window.speechSynthesis.cancel();
  }
}

export function speakText(text, options = {}) {
  if (!canUseTts()) {
    return false;
  }

  const cleanedText = String(text || "").trim();

  if (!cleanedText) {
    return false;
  }

  const synth = window.speechSynthesis;
  synth.cancel();

  const utterance = new SpeechSynthesisUtterance(cleanedText);
  const preferredLang = options.lang || "en-US";
  const preferredVoice = getPreferredVoice(preferredLang);

  if (preferredVoice) {
    utterance.voice = preferredVoice;
    utterance.lang = preferredVoice.lang || preferredLang;
  } else {
    utterance.lang = preferredLang;
  }

  utterance.rate = options.rate || 0.92;
  utterance.pitch = options.pitch || 1.03;
  utterance.volume = options.volume || 1;

  synth.speak(utterance);
  return true;
}
