# GitHub Pages Game Hub

This is a static web app designed to be hosted on GitHub Pages.

## Included pages

- `index.html`: landing page with clickable game buttons
- `scratch-off.html`: scratch-off challenge game
- `scratch-off-config.json`: prompt source grouped by selection
- `underwear-roulette.html`: random underwear combination game
- `underwear-roulette-config.json`: underwear types and materials
- `weekly-challenge.html`: two-card weekly scratch challenge
- `weekly-challenge-config.json`: weekly challenge prompts for husband and wife

## How it works

1. Open the landing page.
2. Click `Scratch Off Challenge`.
3. Choose one option from `Husband`, `Wife`, or `Joint`.
4. Choose one option from `In` or `Out`.
5. Click `Next` to reveal the scratch card.
6. Scratch the square to uncover the selected prompt.
7. Click `Skip` to generate a new prompt using the same selection.

## Underwear Roulette

1. Open `Underwear Roulette`.
2. Choose `Husband` or `Wife` as the player.
3. Click `Spin`.
4. The game randomly chooses whose underwear, then a matching underwear type, then a material.
5. Click `Reroll` for a new result or `Start over` to pick the player again.

## Weekly Challenge

1. Open `Weekly Challenge`.
2. The page generates one scratch-off for `Husband` and one for `Wife`.
3. Scratch each card to reveal the weekly challenge underneath.
4. Click `New challenge` on either card to refresh just that one, or `Refresh both` to regenerate both.

## Deploying to GitHub Pages

If this repository is pushed to GitHub, GitHub Pages can serve it directly as a static site from the repository root.
