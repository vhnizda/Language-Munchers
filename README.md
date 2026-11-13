# Language Munchers

A browser-based language-learning game inspired by the grid-and-munch loop of the classic *Number Munchers* games.

The player controls a frog on a grid of word tiles. A prompt at the top of the screen gives an English word. The frog hops across the board and eats every Czech, Standard German, and European Portuguese (`pt-PT`) tile that translates that English prompt. Other vocabulary tiles are distractors.

## Project status

**Planning only.** This repository intentionally contains no game implementation yet. Development begins after the game design is agreed.

## Vocabulary source

The first playable vocabulary corpus already exists in the private repository [`vhnizda/vaclav-language-learning-path`](https://github.com/vhnizda/vaclav-language-learning-path):

- [`vocabulary/first-300-family-life.csv`](https://github.com/vhnizda/vaclav-language-learning-path/blob/main/vocabulary/first-300-family-life.csv)

That CSV contains 300 stable concepts with English, Czech, Standard German, and `pt-PT` fields. It remains the canonical source of vocabulary. The game should consume a deliberately versioned copy or export only once the data-integration policy is agreed; it should not silently fork or rewrite the source data.

Important source-data rules:

- Keep the stable `id` as the concept key.
- Preserve German and Portuguese articles.
- Preserve written gender alternatives.
- Keep Swiss-context Standard German and European Portuguese intact.

## Intended delivery

The game is intended to be a WebGL browser game. When implementation starts, the repository should publish a static build with GitHub Pages so it can be played from the repository's Pages URL. No GitHub Pages workflow or deployment has been configured during this planning phase.

## Design

The current design brief, confirmed assumptions, and unresolved decisions are in [docs/game-design-document.md](docs/game-design-document.md).

## Scope boundary

This initial repository setup includes only project documentation. It does not include a game engine, WebGL framework, source-code scaffold, vocabulary import, asset, GitHub Pages configuration, or automated workflow.
