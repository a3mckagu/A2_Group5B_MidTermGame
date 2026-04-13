// GLOBAL GAME STATE
// ------------------------------------------------------------
// main.js = the “router” (traffic controller) for the whole game
// ------------------------------------------------------------
//
// Idea: this project has multiple screens (start, instructions, game, win, lose).
// Instead of putting everything in one giant file, each screen lives in its own
// file and defines two main things:
//   1) drawX()         → how that screen looks
//   2) XMousePressed() / XKeyPressed() → how that screen handles input
//
// This main.js file does 3 important jobs:
//   A) stores the current screen in a single shared variable
//   B) calls the correct draw function each frame
//   C) sends mouse/keyboard input to the correct screen handler
// ------------------------------
// This variable is shared across all files because all files run in the same
// global JavaScript scope when loaded in index.html.
//
// We store the “name” of the current screen as a string.
// Only one screen should be active at a time.

let currentScreen = "start";
let currentLevelNumber = 1; // Track the current level (starts at level 1)
let gameStarted = false; // Track if the player has started the game (reached a level)
let levelData;
let level;
let levelInstance;

// Track if instructions screen was opened from help button (vs. start menu)
let instrOpenedFromHelp = false;
let previousScreenBeforeHelp = null; // Store the screen to return to

let potionaryLogo, potionaryLogoDetail, startBg, levelMenu;
let levelBg1,
  levelBg2,
  levelBg3,
  orderSheet,
  blankOrderSheet2,
  cauldronImg,
  recipeBookClosed,
  recipeBookOpen,
  recipeBookBg,
  spoonImg,
  newItemImg;
let symbolBlack, symbolLightgreen, symbolLightpurple, symbolMidblue, symbolRed;
let symbolLightpink2, symbolOrange2, symbolYellow2;
let bottleGreen, bottleRed, bottleBlue, bottleOrange, bottlePink;
let crystalImg, bowlImg, envelopeImg;
let greenSymbol, blueSymbol, orangeSymbol;
let mapIconsDefault, mapIconsHover;
let mapIconsLevel2Default;
let mapIconsLevel3Default, mapIconsLevel3Hover;

// Font names for use with textFont()
const FONT_MANUFACTURING_CONSENT = "Manufacturing Consent";
const FONT_IM_FELL_ENGLISH = "IM Fell English";
const FONT_VT323 = "VT323";
const FONT_MONSIEUR_LA_DOULAISE = "Monsieur La Doulaise";
const FONT_VOCES = "Voces";

// ------------------------------
// preload() runs BEFORE setup() to load assets
// ------------------------------
// Use preload() to ensure images are loaded before they're used

function preload() {
  potionaryLogo = loadImage("assets/brand/potionary-logo.png");
  potionaryLogoDetail = loadImage("assets/brand/potionary-logo-detail.svg");
  startBg = loadImage("assets/background/start-screen.png");
  levelMenu = loadImage("assets/background/level-menu.png");

  // Level backgrounds
  levelBg1 = loadImage("assets/background/level-1.png");
  levelBg2 = loadImage("assets/background/level-2.png");
  levelBg3 = loadImage("assets/background/level-3.png");
  recipeBookBg = loadImage("assets/background/recipe-book.png");
  newItemImg = loadImage("assets/background/new-item.png");
  orderSheet = loadImage("assets/order/blank-order-sheet-2.png");
  blankOrderSheet2 = loadImage("assets/order/blank-order-sheet-2.png");
  cauldronImg = loadImage("assets/cauldron/cauldron-default-state.png");
  cauldronImgGlow = loadImage("assets/cauldron/cauldron-glow-state.png");
  spoonImg = loadImage("assets/cauldron/spoon.png");
  recipeBookClosed = loadImage("assets/recipe/recipe-book-default-state.png");
  recipeBookOpen = loadImage("assets/recipe/open-recipe-book.svg");

  bottleBlack = loadImage("assets/vials/closed-black.svg");
  bottleBlack2 = loadImage("assets/vials/closed-black2.svg");
  bottleDarkgreen = loadImage("assets/vials/closed-darkgreen.svg");
  bottleDarkgreen2 = loadImage("assets/vials/closed-darkgreen2.svg");
  bottleDarkpurple = loadImage("assets/vials/closed-darkpurple.svg");
  bottleLightblue = loadImage("assets/vials/closed-lightblue.svg");
  bottleLightgreen = loadImage("assets/vials/closed-lightgreen.svg");
  bottleLightpink = loadImage("assets/vials/closed-lightpink.svg");
  bottleLightpurple = loadImage("assets/vials/closed-lightpurple.svg");
  bottleLightpurple2 = loadImage("assets/vials/closed-lightpurple2.svg");
  bottleLightred = loadImage("assets/vials/closed-lightred.svg");
  bottleMidblue = loadImage("assets/vials/closed-midblue.svg");
  bottleClosedOrange = loadImage("assets/vials/closed-orange.svg");
  bottleOrange2 = loadImage("assets/vials/closed-orange2.svg");
  bottleTeal = loadImage("assets/vials/closed-teal.svg");
  bottleYellow = loadImage("assets/vials/closed-yellow.svg");
  bottleYellow2 = loadImage("assets/vials/closed-yellow2.svg");
  bottleLightblue2 = loadImage("assets/vials/closed-lightblue2.svg");
  bottleLightpink2 = loadImage("assets/vials/closed-lightpink2.svg");

  // Open variants (used when a vial is picked up)
  bottleOpenBlack = loadImage("assets/vials/open-black.svg");
  bottleOpenBlack2 = loadImage("assets/vials/open-black2.svg");
  bottleOpenDarkgreen = loadImage("assets/vials/open-darkgreen.svg");
  bottleOpenDarkgreen2 = loadImage("assets/vials/open-darkgreen2.svg");
  bottleOpenDarkpurple = loadImage("assets/vials/open-darkpurple.svg");
  bottleOpenLightblue = loadImage("assets/vials/open-lightblue.svg");
  bottleOpenLightgreen = loadImage("assets/vials/open-lightgreen.svg");
  bottleOpenLightpink = loadImage("assets/vials/open-lightpink.svg");
  bottleOpenLightpurple = loadImage("assets/vials/open-lightpurple.svg");
  bottleOpenLightpurple2 = loadImage("assets/vials/open-lightpurple2.svg");
  bottleOpenLightred = loadImage("assets/vials/open-lightred.svg");
  bottleOpenMidblue = loadImage("assets/vials/open-midblue.svg");
  bottleOpenOrange = loadImage("assets/vials/open-orange.svg");
  bottleOpenOrange2 = loadImage("assets/vials/open-orange2.svg");
  bottleOpenTeal = loadImage("assets/vials/open-teal.svg");
  bottleTeal2 = loadImage("assets/vials/closed-teal2.svg");
  bottleOpenTeal2 = loadImage("assets/vials/open-teal2.svg");
  bottleOpenYellow = loadImage("assets/vials/open-yellow.svg");
  bottleOpenYellow2 = loadImage("assets/vials/open-yellow2.svg");
  bottleOpenLightblue2 = loadImage("assets/vials/open-lightblue2.svg");
  bottleOpenLightpink2 = loadImage("assets/vials/open-lightpink2.svg");

  crystalImg = loadImage("assets/crystal/crystal-v2.svg");
  // Use single brown bowl asset
  bowlImg = loadImage("assets/crystal/brown-bowl.png");
  envelopeImg = loadImage("assets/order/envelope.png");

  greenSymbol = loadImage("assets/symbols/green-symbol.svg");
  blueSymbol = loadImage("assets/symbols/blue-symbol.svg");
  orangeSymbol = loadImage("assets/symbols/orange-symbol.svg");
  symbolBlack = loadImage("assets/symbols/symbol-black.svg");
  symbolLightgreen = loadImage("assets/symbols/symbol-lightgreen.svg");
  symbolLightpurple = loadImage("assets/symbols/symbol-lightpurple.svg");
  symbolMidblue = loadImage("assets/symbols/symbol-midblue.svg");
  symbolRed = loadImage("assets/symbols/symbol-red.svg");
  symbolLightpink2 = loadImage("assets/symbols/symbol-lightpink2.svg");
  symbolOrange2 = loadImage("assets/symbols/symbol-orange2.svg");
  symbolYellow2 = loadImage("assets/symbols/symbol-yellow2.svg");

  // Additional symbol variants used by Level 3
  symbolLightpink = loadImage("assets/symbols/symbol-lightpink.svg");
  symbolLightblue2 = loadImage("assets/symbols/symbol-lightblue2.svg");
  symbolDarkpurple = loadImage("assets/symbols/symbol-darkpurple.svg");
  symbolLightpurple2 = loadImage("assets/symbols/symbol-lightpurple2.svg");

  // Additional symbol variants (used by recipes)
  symbolDarkgreen = loadImage("assets/symbols/symbol-darkgreen.svg");
  symbolOrange = loadImage("assets/symbols/symbol-orange.svg");
  symbolTeal = loadImage("assets/symbols/symbol-teal.svg");

  // Map screen icons
  mapIconsDefault = loadImage("assets/background/map-icons-default.png");
  mapIconsHover = loadImage("assets/background/map-icons-hover.png");
  mapIconsLevel2Default = loadImage(
    "assets/background/map-icons-default-lvl2.png",
  );
  mapIconsLevel3Default = loadImage(
    "assets/background/map-icons-default-lvl3.png",
  );
  // Hover variant removed: use the default image for hover state as well
  mapIconsLevel3Hover = mapIconsLevel3Default;

  levelData = loadJSON("levels.json");

  // Preload Google Fonts
  document.fonts.load('16px "Manufacturing Consent"');
  document.fonts.load('16px "IM Fell English"');
  document.fonts.load('16px "VT323"');
  document.fonts.load('16px "Monsieur La Doulaise"');
  document.fonts.load('16px "Voces"');

  // Note: Sound effects are preloaded as <audio> elements in index.html:
  // - assets/sound/stirring.mp3 (for spoon mixing)
  // - assets/sound/crystal-shine.mp3 (for crystal pickup, at 55% volume)
  // - assets/sound/glass-cling.mp3 (for vial pickups at 50%, and returns at 40%)
}

// ------------------------------
// Helper function to create a fresh level instance
function createLevelInstance() {
  // Select the appropriate background image based on the current level number
  let selectedLevelBg = levelBg1;
  if (currentLevelNumber === 2) {
    selectedLevelBg = levelBg2;
  } else if (currentLevelNumber === 3) {
    selectedLevelBg = levelBg3;
  }

  levelInstance = new Level({
    levelNumber: currentLevelNumber,
    cauldronImg,
    cauldronImgGlow,
    recipeBookClosed,
    recipeBookOpen,
    levelBg: selectedLevelBg,
    newItemImg,
    orderSheet,
    blankOrderSheet2,
    bottleBlack,
    bottleBlack2,
    bottleDarkgreen,
    bottleDarkgreen2,
    bottleDarkpurple,
    bottleLightblue,
    bottleLightgreen,
    bottleLightpink,
    bottleLightpurple,
    bottleLightpurple2,
    bottleLightred,
    bottleMidblue,
    bottleClosedOrange,
    bottleOrange2,
    bottleTeal,
    bottleTeal2,
    bottleYellow,
    bottleYellow2,
    bottleLightblue2,
    bottleLightpink2,
    // Open variants
    bottleOpenBlack,
    bottleOpenBlack2,
    bottleOpenDarkgreen,
    bottleOpenDarkgreen2,
    bottleOpenDarkpurple,
    bottleOpenLightblue,
    bottleOpenLightgreen,
    bottleOpenLightpink,
    bottleOpenLightpurple,
    bottleOpenLightpurple2,
    bottleOpenLightred,
    bottleOpenMidblue,
    bottleOpenOrange,
    bottleOpenOrange2,
    bottleOpenTeal,
    bottleOpenTeal2,
    bottleOpenYellow,
    bottleOpenYellow2,
    bottleOpenLightblue2,
    bottleOpenLightpink2,
    crystalImg,
    bowlImg,
    envelopeImg,
    spoonImg,
    greenSymbol,
    blueSymbol,
    orangeSymbol,
  });

  // Also provide the recipe-book background asset so the level can switch
  // the background when the recipe book is opened.
  levelInstance.assets.recipeBookBg = recipeBookBg;

  // Attach additional symbol assets for recipe rendering
  levelInstance.assets.symbolBlack = symbolBlack;
  levelInstance.assets.symbolLightgreen = symbolLightgreen;
  levelInstance.assets.symbolLightpurple = symbolLightpurple;
  levelInstance.assets.symbolMidblue = symbolMidblue;
  levelInstance.assets.symbolRed = symbolRed;
  levelInstance.assets.symbolLightpink2 = symbolLightpink2;
  levelInstance.assets.symbolOrange2 = symbolOrange2;
  levelInstance.assets.symbolYellow2 = symbolYellow2;
  // Attach additional Level 3 symbol variants
  levelInstance.assets.symbolLightpink = symbolLightpink;
  levelInstance.assets.symbolLightblue2 = symbolLightblue2;
  levelInstance.assets.symbolDarkpurple = symbolDarkpurple;
  levelInstance.assets.symbolLightpurple2 = symbolLightpurple2;
  // Attach new symbol assets
  levelInstance.assets.symbolDarkgreen = symbolDarkgreen;
  levelInstance.assets.symbolOrange = symbolOrange;
  levelInstance.assets.symbolTeal = symbolTeal;
}

function jumpToLevel(levelNumber) {
  currentLevelNumber = levelNumber;
  gameStarted = true; // Mark that the player has started playing a level
  createLevelInstance();
  currentScreen = "level";
  try {
    if (typeof restoreBgMusicVolume === "function") restoreBgMusicVolume();
  } catch (e) {}
}

// Restore background music volume to the original level (if previously reduced).
function restoreBgMusicVolume() {
  try {
    const bg = document.getElementById("bg-music");
    if (!bg) return;
    const orig =
      typeof window._bgMusicOriginalVolume === "number"
        ? window._bgMusicOriginalVolume
        : 0.25;
    try {
      bg.volume = orig;
    } catch (e) {}
    // If music is paused, try to resume playback.
    if (bg.paused) {
      bg.play().catch(() => {});
    }
  } catch (e) {}
}

function jumpToLevelResult(levelNumber, resultType) {
  jumpToLevel(levelNumber);
  levelInstance.levelResult = resultType;

  if (typeof Results !== "undefined") {
    Results.reset();
  }
}

function jumpToLevel2SecondRecipe() {
  jumpToLevel(2);

  levelInstance.orderStarted = true;
  levelInstance.hasUnreadOrder = false;
  levelInstance.currentSequenceIndex = 0;
  levelInstance.completedSequences = [false, false]; // Level 2 has 2 valid sequences
  levelInstance.sequenceResultsToDisplay = [];
  levelInstance.addedIngredients = [];
  levelInstance.crystalAdded = false;
}

// setup() runs ONCE at the beginning
// ------------------------------
// This is where you usually set canvas size and initial settings.
function setup() {
  pixelDensity(1);
  createCanvas(windowWidth, windowHeight);
  createLevelInstance();
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

// ------------------------------
// draw() runs every frame (many times per second)
// ------------------------------
// This is the core “router” for visuals.
// Depending on currentScreen, we call the correct draw function.
function draw() {
  // Each screen file defines its own draw function:
  //   start.js         → drawStart()
  //   instructions.js  → drawInstr()

  if (currentScreen === "start") drawStart();
  else if (currentScreen === "instr") drawInstr();
  else if (currentScreen === "finish") drawEnd();
  else if (currentScreen === "map") drawMap();
  else if (currentScreen === "level") drawLevel();

  // (Optional teaching note)
  // This “if/else chain” is a very common early approach.
  // Later in the course you might replace it with:
  // - a switch statement, or
  // - an object/map of screens
}

// ------------------------------
// mousePressed() runs once each time the mouse is clicked
// ------------------------------
// This routes mouse input to the correct screen handler.
function mousePressed() {
  // Each screen *may* define a mouse handler:
  // start.js         → startMousePressed()
  // instructions.js  → instrMousePressed()

  console.log("[main.js mousePressed] Called - currentScreen:", currentScreen);
  if (currentScreen === "start") startMousePressed();
  else if (currentScreen === "instr") instrMousePressed();
  else if (currentScreen === "finish") endMousePressed();
  else if (currentScreen === "map") mapMousePressed();
  else if (currentScreen === "level") {
    console.log("[main.js] Routing to levelMousePressed");
    levelMousePressed();
  }
  return false; // Prevent default browser behavior
}

// ------------------------------
// mouseReleased() runs once each time the mouse is released
// ------------------------------
function mouseReleased() {
  // Mouse release no longer forcibly drops the spoon. Spoon pickup/drop is
  // handled via clicks (toggle) inside `levelMousePressed()` so we avoid
  // interrupting the click-to-pick behaviour.
}

// ------------------------------
// keyPressed() runs once each time a key is pressed
// ------------------------------
// This routes keyboard input to the correct screen handler.
function keyPressed() {
  // Handle escape key globally
  if (keyCode === ESCAPE) {
    if (currentScreen === "level") {
      currentScreen = "map";
      try {
        restoreBgMusicVolume();
      } catch (e) {}
    } else if (currentScreen === "map") {
      currentScreen = "start";
    }
    return;
  }

  // --------- Debug / testing shortcuts (global) ---------
  // Level jumps: 1, 2
  if (key === "1") {
    jumpToLevel(1);
    return;
  }
  if (key === "2") {
    jumpToLevel(2);
    return;
  }
  if (key === "3") {
    jumpToLevel(3);
    return;
  }

  // Result jumps: A-F -> show result banners for quick testing
  if (typeof key === "string") {
    const k = key.toUpperCase();
    if (k === "A") {
      jumpToLevelResult(1, "CORRECT");
      return;
    }
    if (k === "B") {
      jumpToLevelResult(1, "WRONG");
      return;
    }
    if (k === "C") {
      jumpToLevelResult(1, "TIMEOUT");
      return;
    }
    if (k === "D") {
      jumpToLevelResult(2, "CORRECT");
      return;
    }
    if (k === "E") {
      jumpToLevelResult(2, "WRONG");
      return;
    }
    if (k === "F") {
      jumpToLevelResult(2, "TIMEOUT");
      return;
    }

    // Debug shortcuts for Level 3 results
    if (k === "X") {
      jumpToLevelResult(3, "CORRECT");
      return;
    }
    if (k === "Y") {
      jumpToLevelResult(3, "WRONG");
      return;
    }
    if (k === "Z") {
      jumpToLevelResult(3, "TIMEOUT");
      return;
    }

    // G: toggle spoon hitbox debug overlay
    if (k === "G") {
      if (typeof SPOON_DEBUG_HITBOX === "undefined") {
        window.SPOON_DEBUG_HITBOX = true;
      } else {
        SPOON_DEBUG_HITBOX = !SPOON_DEBUG_HITBOX;
      }
      return;
    }

    // H: toggle all level hitboxes (vials, cauldron, crystal, spoon)
    if (k === "H") {
      if (typeof LEVEL_DEBUG_HITBOX === "undefined") {
        window.LEVEL_DEBUG_HITBOX = true;
      } else {
        LEVEL_DEBUG_HITBOX = !LEVEL_DEBUG_HITBOX;
      }
      return;
    }
    // Left / Right: J / L
    if (k === "J") {
      level1RelX -= 0.005;
      return;
    }
    if (k === "L") {
      level1RelX += 0.005;
      return;
    }
    // Up / Down: I / K
    if (k === "I") {
      level1RelY -= 0.005;
      return;
    }
    if (k === "K") {
      level1RelY += 0.005;
      return;
    }
    // Smaller / Larger: N / M
    if (k === "N") {
      level1RelDiameter = max(0.02, level1RelDiameter - 0.005);
      return;
    }
    if (k === "M") {
      level1RelDiameter = min(0.6, level1RelDiameter + 0.005);
      return;
    }

    // Save / Load Level 1 hitbox: P -> save, 0 -> load
    if (k === "P") {
      if (typeof localStorage !== "undefined") {
        const payload = { x: level1RelX, y: level1RelY, d: level1RelDiameter };
        localStorage.setItem("level1Hitbox", JSON.stringify(payload));
        console.log("Saved Level 1 hitbox:", payload);
      }
      return;
    }
    if (k === "0") {
      if (typeof localStorage !== "undefined") {
        const raw = localStorage.getItem("level1Hitbox");
        if (raw) {
          try {
            const obj = JSON.parse(raw);
            level1RelX = obj.x;
            level1RelY = obj.y;
            level1RelDiameter = obj.d;
            console.log("Loaded Level 1 hitbox:", obj);
          } catch (e) {
            console.warn("Failed to parse saved hitbox", e);
          }
        }
      }
      return;
    }
  }

  // Each screen *may* define a key handler:
  // start.js         → startKeyPressed()
  // instructions.js  → instrKeyPressed()
  // game.js          → gameKeyPressed()
  // win.js           → winKeyPressed()
  // lose.js          → loseKeyPressed()

  if (currentScreen === "start") startKeyPressed();
  else if (currentScreen === "instr") instrKeyPressed();
  else if (currentScreen === "finish") endKeyPressed();
  else if (currentScreen === "map") mapKeyPressed();
  else if (currentScreen === "level") levelKeyPressed();
}

function mouseWheel(e) {
  // Each screen *may* define a scroll handler:
  // level.js         → levelMouseWheel()

  if (currentScreen === "level") levelMouseWheel(e);
}

// ------------------------------------------------------------
// Shared helper function: isHover()
// ------------------------------------------------------------
//
// Many screens have buttons.
// This helper checks whether the mouse is inside a rectangle.
//
// Important: our buttons are drawn using rectMode(CENTER),
// meaning x,y is the CENTRE of the rectangle.
// So we check mouseX and mouseY against half-width/half-height bounds.
//
// Input:  an object with { x, y, w, h }
// Output: true if mouse is over the rectangle, otherwise false
function isHover({ x, y, w, h }) {
  return (
    mouseX > x - w / 2 && // mouse is right of left edge
    mouseX < x + w / 2 && // mouse is left of right edge
    mouseY > y - h / 2 && // mouse is below top edge
    mouseY < y + h / 2 // mouse is above bottom edge
  );
}
