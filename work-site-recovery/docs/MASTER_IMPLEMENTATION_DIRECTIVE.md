# MTS Training Arena — MASTER IMPLEMENTATION DIRECTIVE

## Mission

Continue developing the **existing MTS Training Arena project** into a complete, production-ready interactive training and competition platform.

**This is a continuation project, not a new build.** Inspect the existing implementation, preserve its working features, recover and build on the most advanced codebase, and complete the agreed product specification.

The user has access to connected **GitHub, Cloudflare, and Firebase** services. Use these services directly where available, according to their actual permissions and the confirmed project configuration.

Do not repeatedly ask the user to make minor technical or visual decisions. Take ownership of those decisions and proceed.

**Contact the user when an essential intervention is required**, especially for unavailable permissions, secrets, project ownership ambiguity, destructive operations, paid services, or changes that could affect an existing production application.

## 1. Existing Project Discovery

Inspect the GitHub account `hazemshaaban77` and investigate the existing project implementations, including:

- `MTS-Training-Arena`
- `MTS-Quiz`
- The branch `feature/mts-training-arena-foundation`, if present.
- Existing GitHub Pages deployments and relevant branches.
- Existing Firebase projects, database structures, security rules, and authentication setup.
- Existing Cloudflare Workers, bindings, and deployment configuration.
- The previously created ChatGPT Work version, if accessible.

Determine which codebase is the most complete and the correct continuation target based on actual source history, application functionality, and the user's existing Work project.

**Do not create an unrelated replacement application.**

Preserve the original Nafeza Quiz and other existing working projects. Do not overwrite legacy production data or deployments.

Inspect CI and deployment failures, especially the existing game-engine and Firebase security-rule tests. Investigate reported exposed API-key alerts and distinguish public client configuration from genuinely sensitive credentials.

Record the baseline before making changes.

## 2. Product Identity

Product name: **MTS Training Arena**

Build an original, futuristic, cinematic training platform inspired by premium TV talent and game shows.

Key requirements:

- MTS corporate color palette.
- Original MTS and Training Team logos displayed proportionally throughout.
- Reuse existing authorized logo assets, including `mts.png` and `training.png` where available.
- Fully responsive Arabic and English support with RTL/LTR.
- Independent language preference per user.
- Different virtual stages and visual identities for different activities.
- Hybrid 2D/3D scenes optimized for each device.
- High-quality lighting, motion, reveal sequences, and audio.
- Adaptive cinematic intensity appropriate to each activity.
- Trainer-controlled sound, effects intensity, and Quiet Mode.
- Cinematic projector output with fast, accessible mobile interactions.
- No generic Google Forms-style activity interfaces.
- No unnecessarily long camera sweeps or excessive waiting animations.

## 3. Roles and Permissions

Support:

1. Admin
2. Senior Trainer
3. Trainer

Only Admin can create trainer accounts and manage global branding, logos, and system settings.

Senior Trainer has Trainer permissions plus access to authorized team reports.

All trainers may view the shared session catalog, but may edit and operate only sessions they own, subject to administrator authorization.

Support email/password authentication, with future Google Login compatibility.

Enforce authorization on backend/database operations, not only the user interface.

## 4. Trainer Dashboard and Session Builder

Provide a customizable dashboard and logically grouped sections:

- Sessions
- Game Library
- Activity Builder
- Question Bank
- Media Library
- Templates
- Shared and Personal Libraries
- Surveys
- Reports
- Teams
- Settings

Support session creation from scratch, templates, and duplication.

Use a Visual Builder with detailed configuration panels.

Support drag-and-drop activity ordering and Timeline, Card, and List views.

Allow unlimited logical questions per game, subject to performance and storage limits.

Support Sections and game-specific stages.

Provide global settings that individual activities and questions may override.

Support auto-save, manual save, preview, draft management, and full session simulation.

A trainer can configure manual or automatic progression, with live manual intervention.

Allow edits to future activities during a live session without modifying started questions, confirmed answers, or finalized scores.

## 5. One-QR Session Architecture

**Non-negotiable: exactly one QR code per session.**

The participant scans it once, enters:

- Name
- Employee ID
- Preferred language: Arabic or English

No permanent participant account is required.

The participant then stays in the same session through every activity.

Required flow:

Create Session → Review → Launch → Cinematic Lobby with QR → Join Participants → Trainer Starts → Sequential Activities → Results / Survey / Ceremony.

Late joiners require trainer approval.

Reconnect returning participants automatically while preserving confirmed progress and scores.

Support verified device replacement, ensuring that knowing an Employee ID alone does not allow session hijacking.

Prevent duplicate active identities, unauthorized answers, replayed requests, and double scoring.

Synchronize Trainer, Participant, and Projector views using authoritative backend state.

## 6. The 10 Main Activities

Implement all 10 as functioning engines, not static demonstrations.

### 6.1 Quiz Arena

- Mixed question types: MCQ, True/False, Dropdown, Match, Order, Image Hotspot, and predefined-answer Fill in the Blank where applicable.
- Exactly one correct answer per question. Exclude Multiple Answers as a scored question type in Quiz Arena.
- MCQ supports 2–4 choices.
- Organize questions into Sections.
- Immediate submit confirmation followed by waiting for answer reveal.
- First confirmed submission is final.
- Hybrid manual/automatic progression.
- Speed-based scoring.
- Animated circular timer.
- Pause freezes timer and submissions.
- Trainer adds time in increments of 10 seconds while time remains.
- Answers close automatically on timeout.
- Reveal and explanation follow trainer-configured rules.
- Live trainer sees response count.
- Optional leaderboard after questions, controlled by trainer.
- Final animated podium for the top 3 plus complete ranking.
- Lightweight question transitions and adaptive effects.

### 6.2 Wheel of Fortune

- Trainer-configured sectors, with practical display limits.
- Four outcome categories: Question, Prize, Penalty, Mystery.
- Equal selection probability among available sectors.
- Per-sector repeatability.
- Mini Quiz with multiple questions for Question sectors.
- Customizable rewards, privileges, symbolic prizes, and appropriate educational penalties.
- Individual/team turn selection, manual/random/sequential.
- Trainer-configurable number of rounds.
- Spin duration 4–12 seconds.
- Countdown 3–2–1 before spin.
- Cinematic player entrance card.
- Large authorized Spin button on selected participant's phone.
- Server-selected fair outcome.
- Automatic reveal 2 seconds after wheel stops.
- Reward celebration scaled to value.
- Per-sector penalty effects.
- Progressive Mystery card reveal.
- Short cinematic countdown before Mini Quiz.
- Automatic application of configured point changes after reveal.
- Recorded re-spin procedure for genuine errors.
- Trainer-controlled leaderboard display.
- Separate audio and effects controls for projector and mobile.

### 6.3 Ultimate Game Show

- Progressive-difficulty competition format inspired by major televised quiz shows, with an original identity.
- Trainer-configurable individual, team, and head-to-head participation by stage.
- Multiple stages with distinct futuristic environments, lighting, and sound.
- Increasing points per stage.
- Different question types and stage-specific challenges.
- Lifelines: 50:50, Audience Vote, +30 Seconds.
- Stage-specific consequences for wrong answers.
- Cinematic final-answer suspense.
- Two-second answer reveal delay.
- Increasing win celebrations.
- Animated removal of two wrong choices for 50:50.
- 3D audience-voting chart.
- Betting with points committed before the applicable question.
- Always-visible points and stage-end ranking.
- Risk Mode with red/gold dramatic lighting.
- Animated championship trophy ceremony.
- Mobile preserves stage identity with lighter effects.
- Full soundtrack and Quiet Mode.

### 6.4 Meta Plan

**A non-competitive training classification activity, not a game.**

- Trainer prepares categories and cards with text, images, and icons.
- Individual participants independently classify cards on mobile.
- Responsive drag/drop or tap-to-assign.
- Cards remain movable until submission.
- Require all cards to be classified before enabling Submit.
- No timer, points, or leaderboard.
- After submission show personal classification summary and waiting status.
- Trainer chooses manual close or automatic close after all eligible submissions.
- Projector displays a premium 3D board without revealing correct mappings while classification is active.
- After closing, trainer chooses Reveal All or progressive Reveal.
- Cards animate toward their correct categories.
- Participant sees personal correct/incorrect results after reveal.
- Trainer sees live analytics and can select what is projected.
- Support highlighting categories/cards, discussion notes, and hiding analytics.
- Calm motion and gentle sounds.
- Finish with an elegant card-consolidation scene.

### 6.5 Escape Room

- Individual, team, and collaborative modes.
- 1–5 rooms.
- Theme selection from original reusable environments.
- Hybrid 3D visuals and mobile-friendly puzzle interactions.
- Trainer-created mission narrative.
- Multiple puzzle types.
- Configurable door-unlock conditions.
- Configurable wrong-answer policy.
- Configurable hints and access conditions.
- Optional timer rules.
- Competitive or collaborative scoring.
- Configurable team collaboration.
- Trainer progress dashboard with room maps and puzzle states.
- Cinematic door-unlock and successful escape sequences.
- Support controlled mission pause, hints, clues, and auditable trainer overrides.

### 6.6 Live Poll

Non-scored live voting and feedback activity.

Choose a versatile implementation supporting multiple-choice, rating questions, word clouds, and prioritization where feasible.

Support trainer-configurable anonymous or identified polling, reveal timing, and voting changes. Protect anonymity at the data-access layer.

### 6.7 Order It

Interactive sequencing of steps, processes, or events.

Support mobile drag/drop and accessible tap-based reordering, automatic evaluation, explanations, and cinematic correct-order reveal.

### 6.8 Open the Box

Interactive virtual boxes containing questions, challenges, or surprises.

Support configurable box contents, selection and reuse rules, 3D opening effects, and safe score application.

### 6.9 Flashcards

A calm knowledge-revision experience with flipping cards, progress tracking, optional self-assessment, media support, and lightweight animation.

### 6.10 Scenario Challenge

Branching professional-training scenarios with decision points, consequences, multiple endings, discussion prompts, and optional scoring.

Design the last five activities with the same quality and integration standards. Do not ask the user to make minor implementation decisions.

## 7. Teams and Scoring

The trainer chooses an individual or team session.

Each activity may define its own team-scoring mechanics.

The trainer configures activity weights for the overall session score.

No arbitrary manual Bonus Points.

The trainer can show/hide the general leaderboard at any time.

Tie-breaking rules must be defined before the session starts.

End with a cinematic hierarchical top-three podium. For team sessions, show the leading three teams using the same podium concept.

Ensure scores are server-authoritative, deterministic, auditable, and applied only once.

Non-scored activities must never distort the leaderboard.

## 8. Training Surveys

Build a dedicated survey module separate from competition scoring.

Use cases:

- Pre-training needs assessment
- End-of-session feedback and trainer evaluation
- Post-training impact assessment

All trainers can create surveys and access authorized survey results.

Support anonymous and identified responses, with genuine protection for anonymous data.

Automatically run an attached end-of-session survey at its configured point in the session-ending sequence.

Provide charts, percentages, and averages.

Keep the UI premium, calm, and neutral.

## 9. Reports, Session Lifecycle and Recovery

Implement:

- Draft, Ready, Lobby, Live, Paused, Completed, Archived.
- Session duplication and templates.
- Recovery after trainer disconnects.
- Participant response and progress history.
- Attendance and participation.
- Individual and team scoring.
- Activity analytics.
- Survey analytics.
- Appropriate export capabilities.
- Audit logs and role-based report access.
- Consistent state recovery after page refresh and device reconnection.

## 10. Technology and Deployment

Use the existing connected technology stack wherever technically suitable:

**GitHub**
- Source management.
- Feature branches and pull requests.
- Automated CI tests.
- GitHub Pages for the static web application where suitable.

**Cloudflare**
- Workers for backend APIs and trusted actions.
- Security/rate limiting and service integrations as needed.
- Manage deployment and runtime bindings using available connected permissions.

**Firebase**
- Authentication for trainers.
- Realtime Database for session synchronization where appropriate.
- Security rules and tests.
- Existing project/data compatibility wherever safe.

Prefer free-tier solutions without introducing paid infrastructure.

Target reliable concurrent operation for **60–80 participants**, verified with realistic load tests.

No credentials or privileged secrets in frontend code or repository history. Audit previous security alerts and remediate actual exposures.

Do not weaken Firebase rules to make features work.

## 11. Autonomy and Approvals

You may use the connected GitHub, Cloudflare, and Firebase environments to investigate, implement, test, and prepare deployment within available permissions.

Proceed autonomously with routine reversible development steps.

Do not destroy or overwrite existing production projects, delete databases, rotate shared production credentials, introduce paid resources, or change the original Nafeza Quiz deployment without explicit approval.

For publishing changes, follow the user's current authorized deployment scope and any platform-required confirmation steps. If approval is required, prepare the exact changes and ask once with a concise explanation.

When blocked by missing access, request the specific action needed rather than stopping the whole project.

Never claim that a deployment or end-to-end flow works until it has been tested successfully.

## 12. Quality Gates

Test each feature with real interaction flows, not visual inspection alone.

Verify:

- Trainer registration/login/permissions.
- Full Session Builder.
- Exactly one QR across multiple sequential games.
- Late join approval.
- Trainer, participant, and projector state synchronization.
- Mobile Arabic/English interfaces.
- Reconnection and device replacement.
- Correct scoring and tie rules.
- Every activity's full play cycle.
- Survey data separation and anonymity.
- Projector effects and Quiet Mode.
- Mobile usability and performance.
- Firebase rule enforcement.
- Cloudflare backend security.
- CI success and clean deployment.
- No regression in the original quiz.

Use automated tests plus browser-based end-to-end testing where available.

## 13. Execution Procedure

1. Inspect the existing project and all connected services.
2. Identify the canonical continuation codebase.
3. Create an implementation inventory: working, incomplete, broken, and missing.
4. Fix the current build and CI failures.
5. Produce a practical implementation backlog.
6. Implement the core platform and real-time session flow first.
7. Integrate the activities progressively.
8. Complete scoring, surveys, reports, and permissions.
9. Add the full cinematic experience without sacrificing speed.
10. Run end-to-end, security, and load tests.
11. Deploy to the authorized preview/production environment.
12. Report working URLs, GitHub branch/PR, test results, remaining issues, and any required user approvals.

**Important:** Do not stop after generating a specification, mockup, screenshots, or a prototype.

Deliver a functioning, integrated continuation of the existing MTS Training Arena project.

Make technical decisions independently, but preserve all user-approved product decisions above.

If anything essential needs the user's involvement, ask clearly and specifically; otherwise continue implementation.
