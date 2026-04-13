// LEVELS MENU
// ------------------------------------------------------------
// NOTE: Do NOT add setup() or draw() in this file
// setup() and draw() live in main.js
// drawMap() is called from main.js only when:
// currentScreen === "map"

const BASE_W = 1152;
const BASE_H = 648;

// Hover animation state for map icons fade
let mapIconHoverFade = 0;
const MAP_ICON_FADE_SPEED = 0.08; // fade speed per frame
// Hover animation state for Level 2 glow
let level2GlowFade = 0;
const LEVEL2_GLOW_FADE_SPEED = 0.12; // slightly faster glow fade
// Hover animation state for Level 1 glow
let level1GlowFade = 0;
const LEVEL1_GLOW_FADE_SPEED = 0.12;
// Hover animation state for Level 3 glow
let level3GlowFade = 0;
const LEVEL3_GLOW_FADE_SPEED = 0.12;

// ========== HITBOX CONFIGURATION ==========
// All hitboxes are centered on the map screen (BASE_W/2, BASE_H/2)
// Modify these variables to adjust hitbox positions and sizes

// LEVEL 1: Circle at center
const LEVEL1_HITBOX = {
  centerX: BASE_W / 2 - 288,
  centerY: BASE_H / 2 + 122,
  radius: 87, // diameter will be radius * 2
};

// LEVEL 2: Norman window shape (rectangle with semicircle on top)
// Norman window = rectangle body + semicircle top
const LEVEL2_HITBOX = {
  centerX: BASE_W / 2 - 85,
  centerY: BASE_H / 2 + 50, // positioned slightly lower
  rectWidth: 153, // width of rectangular body
  rectHeight: 170, // height of rectangular body (doesn't include semicircle)
  // semicircle sits on top with same width as rect
};

// LEVEL 3: Norman window shape (same as Level 2, positioned higher with red fill)
const LEVEL3_HITBOX = {
  centerX: BASE_W / 2 + 242,
  centerY: BASE_H / 2 + 210, // positioned slightly higher
  rectWidth: 265,
  rectHeight: 221,
};

// Legacy progression button removed — navigation controlled by level icons

// ========== HITBOX DETECTION HELPERS ==========

// Check if a point is inside Level 1 circle hitbox
function isPointInLevel1Circle(px, py) {
  const dx = px - LEVEL1_HITBOX.centerX;
  const dy = py - LEVEL1_HITBOX.centerY;
  const distSq = dx * dx + dy * dy;
  const radiusSq = LEVEL1_HITBOX.radius * LEVEL1_HITBOX.radius;
  return distSq <= radiusSq;
}

// Check if a point is inside a Norman window shape (rectangle + semicircle on top)
function isPointInNormanWindow(px, py, config) {
  const rectLeft = config.centerX - config.rectWidth / 2;
  const rectRight = config.centerX + config.rectWidth / 2;
  const rectTop = config.centerY - config.rectHeight;
  const rectBottom = config.centerY;

  // Check if inside rectangular body
  if (px >= rectLeft && px <= rectRight && py >= rectTop && py <= rectBottom) {
    return true;
  }

  // Check if inside semicircle on top
  // Semicircle center is at the top of the rectangle
  const semicircleTop = rectTop;
  const semicircleRadius = config.rectWidth / 2;
  const dx = px - config.centerX;
  const dy = py - semicircleTop;

  if (dy <= 0 && dy >= -semicircleRadius) {
    // Point is above the rectangle line
    const distSq = dx * dx + dy * dy;
    return distSq <= semicircleRadius * semicircleRadius;
  }

  return false;
}

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

  // Select the correct map icons based on current level
  let currentDefaultIcons, currentHoverIcons;

  if (currentLevelNumber === 1) {
    currentDefaultIcons = mapIconsDefault;
    currentHoverIcons = mapIconsHover;
  } else if (currentLevelNumber === 2) {
    currentDefaultIcons = mapIconsLevel2Default;
    // Hover variant removed for Level 2; use default icons only.
    currentHoverIcons = mapIconsLevel2Default;
  } else {
    // Level 3+
    currentDefaultIcons = mapIconsLevel3Default;
    currentHoverIcons = mapIconsLevel3Hover;
  }

  const mapIconAspectRatio =
    currentDefaultIcons.height / currentDefaultIcons.width;
  const mapIconWidth = 778;
  const mapIconHeight = mapIconWidth * mapIconAspectRatio;
  const mapIconX = BASE_W / 2;
  const mapIconY = BASE_H / 2;

  // Check if mouse is hovering over the level hitbox (in base coordinates)
  const adjustedMX = (mouseX - offsetX) / scaleFactor;
  const adjustedMY = (mouseY - offsetY) / scaleFactor;

  // Determine if hovering over any unlocked level's hitbox
  let isHovering = false;
  if (
    currentLevelNumber >= 1 &&
    isPointInLevel1Circle(adjustedMX, adjustedMY)
  ) {
    isHovering = true;
  }
  if (
    currentLevelNumber >= 2 &&
    isPointInNormanWindow(adjustedMX, adjustedMY, LEVEL2_HITBOX)
  ) {
    isHovering = true;
  }
  if (
    currentLevelNumber >= 3 &&
    isPointInNormanWindow(adjustedMX, adjustedMY, LEVEL3_HITBOX)
  ) {
    isHovering = true;
  }

  // Update fade animation based on hover state
  if (isHovering) {
    mapIconHoverFade = min(mapIconHoverFade + MAP_ICON_FADE_SPEED, 1);
  } else {
    mapIconHoverFade = max(mapIconHoverFade - MAP_ICON_FADE_SPEED, 0);
  }

  // Determine whether the mouse is hovering Level 2 specifically
  const level2Hovered =
    currentLevelNumber >= 2 &&
    isPointInNormanWindow(adjustedMX, adjustedMY, LEVEL2_HITBOX);

  // Determine whether the mouse is hovering Level 1 specifically
  const level1Hovered =
    currentLevelNumber >= 1 && isPointInLevel1Circle(adjustedMX, adjustedMY);

  // Animate level1 glow fade separately so it only appears on hover
  if (level1Hovered) {
    level1GlowFade = min(level1GlowFade + LEVEL1_GLOW_FADE_SPEED, 1);
  } else {
    level1GlowFade = max(level1GlowFade - LEVEL1_GLOW_FADE_SPEED, 0);
  }

  // Animate level2 glow fade separately so it only appears on hover
  if (level2Hovered) {
    level2GlowFade = min(level2GlowFade + LEVEL2_GLOW_FADE_SPEED, 1);
  } else {
    level2GlowFade = max(level2GlowFade - LEVEL2_GLOW_FADE_SPEED, 0);
  }

  // Determine whether the mouse is hovering Level 3 specifically
  const level3Hovered =
    currentLevelNumber >= 3 &&
    isPointInNormanWindow(adjustedMX, adjustedMY, LEVEL3_HITBOX);

  // Animate level3 glow fade separately so it only appears on hover
  if (level3Hovered) {
    level3GlowFade = min(level3GlowFade + LEVEL3_GLOW_FADE_SPEED, 1);
  } else {
    level3GlowFade = max(level3GlowFade - LEVEL3_GLOW_FADE_SPEED, 0);
  }

  // ============ HOVER GLOWS (unified shadowBlur for both levels) ============
  // Both levels use the same technique: fill the shape with shadowBlur.
  // The icon image drawn afterwards covers the opaque fill, leaving only
  // the shadow (glow) visible around the edges.

  // --- Level 2 glow (Norman window shape) ---
  if (level2GlowFade > 0.001) {
    const glowW = LEVEL2_HITBOX.rectWidth;
    const glowH = LEVEL2_HITBOX.rectHeight - 6;
    const glowLeft = LEVEL2_HITBOX.centerX - glowW / 2;
    // Nudge the glow slightly upward so it visually aligns with the icon
    const glowTop = LEVEL2_HITBOX.centerY - glowH - 2;
    const glowCenterX = LEVEL2_HITBOX.centerX;
    const glowRadius = glowW / 2;
    const cornerRadius = 18;

    for (let pass = 0; pass < 3; pass++) {
      drawingContext.save();
      drawingContext.shadowColor = `rgba(206,181,58,${(0.95 - pass * 0.18) * level2GlowFade})`;
      drawingContext.shadowBlur = 14 + pass * 8;
      drawingContext.shadowOffsetX = 0;
      drawingContext.shadowOffsetY = 0;
      drawingContext.fillStyle = `rgba(206,181,58,${0.9 * level2GlowFade})`;

      drawingContext.beginPath();
      drawingContext.moveTo(glowCenterX - glowRadius, glowTop);
      drawingContext.arc(glowCenterX, glowTop, glowRadius, Math.PI, 0);
      drawingContext.lineTo(glowLeft + glowW, glowTop + glowH - cornerRadius);
      drawingContext.arcTo(
        glowLeft + glowW,
        glowTop + glowH,
        glowLeft + glowW - cornerRadius,
        glowTop + glowH,
        cornerRadius,
      );
      drawingContext.lineTo(glowLeft + cornerRadius, glowTop + glowH);
      drawingContext.arcTo(
        glowLeft,
        glowTop + glowH,
        glowLeft,
        glowTop + glowH - cornerRadius,
        cornerRadius,
      );
      drawingContext.lineTo(glowLeft, glowTop + glowRadius);
      drawingContext.closePath();
      drawingContext.fill();
      drawingContext.restore();
    }
  }

  // --- Level 3 glow (Norman window shape, larger) ---
  if (level3GlowFade > 0.001) {
    const glowW = LEVEL3_HITBOX.rectWidth;
    const glowH = LEVEL3_HITBOX.rectHeight - 6;
    const glowLeft = LEVEL3_HITBOX.centerX - glowW / 2;
    // Nudge the glow slightly upward so it visually aligns with the icon
    const glowTop = LEVEL3_HITBOX.centerY - glowH - 2;
    const glowCenterX = LEVEL3_HITBOX.centerX;
    const glowRadius = glowW / 2;
    const cornerRadius = 18;

    for (let pass = 0; pass < 3; pass++) {
      drawingContext.save();
      drawingContext.shadowColor = `rgba(206,181,58,${(0.95 - pass * 0.18) * level3GlowFade})`;
      drawingContext.shadowBlur = 14 + pass * 8;
      drawingContext.shadowOffsetX = 0;
      drawingContext.shadowOffsetY = 0;
      drawingContext.fillStyle = `rgba(206,181,58,${0.9 * level3GlowFade})`;

      drawingContext.beginPath();
      drawingContext.moveTo(glowCenterX - glowRadius, glowTop);
      drawingContext.arc(glowCenterX, glowTop, glowRadius, Math.PI, 0);
      drawingContext.lineTo(glowLeft + glowW, glowTop + glowH - cornerRadius);
      drawingContext.arcTo(
        glowLeft + glowW,
        glowTop + glowH,
        glowLeft + glowW - cornerRadius,
        glowTop + glowH,
        cornerRadius,
      );
      drawingContext.lineTo(glowLeft + cornerRadius, glowTop + glowH);
      drawingContext.arcTo(
        glowLeft,
        glowTop + glowH,
        glowLeft,
        glowTop + glowH - cornerRadius,
        cornerRadius,
      );
      drawingContext.lineTo(glowLeft, glowTop + glowRadius);
      drawingContext.closePath();
      drawingContext.fill();
      drawingContext.restore();
    }
  }

  // --- Level 1 glow (circle shape) ---
  if (level1GlowFade > 0.001) {
    const glowCX = LEVEL1_HITBOX.centerX;
    const glowCY = LEVEL1_HITBOX.centerY;
    const glowR = LEVEL1_HITBOX.radius + 2;

    for (let pass = 0; pass < 3; pass++) {
      drawingContext.save();
      drawingContext.shadowColor = `rgba(206,181,58,${(0.7 - pass * 0.15) * level1GlowFade})`;
      drawingContext.shadowBlur = 12 + pass * 8;
      drawingContext.shadowOffsetX = 0;
      drawingContext.shadowOffsetY = 0;
      drawingContext.fillStyle = `rgba(206,181,58,${0.7 * level1GlowFade})`;

      drawingContext.beginPath();
      drawingContext.arc(glowCX, glowCY, glowR, 0, Math.PI * 2);
      drawingContext.closePath();
      drawingContext.fill();
      drawingContext.restore();
    }
  }

  // Draw default image
  imageMode(CENTER);
  image(currentDefaultIcons, mapIconX, mapIconY, mapIconWidth, mapIconHeight);

  // Draw hover image on top with fade opacity (only when fading > 0)
  // For Level 1, skip hover image and use glow instead
  if (mapIconHoverFade > 0 && currentLevelNumber !== 1) {
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

  // Legacy progression button removed; progression via level icons

  pop();

  if (isHovering) cursor(HAND);
  else cursor(ARROW);
}

// ------------------------------------------------------------
// Mouse input for the map screen.
// ------------------------------------------------------------
// Called from main.js only when currentScreen === "map"
function mapMousePressed() {
  // Calculate scale and offset to convert mouse coordinates
  const scaleFactor = min(width / BASE_W, height / BASE_H);
  const offsetX = (width - BASE_W * scaleFactor) / 2;
  const offsetY = (height - BASE_H * scaleFactor) / 2;

  // Convert mouse coordinates to base coordinates (accounting for scale and offset)
  const adjustedMX = (mouseX - offsetX) / scaleFactor;
  const adjustedMY = (mouseY - offsetY) / scaleFactor;

  // Legacy progression control removed; progression handled via level icons

  // Determine which unlocked level (if any) was clicked and start it
  let clickedLevel = 0;
  if (
    isPointInLevel1Circle(adjustedMX, adjustedMY) &&
    currentLevelNumber >= 1
  ) {
    clickedLevel = 1;
  }
  if (
    isPointInNormanWindow(adjustedMX, adjustedMY, LEVEL2_HITBOX) &&
    currentLevelNumber >= 2
  ) {
    clickedLevel = 2;
  }
  if (
    isPointInNormanWindow(adjustedMX, adjustedMY, LEVEL3_HITBOX) &&
    currentLevelNumber >= 3
  ) {
    clickedLevel = 3;
  }

  if (clickedLevel > 0) {
    currentLevelNumber = clickedLevel;
    createLevelInstance();
    currentScreen = "level";
  }
}

// ------------------------------------------------------------
// Keyboard input for the map screen
// ------------------------------------------------------------
// Provides keyboard shortcuts:
// - ENTER starts the game
// - ESC returns to start menu (handled globally)
function mapKeyPressed() {
  if (keyCode === ENTER) {
    currentScreen = "level";
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
