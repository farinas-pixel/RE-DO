/**
 * ScenarioCataloguePage — Scenario Universe
 *
 * Implements Phase 2:
 * 1. Brand Header with Allura cursive splash typography and concise product mission.
 * 2. Real search bar & keyword filtering across titles, roles, and descriptions.
 * 3. Clearly separated category controls with accessible spacing, active tabs, and responsive layout.
 * 4. Difficulty filtering pills (All, Beginner, Intermediate, Advanced).
 * 5. Cinematic scenario cards featuring custom atmospheric gradients, archetype labels, environment badges, and full goals checklists.
 * 6. Connection to the 6-stage GuidedSetupModal sequence.
 */

import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { getScenarios, createSession, addSessionMessage } from '@/services/sessionService';
import type { Scenario, ScenarioCategory, DifficultyLevel } from '@/types/database';
import { getScenarioTheme } from '@/lib/scenarioThemes';
import { GuidedSetupModal, type SetupConfiguration } from '@/components/GuidedSetupModal';
import { ScenarioDetailsModal } from '@/components/ScenarioDetailsModal';
import { CrystalBall } from '@/components/CrystalBall';

const CATEGORIES: ScenarioCategory[] = [
  'Career & Jobs',
  'Education',
  'Business & Startups',
  'Social & Communication',
  'Everyday Life',
];

export function ScenarioCataloguePage() {
  const navigate = useNavigate();
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<ScenarioCategory | 'All'>('All');
  const [selectedDifficulty, setSelectedDifficulty] = useState<DifficultyLevel | 'All'>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Setup & Details Modal State
  const [detailsScenario, setDetailsScenario] = useState<Scenario | null>(null);
  const [activeSetupScenario, setActiveSetupScenario] = useState<Scenario | null>(null);
  const [starting, setStarting] = useState(false);
  const [startError, setStartError] = useState<string | null>(null);

  const fetchScenariosList = async () => {
    setLoading(true);
    setError(null);
    const categoryParam = selectedCategory === 'All' ? undefined : selectedCategory;
    const { data, error: err } = await getScenarios(categoryParam);

    if (err) {
      setError(err);
    } else {
      setScenarios(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchScenariosList();
  }, [selectedCategory]);

  // Client-side search and difficulty filtering
  const filteredScenarios = useMemo(() => {
    return scenarios.filter((s) => {
      const matchesDifficulty =
        selectedDifficulty === 'All' || s.difficulty === selectedDifficulty;

      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        s.title.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q) ||
        s.role.toLowerCase().includes(q) ||
        s.user_role.toLowerCase().includes(q);

      return matchesDifficulty && matchesSearch;
    });
  }, [scenarios, selectedDifficulty, searchQuery]);

  const handleLaunchSession = async (config: SetupConfiguration) => {
    if (!activeSetupScenario || starting) return;
    setStarting(true);
    setStartError(null);

    // 1. Create real session record in Supabase
    const { data: session, error: createErr } = await createSession({
      scenarioId: activeSetupScenario.id,
      role: activeSetupScenario.role,
      userRole: activeSetupScenario.user_role,
      difficulty: config.difficulty,
      practiceMode: config.practiceMode,
      metadata: {
        coachingPreference: config.coachingPreference,
        environmentBadge: getScenarioTheme(activeSetupScenario.title).environmentBadge,
      },
    });

    if (createErr || !session) {
      setStartError(createErr || 'Failed to initialize simulation session in Supabase.');
      setStarting(false);
      return;
    }

    // 2. Add initial counterpart starter prompt to session_messages
    const initialPrompt =
      activeSetupScenario.starter_prompts?.[0] ||
      `Hello. I am stepping in as ${activeSetupScenario.role}. We are ready to begin the rehearsal for "${activeSetupScenario.title}". Please introduce yourself or answer whenever you are ready.`;

    await addSessionMessage(session.id, 'assistant', initialPrompt, {
      isStarter: true,
      role: activeSetupScenario.role,
      isAiGenerated: false,
    });

    // 3. Add initial pedagogical welcome note if in guided mode
    if (config.coachingPreference === 'guided') {
      await addSessionMessage(
        session.id,
        'system',
        `Tutor Activated: You are rehearsing as "${activeSetupScenario.user_role}" at ${config.difficulty} difficulty. Aim to fulfill your scenario objectives. Click 'Request Tutor Hint' at any point for strategic guidance.`,
        {
          isTutorHint: true,
          type: 'onboarding_guidance',
        }
      );
    }

    // 4. Navigate to live rehearsal room
    navigate(`/session/${session.id}`);
  };

  return (
    <div className="catalogue-universe">
      {/* Cinematic Brand Header with Allura cursive splash */}
      <header className="universe-hero-section">
        <div className="universe-brand-badge">
          <span className="brand-allura-script">Experience it</span>
          <span className="brand-subtext">before you face it.</span>
        </div>
        <h1 className="universe-headline">The Scenario Universe</h1>
        <p className="universe-subheadline">
          Immersive, high-stakes roleplay environments engineered for definitive real-world verbal mastery.
        </p>

        {/* Search Bar & Global Filter Bar */}
        <div className="universe-filter-controls">
          <div className="universe-search-bar">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              placeholder="Search scenarios by role, challenge, or topic..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Search scenarios"
            />
            {searchQuery && (
              <button
                className="clear-search-btn"
                onClick={() => setSearchQuery('')}
                aria-label="Clear search"
              >
                ✕
              </button>
            )}
          </div>

          <div className="difficulty-pills" role="radiogroup" aria-label="Difficulty filter">
            <span className="filter-label">Difficulty:</span>
            {(['All', 'Beginner', 'Intermediate', 'Advanced'] as const).map((lvl) => (
              <button
                key={lvl}
                className={`difficulty-pill ${selectedDifficulty === lvl ? 'active' : ''}`}
                onClick={() => setSelectedDifficulty(lvl)}
              >
                {lvl}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Interactive Selectable 3D Crystal Balls Strip */}
      <section className="universe-3d-spheres-tray" aria-label="Interactive 3D Scenario Spheres">
        <div className="spheres-scroll-row">
          <CrystalBall
            id="All"
            label="All Realms"
            colorTop="#f472b6"
            colorBottom="#c084fc"
            selected={selectedCategory === 'All'}
            onSelect={() => setSelectedCategory('All')}
          />
          <CrystalBall
            id="Career & Jobs"
            label="Career"
            colorTop="#38bdf8"
            colorBottom="#6366f1"
            selected={selectedCategory === 'Career & Jobs'}
            onSelect={() => setSelectedCategory('Career & Jobs')}
          />
          <CrystalBall
            id="Education"
            label="Education"
            colorTop="#a855f7"
            colorBottom="#4338ca"
            selected={selectedCategory === 'Education'}
            onSelect={() => setSelectedCategory('Education')}
          />
          <CrystalBall
            id="Business & Startups"
            label="Business"
            colorTop="#ec4899"
            colorBottom="#be185d"
            selected={selectedCategory === 'Business & Startups'}
            onSelect={() => setSelectedCategory('Business & Startups')}
          />
          <CrystalBall
            id="Social & Communication"
            label="Social"
            colorTop="#34d399"
            colorBottom="#059669"
            selected={selectedCategory === 'Social & Communication'}
            onSelect={() => setSelectedCategory('Social & Communication')}
          />
          <CrystalBall
            id="Everyday Life"
            label="Everyday"
            colorTop="#fbbf24"
            colorBottom="#d97706"
            selected={selectedCategory === 'Everyday Life'}
            onSelect={() => setSelectedCategory('Everyday Life')}
          />
        </div>
      </section>

      {/* Main Categories Navigation Bar */}
      <nav className="universe-categories-nav" aria-label="Scenario categories">
        <div className="category-tabs-scroll">
          <button
            className={`category-tab-btn ${selectedCategory === 'All' ? 'active' : ''}`}
            onClick={() => setSelectedCategory('All')}
          >
            All Categories <span className="cat-count">({scenarios.length})</span>
          </button>
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              className={`category-tab-btn ${selectedCategory === cat ? 'active' : ''}`}
              onClick={() => setSelectedCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>
      </nav>

      {/* Loading State */}
      {loading && (
        <div className="universe-loading-state">
          <div className="cinematic-spinner" />
          <p>Connecting to Supabase Scenario Universe...</p>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="catalogue-alert error" role="alert">
          <h4>Failed to synchronize scenarios</h4>
          <p>{error}</p>
          <button className="btn btn-outline" onClick={fetchScenariosList}>
            Retry Connection
          </button>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && filteredScenarios.length === 0 && (
        <div className="universe-empty-state">
          <div className="empty-icon">🌌</div>
          <h3>No Scenarios Match Your Criteria</h3>
          <p>
            {searchQuery
              ? `No simulation matches "${searchQuery}". Try broadening your search or resetting filters.`
              : `No scenarios registered for category "${selectedCategory}".`}
          </p>
          <button
            className="btn btn-outline"
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('All');
              setSelectedDifficulty('All');
            }}
          >
            Reset All Filters
          </button>
        </div>
      )}

      {/* Cinematic Scenarios Grid */}
      {!loading && !error && filteredScenarios.length > 0 && (
        <main className="universe-grid">
          {filteredScenarios.map((scenario) => {
            const theme = getScenarioTheme(scenario.title);
            return (
              <article
                key={scenario.id}
                className="cinematic-scenario-card"
                style={{
                  background: theme.gradientBackground,
                  borderColor: 'rgba(255, 255, 255, 0.1)',
                }}
              >
                {/* Environmental Header & Metadata */}
                <div className="card-ambient-glow" style={{ background: theme.glowColor }} />
                
                <div className="card-meta-top">
                  <span className="environment-tag" style={{ borderColor: theme.accentColor }}>
                    {theme.iconSymbol} {theme.environmentBadge}
                  </span>
                  <span className={`difficulty-tag ${scenario.difficulty.toLowerCase()}`}>
                    {scenario.difficulty}
                  </span>
                </div>

                <div className="card-headline-group">
                  <span className="category-label">{scenario.category}</span>
                  <h3 className="card-title">{scenario.title}</h3>
                  <p className="card-description">{scenario.description}</p>
                </div>

                {/* Role Matrix */}
                <div className="card-role-matrix">
                  <div className="matrix-row">
                    <span className="matrix-label">Your Counterpart</span>
                    <strong className="matrix-val counterpart-val">{scenario.role}</strong>
                  </div>
                  <div className="matrix-row">
                    <span className="matrix-label">Your Rehearsal Role</span>
                    <strong className="matrix-val user-val">{scenario.user_role}</strong>
                  </div>
                </div>

                {/* Complete Practice Goals */}
                <div className="card-goals-section">
                  <span className="goals-heading">Core Mastery Objectives:</span>
                  <ul className="goals-bullet-list">
                    {scenario.goals.map((goal, idx) => (
                      <li key={idx}>
                        <span className="bullet-dot" style={{ color: theme.accentColor }}>•</span>
                        <span>{goal}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Primary Action Buttons */}
                <div className="card-action-tray">
                  <button
                    className="btn btn-outline details-trigger-btn"
                    onClick={() => setDetailsScenario(scenario)}
                  >
                    View Details
                  </button>
                  <button
                    className="btn btn-primary enter-scenario-btn"
                    style={{
                      background: theme.accentColor,
                      boxShadow: `0 4px 20px -4px ${theme.glowColor}`,
                    }}
                    onClick={() => setActiveSetupScenario(scenario)}
                  >
                    Enter Rehearsal →
                  </button>
                </div>
              </article>
            );
          })}
        </main>
      )}

      {/* Screen Type #06: Scenario Details Modal */}
      <ScenarioDetailsModal
        scenario={detailsScenario}
        isOpen={Boolean(detailsScenario)}
        onClose={() => setDetailsScenario(null)}
        onStartRehearsal={(scen) => {
          setDetailsScenario(null);
          setActiveSetupScenario(scen);
        }}
      />

      {/* Guided Setup Experience Modal */}
      {activeSetupScenario && (
        <GuidedSetupModal
          scenario={activeSetupScenario}
          onClose={() => setActiveSetupScenario(null)}
          onStart={handleLaunchSession}
          isStarting={starting}
          startError={startError}
        />
      )}
    </div>
  );
}
