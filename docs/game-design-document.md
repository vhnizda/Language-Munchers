# Language Munchers — Game Design Document

**Status:** Draft 1.1 — MVP design decisions complete
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
| Move | Arrow keys and on-screen arrow buttons | Moves exactly one orthogonal tile. On-screen buttons support touch and pointer input. |
| Munch / select | Space and an on-screen `Space` button | Evaluates only the focused tile. The button supports touch and pointer input. |
| Pause | Escape and an on-screen `Pause` button | Freezes game state, including incorrect-answer feedback timing, and exposes `Continue` and `Quit topic` actions. |
| Maximize | Header `Full Screen` button | Uses native browser/device full-screen mode when available, with an in-page maximize fallback. Available on every screen. |

A topic run starts with **three lives**. The game must display remaining lives, the current topic, and current level progress (`word n / total words`) throughout play.

Mouse, touch, and keyboard input must drive the same focused-tile and explicit-Munch actions. The on-screen arrow and `Space` buttons are required for touch-capable devices; a connected keyboard remains fully usable on any device. Pointer/touch movement must not silently submit a tile.

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
| `notes` | Ignored in version 1; not exported to a playable tile or used by board generation. |

The corpus has 15 situational groups, from family and people through questions and connectors.

### Content fidelity

- English is the prompt language for the initial game.
- Tile languages are Czech, Standard German, and European Portuguese only.
- Every tile displays exactly one source field in exactly one target language; it must never group Czech, German, and Portuguese on one tile.
- Tiles provide **no language hints** in version 1: no explicit language labels, flags, language-specific colours, or language-specific styling. The player must recognize each displayed word independently. A later version may add optional hints as an accessibility or learning setting.
- Standard German must retain the corpus's Swiss-context spelling and vocabulary where provided.
- Portuguese must remain `pt-PT`; Brazilian Portuguese must not be substituted.
- German and Portuguese articles are part of the answer text and must remain visible.
- Written gender alternatives and slash-separated alternatives must remain intact inside one indivisible tile; do not split them into separately selectable answers.
- Each tile displays the complete value of its target-language CSV field exactly as written, including articles and alternatives.
- The `notes` field is ignored in version 1: it must not be rendered, used for answer validation, or used in board generation.
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

For a prompt with concept ID `P`, a tile is correct if and only if its `conceptId` is `P`. The tile displays the full selected target-language field from the CSV, including articles and alternatives. Display strings must not be re-parsed at runtime to decide correctness.

Before a board is shown, the generator must create and validate a board manifest containing:

- prompt concept ID;
- each tile's concept ID, language, and display text;
- each tile's correct/incorrect status;
- the count and positions of all correct tiles.

The manifest must guarantee at least one correct tile in **each** target language, more than three correct tiles overall, and at least one intentionally repeated correct translation. It must target a roughly 50/50 correct-to-distractor ratio. For the 24-tile MVP board, it must use an exact 12/12 correct-to-distractor split and eight Czech, eight German, and eight Portuguese tiles. It must also guarantee at least one distractor, no malformed or empty display text, and no accidental duplicate distractor that creates avoidable ambiguity. Repeated correct tiles are intentional and required. After construction, language and concept positions must be shuffled across the full grid: no language or concept may occupy a dedicated row, column, quadrant, or other predictable region. The board must remain stable for the entire round except that a tile is removed when the player correctly eats it or incorrectly selects it.

## 5. Practice configuration and modes

The pre-game session setup should be deliberately small:

| Setting | Initial proposal |
|---|---|
| Topic | One CSV `group`, selected from the choice menu. |
| Run length and order | One level per concept in the selected topic; create a fresh randomized order at the start of each run, with every concept appearing exactly once. |
| Tile languages | Every board contains eight Czech, eight German, and eight Portuguese tiles; every tile displays exactly one language. Language assignment and tile placement are randomized subject to this distribution. |
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
- make every tile fully legible before selection; text may wrap onto multiple lines inside its tile and must not be clipped;
- remain winnable from the state shown to the player;
- preserve each unresolved tile's text and location throughout a calm-mode round;
- intentionally repeat one or more correct translations while avoiding accidental duplicate distractors;
- distribute languages and concepts across the whole grid rather than by row, column, quadrant, or other recognizable region;
- expose remaining lives, `correct eaten / correct total`, and `word n / total words` without revealing which unselected tiles are correct.

The game starts one topic run at a time: the player selects one CSV `group` and plays every concept in that group before returning to the choice menu. It does not begin with all 300 concepts at once.

### Initial MVP board layout

The MVP uses the following board:

- 4-row × 6-column grid (24 tiles), optimized for wider-than-tall desktop screens;
- one prompt concept;
- 12 correct tiles: at least one in each language, with the prompt's translations intentionally repeated;
- 12 distractors drawn from the same study group;
- eight Czech, eight German, and eight Portuguese tiles, with positions randomized across the full grid;
- Calm mode; three lives per topic run; keyboard controls; explicit Munch action; no score pressure.

A 4-row × 6-column board is the initial MVP layout. Its 24 tiles provide an exact 12/12 correct-to-distractor split and eight tiles per language, while its landscape shape suits wider-than-tall screens. Tile text may wrap to multiple lines; character limits and minimum font-size tuning are implementation refinements to validate once the game is playable. The generator must shuffle every language and concept across the whole grid with no dedicated language or concept region.

## 7. Feedback, progression, and learning intent

The first release should prioritize accurate recognition, repeated exposure, and short sessions over breadth or high-score complexity.

### Required feedback

- On a correct answer: show clear positive confirmation and an updated progress count.
- On a wrong answer: show the selected target-language tile and its English meaning for exactly **one second**, then automatically clear that tile and deduct one life. The game continues; this feedback does not pause the board and cannot be manually dismissed.
- On losing the third life: show a topic-loss summary and return to the choice menu.
- On board completion: list the prompt and the correct Czech, German, and Portuguese forms used in that round, then begin the next concept in the selected topic.
- On topic completion: show a topic-win summary after every concept in that topic has been completed, then return to the choice menu.

### Proposed progression path

1. One selected target language; one complete topic run; Calm mode.
2. Mixed Czech, German, and Portuguese correct tiles.
3. More confusable distractors within the selected topic.
4. Review boards selected from recent mistakes or weak concepts.
5. Optional Mastery mode, only after the calm learning loop tests well.

Progress is stored locally on the player's device for version 1. No account, cloud synchronization, analytics, or other user-data collection is required. Clearing browser storage may clear local progress.

## 8. Presentation, audio, and accessibility

The player character is a frog. The MVP visual direction is original, nostalgic, blocky Apple II-era computer-game imagery around the board, while word tiles remain clean and highly legible. It must not reproduce *Number Munchers* assets, characters, layouts, sounds, or branding.

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

The MVP is a dependency-free static browser game: HTML, CSS, and ES modules. Its word tiles are rendered in the DOM so their multilingual text can wrap accessibly and remain legible on GitHub Pages. This is a deliberate MVP trade-off: it is **not yet a WebGL renderer**. A future WebGL visual layer may sit behind or replace the presentation layer without changing the isolated board-generation rules in `src/game.js`.

### Hosting

The public repository deploys through a GitHub Actions Pages workflow whenever `main` changes. The playable public URL is `https://vhnizda.github.io/Language-Munchers/`; no login is required.

### Data boundary

The private vocabulary repository remains canonical. `scripts/export-vocabulary.mjs` imports from an authorized local checkout at build/export time and creates the reviewed static `data/vocabulary.json` export. The public export contains only `id`, `group`, `english`, `czech`, `german_standard`, and `portuguese_pt`. It omits `notes` and the browser never contacts the private source repository at runtime.

Version 1 has no pronunciation assets or runtime audio dependency. It stores progress only in browser-local storage and sends no player data to a server.

### Validation

- `npm test` verifies vocabulary export rules and pure board/run behavior.
- The Pages workflow runs that test suite before deployment.
- Manual browser verification covers the topic menu, a 24-tile board, keyboard movement, touch controls, and one-second incorrect-answer feedback.

## 10. Deferred work

- A real WebGL rendering layer, if visual requirements justify its added text-rendering complexity.
- Browser test matrix and a defined minimum supported viewport.
- Art, sound, animation, and character assets.
- Accounts, online features, leaderboards, and monetization.

## 11. MVP design status

The MVP game-design decisions are complete. The complete-field tile rule removes ambiguity for articles, alternatives, gendered forms, and notes:

- display each selected target-language CSV field exactly as written in one indivisible tile;
- retain articles and written alternatives together on that tile;
- ignore the `notes` field in version 1.

Future-version questions such as pronunciation sources, mastery pressure, and broader accessibility settings do not block the MVP.

## 12. Next milestone

When development is explicitly approved, prepare one vertical slice using this completed MVP contract:

- one named CSV topic, played in a fresh randomized order until every concept is cleared exactly once;
- the confirmed 4-row × 6-column board layout with a 12/12 correct-to-distractor split, eight tiles per language, repeated correct tiles, and no spatial language/concept pattern;
- the confirmed three-life loss rule and calm mode with no hazards;
- keyboard controls plus required touch/pointer on-screen arrow and `Space` buttons;
- the confirmed one-second, non-pausing wrong-tile feedback sequence;
- browser-local progress storage with no account or server data collection;
- original blocky Apple II-era visual direction with clear word tiles;
- one reviewed static game-data export path with no audio dependency;
- public GitHub Pages deployment that requires no player login.

Only after that approval should development begin.

## Sources

[1] https://mirrors.apple2.org.za/ftp.apple.asimov.net/documentation/applications/misc/MECC_Number_Munchers_manual.pdf
[2] https://archive.org/download/Macintosh_Garden_Manuals_2021_N-O/NumberMunchersManual.pdf
[3] https://mecc.co/word-munchers-deluxe
[4] https://oldgamesdownload.com/readme/word-munchers-deluxe-windows-readme-english
