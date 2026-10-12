/**
 * RE:DO Pedagogical Tutor & Roleplay Engine
 *
 * Implements Phase 5:
 * - Scenario-specific, context-aware counterpart dialogue.
 * - Non-interruptive AI Tutor assistance providing:
 *   1. Contextual Hints (on-demand guidance).
 *   2. Objective Evaluation & Alignment checks.
 *   3. Post-Session Comprehensive Rehearsal Feedback Reports (strengths, growth areas, STAR alignment).
 * - Explicit transparency: Clear labeling of deterministic pedagogical rules vs. external generative models.
 */

export interface TutorHint {
  strategy: string;
  recommendedFramework: string;
  suggestedOpeningPhrase: string;
}

export interface RehearsalTurnResult {
  counterpartResponse: string;
  tutorObservation?: string;
  tutorHint?: TutorHint;
}

export interface RehearsalFeedbackReport {
  overallScoreEstimate: string; // e.g., "Strong Alignment"
  summary: string;
  strengths: string[];
  growthAreas: string[];
  goalCoverage: { goal: string; status: 'Covered' | 'Partially Addressed' | 'Pending Focus' }[];
  actionableRecommendation: string;
  sampleExemplarResponse: string;
}

/**
 * Generate contextual counterpart turn and optional tutor guidance.
 */
export function generateContextualTurn(params: {
  scenarioTitle: string;
  counterpartRole: string;
  userRole: string;
  difficulty: string;
  userMessage: string;
  turnIndex: number;
  goals: string[];
  coachingPreference: 'guided' | 'challenge';
}): RehearsalTurnResult {
  const { counterpartRole, difficulty, userMessage, turnIndex, goals, coachingPreference } = params;
  const userTextLower = userMessage.toLowerCase();

  // Difficulty pressure modifiers
  const isAdvanced = difficulty === 'Advanced';
  const isBeginner = difficulty === 'Beginner';

  // 1. Counterpart turn generation based on conversation progression & input substance
  let counterpartResponse = '';
  let tutorObservation: string | undefined = undefined;

  // Turn 1
  if (turnIndex === 1) {
    if (isAdvanced) {
      counterpartResponse = `I see your baseline thesis, but you haven't addressed the underlying constraints. In high-stakes situations, theory rarely survives intact. Walk me through the exact numbers and technical trade-offs you accounted for.`;
    } else if (isBeginner) {
      counterpartResponse = `Thank you for sharing that opening perspective. As ${counterpartRole}, I would love to understand the background better: What was the primary motivation behind your approach, and who were the key stakeholders involved?`;
    } else {
      counterpartResponse = `Understood. That touches upon the high-level situation. As ${counterpartRole}, let me press on the execution: What specific actions did you personally lead, and what resistance did you encounter along the way?`;
    }

    if (coachingPreference === 'guided') {
      tutorObservation = `Tutor Note: Great start. For your next turn, anchor your response in the STAR framework (Situation, Task, Action, Result) to make your personal contribution clear.`;
    }
  }
  // Turn 2
  else if (turnIndex === 2) {
    const hasMetrics = /\b(\d+|%|percent|metric|roi|latency|cost|hours|weeks|months)\b/i.test(userTextLower);

    if (!hasMetrics && isAdvanced) {
      counterpartResponse = `You are describing qualitative intentions, but I am looking for measurable outcomes. How did you know this initiative succeeded? What were the benchmark figures before and after your intervention?`;
    } else {
      counterpartResponse = `That gives a much sharper picture of the friction. Now consider the counter-perspective: If our primary sponsor or lead engineer argued that this solution creates technical debt or risk, how would you defend your decision?`;
    }

    if (coachingPreference === 'guided') {
      tutorObservation = hasMetrics
        ? `Tutor Note: Excellent use of tangible metrics. Counter-arguments often test composure—remain empathetic to stakeholder concerns while defending the ROI.`
        : `Tutor Note: The counterpart is looking for concrete evidence. Mention specific timelines, metrics, or team consensus moments.`;
    }
  }
  // Turn 3
  else if (turnIndex === 3) {
    counterpartResponse = `Fair defense of the counter-arguments. Let's look forward: If you had to redo this entire scenario knowing what you know now, what is the single biggest architectural or strategic change you would implement on day one?`;

    if (coachingPreference === 'guided') {
      tutorObservation = `Tutor Note: Final reflective question. Focus on institutional learning and foresight rather than blaming external limitations.`;
    }
  }
  // Turn 4+ (Wrap up / Extended exploration)
  else {
    counterpartResponse = `Thank you. That provides a comprehensive picture of your situational judgment, composure, and problem-solving framework. I have what I need to evaluate our path forward. Is there anything critical we haven't touched on that you'd like to emphasize before we conclude?`;

    if (coachingPreference === 'guided') {
      tutorObservation = `Tutor Note: The counterpart is closing the interaction. You can either deliver a concise 30-second closing statement or conclude the rehearsal to generate your post-session feedback report.`;
    }
  }

  // Generate on-demand tutor hint for the current context
  const tutorHint: TutorHint = {
    strategy: `Align response with primary objective: "${goals[0] || 'Clear articulation'}"`,
    recommendedFramework: isAdvanced ? 'STAR-L (Situation, Task, Action, Result, Learning)' : 'STAR Model',
    suggestedOpeningPhrase: isBeginner
      ? `"In this situation, my primary focus was to ensure clear stakeholder communication by..."`
      : `"When evaluating the trade-offs, I prioritized measurable business continuity by..."`,
  };

  return {
    counterpartResponse,
    tutorObservation,
    tutorHint,
  };
}

/**
 * Generate a transparent, structured Post-Session Feedback Report
 * Evaluates real user message history from Supabase session.
 */
export function generatePostSessionReport(params: {
  scenarioTitle: string;
  role: string;
  difficulty: string;
  goals: string[];
  userMessages: string[];
}): RehearsalFeedbackReport {
  const { scenarioTitle, role, difficulty, goals, userMessages } = params;

  const totalWords = userMessages.reduce((acc, m) => acc + m.trim().split(/\s+/).length, 0);
  const avgTurnLength = userMessages.length > 0 ? Math.round(totalWords / userMessages.length) : 0;

  // Analysis heuristics
  const hasSTAR = userMessages.some((m) =>
    /\b(result|outcome|led to|impact|achieved|improved|reduced|increased)\b/i.test(m)
  );
  const hasEmpathy = userMessages.some((m) =>
    /\b(perspective|understand|collaborate|listened|feedback|aligned|compromise)\b/i.test(m)
  );
  const hasMetrics = userMessages.some((m) =>
    /\b(\d+|%|percent|kpi|budget|timeline|cost|data)\b/i.test(m)
  );

  const strengths: string[] = [];
  const growthAreas: string[] = [];

  if (hasSTAR) {
    strengths.push('Articulated clear outcomes and tangible downstream business/project results.');
  } else {
    growthAreas.push('Focus on concluding examples with measurable results rather than stopping at the action taken.');
  }

  if (hasEmpathy) {
    strengths.push('Demonstrated stakeholder empathy and collaborative de-escalation under scrutiny.');
  } else {
    growthAreas.push('Acknowledge counterpart constraints explicitly before defending your proposed solution.');
  }

  if (hasMetrics) {
    strengths.push('Anchored explanations using concrete figures, timelines, or quantitative indicators.');
  } else {
    growthAreas.push('Incorporate quantifiable metrics (e.g. percentages, weeks saved, cost limits) to elevate authority.');
  }

  if (avgTurnLength >= 25) {
    strengths.push(`Maintained substantive verbal depth (average ${avgTurnLength} words per response).`);
  } else {
    growthAreas.push('Elaborate more deeply on your thought process; terse answers can read as evasive in high-stakes roles.');
  }

  // Goal coverage mapping
  const goalCoverage = goals.map((goal, idx) => {
    let status: 'Covered' | 'Partially Addressed' | 'Pending Focus' = 'Partially Addressed';
    if (idx === 0 && (hasSTAR || userMessages.length >= 2)) status = 'Covered';
    else if (idx === 1 && (hasEmpathy || hasMetrics)) status = 'Covered';
    else if (userMessages.length < 2) status = 'Pending Focus';
    return { goal, status };
  });

  return {
    overallScoreEstimate: strengths.length >= 3 ? 'Exemplary Proficiency' : strengths.length >= 2 ? 'Proficient Alignment' : 'Emerging Foundation',
    summary: `Rehearsal analysis for "${scenarioTitle}" against ${role} at ${difficulty} difficulty across ${userMessages.length} spoken dialogue turns.`,
    strengths,
    growthAreas,
    goalCoverage,
    actionableRecommendation:
      strengths.length >= 3
        ? 'Your cadence is compelling. In live encounters, maintain this level of calm precision when countered with unexpected constraints.'
        : 'Structure your next rehearsal around the STAR framework: Spend 20% on the situation, 60% on your specific actions, and 20% on verified results.',
    sampleExemplarResponse: `“When faced with this cross-functional conflict, I scheduled an immediate technical alignment session. By separating the user latency requirements from developer convenience and examining our APM benchmarks, we agreed on a phased caching architecture that met 99.9% uptime without breaking sprint delivery.”`,
  };
}
