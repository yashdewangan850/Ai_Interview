function toTitle(value) {
  return String(value || "")
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function buildDashboardInsights(analytics, recentInterviews = []) {
  const totals = analytics?.totals || {};
  const engagement = analytics?.engagement || {};
  const averageScore = totals.averageScore || 0;
  const completed = totals.interviewsCompleted || 0;
  const strongestTopic = analytics?.strongestTopics?.[0]?.topic || "Core fundamentals";
  const categoryBreakdown = analytics?.categoryBreakdown || [];
  const difficultyBreakdown = analytics?.difficultyBreakdown || {};
  const streakDays = engagement.streakDays || 0;
  const completedThisWeek = engagement.completedThisWeek || 0;

  const weakestCategory =
    categoryBreakdown.length > 1
      ? [...categoryBreakdown].sort((left, right) => left.averageScore - right.averageScore)[0]
      : null;

  const mostCommonDifficulty = Object.entries(difficultyBreakdown).sort(
    (left, right) => right[1] - left[1]
  )[0]?.[0];

  const pendingInterview = recentInterviews.find((item) => item.status !== "completed");

  const recommendation = weakestCategory
    ? {
        topic:
          weakestCategory.category === "hr"
            ? "Self introduction and strengths"
            : strongestTopic,
        category: weakestCategory.category,
        difficulty: averageScore >= 70 ? "hard" : "medium",
        questionCount: averageScore >= 70 ? 8 : 6,
        timerMinutes: 15,
      }
    : {
        topic: strongestTopic,
        category: "technical",
        difficulty: mostCommonDifficulty || "medium",
        questionCount: 6,
        timerMinutes: 15,
      };

  const practicePlan = [
    pendingInterview
      ? `Finish your pending ${toTitle(pendingInterview.category)} session on ${pendingInterview.topic}.`
      : `Run one focused ${toTitle(recommendation.category)} session on ${recommendation.topic}.`,
    weakestCategory
      ? `Improve ${toTitle(weakestCategory.category)} responses to balance your performance.`
      : "Build consistency by completing at least two timed interviews this week.",
    averageScore >= 70
      ? "Push to harder rounds and include sharper trade-offs in each answer."
      : "Aim for one concept, one example, and one clear conclusion in every answer.",
  ];

  const achievements = [
    {
      title: "Consistency",
      value: `${streakDays} day streak`,
      unlocked: streakDays >= 1,
    },
    {
      title: "Completion",
      value: `${completed} interviews completed`,
      unlocked: completed >= 3,
    },
    {
      title: "High Performer",
      value: `${totals.bestScore || 0} best score`,
      unlocked: (totals.bestScore || 0) >= 75,
    },
    {
      title: "Weekly Goal",
      value: `${completedThisWeek}/5 this week`,
      unlocked: completedThisWeek >= 5,
    },
  ];

  return {
    strongestTopic,
    weakestCategory: weakestCategory ? toTitle(weakestCategory.category) : "Not enough data",
    recommendation,
    practicePlan,
    achievements,
    streakDays,
    completedThisWeek,
    completed,
  };
}
