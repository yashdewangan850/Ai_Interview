import { jsPDF } from "jspdf";

function writeWrappedText(doc, text, x, y, maxWidth, lineHeight = 7) {
  const lines = doc.splitTextToSize(text, maxWidth);
  const pageHeight = doc.internal.pageSize.getHeight();
  let currentY = y;

  lines.forEach((line) => {
    if (currentY > pageHeight - 15) {
      doc.addPage();
      currentY = 20;
    }

    doc.text(line, x, currentY);
    currentY += lineHeight;
  });

  return currentY;
}

export function downloadInterviewPdf(interview) {
  const doc = new jsPDF();
  const marginX = 16;
  const maxWidth = 178;
  let y = 18;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("AI Interview Report", marginX, y);
  y += 10;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.text(`Topic: ${interview.topic}`, marginX, y);
  y += 7;
  doc.text(`Category: ${interview.category || "technical"}`, marginX, y);
  y += 7;
  doc.text(`Difficulty: ${interview.difficulty}`, marginX, y);
  y += 7;
  doc.text(`Timer: ${interview.timerMinutes || 15} minutes`, marginX, y);
  y += 7;
  doc.text(`Questions: ${interview.questionCount}`, marginX, y);
  y += 7;
  doc.text(`Score: ${interview.evaluation?.score ?? "N/A"}`, marginX, y);
  y += 10;

  doc.setFont("helvetica", "bold");
  doc.text("Feedback", marginX, y);
  y += 7;
  doc.setFont("helvetica", "normal");
  y = writeWrappedText(
    doc,
    interview.evaluation?.feedback || "No feedback available.",
    marginX,
    y,
    maxWidth
  );
  y += 6;

  const listSections = [
    ["Strengths", interview.evaluation?.strengths || []],
    ["Weaknesses", interview.evaluation?.weaknesses || []],
    ["Suggestions", interview.evaluation?.suggestions || []],
  ];

  listSections.forEach(([title, items]) => {
    doc.setFont("helvetica", "bold");
    doc.text(title, marginX, y);
    y += 7;
    doc.setFont("helvetica", "normal");

    if (!items.length) {
      y = writeWrappedText(doc, "No items available.", marginX, y, maxWidth);
      y += 5;
      return;
    }

    items.forEach((item) => {
      y = writeWrappedText(doc, `- ${item}`, marginX, y, maxWidth);
      y += 1;
    });

    y += 5;
  });

  doc.setFont("helvetica", "bold");
  doc.text("Question Review", marginX, y);
  y += 8;

  interview.questions.forEach((question, index) => {
    if (y > doc.internal.pageSize.getHeight() - 40) {
      doc.addPage();
      y = 20;
    }

    doc.setFont("helvetica", "bold");
    y = writeWrappedText(doc, `Q${index + 1}. ${question}`, marginX, y, maxWidth);
    y += 2;

    doc.setFont("helvetica", "normal");
    y = writeWrappedText(
      doc,
      `Your answer: ${interview.answers?.[index] || "No answer provided."}`,
      marginX,
      y,
      maxWidth
    );
    y += 2;

    y = writeWrappedText(
      doc,
      `Reference answer: ${
        interview.evaluation?.referenceAnswers?.[index] ||
        "No reference answer available."
      }`,
      marginX,
      y,
      maxWidth
    );
    y += 8;
  });

  doc.save(
    `${String(interview.topic || "interview")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")}-report.pdf`
  );
}
