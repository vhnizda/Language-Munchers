# Language Munchers — Game Design Document

**Status:** Draft 0.8 — research-informed planning baseline
**Implementation status:** Not started

## 1. Concept

Language Munchers is a single-player vocabulary-recognition game inspired by the grid-and-munch loop of the classic *Number Munchers* and *Word Munchers* games.

A frog occupies a grid of word tiles. Each round shows an English prompt at the top of the screen. Every tile displays exactly one target-language word or phrase—Czech, Standard German, or European Portuguese (`pt-PT`)—never a grouped multilingual answer. The player deliberately eats every tile whose single displayed value translates the English prompt. Tiles with other meanings are distractors.

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

1. From the choice menu, select one CSV `group` (topic).
2. At the start of the run, create one randomized order containing every concept in that topic exactly once.
3. Select the next unfinished concept in the run and display its English value as the prompt.
4. Build a board with a mix of:
   - at least one correct single-language translation in each of Czech, Standard German, and `pt-PT`, with one or more of those correct translations intentionally repeated; and
   - distractor tiles from other concepts in the selected topic, with language totals kept roughly balanced across the three languages.
5. Let the player move the frog one grid square at a time without evaluating the tile.
6. Show a clear focus state for the tile under the frog.
7. On an explicit **Munch** action, evaluate the focused tile.
8. Resolve feedback immediately:
   - **Correct:** eat the tile, update board progress, and preserve the remaining unresolved tiles. Pronunciation is deferred until after the MVP.
   - **Incorrect:** show the English equivalent of the selected wrong word, clear that tile from the board, deduct one life, and record the mistake for potential review. Pronunciation is deferred until after the MVP.
9. If the player has lost all three lives, end the topic run as a loss and return to the choice menu after the loss summary.
10. If every correct tile has been eaten while at least one life remains, complete the level and advance to the next concept in the topic run.
11. After the final concept in the selected topic is completed, show a topic-win summary and return to the choice menu.

### Baseline control contract

| Action | Desktop keyboard | Requirement |
|---|---|---|
| Move | Arrow keys and WASD | Moves exactly one orthogonal tile. |
| Munch / select | Space or Enter | Evaluates only the focused tile. |
| Pause | Escape | Freezes game state and exposes resume/leave actions. |

A topic run starts with **three lives**. The game must display remaining lives, the current topic, and current level progress (`word n / total words`) throughout play.

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
- Every tile displays exactly one source field in exactly one target language; it must never group Czech, German, and Portuguese on one tile.
- Tile languages are Czech, Standard German, and European Portuguese only.
- Standard German must retain the corpus's Swiss-context spelling and vocabulary where provided.
- Portuguese must remain `pt-PT`; Brazilian Portuguese must not be substituted.
- German and Portuguese articles are part of the answer text and must remain visible.
- Written gender alternatives and slash-separated alternatives must remain intact unless an explicit content rule replaces them.
- A CSV row represents one concept, not independent translation cards.

### Future pronunciation mechanic

Target-language pronunciation remains a planned differentiator after the MVP, but **version 1 has no sound**: no pronunciation playback, music, or sound effects. The MVP must validate the visual vocabulary-recognition loop first.

In a later version, whenever the frog eats a tile—whether correct or wrong—the game should play the displayed tile's pronunciation in Czech, Standard German, or European Portuguese. That pronunciation must correspond to the exact displayed form, including articles and written alternatives.

When this feature is introduced, each playable tile must resolve to a reviewed pronunciation asset using its `conceptId`, `language`, and `displayText`; the board generator must not place a tile with no matching asset. The source, licensing, voice standard, and asset-production pipeline remain future implementation decisions.


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

The manifest must guarantee at least one correct tile in **each** target language, more than three correct tiles overall, and at least one intentionally repeated correct translation. It must target a roughly 50/50 correct-to-distractor ratio. Czech, German, and Portuguese totals must be roughly balanced (for a 16-tile board, 5/5/6 in any order is the target). It must also guarantee at least one distractor, no malformed or empty display text, and no accidental duplicate distractor that creates avoidable ambiguity. Repeated correct tiles are intentional and required. After construction, language and concept positions must be shuffled across the full grid: no language or concept may occupy a dedicated row, column, quadrant, or other predictable region. The board must remain stable for the entire round except that a tile is removed when the player correctly eats it or incorrectly selects it.

## 5. Practice configuration and modes

The pre-game session setup should be deliberately small:

| Setting | Initial proposal |
|---|---|
| Topic | One CSV `group`, selected from the choice menu. |
| Run length and order | One level per concept in the selected topic; create a fresh randomized order at the start of each run, with every concept appearing exactly once. |
| Tile languages | Every board contains roughly equal counts of Czech, German, and Portuguese tiles; every tile displays exactly one language. For the initial 16-tile board, use 5/5/6 in randomized language assignment. |
| Correct answers | Every board targets a roughly 50/50 correct-to-distractor ratio, contains at least one correct tile in each language, more than three correct tiles overall, and intentional repeats of one or more correct translations. |
| Pace | **Calm** by default; **Mastery** remains future work. |

### Calm mode — confirmed baseline direction

Calm mode has no enemies and no timer. A topic run starts with three lives. Each wrong answer shows the English meaning of the selected wrong tile, removes that tile, and deducts exactly one life. Losing the third life immediately ends the run as a loss. A completed board advances to the next concept; completing every concept in the selected topic wins the run and returns the player to the choice menu.

### Mastery mode — future option, not v1 commitment

A later mastery mode may add original hazards or a timer after the calm loop is validated. It must be separately selectable, must not modify tile text or correctness, and must remain winnable without luck. Temporary safety/protection mechanics can be considered only after testing; they are not a reason to delay the baseline game.

## 6. Board design

The source games demonstrate that a compact, fully visible grid supports scan-and-decide play. Their exact board dimensions and presentation are not a requirement for this game. The Language Munchers grid must instead be sized around the longest expected Czech, German, and Portuguese strings at the minimum supported laptop viewport.

Each board must:

- have one or more correct tiles and at least one distractor;
- make every tile fully legible before selection;
- remain winnable from the state shown to the player;
- preserve each unresolved tile's text and location throughout a calm-mode round;
- intentionally repeat one or more correct translations while avoiding accidental duplicate distractors;
- distribute languages and concepts across the whole grid rather than by row, column, quadrant, or other recognizable region;
- expose remaining lives, `correct eaten / correct total`, and `word n / total words` without revealing which unselected tiles are correct.

The game starts one topic run at a time: the player selects one CSV `group` and plays every concept in that group before returning to the choice menu. It does not begin with all 300 concepts at once.

### Initial vertical-slice board proposal

This is a proposal to validate, not a locked requirement:

- 4 × 4 grid (16 tiles);
- one prompt concept;
- eight correct tiles: at least one in each language, with the prompt's translations intentionally repeated;
- eight distractors drawn from the same study group;
- a roughly balanced 5/5/6 Czech/German/Portuguese distribution, in a different randomized assignment each board;
- Calm mode; three lives per topic run; keyboard controls; explicit Munch action; no score pressure.

A 4 × 4 board is a starting usability hypothesis. Its 16 tiles allow a roughly balanced 5/5/6 language mix and repeated correct translations, which supports critical scanning rather than a simple three-answer lookup. The generator must shuffle every language and concept across the whole grid with no dedicated language or concept region. This proposal must be tested against long strings and revised before implementation is treated as complete.

## 7. Feedback, progression, and learning intent

The first release should prioritize accurate recognition, repeated exposure, and short sessions over breadth or high-score complexity.

### Required feedback

- On a correct answer: show clear positive confirmation and an updated progress count.
- On a wrong answer: show the selected target-language tile and its English meaning, then clear that tile and deduct one life.
- On losing the third life: show a topic-loss summary and return to the choice menu.
- On board completion: list the prompt and the correct Czech, German, and Portuguese forms used in that round, then begin the next concept in the selected topic.
- On topic completion: show a topic-win summary after every concept in that topic has been completed, then return to the choice menu.

### Proposed progression path

1. One selected target language; one complete topic run; Calm mode.
2. Mixed Czech, German, and Portuguese correct tiles.
3. More confusable distractors within the selected topic.
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
- Pause control is visible and documented;
- animations must not make text unreadable or delay input unnecessarily.

*Word Munchers Deluxe* made spoken target playback available during play.[4] Language Munchers deliberately defers all sound—including pronunciation, music, and sound effects—until after the visual MVP is validated. Text remains the complete source of prompt and tile meaning in version 1.

Music, pronunciation voices, sound effects, animation style, visual mood, and wider accessibility options remain open for later versions.

## 9. Technical direction

The intended game is a WebGL application delivered as static files.

### Planned hosting

When implementation begins, publish a production build through GitHub Pages so the game can run in a web browser from the repository's Pages URL.

### Data boundary

The private vocabulary repository remains canonical. Before implementation, choose one explicit integration model:

1. a reviewed, versioned game-data export committed to this repository; or
2. a build-time import from an authorized local checkout that produces a reviewed static export.

The browser build must not require access to the private source repository at runtime. A public Pages deployment must not expose notes or source content that is not intentionally included in the game export. Version 1 has no pronunciation assets or runtime audio dependency.

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

The research and current decisions define the base loop. The following still require direction before implementation:

1. **Board size and tile count:** Does the proposed 4 × 4 grid fit the longest vocabulary entries at the intended viewport?
2. **Language display:** Should each tile show an explicit language label, language-specific styling, or no language hint?
3. **Variants:** How should entries containing alternatives, gendered forms, articles, or notes be presented without creating multiple-answer ambiguity?
4. **Mistake feedback timing:** For how long should the wrong tile's English meaning remain visible before the tile clears, and can the player dismiss it early?
5. **Controls and devices:** Is desktop keyboard-only acceptable for v1, or are mouse, touch, and mobile support required?
6. **Progress and privacy:** Should topic-run progress be local-only, and is any persistent user data needed for the first release?
7. **Visual direction:** What original art/UI mood should the frog, board, and feedback use?
8. **Repository visibility and launch:** Should the future playable site be publicly accessible through GitHub Pages, or restricted to a private repository/audience?

## 12. Next planning milestone

Resolve the decisions that change the core loop, then approve one vertical slice:

- one named CSV topic, played in a fresh randomized order until every concept is cleared exactly once;
- a validated 4 × 4 (or revised) board layout with roughly balanced language counts, repeated correct tiles, and no spatial language/concept pattern;
- the confirmed three-life loss rule and wrong-tile clear/feedback sequence;
- keyboard movement plus explicit Munch and Pause actions;
- calm mode with no hazards;
- one reviewed static game-data export path with no audio dependency;
- static WebGL build and GitHub Pages deployment path.

Only after that approval should development begin.

## Sources

[1] https://mirrors.apple2.org.za/ftp.apple.asimov.net/documentation/applications/misc/MECC_Number_Munchers_manual.pdf
[2] https://archive.org/download/Macintosh_Garden_Manuals_2021_N-O/NumberMunchersManual.pdf
[3] https://mecc.co/word-munchers-deluxe
[4] https://oldgamesdownload.com/readme/word-munchers-deluxe-windows-readme-english
