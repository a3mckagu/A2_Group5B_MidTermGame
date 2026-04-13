## Assignment 3 - Final Game: Potionary, A Crafting Puzzle Game

---

## Group Number

5B
Aliza Lallani - 21035348
Andreea McKague
Mia Krzysztalowicz
Nelly Gogohounga

---

## Description

Potionary is a potion-crafting puzzle game where players fulfill customer orders by matching symbols from a recipe book to ingredient vials.

- In the first level, players must add vials to a cauldron in the correct order to succeed. A "Customer Patience" timer begins immediately, requiring players to carefully balance speed with accuracy.

- In the second level, a mixing mechanic is introduced. In addition to adding vials to the cauldron, players must mix at the correct point in the recipe.

- In the final level, lights go out! Players must use candlelight to view the recipe.

The game is designed to foster empathy and understanding for individuals with dyslexia. For someone with dyslexia, reading can feel like decoding words in a foreign language - slow, effortful, and mentally exhausting. Even short periods of reading demand intense concentration. Potionary mirrors these experiences through symbols that are visually similar, a challenging-to-read font, and a recipe design that is intentionally difficult to interpret.

In addition, many people with dyslexia develop unique, often unconscious strategies to "decode" text, relying on context, visual memory, or multi-sensory techniques. As such, Potionary reflects not only the challenges people with dyslexia face, but also the ways they adapt.

The design is inspired by the artistic, hand-drawn, medieval art style of Potion Craft Alchemist Simulator (2022) alongside tactile, "pouring" user actions from the viral mobile game Water Sort Puzzle (2020).

---

## Setup and Interaction Instructions

- How to Start: Players view the "Aclhemist's Handbook" for instructions. They then on click "New Game" on the start screen and proceed to level one by clicking on "Level 1: Beginner's Luck" on the level map.
- Controls: View orders by clicking on the envelope icon. Click on the recipe book to view the order steps. Click and move vials from the shelf to the cauldron. Click and move the crystal to finish the potion.
- When players get the recipe correct, they proceed to Level 2, and eventually Level 3.
- Visual Feedback: The cauldron glows when a user "picks up" a vial or crystal, indicating the drop zone. Incorrectly matched vials provide visual feedback once the user runs out of time or completes the incorrect order (fail state / win state).
- Audio Experience: Medieval-themed background music evokes escapism, intrigue, and pressure, playing on an infinite loop during gameplay. The audio speeds up as the timer decreases to add intensity. Sound effects for actions were added for immersion.

---

## Post-Playtest

Three changes made based on playtesting:

1. New Mechanic: During playtesting, Professor Karen suggested that we introduce a mixing mechanic. We incorporated this in Levels 2 and 3, where players must mix at specific points in each recipe.To support this interaction, we implemented a “Mix Meter” that clearly indicates how long players need to stir. This mechanic makes potion-making feel more interactive.

2. New Mechanic: Playtesting also revealed that we needed to add a third mechanic. In Level 3, the lights go out, forcing players to navigate the potion recipe using only their cursor as a candle. This limits visibility so that only a small portion of the recipe is revealed at a time. For the grand finale, we wanted to create a more immersive, high-stakes final brewing experience that tests everything the player has learned so far. This mechanic reflects how individuals with dyslexia often need to process text in smaller segments and hold information in working memory.

3. Persistent Instructions: During playtesting, some players found the game confusing without guidance. To address this, we introduced a “?” button that allows players to access instructions at any time. This provides optional support without interrupting gameplay, helping balance accessibility with our goal of fostering empathy for dyslexia.

---

## Assets

> - `assets/audio/medieval-music.mp3` [9]
> - `assets/background/blue-lvl.png` (original artwork)
> - `assets/background/level-menu.png` (original artwork)
> - `assets/background/map-icons-default.png` (original artwork)
> - `assets/background/map-icons-hover.png` (original artwork)
> - `assets/background/map-icon_1.svg` (original artwork)
> - `assets/background/map-icon_2.svg` (original artwork)
> - `assets/background/map-icon_3.svg` (original artwork)
> - `assets/background/map-icon_4.svg` (original artwork)
> - `assets/background/recipe-book.png` (original artwork)
> - `assets/background/start-screen.png` (original artwork)
> - `assets/brand/potionary-logo-detail.svg` (original artwork)
> - `assets/brand/potionary-logo.png` (original artwork)
> - `assets/brand/potionary-logo.svg` (original artwork)
> - `assets/cauldron/cauldron-default-state.png` (original artwork)
> - `assets/cauldron/cauldron-glow-state.png` (original artwork)
> - `assets/crystal/brown-bowl.png` (generated by Gemini, manually edited in Figma)
> - `assets/crystal/crystal-v2.png` (original artwork)
> - `assets/crystal/crystal-v2.svg` (original artwork)
> - `assets/order/blank-order-sheet-2.png` [3]
> - `assets/order/envelope.png` [2]
> - `assets/symbols/blue-symbol.svg` (original artwork)
> - `assets/symbols/green-symbol.svg` (original artwork)
> - `assets/symbols/orange-symbol.svg` (original artwork)
> - `assets/symbols/symbol-black.svg` (original artwork)
> - `assets/symbols/symbol-lightgreen.svg` (original artwork)
> - `assets/symbols/symbol-lightpurple.svg` (original artwork)
> - `assets/symbols/symbol-midblue.svg` (original artwork)
> - `assets/symbols/symbol-red.svg` (original artwork)
> - `assets/vials/closed-black.svg` (original artwork)
> - `assets/vials/closed-darkgreen.svg` (original artwork)
> - `assets/vials/closed-darkpurple.svg` (original artwork)
> - `assets/vials/closed-lightblue.svg` (original artwork)
> - `assets/vials/closed-lightgreen.svg` (original artwork)
> - `assets/vials/closed-lightorange.svg` (original artwork)
> - `assets/vials/closed-lightpink.svg` (original artwork)
> - `assets/vials/closed-lightpurple.svg` (original artwork)
> - `assets/vials/closed-lightred.svg` (original artwork)
> - `assets/vials/closed-midblue.svg` (original artwork)
> - `assets/vials/closed-teal.svg` (original artwork)
> - `assets/vials/closed-yellow.svg` (original artwork)
> - `assets/vials/open-black.svg` (original artwork)
> - `assets/vials/open-darkgreen.svg` (original artwork)
> - `assets/vials/open-darkpurple.svg` (original artwork)
> - `assets/vials/open-lightblue.svg` (original artwork)
> - `assets/vials/open-lightgreen.svg` (original artwork)
> - `assets/vials/open-lightpink.svg` (original artwork)
> - `assets/vials/open-lightpurple.svg` (original artwork)
> - `assets/vials/open-lightred.svg` (original artwork)
> - `assets/vials/open-midblue.svg` (original artwork)
> - `assets/vials/open-orange.svg` (original artwork)
> - `assets/vials/open-teal.svg` (original artwork)
> - `assets/sound/correct.mp3` [11]
> - `assets/sound/wrong.mp3` [12]
> - `assets/sound/timeout.mp3` [13]

---

## References

[1] Alchemist Simulator. 2020. Steam Store. https://store.steampowered.com/app/1105040/Alchemist_Simulator/

[2] Flat Icon. Envelope free icon. https://www.flaticon.com/free-icon/envelope_2493541

[3] Freepik. Blank beige notepaper design vector. https://www.freepik.com/free-vector/blank-beige-notepaper-design-vector_28428625.htm

[2] Potion Craft Game Review. 2023. Immortal Wordsmith. https://www.immortalwordsmith.co.uk/potion-craft-game-review/

[3] Potion Craft: Alchemist Simulator. 2022. Video game published by tinyBuild. https://store.steampowered.com/app/1210320/Potion_Craft_Alchemist_Simulator/

[4] Potion Punch 2+. 2022. Monstronauts. https://www.monstronauts.com/all-stories/potion-punch-2-plus-apple-arcade/

[5] Potionomics. 2022. Steam Store. https://store.steampowered.com/app/1874490/Potionomics/

[6] Stardew Valley. 2016. Steam Store. https://store.steampowered.com/app/413150/Stardew_Valley/

[7] Strange Horticulture. 2022. Steam Store. https://store.steampowered.com/app/1574580/

[8] Stardew Valley 2024 Review. 2024. The Nocturnal Rambler Blog. https://thenocturnalrambler.blogspot.com/2024/06/stardew-valley-2024-review.htmlStrange_Horticulture/

[9] Tunetank. 2025. Medieval Happy Music. Pixabay. Retrieved March 12, 2026 from https://pixabay.com/music/adventure-medieval-happy-music-412790/

[10] Water Sort Puzzle. 2020. Mobile puzzle game listing on Apple App Store. https://apps.apple.com/us/app/magic-potion-sort-puzzle/id6755454821

[11] DRAGON-STUDIO. Correct. Pixabay. https://pixabay.com/sound-effects/technology-correct-472358/

[12] Lesiakower. Error / Mistake Sound Effect. Pixabay. https://pixabay.com/sound-effects/film-special-effects-error-mistake-sound-effect-incorrect-answer-437420/

[13] DRAGON-STUDIO. Clocking Ticking SFX. Pixabay. https://pixabay.com/sound-effects/clock-ticking-sfx-467486/
