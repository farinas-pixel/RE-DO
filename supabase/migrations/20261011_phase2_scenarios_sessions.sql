-- ==============================================================================
-- RE:DO DATABASE SCHEMA & POLICIES (PHASE 2)
-- Tables: scenarios, sessions, session_messages
-- Project: https://iilyjienklxyeikjrzlf.supabase.co
-- ==============================================================================

-- 1. SCENARIOS TABLE
-- Catalogue of practice scenarios across 5 distinct categories
create table if not exists public.scenarios (
  id uuid primary key default gen_random_uuid(),
  category text not null check (category in (
    'Career & Jobs',
    'Education',
    'Business & Startups',
    'Social & Communication',
    'Everyday Life'
  )),
  title text not null,
  description text not null,
  role text not null,              -- Role of the counter-party (e.g., "Senior Hiring Manager", "Venture Partner")
  user_role text not null,         -- Role of the user (e.g., "Software Engineer Candidate", "Founder")
  difficulty text not null check (difficulty in ('Beginner', 'Intermediate', 'Advanced')),
  goals text[] not null default '{}', -- Key objectives for the practice session
  scenario_instructions text not null, -- Specific context, rules, setting, and role instructions
  starter_prompts text[] not null default '{}', -- Suggested opening lines / conversation starters
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on scenarios
alter table public.scenarios enable row level security;

-- Scenarios policies:
-- Anyone (authenticated or public anon) can browse scenarios catalogue
drop policy if exists "Scenarios are viewable by everyone" on public.scenarios;
create policy "Scenarios are viewable by everyone"
  on public.scenarios
  for select
  using (true);

-- Modifications restricted: only service_role (admin) or strictly authenticated users if needed
-- Standard users cannot delete or tamper with system scenarios
drop policy if exists "Scenarios are insertable by authenticated users" on public.scenarios;
create policy "Scenarios are insertable by authenticated users"
  on public.scenarios
  for insert
  with check (auth.role() = 'authenticated');


-- 2. SESSIONS TABLE
-- Represents a single interview/roleplay practice instance owned by an authenticated user
create table if not exists public.sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  scenario_id uuid references public.scenarios(id) on delete set null,
  role text not null,              -- Partner's role for this session
  user_role text not null,         -- User's role for this session
  difficulty text not null check (difficulty in ('Beginner', 'Intermediate', 'Advanced')),
  practice_mode text not null check (practice_mode in ('text', 'voice', 'camera_preview')),
  status text not null default 'in_progress' check (status in ('in_progress', 'completed', 'abandoned')),
  metadata jsonb default '{}'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  completed_at timestamp with time zone
);

-- Enable RLS on sessions
alter table public.sessions enable row level security;

-- Sessions RLS policies:
-- Strict ownership: Users can only see, create, and update their own sessions
drop policy if exists "Users can view own sessions" on public.sessions;
create policy "Users can view own sessions"
  on public.sessions
  for select
  using (auth.uid() = user_id);

drop policy if exists "Users can create own sessions" on public.sessions;
create policy "Users can create own sessions"
  on public.sessions
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own sessions" on public.sessions;
create policy "Users can update own sessions"
  on public.sessions
  for update
  using (auth.uid() = user_id);

drop policy if exists "Users can delete own sessions" on public.sessions;
create policy "Users can delete own sessions"
  on public.sessions
  for delete
  using (auth.uid() = user_id);


-- 3. SESSION_MESSAGES TABLE
-- Persistent conversation records between User and Counterpart
create table if not exists public.session_messages (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references public.sessions(id) on delete cascade not null,
  sender text not null check (sender in ('user', 'assistant', 'system')),
  content text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  metadata jsonb default '{}'::jsonb
);

-- Enable RLS on session_messages
alter table public.session_messages enable row level security;

-- Session Messages RLS policies:
-- Users can only view messages belonging to sessions they own
drop policy if exists "Users can view messages from own sessions" on public.session_messages;
create policy "Users can view messages from own sessions"
  on public.session_messages
  for select
  using (
    exists (
      select 1 from public.sessions
      where sessions.id = session_messages.session_id
        and sessions.user_id = auth.uid()
    )
  );

-- Users can only insert messages into sessions they own
drop policy if exists "Users can insert messages into own sessions" on public.session_messages;
create policy "Users can insert messages into own sessions"
  on public.session_messages
  for insert
  with check (
    exists (
      select 1 from public.sessions
      where sessions.id = session_messages.session_id
        and sessions.user_id = auth.uid()
    )
  );


-- 4. INDEXES FOR PERFORMANCE
create index if not exists idx_scenarios_category on public.scenarios(category);
create index if not exists idx_scenarios_difficulty on public.scenarios(difficulty);
create index if not exists idx_sessions_user_id on public.sessions(user_id);
create index if not exists idx_sessions_status on public.sessions(status);
create index if not exists idx_session_messages_session_id on public.session_messages(session_id);
create index if not exists idx_session_messages_created_at on public.session_messages(session_id, created_at asc);


-- 5. AUTO-UPDATE UPDATED_AT TRIGGERS
drop trigger if exists on_scenarios_updated on public.scenarios;
create trigger on_scenarios_updated
  before update on public.scenarios
  for each row execute procedure public.handle_updated_at();

drop trigger if exists on_sessions_updated on public.sessions;
create trigger on_sessions_updated
  before update on public.sessions
  for each row execute procedure public.handle_updated_at();


-- 6. SEED DATA (SAFE TO RE-RUN VIA ON CONFLICT / UNIQUE TITLE CHECK)
-- Ensure title uniqueness constraint so re-running migrations does not duplicate seeds
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'scenarios_title_key'
  ) then
    alter table public.scenarios add constraint scenarios_title_key unique (title);
  end if;
end $$;

insert into public.scenarios (
  category,
  title,
  description,
  role,
  user_role,
  difficulty,
  goals,
  scenario_instructions,
  starter_prompts
)
values
  -- Career & Jobs
  (
    'Career & Jobs',
    'Tech Lead Behavioral Interview: Handling Conflict',
    'Practice navigating a high-stakes behavioral interview focusing on cross-functional engineering conflict and architecture disagreements.',
    'VP of Engineering',
    'Senior Software Engineer Candidate',
    'Advanced',
    array[
      'Use the STAR method (Situation, Task, Action, Result) to structure examples',
      'Demonstrate empathy and constructive problem-solving over defensive debate',
      'Articulate clear business and engineering outcomes'
    ],
    'The VP of Engineering evaluates your technical leadership, maturity, and communication during team friction. Ask targeted, incisive questions about real-world scenarios where trade-offs caused disagreement.',
    array[
      'Hello. Tell me about a time when you strongly disagreed with a product manager or team lead on a technical trade-off.',
      'Can you describe a situation where a project missed a critical milestone due to team friction?'
    ]
  ),
  (
    'Career & Jobs',
    'Compensation & Promotion Negotiation',
    'Practice negotiating salary, level advancement, and benefits with an executive recruiter or manager with confidence and data.',
    'Director of Talent Acquisition',
    'Candidate / Current Employee',
    'Intermediate',
    array[
      'Anchor discussions around market benchmark data and concrete business impact',
      'Maintain an assertive yet collaborative tone without making ultimatums',
      'Explore non-base compensation levers (equity, bonuses, flexible schedule)'
    ],
    'The recruiter respects market value but has band constraints. They will test your willingness to justify your target compensation using past achievements and future ROI.',
    array[
      'Thanks for taking the time to review the initial proposal. What are your thoughts on the compensation numbers we outlined?',
      'We love your background, but our budget for this role is strictly capped at $130,000. How do you feel about moving forward?'
    ]
  ),

  -- Education
  (
    'Education',
    'Graduate School Admissions / PhD Defense',
    'Defend your research thesis or explain your graduate academic pursuits to an exacting admissions committee chair.',
    'Academic Committee Chair',
    'Prospective Scholar / Thesis Candidate',
    'Advanced',
    array[
      'Explain complex theoretical concepts clearly and concisely',
      'Justify methodological rigor and acknowledge research boundaries',
      'Demonstrate genuine intellectual curiosity and long-term research commitment'
    ],
    'The Committee Chair is inquisitive and skeptical. They look for clarity of scientific thought, resilience under scrutiny, and originality in problem definition.',
    array[
      'Welcome. In two minutes, could you summarize the central novelty of your proposed research and why traditional frameworks fail?',
      'What do you believe is the single weakest assumption in your methodology?'
    ]
  ),
  (
    'Education',
    'College Scholarship Final Round Panel',
    'Communicate your lived experience, community contribution, and educational goals to a merit scholarship foundation.',
    'Foundation Trustee',
    'Scholarship Finalist',
    'Intermediate',
    array[
      'Articulate a compelling, authentic personal narrative',
      'Connect academic aspirations with real community service or civic impact',
      'Convey grit and resourcefulness when encountering adversity'
    ],
    'The Trustee values authenticity, community leadership, and fiscal responsibility. They want to see how this scholarship directly unlocks exponential impact.',
    array[
      'Congratulations on making it to the final stage. Why does this scholarship matter to you beyond financial assistance?',
      'Tell us about a moment when you had to take initiative outside of the classroom.'
    ]
  ),

  -- Business & Startups
  (
    'Business & Startups',
    'Seed Stage Venture Capital Pitch',
    'Pitch your startup value proposition, customer traction, and defensibility to an analytical early-stage VC investor.',
    'General Partner at Early-Stage Fund',
    'Startup Founder & CEO',
    'Advanced',
    array[
      'Deliver an airtight 60-second elevator pitch',
      'Explain unit economics, customer acquisition cost, and retention loops',
      'Defend unfair advantages against well-funded incumbents'
    ],
    'The Partner seeks rapid clarity on TAM, founder-market fit, and moat. They interrupt with clarifying queries if answers veer into generic buzzwords.',
    array[
      'Good to connect. What is the acute problem you are solving, and why are customers unable to solve it with existing tools?',
      'What gave you confidence in your pricing model? Walk me through your unit economics.'
    ]
  ),
  (
    'Business & Startups',
    'Enterprise B2B Discovery Call',
    'Conduct an effective discovery session with a prospective enterprise client to uncover operational pain points without overselling.',
    'Head of Operations',
    'Enterprise Solutions Consultant',
    'Beginner',
    array[
      'Ask open-ended discovery questions rather than premature product pitching',
      'Map organizational pain to quantifiable business costs',
      'Establish a clear next action for technical stakeholder review'
    ],
    'The Operations Leader is busy and protective of internal team bandwidth. They will only open up if they feel you understand their day-to-day workflow friction.',
    array[
      'We have about 20 minutes today. Our current workflows are frankly messy, but we are hesitant to adopt another tool. Where do you want to start?',
      'What typically causes software rollouts to fail in companies of our size?'
    ]
  ),

  -- Social & Communication
  (
    'Social & Communication',
    'Setting Healthy Boundaries with a Peer or Colleague',
    'Practice addressing overreach, workload dumping, or uncomfortable interpersonal requests calmly and firmly.',
    'Senior Colleague',
    'Team Member',
    'Beginner',
    array[
      'State boundaries clearly without over-apologizing or making excuses',
      'Offer alternative collaborative options when appropriate',
      'Keep composure and de-escalate defensive reactions'
    ],
    'The colleague is well-meaning but accustomed to delegating surplus work to you. They may initially push back, testing your resolve.',
    array[
      'Hey, I really need someone to take over the client status presentation tomorrow morning. Can you handle it for me?',
      'Everyone else is swamped, so I assumed you would be fine taking this on. Is that a problem?'
    ]
  ),
  (
    'Social & Communication',
    'Delivering Constructive Critical Feedback',
    'Provide actionable, empathetic feedback to a peer whose recent performance or communication affected a collective deliverable.',
    'Project Collaborator',
    'Lead Coordinator',
    'Intermediate',
    array[
      'Separate observable behaviors from subjective intent or personality',
      'Focus on shared project goals and collaborative remediation',
      'Listen actively to the other party perspective'
    ],
    'The collaborator feels defensive initially and may attribute issues to unfair constraints. Work towards mutual alignment.',
    array[
      'You wanted to talk about our last client sprint deliverable? I thought everything turned out fine.',
      'I was working under impossible deadlines, so I do not see why my approach is being singled out.'
    ]
  ),

  -- Everyday Life
  (
    'Everyday Life',
    'Apartment Rental Negotiation & Lease Concerns',
    'Negotiate essential repairs, lease terms, and rent increase adjustments directly with a property manager.',
    'Property Manager',
    'Prospective / Existing Tenant',
    'Beginner',
    array[
      'Clearly detail maintenance concerns with documented timeline',
      'Reference reasonable lease clauses and local tenant standards',
      'Reach an agreeable resolution in a firm, polite manner'
    ],
    'The property manager is protective of building margins but values reliable, communicative tenants. They will negotiate if presented with fair, organized facts.',
    array[
      'Hello, I saw your email regarding the proposed lease renewal and the heating issue. What is your primary concern?',
      'Building maintenance costs have increased across the board this year, which is why the rate is adjusted.'
    ]
  ),
  (
    'Everyday Life',
    'Difficult Customer Service Dispute Resolution',
    'Navigate an unfair billing charge or damaged product return with an escalated service representative.',
    'Customer Care Supervisor',
    'Consumer',
    'Intermediate',
    array[
      'Maintain calm authority despite bureaucratic policy hurdles',
      'Present factual records, transaction dates, and policy commitments',
      'Secure a refund, credit, or resolution path without aggressive escalation'
    ],
    'The supervisor operates within policy guidelines. They will respond positively if you state the facts clearly and hold firm on customer agreement rights.',
    array[
      'Thank you for holding. My name is Alex. I understand you are disputing the cancellation fee on your account?',
      'Our standard policy states that all subscriptions are non-refundable after 14 days, regardless of usage.'
    ]
  )
on conflict (title) do update set
  category = excluded.category,
  description = excluded.description,
  role = excluded.role,
  user_role = excluded.user_role,
  difficulty = excluded.difficulty,
  goals = excluded.goals,
  scenario_instructions = excluded.scenario_instructions,
  starter_prompts = excluded.starter_prompts,
  updated_at = timezone('utc'::text, now());
