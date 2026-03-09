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

let currentScreen = "level";
let levelData;
let level;
let levelInstance;

let potionaryLogo, potionaryLogoDetail, startBg, levelMenu;
let levelBg, orderSheet, cauldronImg, recipeBookClosed, recipeBookOpen;
let bottleGreen, bottleRed, bottleBlue, bottleOrange, bottlePink;
let crystalImg, bowlImg, envelopeImg;
let greenSymbol, blueSymbol, orangeSymbol;
let mapIcon1, mapIcon2, mapIcon3, mapIcon4;

// Font names for use with textFont()
const FONT_MANUFACTURING_CONSENT = "Manufacturing Consent";
const FONT_IM_FELL_ENGLISH = "IM Fell English";
const FONT_VT323 = "VT323";
const FONT_MONSIEUR_LA_DOULAISE = "Monsieur La Doulaise";

// ------------------------------
// preload() runs BEFORE setup() to load assets
// ------------------------------
// Use preload() to ensure images are loaded before they're used

function preload() {
  potionaryLogo = loadImage("assets/brand/potionary-logo.png");
  potionaryLogoDetail = loadImage("assets/brand/potionary-logo-detail.svg");
  startBg = loadImage("assets/background/start-screen.png");
  levelMenu = loadImage("assets/background/level-menu.png");

  // Level 1 assets
  levelBg = loadImage("assets/background/blue-lvl.png");
  orderSheet = loadImage("assets/order/blank-order-sheet.png");
  cauldronImg = loadImage("assets/cauldron/cauldron-1.svg");
  recipeBookClosed = loadImage("assets/recipe/closed-recipe-book.svg");
  recipeBookOpen = loadImage("assets/recipe/open-recipe-book.svg");

  bottleGreen = loadImage("assets/ingredient-bottles/lvl-1-easy-green.svg");
  bottleRed = loadImage("assets/ingredient-bottles/lvl-1-easy-red.svg");
  bottleBlue = loadImage("assets/ingredient-bottles/lvl-1-easy-blue.svg");
  bottleOrange = loadImage("assets/ingredient-bottles/lvl-1-easy-orange.svg");
  bottlePink = loadImage("assets/ingredient-bottles/lvl-1-easy-pink.svg");

  crystalImg = loadImage("assets/crystal/crystal-v2.svg");
  bowlImg = loadImage("assets/crystal/bowl.png");
  envelopeImg = loadImage("assets/order/envelope.png");

  greenSymbol = loadImage("assets/symbols/green-symbol.svg");
  blueSymbol = loadImage("assets/symbols/blue-symbol.svg");
  orangeSymbol = loadImage("assets/symbols/orange-symbol.svg");

  // Map screen icons
  mapIcon1 = loadImage("assets/background/map-icon_1.svg");
  mapIcon2 = loadImage("assets/background/map-icon_2.svg");
  mapIcon3 = loadImage("assets/background/map-icon_3.svg");
  mapIcon4 = loadImage("assets/background/map-icon_4.svg");

  levelData = loadJSON("levels.json");

  // Preload Google Fonts
  document.fonts.load('16px "Manufacturing Consent"');
  document.fonts.load('16px "IM Fell English"');
  document.fonts.load('16px "VT323"');
  document.fonts.load('16px "Monsieur La Doulaise"');
}

// ------------------------------
// setup() runs ONCE at the beginning
// ------------------------------
// This is where you usually set canvas size and initial settings.
function setup() {
  createCanvas(windowWidth, windowHeight);
  levelInstance = new Level({
    cauldronImg,
    recipeBookClosed,
    recipeBookOpen,
    levelBg,
    orderSheet,
    bottleGreen,
    bottleRed,
    bottleBlue,
    bottleOrange,
    bottlePink,
    crystalImg,
    bowlImg,
    envelopeImg,
  });
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

  if (currentScreen === "start") startMousePressed();
  else if (currentScreen === "instr") instrMousePressed();
  else if (currentScreen === "map") mapMousePressed();
  else if (currentScreen === "level") levelMousePressed();
}
// ------------------------------
// keyPressed() runs once each time a key is pressed
// ------------------------------
// This routes keyboard input to the correct screen handler.
function keyPressed() {
  // Each screen *may* define a key handler:
  // start.js         → startKeyPressed()
  // instructions.js  → instrKeyPressed()
  // game.js          → gameKeyPressed()
  // win.js           → winKeyPressed()
  // lose.js          → loseKeyPressed()

  if (currentScreen === "start") startKeyPressed();
  else if (currentScreen === "instr") instrKeyPressed();
  else if (currentScreen === "map") mapKeyPressed();
  else if (currentScreen === "level") levelKeyPressed();
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
