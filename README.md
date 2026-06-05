# VibeCouncil

> Turn multiple AI web apps into a browser-based expert council.

**VibeCouncil** is a browser-based multi-AI discussion orchestrator that distributes tasks to multiple AI web apps, collects their responses, coordinates structured discussion rounds, and synthesizes final answers without requiring direct API integration.

It helps users turn ChatGPT, DeepSeek, Gemini, Qwen, Claude, and other AI web apps into a structured expert committee inside the browser.

---

## ✨ One-line Pitch

**VibeCouncil turns your browser into a multi-AI roundtable, where different AI assistants think independently, challenge each other, and work together to produce better final answers.**

中文宣传语：

> **VibeCouncil：把多个 AI 网站变成浏览器里的专家委员会。一次提问，多方讨论，交叉评审，最终共识。**

---

## Why VibeCouncil?

Many people already use multiple AI assistants every day.

Different models have different strengths:

* ChatGPT may be strong at structured reasoning and planning.
* DeepSeek may be strong at Chinese technical analysis and implementation detail.
* Gemini may provide broader context and alternative perspectives.
* Qwen may be strong in Chinese expression and local ecosystem adaptation.
* Claude may be strong at writing, critique, and document refinement.

But using them together is still manual and inefficient.

You usually need to:

* Copy the same prompt into multiple AI websites.
* Wait across several tabs.
* Compare answers manually.
* Ask each model to review the others.
* Merge scattered responses into a final conclusion.

VibeCouncil automates this workflow through a browser extension.

It is not just a multi-AI prompt broadcaster.

It is designed as a **structured discussion engine** based on mature human discussion and decision-making models.

---

## Core Concept

```text
User Task
  ↓
VibeCouncil Browser Extension
  ↓
Multiple AI Web Apps
  ↓
Independent Responses
  ↓
Structured Discussion Rounds
  ↓
Cross-review / Debate / Scoring / Risk Analysis
  ↓
Final Synthesis
```

VibeCouncil works through browser automation and page interaction.

The user logs into AI websites with their own accounts. VibeCouncil coordinates the workflow by opening tabs, injecting prompts, collecting responses, managing discussion rounds, and generating a final result.

---

## Product Positioning

VibeCouncil is:

* A browser-based multi-AI workflow assistant.
* A structured discussion orchestrator.
* A local-first AI collaboration tool.
* A bridge between human decision workflows and AI web apps.

VibeCouncil is not:

* An API wrapper.
* A platform bypass tool.
* A scraping service.
* An account automation farm.
* A tool for bypassing login, paywalls, captchas, or platform limits.

The goal is to improve multi-AI collaboration while respecting platform boundaries and user control.

---

## Key Features

### 1. Multi-AI Task Distribution

Send one task to multiple AI web apps from a unified Side Panel.

Possible supported platforms include:

* ChatGPT
* DeepSeek
* Gemini
* Qwen
* Claude
* Kimi
* Doubao
* Grok
* Perplexity
* Other web-based AI assistants

---

### 2. Browser-based Orchestration

VibeCouncil uses browser extension capabilities instead of direct API integration.

Core mechanisms:

* Chrome Extension
* Side Panel UI
* Content Scripts
* DOM interaction
* Tab management
* Local storage
* Adapter-based platform integration

---

### 3. Response Collection

VibeCouncil collects responses from different AI websites and organizes them into one discussion session.

Each response can be tracked by:

* AI platform
* Assigned role
* Discussion round
* Prompt used
* Response content
* Confidence score
* Execution status
* Timestamp

---

### 4. Structured Discussion Rounds

VibeCouncil can coordinate multiple rounds of discussion.

Example:

```text
Round 1: Independent answers
Round 2: Anonymous synthesis
Round 3: Critique and revision
Round 4: Final judge synthesis
```

This helps reduce shallow one-shot answers and encourages deeper reasoning.

---

### 5. Final Synthesis

After collecting and organizing responses, VibeCouncil can send the complete discussion context to a selected judge AI or synthesis workflow.

The final result may include:

* Consensus
* Disagreements
* Key arguments
* Risks
* Uncertainties
* Recommended solution
* Action items
* Decision matrix
* Final report

---

## Discussion Model System

VibeCouncil is built around a pluggable discussion model system.

Instead of only broadcasting prompts to multiple AI websites, VibeCouncil turns mature human discussion models into reusable AI workflows.

---

## Built-in Discussion Modes

### 1. Parallel Mode

**Best for quick comparison.**

All selected AI members answer the same task independently.

```text
Task
  ↓
AI A / AI B / AI C answer independently
  ↓
VibeCouncil collects responses
  ↓
Compare and summarize
```

Use cases:

* Quick research
* Writing drafts
* Prompt comparison
* Simple technical questions
* Multi-model answer comparison

---

### 2. Delphi Mode

**Best for expert consensus and risk evaluation.**

Inspired by the Delphi Method, this mode emphasizes independent judgment, anonymous aggregation, and multi-round convergence.

```text
Round 1: Independent answers
Round 2: Anonymous aggregation
Round 3: Re-evaluation based on group feedback
Round 4: Consensus and uncertainty summary
```

Use cases:

* Risk assessment
* Technical roadmap planning
* Security priority ranking
* Project estimation
* Strategic planning
* Architecture evaluation

---

### 3. Debate Mode

**Best for open-ended problems and opinion collision.**

Inspired by leaderless group discussion, this mode allows AI members to challenge, supplement, and revise each other’s views.

```text
Round 1: Initial positions
Round 2: Critique others
Round 3: Defend or revise
Round 4: Final synthesis
```

Use cases:

* Product strategy
* Architecture review
* Security solution design
* Investment analysis
* Complex decision-making

---

### 4. Six Hats Mode

**Best for structured multi-perspective thinking.**

Inspired by the Six Thinking Hats model, this mode assigns different thinking roles to different AI members.

| Hat        | Role                              |
| ---------- | --------------------------------- |
| White Hat  | Facts, data, known information    |
| Red Hat    | Intuition, emotion, preference    |
| Black Hat  | Risks, weaknesses, objections     |
| Yellow Hat | Value, opportunity, benefits      |
| Green Hat  | Creativity, alternatives          |
| Blue Hat   | Process control and final summary |

Use cases:

* Product design
* Feature planning
* Creative brainstorming
* Strategy review
* Balanced decision-making

---

### 5. Red-Blue Review Mode

**Best for security, architecture, and adversarial review.**

This mode is designed for security practitioners, architects, and technical reviewers.

```text
Blue Team: Proposes the solution
Red Team: Attacks and challenges the solution
Purple Team: Integrates both sides and improves the design
Auditor: Reviews compliance, cost, and feasibility
Judge: Produces the final recommendation
```

Use cases:

* SOC platform design
* AI agent security review
* DevSecOps planning
* Threat modeling
* Security architecture review
* Incident response planning

---

### 6. Premortem Mode

**Best for finding failure risks before execution.**

This mode asks AI members to assume the project has already failed and reason backward.

```text
Assume the plan failed after 6 months
  ↓
Identify likely failure causes
  ↓
Group risks by category
  ↓
Design prevention measures
  ↓
Generate risk mitigation plan
```

Use cases:

* Project kickoff
* Product launch review
* Architecture deployment
* Security transformation
* Startup idea validation
* Roadmap risk analysis

---

### 7. Decision Matrix Mode

**Best for tool selection and solution comparison.**

AI members score multiple options across structured dimensions.

```text
Define candidates
  ↓
Define evaluation criteria
  ↓
Each AI scores independently
  ↓
Aggregate scores and disagreements
  ↓
Explain differences
  ↓
Recommend final option
```

Use cases:

* Technology selection
* AI model comparison
* Vendor evaluation
* Architecture trade-off analysis
* Open-source project selection
* Build vs buy decision

---

### 8. OODA Mode

**Best for security operations and dynamic decision-making.**

Inspired by the OODA loop:

```text
Observe → Orient → Decide → Act
```

VibeCouncil can map different AI members to each phase.

```text
Observe AI: Collects facts and signals
Orient AI: Analyzes context and root causes
Decide AI: Proposes decisions
Act AI: Breaks decisions into actions
Judge AI: Produces the final response plan
```

Use cases:

* Security alert triage
* Incident response
* System failure analysis
* Vulnerability handling
* Operational decision-making

---

### 9. AAR Mode

**Best for review and retrospective.**

Inspired by After Action Review.

```text
What was expected?
What actually happened?
Why was there a gap?
What should be improved next time?
```

Use cases:

* Project retrospective
* Incident review
* Security event review
* Decision review
* Team collaboration review

---

## Recommended Default Workflow

The recommended default workflow is a hybrid of **Delphi Mode** and **Debate Mode**.

```text
Round 1: Independent Answer
Each AI answers independently without seeing others’ responses.

Round 2: Anonymous Synthesis
VibeCouncil anonymizes and summarizes consensus, disagreements, and missing points.

Round 3: Critique and Revise
Each AI reviews the anonymous synthesis, challenges weak points, and updates its view.

Round 4: Final Judge
A selected judge AI synthesizes all discussion rounds into the final answer.
```

Why this works well:

* Reduces early opinion pollution.
* Avoids blind agreement.
* Encourages critique.
* Preserves minority viewpoints.
* Produces more structured final answers.

---

## Anti-Pollution Design

To improve discussion quality, VibeCouncil includes several anti-pollution mechanisms.

### Independent First Round

The first round is always independent.

AI members do not see each other’s answers before forming their own initial views.

### Anonymous Synthesis

Before cross-review, VibeCouncil aggregates responses anonymously.

This prevents later models from being biased by model names or perceived authority.

### Forced Disagreement Prompting

AI members are explicitly asked to identify:

* What they agree with.
* What they disagree with.
* What is missing.
* What they would revise.
* Whether their view changed and why.

### Change Reason Tracking

If an AI changes its position, it must explain the reason.

This makes the discussion traceable and easier to audit.

---

## Architecture Overview

VibeCouncil uses a lightweight Chrome Extension architecture.

```text
Chrome Extension
  ├── Side Panel UI
  │   ├── Question input
  │   ├── Discussion configuration
  │   ├── Progress timeline
  │   ├── Discussion log
  │   └── Final result
  │
  ├── Orchestrator
  │   ├── Discussion state machine
  │   ├── Round scheduler
  │   ├── Prompt generator
  │   └── Result coordinator
  │
  ├── Platform Adapters
  │   ├── ChatGPT Adapter
  │   ├── Gemini Adapter
  │   ├── DeepSeek Adapter
  │   ├── Qwen Adapter
  │   └── More adapters
  │
  ├── Content Scripts
  │   ├── DOM input
  │   ├── Response detection
  │   ├── Generation status tracking
  │   └── Result extraction
  │
  └── Local Storage
      ├── Discussion history
      ├── User settings
      ├── Adapter configuration
      └── Custom templates
```

---

## Core Modules

### Adapter

Platform-specific DOM interaction layer.

Each AI website is integrated through an adapter that implements a unified interface.

```ts
interface AIPlatformAdapter {
  id: string;
  name: string;
  hostPattern: string;

  sendPrompt(text: string): Promise<void>;
  waitForResponse(): Promise<string>;
  isReady(): Promise<boolean>;
}
```

---

### Orchestrator

The discussion control engine.

It handles:

* Task creation
* Round execution
* Prompt generation
* AI member coordination
* Result collection
* State transitions
* Failure handling

---

### Discussion Strategy

Each discussion mode is implemented as a strategy.

```ts
interface DiscussionStrategy {
  id: string;
  name: string;
  description: string;
  supportedRounds: [number, number];
  requiredParticipants: number;
  generatePrompt(context: RoundContext): string;
  advanceRound(state: DiscussionState): RoundAction[];
}
```

---

### Side Panel UI

The user-facing control center.

It provides:

* Question input
* Platform selection
* Discussion mode selection
* Round configuration
* Judge selection
* Progress timeline
* Discussion log
* Final result view
* Copy and export actions

---

## Data Model

### DiscussionSession

```ts
interface DiscussionSession {
  id: string;
  question: string;
  strategy: DiscussionStrategy;
  config: DiscussionConfig;
  status: DiscussionStatus;
  rounds: Round[];
  finalConclusion?: Conclusion;
  createdAt: number;
  completedAt?: number;
}
```

### DiscussionConfig

```ts
interface DiscussionConfig {
  rounds: number;
  judgeAdapterId: string;
  promptStyle: 'strict' | 'creative' | 'neutral';
  participantIds: string[];
}
```

### Round

```ts
interface Round {
  roundNumber: number;
  type: 'independent' | 'anonymous_synthesis' | 'critique_revise' | 'judge';
  responses: AIResponse[];
  synthesis?: AnonymousSynthesis;
}
```

### AIResponse

```ts
interface AIResponse {
  adapterId: string;
  status: 'pending' | 'streaming' | 'completed' | 'failed';
  content: string;
  confidence?: number;
  changedMind?: boolean;
  changeReason?: string;
  error?: string;
  startedAt: number;
  completedAt?: number;
}
```

---

## Side Panel Experience

The Side Panel is the main control center of VibeCouncil.

```text
┌──────────────────────────────┐
│  VibeCouncil          [⚙️]   │
├──────────────────────────────┤
│  📝 Question                  │
│  ┌──────────────────────────┐│
│  │ Enter your task...        ││
│  └──────────────────────────┘│
│  [Mode ▼] [Rounds ▼]         │
│  [Judge ▼] [Style ▼]         │
│  [Start Discussion]          │
├──────────────────────────────┤
│  📊 Progress                  │
│  ● Round 1: Independent ✅    │
│  ◐ Round 2: Synthesis ⏳     │
│  ○ Round 3: Critique          │
│  ○ Round 4: Judge             │
├──────────────────────────────┤
│  💬 Discussion Log            │
│  [All] [ChatGPT] [Gemini]     │
│  ┌─ Round 1 ──────────────┐  │
│  │ ChatGPT: ... 4/5        │  │
│  │ Gemini: ... 3/5         │  │
│  └────────────────────────┘  │
├──────────────────────────────┤
│  🏆 Final Conclusion          │
│  [Copy] [Export] [Retry]      │
└──────────────────────────────┘
```

---

## Storage Design

VibeCouncil follows a local-first storage model.

| Data                     | Storage                  | Lifecycle         |
| ------------------------ | ------------------------ | ----------------- |
| Discussion history       | chrome.storage.local     | Persistent        |
| Current discussion state | Side Panel memory        | Runtime           |
| Adapter selector config  | chrome.storage.local     | Persistent        |
| User settings            | chrome.storage.sync      | Cross-device sync |
| Discussion templates     | Built-in + local storage | Persistent        |

Default behavior:

* Data is stored locally.
* No server is required.
* No user account is required.
* Users can clear history at any time.

---

## Privacy and Security

VibeCouncil is designed with a local-first privacy model.

Principles:

* No API key required by default.
* No cloud sync by default.
* No password collection.
* No cookie extraction.
* No captcha bypass.
* No paywall bypass.
* No hidden background automation.
* No unrelated page data collection.

Users remain responsible for complying with the terms of each AI platform they use.

---

## Compliance Boundary

VibeCouncil should only assist with user-controlled browser workflows.

It should not:

* Reverse engineer private APIs.
* Circumvent access controls.
* Bypass platform restrictions.
* Automate account registration.
* Bypass rate limits.
* Misrepresent itself as an official integration.
* Extract data from unrelated websites.

Recommended default behavior:

* Manual confirmation before sending prompts.
* Visible execution progress.
* Clear user control.
* Safe failure handling.
* Rate-limited task execution.

---

## Error Handling

Common failure cases:

| Scenario                  | Handling                                         |
| ------------------------- | ------------------------------------------------ |
| AI platform not logged in | Pause and ask user to log in                     |
| DOM selector failed       | Try fallback selectors or mark adapter as broken |
| Response timeout          | Mark member as failed and continue               |
| Response truncated        | Detect “continue” action when possible           |
| Rate limit or paywall     | Pause and ask user to handle manually            |
| Tab closed                | Mark failed or reopen tab with confirmation      |
| Extension reload          | Restore session from local state when possible   |
| Concurrent tasks          | Allow only one active discussion in MVP          |

---

## Technology Stack

| Layer              | Choice                                     |
| ------------------ | ------------------------------------------ |
| Extension standard | Chrome Extension Manifest V3               |
| Language           | TypeScript                                 |
| Build tool         | Vite + CRXJS                               |
| UI framework       | React                                      |
| State management   | Zustand                                    |
| Styling            | Tailwind CSS                               |
| Testing            | Vitest + Testing Library                   |
| Storage            | chrome.storage.local / chrome.storage.sync |

---

## Project Structure

```text
vibe-council/
├── manifest.json
├── vite.config.ts
├── package.json
├── tsconfig.json
├── src/
│   ├── background/
│   │   └── index.ts
│   ├── sidepanel/
│   │   ├── index.html
│   │   ├── main.tsx
│   │   ├── App.tsx
│   │   ├── components/
│   │   │   ├── QuestionInput.tsx
│   │   │   ├── ProgressTimeline.tsx
│   │   │   ├── DiscussionLog.tsx
│   │   │   ├── FinalConclusion.tsx
│   │   │   ├── PlatformStatus.tsx
│   │   │   └── Settings.tsx
│   │   └── store/
│   │       └── discussionStore.ts
│   ├── adapters/
│   │   ├── base.ts
│   │   ├── registry.ts
│   │   ├── chatgpt/
│   │   ├── gemini/
│   │   ├── deepseek/
│   │   └── qwen/
│   ├── strategies/
│   │   ├── base.ts
│   │   ├── registry.ts
│   │   ├── parallel.ts
│   │   ├── delphi.ts
│   │   ├── debate.ts
│   │   ├── six-hats.ts
│   │   ├── red-blue.ts
│   │   └── matrix.ts
│   ├── orchestrator/
│   │   ├── index.ts
│   │   ├── tab-manager.ts
│   │   └── anonymizer.ts
│   ├── messaging/
│   │   └── index.ts
│   ├── utils/
│   │   ├── dom.ts
│   │   └── text.ts
│   └── types/
│       └── index.ts
└── tests/
    ├── adapters/
    ├── strategies/
    └── orchestrator/
```

---

## Roadmap

### Phase 1: MVP

Goal: Validate the core multi-AI workflow.

Features:

* Chrome Extension basic framework
* Side Panel UI
* Task input
* Platform selection
* ChatGPT adapter
* Gemini adapter
* Basic prompt injection
* Basic response collection
* Parallel Mode
* Markdown copy

---

### Phase 2: Structured Discussion

Goal: Add real discussion orchestration.

Features:

* Delphi Mode
* Debate Mode
* Round state machine
* Anonymous synthesis
* Judge synthesis
* Discussion history
* Failure handling

---

### Phase 3: Role-based Workflows

Goal: Add reusable expert templates.

Features:

* Six Hats Mode
* Red-Blue Review Mode
* Decision Matrix Mode
* Custom roles
* Custom prompt templates
* Export to Markdown / HTML

---

### Phase 4: Stable Release

Goal: Make VibeCouncil reliable enough for daily use.

Features:

* More AI platform adapters
* Adapter fallback selectors
* Platform readiness detection
* Selector calibration
* Better timeout handling
* Local-first privacy settings
* Chrome Web Store release preparation

---

## Example Use Cases

### Technical Architecture Review

Use multiple AI assistants as:

* Architect
* Implementation reviewer
* Risk reviewer
* Cost reviewer
* Final judge

Output:

* Architecture recommendation
* Risk list
* Implementation plan
* Trade-off analysis

---

### Security Review

Use Red-Blue Review Mode.

Output:

* Defensive design
* Attack paths
* Security weaknesses
* Purple team improvements
* Final remediation plan

---

### Product Planning

Use Six Hats Mode or Delphi Mode.

Output:

* User value
* Feature risks
* MVP scope
* Roadmap
* Open questions

---

### Tool Selection

Use Decision Matrix Mode.

Output:

* Candidate comparison
* Scoring table
* Key disagreements
* Final recommendation

---

### Incident Review

Use OODA Mode or AAR Mode.

Output:

* Facts
* Root cause
* Impact
* Response plan
* Lessons learned

---

## Design Principles

### 1. Local First

Keep user data local by default.

### 2. User Controlled

The user should always understand what the extension is doing.

### 3. No Platform Bypass

Do not bypass login, paywalls, captchas, or rate limits.

### 4. Structured over Chaotic

Multi-AI collaboration should be guided by explicit discussion models.

### 5. Adapter-based Extensibility

Each AI website should be integrated through a modular adapter.

### 6. Discussion Traceability

Every conclusion should be traceable back to discussion rounds and member responses.

---

## Development Status

VibeCouncil is currently in the design and MVP planning stage.

The first implementation target is:

```text
Chrome Extension
  + Side Panel
  + ChatGPT Adapter
  + Gemini Adapter
  + Parallel Mode
  + Basic response collection
```

---

## Disclaimer

VibeCouncil is an independent browser workflow assistant.

It is not affiliated with OpenAI, Google, Anthropic, DeepSeek, Alibaba, or any other AI platform.

Users are responsible for complying with the terms of service of the AI platforms they use.

---

## License

TBD.

---

## Summary

VibeCouncil is not just a multi-AI prompt sender.

It is a browser-based expert council system that brings structured human discussion models into multi-AI workflows.

The long-term vision is simple:

> Give every user a private AI expert committee inside their browser.
