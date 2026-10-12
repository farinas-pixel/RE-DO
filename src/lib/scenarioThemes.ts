/**
 * Scenario Visual Theme Mapping
 * Provides atmospheric gradient artwork, ambient illumination tones,
 * and environmental metaphors for all 10 curated scenarios.
 */

export interface ScenarioVisualTheme {
  accentColor: string;
  glowColor: string;
  gradientBackground: string;
  environmentBadge: string;
  counterpartArchetype: string;
  iconSymbol: string;
}

export const SCENARIO_THEMES: Record<string, ScenarioVisualTheme> = {
  // Career & Jobs
  'Tech Lead Behavioral Interview: Handling Conflict': {
    accentColor: '#6366f1',
    glowColor: 'rgba(99, 102, 241, 0.35)',
    gradientBackground: 'radial-gradient(circle at 85% 15%, rgba(99, 102, 241, 0.28) 0%, rgba(15, 23, 42, 0.95) 75%)',
    environmentBadge: 'Executive Boardroom',
    counterpartArchetype: 'Incisive VP of Engineering evaluating architecture trade-offs & team dynamics',
    iconSymbol: '⚡',
  },
  'Compensation & Promotion Negotiation': {
    accentColor: '#10b981',
    glowColor: 'rgba(16, 185, 129, 0.32)',
    gradientBackground: 'radial-gradient(circle at 85% 15%, rgba(16, 185, 129, 0.25) 0%, rgba(6, 30, 24, 0.95) 75%)',
    environmentBadge: 'Talent Acquisition Office',
    counterpartArchetype: 'Strategic Director balancing band limits with high-value candidate retention',
    iconSymbol: '⚖️',
  },

  // Education
  'Graduate School Admissions / PhD Defense': {
    accentColor: '#8b5cf6',
    glowColor: 'rgba(139, 92, 246, 0.35)',
    gradientBackground: 'radial-gradient(circle at 85% 15%, rgba(139, 92, 246, 0.28) 0%, rgba(20, 10, 38, 0.95) 75%)',
    environmentBadge: 'Academic Committee Chamber',
    counterpartArchetype: 'Tenured Chair probing methodological rigor, validity, and scientific novelty',
    iconSymbol: '🏛️',
  },
  'College Scholarship Final Round Panel': {
    accentColor: '#ec4899',
    glowColor: 'rgba(236, 72, 153, 0.32)',
    gradientBackground: 'radial-gradient(circle at 85% 15%, rgba(236, 72, 153, 0.25) 0%, rgba(35, 10, 25, 0.95) 75%)',
    environmentBadge: 'Foundation Trustee Hall',
    counterpartArchetype: 'Discerning Philanthropic Trustee searching for authentic grit & community impact',
    iconSymbol: '🎓',
  },

  // Business & Startups
  'Seed Stage Venture Capital Pitch': {
    accentColor: '#f59e0b',
    glowColor: 'rgba(245, 158, 11, 0.35)',
    gradientBackground: 'radial-gradient(circle at 85% 15%, rgba(245, 158, 11, 0.28) 0%, rgba(35, 20, 5, 0.95) 75%)',
    environmentBadge: 'Sand Hill Road Partner Lounge',
    counterpartArchetype: 'Venture Partner scrutinizing unit economics, defensibility, and market moats',
    iconSymbol: '🚀',
  },
  'Enterprise B2B Discovery Call': {
    accentColor: '#0ea5e9',
    glowColor: 'rgba(14, 165, 233, 0.32)',
    gradientBackground: 'radial-gradient(circle at 85% 15%, rgba(14, 165, 233, 0.25) 0%, rgba(8, 25, 40, 0.95) 75%)',
    environmentBadge: 'Corporate Operations Suite',
    counterpartArchetype: 'Pragmatic Head of Ops protective of team bandwidth and skeptical of software fatigue',
    iconSymbol: '🏢',
  },

  // Social & Communication
  'Setting Healthy Boundaries with a Peer or Colleague': {
    accentColor: '#14b8a6',
    glowColor: 'rgba(20, 184, 166, 0.32)',
    gradientBackground: 'radial-gradient(circle at 85% 15%, rgba(20, 184, 166, 0.25) 0%, rgba(5, 30, 28, 0.95) 75%)',
    environmentBadge: 'Shared Office Breakout Area',
    counterpartArchetype: 'Accustomed Delegator pushing surplus project responsibilities onto your plate',
    iconSymbol: '🛡️',
  },
  'Delivering Constructive Critical Feedback': {
    accentColor: '#f43f5e',
    glowColor: 'rgba(244, 63, 94, 0.35)',
    gradientBackground: 'radial-gradient(circle at 85% 15%, rgba(244, 63, 94, 0.28) 0%, rgba(38, 8, 16, 0.95) 75%)',
    environmentBadge: 'Private 1-on-1 Workspace',
    counterpartArchetype: 'Defensive Collaborator feeling vulnerable about sprint deliverable quality',
    iconSymbol: '💬',
  },

  // Everyday Life
  'Apartment Rental Negotiation & Lease Concerns': {
    accentColor: '#eab308',
    glowColor: 'rgba(234, 179, 8, 0.32)',
    gradientBackground: 'radial-gradient(circle at 85% 15%, rgba(234, 179, 8, 0.25) 0%, rgba(30, 25, 6, 0.95) 75%)',
    environmentBadge: 'Property Management Office',
    counterpartArchetype: 'Margin-conscious Property Manager who values factual timeline evidence',
    iconSymbol: '🔑',
  },
  'Difficult Customer Service Dispute Resolution': {
    accentColor: '#a855f7',
    glowColor: 'rgba(168, 85, 247, 0.32)',
    gradientBackground: 'radial-gradient(circle at 85% 15%, rgba(168, 85, 247, 0.25) 0%, rgba(28, 12, 38, 0.95) 75%)',
    environmentBadge: 'Customer Care Support Line',
    counterpartArchetype: 'Policy-bound Supervisor needing structured documentation to override fees',
    iconSymbol: '📞',
  },
};

export const DEFAULT_THEME: ScenarioVisualTheme = {
  accentColor: '#6366f1',
  glowColor: 'rgba(99, 102, 241, 0.3)',
  gradientBackground: 'radial-gradient(circle at 85% 15%, rgba(99, 102, 241, 0.22) 0%, rgba(15, 23, 42, 0.95) 75%)',
  environmentBadge: 'Simulation Chamber',
  counterpartArchetype: 'Evaluator assessing situational judgment and verbal composure',
  iconSymbol: '🎯',
};

export function getScenarioTheme(title: string): ScenarioVisualTheme {
  return SCENARIO_THEMES[title] || DEFAULT_THEME;
}
