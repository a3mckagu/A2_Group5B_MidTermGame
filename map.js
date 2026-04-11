// LEVELS MENU
// ------------------------------------------------------------
// NOTE: Do NOT add setup() or draw() in this file
// setup() and draw() live in main.js
// drawMap() is called from main.js only when:
// currentScreen === "map"

const BASE_W = 1152;
const BASE_H = 648;

// Toggle to show hitbox debug overlay on the map screen.
// Toggled by the global debug key `H` (see main.js)
let MAP_DEBUG_HITBOX = false;

// Hover animation state for map icons fade
let mapIconHoverFade = 0;
const MAP_ICON_FADE_SPEED = 0.08; // fade speed per frame

// Level hit-area parameters (relative to map image center)
// Final defaults (aligned to Level 1 artwork). Use debug keys if needed.
// Values chosen from interactive tuning overlay.
let level1RelX = -0.4; // negative = left
let level1RelY = 0.295; // positive = down
let level1RelDiameter = 0.18;

// Level 2 hitbox is 30px to the right of Level 1
let level2RelX = -0.4 + 0.0386; // ~30px shift (30/778 ≈ 0.0386)
let level2RelY = 0.295;
let level2RelDiameter = 0.18;

// Level 3 hitbox is 60px to the right of Level 1 (30px right from Level 2)
let level3RelX = -0.4 + 0.0772; // ~60px shift (60/778 ≈ 0.0772)
let level3RelY = 0.295;
let level3RelDiameter = 0.18;

function drawMap() {
  background(0);

  const scaleFactor = min(width / BASE_W, height / BASE_H);
  const offsetX = (width - BASE_W * scaleFactor) / 2;
  const offsetY = (height - BASE_H * scaleFactor) / 2;

  push();
  translate(offsetX, offsetY);
  scale(scaleFactor);

  // Draw background (in base coordinates)
  image(levelMenu, 0, 0, BASE_W, BASE_H);

  // Draw map icons image centered in the middle of the screen
  const mapIconWidth = 778;

  // Select the correct map icons based on current level
  let currentDefaultIcons,
    currentHoverIcons,
    currentRelX,
    currentRelY,
    currentRelDiameter,
    hitboxType = "circle",
    hitboxOffsetX = 0,
    hitboxOffsetY = 0,
    hitboxW = 0,
    hitboxH = 0;

  if (currentLevelNumber === 1) {
    currentDefaultIcons = mapIconsDefault;
    currentHoverIcons = mapIconsHover;
    currentRelX = level1RelX;
    currentRelY = level1RelY;
    currentRelDiameter = level1RelDiameter;
    hitboxType = "circle";
  } else if (currentLevelNumber === 2) {
    currentDefaultIcons = mapIconsLevel2Default;
    currentHoverIcons = mapIconsLevel2Hover;
    hitboxType = "rect";
    hitboxOffsetX = -155;
    hitboxOffsetY = -34;
    hitboxW = 118;
    hitboxH = 175;
  } else {
    // Level 3+
    currentDefaultIcons = mapIconsLevel3Default;
    currentHoverIcons = mapIconsLevel3Hover;
    hitboxType = "square";
    hitboxOffsetX = 48;
    hitboxOffsetY = 80;
    hitboxW = 138;
    hitboxH = 138;
  }

  const mapIconAspectRatio =
    currentDefaultIcons.height / currentDefaultIcons.width;
  const mapIconHeight = mapIconWidth * mapIconAspectRatio;
  const mapIconX = BASE_W / 2;
  const mapIconY = BASE_H / 2;
  // Check if mouse is hovering over the level hitbox (in base coordinates)
  const adjustedMX = (mouseX - offsetX) / scaleFactor;
  const adjustedMY = (mouseY - offsetY) / scaleFactor;

  // Calculate hitbox position based on level type
  let levelX, levelY, isHovering;

  if (currentLevelNumber === 1) {
    // Level 1: Circle hitbox at center position
    levelX = mapIconX + mapIconWidth * currentRelX;
    levelY = mapIconY + mapIconHeight * currentRelY;
    const levelDiameter = mapIconWidth * currentRelDiameter;

    const dx = adjustedMX - levelX;
    const dy = adjustedMY - levelY;
    const distToLevel = Math.sqrt(dx * dx + dy * dy);
    isHovering = distToLevel <= levelDiameter / 2;
  } else if (currentLevelNumber === 2) {
    // Level 2: Rectangle hitbox with pixel offsets
    levelX = mapIconX + hitboxOffsetX;
    levelY = mapIconY + hitboxOffsetY;
    const rectLeft = levelX - hitboxW / 2;
    const rectTop = levelY - hitboxH / 2;
    const rectRight = levelX + hitboxW / 2;
    const rectBottom = levelY + hitboxH / 2;

    isHovering =
      adjustedMX >= rectLeft &&
      adjustedMX <= rectRight &&
      adjustedMY >= rectTop &&
      adjustedMY <= rectBottom;
  } else {
    // Level 3+: Square hitbox with pixel offsets
    levelX = mapIconX + hitboxOffsetX;
    levelY = mapIconY + hitboxOffsetY;
    const squareLeft = levelX - hitboxW / 2;
    const squareTop = levelY - hitboxH / 2;
    const squareRight = levelX + hitboxW / 2;
    const squareBottom = levelY + hitboxH / 2;

    isHovering =
      adjustedMX >= squareLeft &&
      adjustedMX <= squareRight &&
      adjustedMY >= squareTop &&
      adjustedMY <= squareBottom;
  }

  // Update fade animation based on hover state
  if (isHovering) {
    mapIconHoverFade = min(mapIconHoverFade + MAP_ICON_FADE_SPEED, 1);
  } else {
    mapIconHoverFade = max(mapIconHoverFade - MAP_ICON_FADE_SPEED, 0);
  }

  // Draw default image
  imageMode(CENTER);
  image(currentDefaultIcons, mapIconX, mapIconY, mapIconWidth, mapIconHeight);

  // Draw hover image on top with fade opacity (only when fading > 0)
  if (mapIconHoverFade > 0) {
    5;
    tint(255, mapIconHoverFade * 255);
    image(currentHoverIcons, mapIconX, mapIconY, mapIconWidth, mapIconHeight);
    noTint();
  }

  imageMode(CORNER);

  // Title in base coordinates
  fill("#ceb53a");
  textFont("Fraunces");
  textSize(42);
  textStyle(BOLD);
  textAlign(CENTER, CENTER);
  text("Alchemy Map", BASE_W / 2, BASE_H * 0.14);

  // Debug: draw hitbox overlay when enabled
  if (MAP_DEBUG_HITBOX) {
    // Level 1 (circle)
    const l1x = mapIconX + mapIconWidth * level1RelX;
    const l1y = mapIconY + mapIconHeight * level1RelY;
    const l1diam = mapIconWidth * level1RelDiameter;

    noFill();
    stroke(0, 255, 100);
    strokeWeight(2);
    ellipse(l1x, l1y, l1diam, l1diam);

    // Level 2 (circle-like representation using relative coords)
    const l2x = mapIconX + mapIconWidth * level2RelX;
    const l2y = mapIconY + mapIconHeight * level2RelY;
    const l2diam = mapIconWidth * level2RelDiameter;
    stroke(255, 180, 0);
    ellipse(l2x, l2y, l2diam, l2diam);

    // Level 3 (circle-like representation using relative coords)
    const l3x = mapIconX + mapIconWidth * level3RelX;
    const l3y = mapIconY + mapIconHeight * level3RelY;
    const l3diam = mapIconWidth * level3RelDiameter;
    stroke(200, 80, 255);
    ellipse(l3x, l3y, l3diam, l3diam);

    // Draw readout for level1 values
    noStroke();
    fill(255);
    textAlign(LEFT, TOP);
    textSize(13);
    const infoX = 16;
    const infoY = BASE_H - 110;
    text(
      `Hitbox debug (H toggle)\nJ / L: left / right\nI / K: up / down\nN / M: smaller / larger\nP: save   0: load\n\nLevel1 x=${level1RelX.toFixed(4)} y=${level1RelY.toFixed(4)} d=${level1RelDiameter.toFixed(4)}`,
      infoX,
      infoY,
    );
  }

  pop();

  if (isHovering) cursor(HAND);
  else cursor(ARROW);
}

// ------------------------------------------------------------
// Mouse input for the map screen.
// ------------------------------------------------------------
// Called from main.js only when currentScreen === "map"
function mapMousePressed() {
  // Create a fresh level instance and transition to gameplay
  createLevelInstance();
  currentScreen = "level";
}

// ------------------------------------------------------------
// Keyboard input for the map screen
// ------------------------------------------------------------
// Provides keyboard shortcuts:
// - ENTER starts the game
// - S returns to start menu
// - ESC returns to start menu (handled globally)
function mapKeyPressed() {
  if (keyCode === ENTER) {
    currentScreen = "level";
  }

  if (key === "s" || key === "S") {
    currentScreen = "start";
  }
}

// ------------------------------------------------------------
// Helper: drawButton()
// ------------------------------------------------------------
// This function draws a button and changes its appearance on hover.
// It does NOT decide what happens when you click the button.
// That logic lives in startMousePressed() above.
//
// Keeping drawing separate from input/logic makes code easier to read.
function drawButton({ x, y, w, h, label }) {
  rectMode(CENTER);

  // Check if the mouse is over the button rectangle
  const hover = isHover({ x, y, w, h });

  noStroke();

  // ---- Visual feedback (hover vs not hover) ----
  // This is a common UI idea:
  // - normal state is calmer
  // - hover state is brighter + more “active”
  //
  // We also add a shadow using drawingContext (p5 lets you access the
  // underlying canvas context for effects like shadows).
  if (hover) {
    fill(255, 255, 255, 0); // more opaque on hover
    stroke("#83c5be");
    strokeWeight(1.5);
  } else {
    fill(255, 255, 255, 0); // semi-transparent white
    stroke(255, 255, 255, 0);
    strokeWeight(1.5);
  }

  rect(x, y, w, h);

  // Draw the label text - dark navy for high contrast
  noStroke();
  fill("#ceb53a");
  textSize(23);
  textStyle(BOLD);
  textAlign(CENTER, CENTER);
  text(label, x, y);
}

// Helper: isCircleHover()
// Checks if the mouse is over a circular button.
function isCircleHover({ x, y, diameter }) {
  const radius = diameter / 2;
  const distance = dist(mouseX, mouseY, x, y);
  return distance < radius;
}

// Helper: isIconHover()
// Checks if the mouse is over a rectangular icon
function isIconHover(x, y, width, height) {
  return (
    mouseX > x - width / 2 &&
    mouseX < x + width / 2 &&
    mouseY > y - height / 2 &&
    mouseY < y + height / 2
  );
}

// Helper: drawCircleButton()
// Draws a circular button with "click me" text.
function drawCircleButton({ x, y, diameter }) {
  fill(255);
  noStroke();
  ellipseMode(CENTER);
  ellipse(x, y, diameter, diameter);

  fill(0);
  textSize(18);
  textAlign(CENTER, CENTER);
  text("Begin", x, y);
}
