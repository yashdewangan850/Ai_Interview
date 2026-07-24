const { GoogleGenerativeAI } = require("@google/generative-ai");

const KNOWLEDGE_BASE = [
  {
    title: "Frontend Focus",
    keywords: ["frontend", "react", "javascript", "css", "ui", "web"],
    content:
      "Frontend interviews usually test component thinking, state management, rendering performance, accessibility, API integration, and clean UI decisions.",
  },
  {
    title: "Backend Focus",
    keywords: ["backend", "node", "express", "api", "server", "microservice"],
    content:
      "Backend interviews often cover API design, validation, authentication, database access, error handling, scalability, and production-ready architecture.",
  },
  {
    title: "Data And Databases",
    keywords: ["sql", "database", "mongodb", "sqlite", "data", "schema"],
    content:
      "Database questions should explore schema design, indexing, trade-offs between SQL and NoSQL, data consistency, and query optimization.",
  },
  {
    title: "Algorithms And Problem Solving",
    keywords: ["dsa", "algorithm", "data structure", "problem solving", "coding"],
    content:
      "Algorithm interviews should assess correctness, time complexity, space complexity, edge cases, and the ability to reason clearly about trade-offs.",
  },
  {
    title: "AI And ML Systems",
    keywords: ["ai", "ml", "machine learning", "llm", "genai", "rag"],
    content:
      "AI interviews typically evaluate model choice, data flow, evaluation metrics, prompt design, hallucination handling, retrieval strategies, and safety concerns.",
  },
  {
    title: "Behavioral And Communication",
    keywords: ["behavioral", "leadership", "teamwork", "communication", "student"],
    content:
      "Behavioral questions should encourage specific examples, ownership, collaboration, conflict resolution, learning mindset, and communication clarity.",
  },
];

const DAILY_RESEARCH_TOPICS = [
  "large language model evaluation",
  "retrieval-augmented generation",
  "AI agents and tool use",
  "multimodal AI systems",
  "vector databases and embeddings",
  "privacy-preserving machine learning",
  "federated learning",
  "edge AI and on-device inference",
  "model quantization and optimization",
  "prompt engineering",
  "hallucination mitigation",
  "synthetic data generation",
  "graph neural networks",
  "reinforcement learning from human feedback",
  "AI safety and alignment",
  "explainable AI",
  "model serving and inference pipelines",
  "autonomous systems",
  "responsible AI governance",
  "computer vision transformers",
];

function getModel() {
  if (!process.env.GEMINI_API_KEY) {
    return null;
  }

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  return genAI.getGenerativeModel({
    model: process.env.GEMINI_MODEL || "gemini-2.5-flash",
  });
}

function shuffle(items) {
  const nextItems = [...items];

  for (let index = nextItems.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [nextItems[index], nextItems[randomIndex]] = [
      nextItems[randomIndex],
      nextItems[index],
    ];
  }

  return nextItems;
}

function createSeededRandom(seedValue) {
  let seed = 0;

  String(seedValue)
    .split("")
    .forEach((character) => {
      seed = (seed * 31 + character.charCodeAt(0)) >>> 0;
    });

  return () => {
    seed = (1664525 * seed + 1013904223) >>> 0;
    return seed / 4294967296;
  };
}

function shuffleWithRandom(items, random) {
  const nextItems = [...items];

  for (let index = nextItems.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(random() * (index + 1));
    [nextItems[index], nextItems[randomIndex]] = [
      nextItems[randomIndex],
      nextItems[index],
    ];
  }

  return nextItems;
}

function tokenize(text) {
  return (text || "")
    .toLowerCase()
    .split(/[^a-z0-9+#.]+/i)
    .filter(Boolean);
}

function retrieveContext(topic, difficulty) {
  const tokens = new Set([...tokenize(topic), difficulty]);

  const matches = KNOWLEDGE_BASE.map((item) => {
    const score = item.keywords.reduce(
      (total, keyword) => total + (tokens.has(keyword.toLowerCase()) ? 1 : 0),
      0
    );

    return { ...item, score };
  })
    .sort((left, right) => right.score - left.score)
    .slice(0, 3)
    .filter((item) => item.score > 0);

  const defaultContext = {
    title: "General Interview Guidance",
    content:
      "Interview questions should be practical, non-repetitive, and balanced between fundamentals, real-world reasoning, and communication clarity.",
  };

  const relevantItems = matches.length ? matches : [defaultContext];

  return relevantItems
    .map((item, index) => `${index + 1}. ${item.title}: ${item.content}`)
    .join("\n");
}

function parseQuestionList(rawText, count) {
  const cleaned = rawText
    .replace(/\r/g, "")
    .replace(/^\s*[-*]\s+/gm, "")
    .trim();

  const parsedQuestions = cleaned
    .split(/\n+/)
    .map((line) => line.replace(/^\d+[\).\s-]*/, "").trim())
    .filter(Boolean)
    .filter((line) => !line.toLowerCase().startsWith("here are"));

  const uniqueQuestions = [];

  parsedQuestions.forEach((question) => {
    if (!uniqueQuestions.includes(question)) {
      uniqueQuestions.push(question);
    }
  });

  return uniqueQuestions.slice(0, count);
}

function normalizeQuestionText(text) {
  return String(text || "")
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function similarity(left, right) {
  const leftTokens = new Set(tokenize(left).filter((token) => token.length > 3));
  const rightTokens = new Set(tokenize(right).filter((token) => token.length > 3));

  if (!leftTokens.size || !rightTokens.size) {
    return 0;
  }

  let intersection = 0;
  leftTokens.forEach((token) => {
    if (rightTokens.has(token)) {
      intersection += 1;
    }
  });

  return intersection / Math.max(leftTokens.size, rightTokens.size);
}

function isTooSimilar(question, existingQuestions) {
  return existingQuestions.some((existingQuestion) => {
    const normalizedExisting = normalizeQuestionText(existingQuestion);
    const normalizedQuestion = normalizeQuestionText(question);

    return (
      normalizedExisting === normalizedQuestion ||
      normalizedExisting.includes(normalizedQuestion) ||
      normalizedQuestion.includes(normalizedExisting) ||
      similarity(normalizedQuestion, normalizedExisting) >= 0.72
    );
  });
}

function filterUniqueQuestions(questions, blockedQuestions, count) {
  const selectedQuestions = [];

  questions.forEach((question) => {
    if (!question || selectedQuestions.length >= count) {
      return;
    }

    const combinedExisting = [...blockedQuestions, ...selectedQuestions];

    if (!isTooSimilar(question, combinedExisting)) {
      selectedQuestions.push(question.trim());
    }
  });

  return selectedQuestions;
}

function extractJson(rawText) {
  const fencedMatch = rawText.match(/```json\s*([\s\S]*?)```/i);
  if (fencedMatch) {
    return fencedMatch[1].trim();
  }

  const objectMatch = rawText.match(/\{[\s\S]*\}/);
  return objectMatch ? objectMatch[0] : rawText.trim();
}

function normalizeDailyQuizQuestion(question, index) {
  const prompt = String(question?.question || "").trim();
  const options = Array.isArray(question?.options)
    ? question.options.map((option) => String(option || "").trim()).filter(Boolean)
    : [];
  const correctOption = Number.parseInt(question?.correctOption, 10);
  const explanation = String(question?.explanation || "").trim();

  if (!prompt) {
    throw new Error(`Daily quiz question ${index + 1} was empty.`);
  }

  if (options.length !== 4) {
    throw new Error(`Daily quiz question ${index + 1} must include 4 options.`);
  }

  if (!Number.isInteger(correctOption) || correctOption < 0 || correctOption > 3) {
    throw new Error(`Daily quiz question ${index + 1} had an invalid correct option.`);
  }

  return {
    question: prompt,
    options,
    correctOption,
    explanation:
      explanation ||
      "Review the core concept behind this question and compare the correct option with the distractors.",
  };
}

function reorderQuizOptions(question, random) {
  const optionItems = question.options.map((option, index) => ({
    option,
    index,
  }));
  const shuffledOptions = shuffleWithRandom(optionItems, random);

  return {
    ...question,
    options: shuffledOptions.map((item) => item.option),
    correctOption: shuffledOptions.findIndex(
      (item) => item.index === question.correctOption
    ),
  };
}

function buildFallbackDailyQuiz(quizDate) {
  const random = createSeededRandom(`daily-quiz-${quizDate}`);
  const featuredTopics = shuffleWithRandom(DAILY_RESEARCH_TOPICS, random).slice(0, 5);
  const pool = [
    {
      question:
        "What is the main purpose of retrieval-augmented generation in modern AI systems?",
      options: [
        "To increase monitor resolution during inference",
        "To combine model reasoning with retrieved external knowledge",
        "To replace embeddings with raw SQL queries",
        "To remove the need for prompt design",
      ],
      correctOption: 1,
      explanation:
        "RAG improves responses by retrieving relevant external context before or during generation.",
    },
    {
      question:
        "Which metric is most commonly used to evaluate ranking quality in retrieval systems?",
      options: ["BLEU", "mAP", "nDCG", "PSNR"],
      correctOption: 2,
      explanation:
        "nDCG is widely used to evaluate ranking quality because it accounts for graded relevance and position.",
    },
    {
      question:
        "Why are vector embeddings useful in semantic search systems?",
      options: [
        "They convert text into dense numeric representations of meaning",
        "They store data only as binary trees",
        "They guarantee perfect factual accuracy",
        "They replace the need for indexes entirely",
      ],
      correctOption: 0,
      explanation:
        "Embeddings represent semantic meaning numerically so related content can be retrieved by similarity.",
    },
    {
      question:
        "What is the main benefit of model quantization for deployed AI systems?",
      options: [
        "Higher storage use with slower inference",
        "Smaller models and faster inference with some accuracy trade-off",
        "Guaranteed better reasoning ability",
        "Removal of all hardware limitations",
      ],
      correctOption: 1,
      explanation:
        "Quantization reduces precision to lower memory and speed up inference, usually with some trade-offs.",
    },
    {
      question:
        "Which statement best describes multimodal AI?",
      options: [
        "A model that only predicts numeric tables",
        "A system that works with multiple data types like text, image, and audio",
        "A database that stores only vectors",
        "A model trained without supervision or prompts",
      ],
      correctOption: 1,
      explanation:
        "Multimodal AI handles more than one modality, such as text, image, audio, or video.",
    },
    {
      question:
        "What is the role of a reward model in reinforcement learning from human feedback?",
      options: [
        "To compress training images",
        "To score outputs based on human preference signals",
        "To replace the base model architecture",
        "To store prompts in a vector database",
      ],
      correctOption: 1,
      explanation:
        "A reward model estimates which outputs humans prefer and helps guide policy optimization.",
    },
    {
      question:
        "Why is hallucination mitigation important in LLM applications?",
      options: [
        "It increases GPU temperature stability",
        "It reduces the risk of confident but incorrect answers",
        "It ensures the model never needs context",
        "It removes the need for evaluation",
      ],
      correctOption: 1,
      explanation:
        "Hallucination mitigation focuses on reducing responses that sound plausible but are factually wrong.",
    },
    {
      question:
        "Which privacy-focused approach trains across many devices without centralizing raw user data?",
      options: [
        "Federated learning",
        "Beam search",
        "Greedy decoding",
        "Cache invalidation",
      ],
      correctOption: 0,
      explanation:
        "Federated learning keeps raw data local and aggregates learned updates instead of centralizing private data.",
    },
    {
      question:
        "What is a key reason to use tool-calling in AI agents?",
      options: [
        "To make prompts shorter without changing capabilities",
        "To let a model interact with external systems like search, code, or databases",
        "To disable structured outputs",
        "To convert all tasks into image generation",
      ],
      correctOption: 1,
      explanation:
        "Tool-calling extends an agent by letting it act on external systems rather than answering from text alone.",
    },
    {
      question:
        "Which challenge is especially important when deploying edge AI models on mobile devices?",
      options: [
        "Unlimited compute budget",
        "Model size, latency, and power constraints",
        "Requirement to avoid all quantization",
        "Need for relational joins in the browser",
      ],
      correctOption: 1,
      explanation:
        "Edge devices have limited memory, battery, and compute, so compact efficient models matter.",
    },
    {
      question:
        "What does explainable AI mainly try to improve?",
      options: [
        "The color scheme of training dashboards",
        "Understanding of how a model reached its output",
        "The randomness of token generation",
        "The size of the deployment package",
      ],
      correctOption: 1,
      explanation:
        "Explainable AI aims to make model behavior and decision logic easier to interpret.",
    },
    {
      question:
        "Which statement best describes synthetic data in AI workflows?",
      options: [
        "It is always more accurate than real-world data",
        "It is artificially generated data used to supplement or simulate training examples",
        "It is encrypted data that cannot be labeled",
        "It is only used in frontend development",
      ],
      correctOption: 0,
      explanation:
        "Synthetic data is generated artificially and is often used to expand scarce or sensitive datasets.",
    },
    {
      question:
        "What is one major reason researchers evaluate LLMs with benchmark suites?",
      options: [
        "To test models across many tasks in a consistent way",
        "To remove the need for validation data",
        "To guarantee zero hallucinations",
        "To convert model outputs into SQL automatically",
      ],
      correctOption: 0,
      explanation:
        "Benchmarks help compare systems on standardized tasks and identify strengths or weaknesses.",
    },
    {
      question:
        "In responsible AI governance, what is a model card mainly used for?",
      options: [
        "To document model purpose, limitations, and evaluation details",
        "To encrypt the model weights",
        "To replace deployment logs",
        "To make prompts multimodal",
      ],
      correctOption: 0,
      explanation:
        "Model cards summarize intended use, evaluation, risks, and constraints for transparency.",
    },
  ];

  const researchIntroQuestion = featuredTopics.map((topic) => ({
    question: `Which statement best matches the research topic "${topic}"?`,
    options: [
      `It is an active area in modern AI and computing research with real system trade-offs.`,
      "It only refers to changing website colors and layout themes.",
      "It is a legacy topic used only in desktop printers.",
      "It means deleting model evaluation completely.",
    ],
    correctOption: 0,
    explanation: `${topic} is treated here as a modern research-oriented topic rather than a basic web-only concept.`,
  }));

  return shuffleWithRandom([...pool, ...researchIntroQuestion], random)
    .slice(0, 5)
    .map((question) => reorderQuizOptions(question, random));
}

async function generateDailyQuiz({ quizDate }) {
  const model = getModel();
  const researchTopics = shuffleWithRandom(
    DAILY_RESEARCH_TOPICS,
    createSeededRandom(`daily-quiz-topics-${quizDate}`)
  ).slice(0, 8);

  if (!model) {
    return {
      title: "Daily Quiz",
      questions: buildFallbackDailyQuiz(quizDate),
      meta: {
        source: "fallback",
        focusTopics: researchTopics,
        warning:
          "Gemini API key missing. Using local research-topic daily quiz generation.",
      },
    };
  }

  const prompt = `
You are creating the Daily Quiz for a student interview preparation platform.

Date: ${quizDate}
Quiz title: Daily Quiz

Generate exactly 5 multiple-choice questions for today's daily quiz.

Research focus topics for today:
${researchTopics.map((topic, index) => `${index + 1}. ${topic}`).join("\n")}

Requirements:
- The quiz must be based on newer research-oriented or advanced engineering topics, especially AI, ML systems, modern data systems, autonomous agents, privacy, optimization, multimodal systems, and current computing trends
- Prefer the listed focus topics and keep questions conceptually current instead of generic beginner web questions
- Each question must have exactly 4 options
- Exactly 1 option must be correct
- Keep the difficulty student-friendly but not trivial
- Avoid repeating the same concept in multiple questions

Return valid JSON only in this exact shape:
{
  "title": "Daily Quiz",
  "questions": [
    {
      "question": "string",
      "options": ["option A", "option B", "option C", "option D"],
      "correctOption": 1,
      "explanation": "short explanation"
    }
  ]
}
`;

  try {
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.8,
        topP: 0.95,
        responseMimeType: "application/json",
      },
    });
    const text = result.response.text();
    const parsed = JSON.parse(extractJson(text));
    const normalizedQuestions = Array.isArray(parsed.questions)
      ? parsed.questions.map(normalizeDailyQuizQuestion)
      : [];

    if (normalizedQuestions.length !== 5) {
      throw new Error("Daily quiz did not contain exactly 5 questions.");
    }

    return {
      title: String(parsed.title || "Daily Quiz").trim() || "Daily Quiz",
      questions: normalizedQuestions,
      meta: {
        source: "gemini",
        focusTopics: researchTopics,
      },
    };
  } catch (error) {
    console.error("Gemini daily quiz generation failed, using fallback:", error.message);
    return {
      title: "Daily Quiz",
      questions: buildFallbackDailyQuiz(quizDate),
      meta: {
        source: "fallback",
        focusTopics: researchTopics,
        warning:
          `Gemini request failed. Using local research-topic daily quiz instead. ${error.message}`,
      },
    };
  }
}

function buildFallbackReferenceAnswers(questions, topic) {
  return questions.map((question, index) => {
    const keywords = tokenize(`${question} ${topic}`)
      .filter((word) => word.length > 4)
      .slice(0, 4);

    const focusArea = keywords.length ? keywords.join(", ") : topic;

    return `A strong answer should define the core concept, connect it to ${focusArea}, give one practical example, and mention a trade-off or best practice that shows interview-ready reasoning. This demonstrates both understanding and application.`;
  });
}

async function generateReferenceAnswersWithGemini(
  model,
  questions,
  topic,
  difficulty,
  retrievedContext
) {
  const prompt = `
You are a technical interview coach.

Create exactly one concise, high-quality reference answer for each interview question below.

Topic: ${topic}
Difficulty: ${difficulty}

Retrieved context:
${retrievedContext}

Questions:
${questions.map((question, index) => `${index + 1}. ${question}`).join("\n")}

Return valid JSON only in this exact shape:
{
  "referenceAnswers": [
    "answer for question 1",
    "answer for question 2"
  ]
}

Rules:
- The array length must be exactly ${questions.length}
- Each array item must answer only its matching question
- Keep each answer clear, practical, and interview-ready
- Each answer should be about 3 to 6 sentences
`;

  const result = await model.generateContent({
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: 0.5,
      topP: 0.9,
      responseMimeType: "application/json",
    },
  });

  const text = result.response.text();
  const parsed = JSON.parse(extractJson(text));

  if (!Array.isArray(parsed.referenceAnswers)) {
    throw new Error("Reference answers payload was not an array.");
  }

  const cleanedAnswers = parsed.referenceAnswers
    .map((item) => String(item || "").trim())
    .filter(Boolean);

  if (cleanedAnswers.length !== questions.length) {
    throw new Error("Reference answer count did not match question count.");
  }

  return cleanedAnswers;
}

function normalizeEvaluation(evaluation, questions = [], topic = "") {
  const score = Number.isFinite(Number(evaluation.score))
    ? Math.max(0, Math.min(100, Number(evaluation.score)))
    : 0;

  const toList = (value, fallback) =>
    Array.isArray(value) && value.length
      ? value.map((item) => String(item).trim()).filter(Boolean).slice(0, 5)
      : fallback;

  const fallbackReferenceAnswers = buildFallbackReferenceAnswers(questions, topic);
  const referenceAnswers =
    Array.isArray(evaluation.referenceAnswers) && evaluation.referenceAnswers.length
      ? questions.map(
          (_question, index) =>
            String(evaluation.referenceAnswers[index] || "").trim() ||
            fallbackReferenceAnswers[index]
        )
      : fallbackReferenceAnswers;

  return {
    score: Math.round(score),
    feedback:
      String(evaluation.feedback || "").trim() ||
      "This interview needs a clearer and more detailed response set.",
    strengths: toList(evaluation.strengths, ["Shows willingness to attempt the interview."]),
    weaknesses: toList(evaluation.weaknesses, [
      "Some answers need more depth and clearer technical reasoning.",
    ]),
    suggestions: toList(evaluation.suggestions, [
      "Use a clear structure with concept, example, and trade-off in each answer.",
    ]),
    referenceAnswers,
  };
}

function fallbackQuestions(topic, difficulty, count) {
  const conceptAngles = [
    "core concepts",
    "architecture decisions",
    "performance trade-offs",
    "debugging strategy",
    "real-world project design",
    "common mistakes",
    "testing approach",
    "scalability concerns",
    "security considerations",
    "best practices",
    "production troubleshooting",
    "team collaboration choices",
    "state management decisions",
    "database or API integration",
    "maintainability trade-offs",
    "edge-case handling",
    "code organization",
    "deployment readiness",
    "monitoring and observability",
    "error handling",
  ];

  const openers = [
    `How would you explain`,
    `Describe`,
    `What would you say about`,
    `How would you approach`,
    `Give an example of`,
    `What trade-offs appear in`,
    `How do strong candidates discuss`,
    `How would you solve`,
  ];

  const endings = [
    "in an interview answer?",
    "in a real project?",
    "for a student-level technical round?",
    "during a production scenario?",
    "when balancing speed and maintainability?",
    "while working with teammates?",
  ];

  const pool = [];

  shuffle(conceptAngles).forEach((angle, angleIndex) => {
    shuffle(openers).forEach((opener, openerIndex) => {
      const ending = endings[(angleIndex + openerIndex) % endings.length];
      pool.push(
        `${opener} ${angle} in ${topic} ${ending}`.replace(/\s+/g, " ").trim()
      );
      pool.push(
        `For a ${difficulty} interview, how would you handle ${angle} when building with ${topic}?`
      );
      pool.push(
        `What mistakes should candidates avoid when discussing ${angle} in ${topic}?`
      );
    });
  });

  return shuffle(pool).slice(0, count);
}

function ensureQuestionCount(questions, topic, difficulty, blockedQuestions, count) {
  if (questions.length >= count) {
    return questions.slice(0, count);
  }

  const completedQuestions = [...questions];
  const fallbackPool = fallbackQuestions(topic, difficulty, count * 12);

  fallbackPool.forEach((question) => {
    if (completedQuestions.length >= count) {
      return;
    }

    if (!isTooSimilar(question, [...blockedQuestions, ...completedQuestions])) {
      completedQuestions.push(question);
    }
  });

  let attempt = 1;

  while (completedQuestions.length < count) {
    const forcedQuestion =
      `In a ${difficulty} interview, explain a distinct practical challenge ${attempt} involving ${topic} and how you would solve it.`;

    if (!isTooSimilar(forcedQuestion, [...blockedQuestions, ...completedQuestions])) {
      completedQuestions.push(forcedQuestion);
    }

    attempt += 1;
  }

  return completedQuestions;
}

function keywordCoverage(question, answer, topic) {
  const sourceWords = tokenize(`${question} ${topic}`).filter(
    (word) => word.length > 3
  );
  const answerWords = new Set(tokenize(answer));

  if (!sourceWords.length) {
    return 0;
  }

  const matched = sourceWords.filter((word) => answerWords.has(word)).length;
  return matched / sourceWords.length;
}

function fallbackEvaluation({ topic, questions, answers }) {
  const perQuestionScores = questions.map((question, index) => {
    const answer = answers[index] || "";
    const words = tokenize(answer);

    if (!answer.trim()) {
      return 0;
    }

    const baseScore = 42;
    const lengthScore = Math.min(words.length / 28, 1) * 20;
    const coverageScore = keywordCoverage(question, answer, topic) * 20;
    const structureScore = /because|for example|trade-off|depends|first|then|therefore|however/i.test(
      answer
    )
      ? 10
      : 5;
    const specificityScore =
      new Set(words.filter((word) => word.length > 4)).size >= 6 ? 8 : 3;

    return Math.min(
      100,
      baseScore + lengthScore + coverageScore + structureScore + specificityScore
    );
  });

  const score = perQuestionScores.length
    ? perQuestionScores.reduce((total, item) => total + item, 0) /
      perQuestionScores.length
    : 0;

  const answeredCount = answers.filter((answer) => answer.trim()).length;
  const averageWords =
    answers.reduce((total, answer) => total + tokenize(answer).length, 0) /
    Math.max(answers.length, 1);

  const strengths = [];
  const weaknesses = [];
  const suggestions = [];

  if (answeredCount === questions.length) {
    strengths.push("Completed the full interview without skipping questions.");
  } else {
    weaknesses.push("Some questions were skipped or answered very briefly.");
  }

  if (averageWords >= 35) {
    strengths.push("Answers show a helpful amount of detail.");
  } else {
    weaknesses.push("Answers need more depth and supporting explanation.");
    suggestions.push("Aim for 4-6 thoughtful sentences per answer.");
  }

  if (score >= 70) {
    strengths.push("Shows a solid understanding of the topic fundamentals.");
  } else {
    weaknesses.push("Technical reasoning and topic coverage can be stronger.");
    suggestions.push("Reference specific concepts, examples, and trade-offs.");
  }

  let adjustedScore = score;

  if (answeredCount === questions.length && averageWords >= 10) {
    adjustedScore = Math.max(adjustedScore, 55);
  }

  if (answeredCount === questions.length && averageWords >= 18) {
    adjustedScore = Math.max(adjustedScore, 65);
  }

  suggestions.push(
    "Structure answers as concept, practical example, and why that approach is appropriate."
  );

  return normalizeEvaluation({
    score: adjustedScore,
    feedback:
      adjustedScore >= 75
        ? "You communicated the core ideas well and showed decent technical confidence. Keep improving precision and real-world examples."
        : "This score was estimated using the local fallback evaluator. Your answers may still be conceptually correct, but clearer structure and a little more detail will improve consistency when Gemini is unavailable.",
    strengths,
    weaknesses,
    suggestions,
    referenceAnswers: buildFallbackReferenceAnswers(questions, topic),
  }, questions, topic);
}

async function generateInterviewQuestions({
  topic,
  category = "technical",
  difficulty,
  count,
  previousQuestions = [],
}) {
  const model = getModel();
  const retrievedContext = retrieveContext(topic, difficulty);
  const blockedQuestions = previousQuestions.slice(0, 50);

  if (!model) {
    const fallback = filterUniqueQuestions(
      fallbackQuestions(topic, difficulty, count * 4),
      blockedQuestions,
      count
    );

    return {
      questions: ensureQuestionCount(
        fallback,
        topic,
        difficulty,
        blockedQuestions,
        count
      ),
      meta: {
        source: "fallback",
        warning: "Gemini API key missing. Using local question generation.",
      },
    };
  }

  const prompt = `
You are a professional interviewer.

Generate ${count} unique interview questions for topic: ${topic}
Category: ${category}
Difficulty: ${difficulty}

Retrieved context:
${retrievedContext}

Avoid repeating or closely paraphrasing any of these previous questions:
${blockedQuestions.length ? blockedQuestions.map((item, index) => `${index + 1}. ${item}`).join("\n") : "None"}

Rules:
- Questions must be clear
- No repetition
- Cover different concepts
- Each question must explore a different angle
- Return valid JSON only in this shape:
  { "questions": ["question 1", "question 2"] }
`;

  try {
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.9,
        topP: 0.95,
        responseMimeType: "application/json",
      },
    });
    const text = result.response.text();
    const parsedPayload = JSON.parse(extractJson(text));
    const candidateQuestions = Array.isArray(parsedPayload.questions)
      ? parsedPayload.questions.map((item) => String(item).trim()).filter(Boolean)
      : parseQuestionList(text, count);
    const uniqueQuestions = filterUniqueQuestions(
      candidateQuestions,
      blockedQuestions,
      count
    );

    if (uniqueQuestions.length === count) {
      return {
        questions: uniqueQuestions,
        meta: {
          source: "gemini",
        },
      };
    }

    const fallbackFill = filterUniqueQuestions(
      fallbackQuestions(topic, difficulty, count * 4),
      [...blockedQuestions, ...uniqueQuestions],
      count - uniqueQuestions.length
    );

    return {
      questions: ensureQuestionCount(
        [...uniqueQuestions, ...fallbackFill],
        topic,
        difficulty,
        blockedQuestions,
        count
      ),
      meta: {
        source: uniqueQuestions.length ? "gemini+fallback" : "fallback",
        warning:
          "Gemini returned overlapping or incomplete questions, so local fallback questions were added.",
      },
    };
  } catch (error) {
    console.error("Gemini question generation failed, using fallback:", error.message);
    const fallback = filterUniqueQuestions(
      fallbackQuestions(topic, difficulty, count * 4),
      blockedQuestions,
      count
    );

    return {
      questions: ensureQuestionCount(
        fallback,
        topic,
        difficulty,
        blockedQuestions,
        count
      ),
      meta: {
        source: "fallback",
        warning: `Gemini request failed. Using local fallback instead. ${error.message}`,
      },
    };
  }
}

async function evaluateInterview({
  topic,
  category = "technical",
  difficulty,
  questions,
  answers,
}) {
  const model = getModel();
  const retrievedContext = retrieveContext(topic, difficulty);
  const interviewTranscript = questions
    .map(
      (question, index) =>
        `Question ${index + 1}: ${question}\nAnswer ${index + 1}: ${answers[index] || ""}`
    )
    .join("\n\n");

  if (!model) {
    return {
      ...fallbackEvaluation({ topic, questions, answers }),
      meta: {
        source: "fallback",
        warning: "Gemini API key missing. Using local evaluation.",
      },
    };
  }

  const prompt = `
You are a technical interviewer.

Evaluate the candidate answers below:

Category: ${category}

${interviewTranscript}

Retrieved context:
${retrievedContext}

Return valid JSON only in this exact shape:
{
  "score": number,
  "strengths": ["string"],
  "weaknesses": ["string"],
  "suggestions": ["string"],
  "feedback": "string"
}

Be honest and constructive.
`;

  try {
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.4,
        topP: 0.9,
        responseMimeType: "application/json",
      },
    });
    const text = result.response.text();
    const parsed = JSON.parse(extractJson(text));
    const referenceAnswers = await generateReferenceAnswersWithGemini(
      model,
      questions,
      topic,
      difficulty,
      retrievedContext
    );

    return {
      ...normalizeEvaluation(
        {
          ...parsed,
          referenceAnswers,
        },
        questions,
        topic
      ),
      meta: {
        source: "gemini",
      },
    };
  } catch (error) {
    console.error("Gemini evaluation failed, using fallback:", error.message);
    return {
      ...fallbackEvaluation({ topic, questions, answers }),
      meta: {
        source: "fallback",
        warning: `Gemini evaluation failed. Using local evaluation instead. ${error.message}`,
      },
    };
  }
}

module.exports = {
  generateDailyQuiz,
  generateInterviewQuestions,
  evaluateInterview,
};
