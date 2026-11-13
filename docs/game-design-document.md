# Language Munchers — Game Design Document

**Status:** Draft 0.2 — research-informed planning baseline
**Implementation status:** Not started

## 1. Concept

Language Munchers is a single-player vocabulary-recognition game inspired by the grid-and-munch loop of the classic *Number Munchers* and *Word Munchers* games.

A frog occupies a grid of word tiles. Each round shows an English prompt at the top of the screen. The player moves the frog around the grid and deliberately eats every Czech, Standard German, or European Portuguese (`pt-PT`) tile that translates that English prompt. Tiles with other meanings are distractors.

The game teaches recognition of one concept across three target languages while preserving a short, spatial action loop. It will use an original frog, art direction, sound, UI, names, and implementation. It must not copy protected assets, interface layouts, audio, characters, terminology, or code from the Munchers games.

## 2. Research findings and design consequences

The original *Number Munchers* manual establishes the core pattern: use directional controls to move a player character over a grid, use a separate action to consume the current target, clear every target matching the rule at the top of the screen, and lose a Muncher for an incorrect target or enemy collision. It also uses lives, score, transient safe zones, several enemy behaviours, and escalating pressure across levels.[1]

*Word Munchers Deluxe* applies the same pattern to language exercises. Its documented options include topic and difficulty selection, ordered or random fact sequences, a Troggle-free mode, arrow-key movement, a separate Space action to munch, spoken target playback, and a life loss for a wrong answer or an enemy collision. It also introduces temporary invincibility and a reward break after three cleared boards.[4] The MECC product description explicitly presents the ability to turn off enemies as a way to give learners more time.[3]

### What Language Munchers should reuse

- **Rule-first boards:** keep the criterion visibly fixed above the grid for the entire round.
- **Move, then choose:** movement and answer selection must be separate actions. A player may stand on a tile, read it, and decide whether to eat it; movement alone must never submit an answer.
- **Clear-the-set objective:** the board ends only after all correct tiles currently placed on it are eaten.
- **Short, configurable practice:** let a player choose a small vocabulary group, a language mode, and ordered or randomized prompt sequencing. The original *Number Munchers* manual likewise documents choosing a range and progressing in order, which supports making study-set and sequencing choices explicit rather than hidden.[2]
- **A calm learning mode:** the default initial experience should have no enemies or timer. Speed pressure must not be required to practice vocabulary recognition.
- **Optional mastery pressure:** enemies, timer, score chase, streaks, and temporary protection are viable later modes, not baseline learning requirements.
- **Inter-board payoff:** use a small original celebration or progress summary after a fixed number of cleared boards; do not copy the Munchers' cutscenes.

### What Language Munchers should not reuse

- The Munchers games' characters, Troggles, “Muncher” naming, art, audio, exact scoring tables, cutscenes, or UI presentation.
- Enemy behaviours that mutate, remove, or replace answer tiles. That can be interesting arcade design, but it undermines a vocabulary exercise because the player can lose a planned answer through no learning-related mistake.
- Any mechanic that makes a language learner answer before the word is legible or before the player can opt into time pressure.

## 3. Player goal and round loop

### Round objective

Eat all and only the tiles that correctly translate the current English prompt.

### Required round loop

1. Select a vocabulary concept from the active study set.
2. Display its English value as the prompt.
3. Build a board with a mix of:
   - correct translations of that concept in Czech, Standard German, and/or `pt-PT`; and
   - distractor translations from other active concepts.
4. Let the player move the frog one grid square at a time without evaluating the tile.
5. Show a clear focus state for the tile under the frog.
6. On an explicit **Munch** action, evaluate the focused tile.
7. Resolve feedback immediately:
   - **Correct:** eat the tile, update round progress, and preserve the remaining board state.
   - **Incorrect:** apply the selected mistake rule, reveal the tile's correct English meaning, and record the event for potential review.
8. Complete the board only after every correct tile has been eaten; then show concise feedback and advance.

### Baseline control contract

| Action | Desktop keyboard | Requirement |
|---|---|---|
| Move | Arrow keys and WASD | Moves exactly one orthogonal tile. |
| Munch / select | Space or Enter | Evaluates only the focused tile. |
| Pause | Escape | Freezes game state and exposes resume/leave actions. |
| Replay prompt | `R` | Repeats the English prompt in text; future audio, if enabled, also plays here. |

Mouse, touch, and gamepad support are not decided. If mouse support is added, selecting a tile must not silently submit it; use a two-step focus-then-munch model or an equally deliberate accessible equivalent.

## 4. Vocabulary and language requirements

### Canonical source

The first corpus is the private [`vhnizda/vaclav-language-learning-path`](https://github.com/vhnizda/vaclav-language-learning-path) repository:

[`vocabulary/first-300-family-life.csv`](https://github.com/vhnizda/vaclav-language-learning-path/blob/main/vocabulary/first-300-family-life.csv)

The inspected source is a 300-row, stable-ID CSV with this schema:

| Field | Game use |
|---|---|
| `id` | Stable concept identifier; future save/progress key. |
| `group` | Study-set and difficulty grouping. |
| `english` | Top-of-screen prompt. |
| `czech` | Candidate tile text. |
| `german_standard` | Candidate tile text. |
| `portuguese_pt` | Candidate tile text. |
| `notes` | Display, validation, or content guidance where required. |

The corpus has 15 situational groups, from family and people through questions and connectors.

### Content fidelity

- English is the prompt language for the initial game.
- Tile languages are Czech, Standard German, and European Portuguese only.
- Standard German must retain the corpus's Swiss-context spelling and vocabulary where provided.
- Portuguese must remain `pt-PT`; Brazilian Portuguese must not be substituted.
- German and Portuguese articles are part of the answer text and must remain visible.
- Written gender alternatives and slash-separated alternatives must remain intact unless an explicit content rule replaces them.
- A CSV row represents one concept, not independent translation cards.

### Tile model and answer contract

A generated tile must retain display content, language, and concept provenance:

```text
conceptId: "001"
language: "czech" | "german_standard" | "portuguese_pt"
displayText: "rodina"
```

For a prompt with concept ID `P`, a tile is correct if and only if its `conceptId` is `P`. Display strings must not be re-parsed at runtime to decide correctness.

Before a board is shown, the generator must create and validate a board manifest containing:

- prompt concept ID;
- each tile's concept ID, language, and display text;
- each tile's correct/incorrect status;
- the count and positions of all correct tiles.

The manifest must guarantee at least one correct tile, at least one distractor, no malformed or empty display text, and no duplicate tile that creates avoidable ambiguity. The board must remain stable for the entire round in calm mode.

## 5. Practice configuration and modes

The pre-game session setup should be deliberately small:

| Setting | Initial proposal |
|---|---|
| Study set | One selected `group`, then a smaller chosen subset if necessary. |
| Correct-tile languages | Czech only, German only, Portuguese only, or mixed. |
| Prompt order | Ordered by selected concept list or randomized. |
| Pace | **Calm** by default; **Mastery** remains future work. |

### Calm mode — confirmed baseline direction

Calm mode has no enemies and no timer. A wrong answer should cost a round mistake rather than immediately erase a learning opportunity. The exact life/scoring rule is still open, but feedback must name the selected tile's English meaning and leave the player able to learn from the error.

### Mastery mode — future option, not v1 commitment

A later mastery mode may add original hazards or a timer after the calm loop is validated. It must be separately selectable, must not modify tile text or correctness, and must remain winnable without luck. Temporary safety/protection mechanics can be considered only after testing; they are not a reason to delay the baseline game.

## 6. Board design

The source games demonstrate that a compact, fully visible grid supports scan-and-decide play. Their exact board dimensions and presentation are not a requirement for this game. The Language Munchers grid must instead be sized around the longest expected Czech, German, and Portuguese strings at the minimum supported laptop viewport.

Each board must:

- have one or more correct tiles and at least one distractor;
- make every tile fully legible before selection;
- remain winnable from the state shown to the player;
- preserve tile text and location throughout a calm-mode round;
- avoid accidental ambiguity caused by duplicate strings, alternatives, or insufficient context;
- expose progress as `correct eaten / correct total` without revealing which unselected tiles are correct.

The game should begin with a limited active group or small concept subset rather than all 300 concepts at once.

### Initial vertical-slice board proposal

This is a proposal to validate, not a locked requirement:

- 4 × 4 grid;
- one prompt concept;
- three correct tiles: one each in Czech, German, and `pt-PT`;
- 13 distractors drawn from the same study group;
- Calm mode; keyboard controls; explicit Munch action; no score pressure.

A 4 × 4 board is a starting usability hypothesis. It must be tested against long strings and revised before implementation is treated as complete.

## 7. Feedback, progression, and learning intent

The first release should prioritize accurate recognition, repeated exposure, and short sessions over breadth or high-score complexity.

### Required feedback

- On a correct answer: clear positive confirmation and an updated progress count.
- On a wrong answer: clear but non-punitive correction showing the selected target-language tile and its English meaning.
- On board completion: list the prompt and the correct Czech, German, and Portuguese forms used in that round.
- Between boards: make the next prompt distinct from the previous one unless deliberate review is active.

### Proposed progression path

1. One selected target language; small group; Calm mode.
2. Mixed Czech, German, and Portuguese correct tiles.
3. More confusable distractors within the same study group.
4. Review boards selected from recent mistakes or weak concepts.
5. Optional Mastery mode, only after the calm learning loop tests well.

Progress tracking, spaced repetition, profiles, persistent saves, and a high-score table are possible later additions. They are not confirmed initial scope.

## 8. Presentation, audio, and accessibility

The player character is a frog. The visual direction must be original.

Initial presentation requirements:

- prompt remains prominent and readable;
- word tiles prioritize typography, articles, alternatives, and diacritics;
- the currently focused tile has a clear non-colour-only focus treatment;
- correct and incorrect responses are distinguishable without relying only on colour or sound;
- the full game is usable by keyboard;
- Pause and Replay prompt controls are visible and documented;
- animations must not make text unreadable or delay input unnecessarily.

The older *Word Munchers Deluxe* made spoken target playback available during play.[4] Language Munchers should reserve a clean extension point for audio pronunciation, but audio is not required for the first vertical slice and must never be the only way to understand a prompt or tile.

Music, sound effects, animation style, voice source, visual mood, and wider accessibility options remain open.

## 9. Technical direction

The intended game is a WebGL application delivered as static files.

### Planned hosting

When implementation begins, publish a production build through GitHub Pages so the game can run in a web browser from the repository's Pages URL.

### Data boundary

The private vocabulary repository remains canonical. Before implementation, choose one explicit integration model:

1. a reviewed, versioned game-data export committed to this repository; or
2. a build-time import from an authorized local checkout that produces a reviewed static export.

The browser build must not require access to the private source repository at runtime. A public Pages deployment must not expose notes or source content that is not intentionally included in the game export.

### Not decided

- WebGL engine/framework (for example, a game engine export versus a lightweight custom renderer).
- JavaScript/TypeScript versus another WebGL toolchain.
- Build and deployment workflow.
- Browser and mobile support targets.
- Save-data location and privacy model.

Technical choices should be made after a small vertical-slice decision, not pre-emptively in this planning repository.

## 10. Out of scope for the current phase

- Game code or a WebGL scaffold.
- Importing or copying the vocabulary CSV into this repository.
- GitHub Pages configuration or deployment.
- Art, sound, animation, and character assets.
- Accounts, online features, leaderboards, and monetization.

## 11. Open decisions

The research reduces ambiguity in the base loop but does not decide product choices. The following still require direction before implementation:

1. **Round completion:** Is the initial requirement exactly one correct tile per language, or can a board contain repeated correct translations of a concept?
2. **Wrong answers:** In Calm mode, should a wrong tile deduct a life, score, streak, or only create a review mark? How many mistakes end a board, if any?
3. **Mastery pressure:** Should v1 omit hazards entirely, or reserve an experimental timer/enemy prototype after the calm vertical slice?
4. **Board size and tile count:** Does the proposed 4 × 4 grid fit the longest vocabulary entries at the intended viewport?
5. **Language display:** Should each tile show an explicit language label, language-specific styling, or no language hint?
6. **Vocabulary mode:** Which of the 15 groups starts the game, and how large should the initial selectable mini-set be?
7. **Variants:** How should entries containing alternatives, gendered forms, articles, or notes be presented without creating multiple-answer ambiguity?
8. **Learning feedback:** Should wrong answers and completion screens include all three translations, and should mistakes drive subsequent review boards?
9. **Audio:** Is on-demand pronunciation needed after the first text-only vertical slice? If yes, what licensed source and which languages/forms are authoritative?
10. **Controls and devices:** Is desktop keyboard-only acceptable for v1, or are mouse, touch, and mobile support required?
11. **Progress and privacy:** Should progress be local-only, and is user data needed at all for the first release?
12. **Visual direction:** What original art/UI mood should the frog, board, and feedback use?
13. **Repository visibility and launch:** Should the future playable site be publicly accessible through GitHub Pages, or restricted to a private repository/audience?

## 12. Next planning milestone

Resolve the decisions that change the core loop, then approve one vertical slice:

- one named small study set;
- a validated 4 × 4 (or revised) board layout;
- explicit correct/wrong and completion rules;
- keyboard movement plus explicit Munch and Pause actions;
- calm mode with no hazards;
- one reviewed static game-data export path;
- static WebGL build and GitHub Pages deployment path.

Only after that approval should development begin.

## Sources

[1] https://mirrors.apple2.org.za/ftp.apple.asimov.net/documentation/applications/misc/MECC_Number_Munchers_manual.pdf
[2] https://archive.org/download/Macintosh_Garden_Manuals_2021_N-O/NumberMunchersManual.pdf
[3] https://mecc.co/word-munchers-deluxe
[4] https://oldgamesdownload.com/readme/word-munchers-deluxe-windows-readme-english
