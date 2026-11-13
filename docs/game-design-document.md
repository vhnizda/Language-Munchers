# Language Munchers — Game Design Document

**Status:** Draft 0.1 — planning baseline  
**Implementation status:** Not started

## 1. Concept

Language Munchers is a single-player vocabulary-recognition game inspired by the grid-and-munch loop of the classic *Number Munchers* games.

A frog occupies a grid of word tiles. Each round shows an English prompt at the top of the screen. The player moves the frog around the grid and eats every tile whose Czech, Standard German, or European Portuguese (`pt-PT`) text has the same meaning as that English prompt. Tiles with different meanings are distractors.

The game teaches recognition of the same concept across the three target languages while retaining the fast, spatial play loop that defines the inspiration.

## 2. Player goal and round loop

### Round objective

Eat all tiles that correctly translate the current English prompt without eating an incorrect tile.

### Baseline loop

1. Select a vocabulary concept from the active study set.
2. Display its English value as the prompt.
3. Fill a grid with a mix of:
   - correct translations of that concept in Czech, Standard German, and/or `pt-PT`; and
   - distractor translations from other concepts in the same active study set.
4. Let the player move the frog one tile at a time.
5. On entering a tile, resolve whether it is a correct translation.
6. End the round after the player has eaten all correct tiles, or after the eventual failure rule is met.
7. Show concise feedback and advance to the next concept or round.

The exact scoring, life, enemy, timer, and failure systems are not decided yet.

## 3. Vocabulary and language requirements

### Canonical source

The first corpus is the private `vhnizda/vaclav-language-learning-path` repository:

`vocabulary/first-300-family-life.csv`

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

### Proposed content model

A tile should preserve both its displayed string and its provenance:

```text
conceptId: "001"
language: "czech" | "german_standard" | "portuguese_pt"
displayText: "rodina"
```

The game should treat all target-language tiles derived from the prompted `conceptId` as correct. This is a design proposal, not an implemented format.

## 4. Core interaction

### Controls

Proposed initial controls:

- Arrow keys / WASD: move the frog one grid square.
- Touch or mobile controls: undecided.
- Gamepad: undecided.

### Tile resolution

When the frog enters a tile:

- **Correct tile:** the frog eats it; the tile disappears or visibly resolves as correct.
- **Incorrect tile:** apply the round's future mistake rule and give clear feedback.

A tile should visibly indicate its language without relying only on colour. The final signal could be a language label, text treatment, icon, or a combination.

## 5. Board design

The original reference suggests a compact, readable grid. The initial build should use a grid size that keeps full target phrases legible on normal laptop screens. No final grid dimensions are chosen.

Each board must:

- have at least one correct tile;
- include a meaningful mix of distractors;
- never create an unwinnable state;
- make every tile legible before it can be selected;
- avoid accidental ambiguity caused by duplicate strings or alternate translations.

The game should begin with a limited active group or small concept subset rather than all 300 concepts at once.

## 6. Progression and learning intent

The first release should prioritize accurate recognition and repeatable short sessions over breadth or complex progression.

Potential progression path:

1. One language of correct tiles on a board.
2. Mixed Czech, German, and Portuguese correct tiles.
3. Larger active vocabulary groups and stronger distractors.
4. Review rounds driven by recent mistakes or weak concepts.

Progress tracking, spaced repetition, profiles, and persistent saves are possible later additions. They are not in the confirmed initial scope.

## 7. Presentation and audio

The player character is a frog. The visual language should be original rather than copying assets, interface layouts, sounds, or branding from *Number Munchers*.

Initial presentation requirements:

- prompt remains prominent and readable;
- word tiles prioritize typography and diacritics;
- correct and incorrect responses are distinguishable;
- game remains usable with keyboard navigation.

Music, sound effects, animation style, art direction, voice pronunciation, and accessibility options remain open.

## 8. Technical direction

The intended game is a WebGL application delivered as static files.

### Planned hosting

When implementation begins, publish a production build through GitHub Pages so the game can run in a web browser from the repository's Pages URL.

### Not decided

- WebGL engine/framework (for example, a game engine export versus a lightweight custom renderer).
- JavaScript/TypeScript versus another WebGL toolchain.
- Build and deployment workflow.
- Browser and mobile support targets.
- Save-data location and privacy model.

Technical choices should be made after a small vertical-slice decision, not pre-emptively in this planning repository.

## 9. Out of scope for the current phase

- Game code or a WebGL scaffold.
- Importing or copying the vocabulary CSV into this repository.
- GitHub Pages configuration or deployment.
- Art, sound, animation, and character assets.
- Accounts, online features, leaderboards, and monetization.

## 10. Open decisions

The following require direction before implementation:

1. **Round completion:** Must the player eat one correct translation per language, every correct tile on the board, or a different fixed count?
2. **Wrong answers:** Is a wrong tile an immediate loss, a lost life, a score penalty, or simply corrective feedback?
3. **Threats and pacing:** Should the game include roaming enemies, a timer, or neither in the first version?
4. **Board size and tile count:** What is the target initial grid size, and how many correct/distractor tiles should a board contain?
5. **Language display:** Should each tile show an explicit language label, language-specific styling, or no language hint?
6. **Vocabulary mode:** Start with one of the 15 groups, a manually selected mini-set, or an adaptive set? Which group comes first?
7. **Variants:** How should entries containing alternatives, gendered forms, or notes be presented and judged?
8. **Learning feedback:** Should the game reveal translations after a mistake or round, and should it record mistakes for review?
9. **Controls and devices:** Is desktop keyboard-only acceptable for v1, or is touch/mobile support required?
10. **Progress and privacy:** Should progress be local-only, and is user data needed at all for the first release?
11. **Visual direction:** What original art/UI mood should the frog, board, and feedback use?
12. **Repository visibility and launch:** Should the future playable site be publicly accessible through GitHub Pages, or restricted to a private repository/audience?

## 11. Next planning milestone

Resolve the open decisions that change the core loop, then define one vertical slice:

- one small study set;
- one board layout;
- exact correct/wrong rules;
- keyboard control;
- static WebGL build and Pages deployment path.

Only after that approval should development begin.
