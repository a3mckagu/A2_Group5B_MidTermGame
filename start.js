// START MENU
// ------------------------------------------------------------
// NOTE: Do NOT add setup() or draw() in this file
// setup() and draw() live in main.js
// This file only defines:
// 1) drawStart() → what the start/menu screen looks like
// 2) input handlers → what happens on click / key press on this screen
// 3) a helper function to draw menu buttons
// ------------------------------------------------------------
// drawStart() is called from main.js only when:
// currentScreen === "start"

function drawStart() {
  background(0);

  const BASE_WIDTH = 1152;
  const BASE_HEIGHT = 648;
  const scaleFactor = min(width / BASE_WIDTH, height / BASE_HEIGHT);
  const offsetX = (width - BASE_WIDTH * scaleFactor) / 2;
  const offsetY = (height - BASE_HEIGHT * scaleFactor) / 2;

  push();
  translate(offsetX, offsetY);
  scale(scaleFactor);
  image(startBg, 0, 0, BASE_WIDTH, BASE_HEIGHT);

  // Center the logo images on the screen
  imageMode(CENTER);
  image(potionaryLogo, BASE_WIDTH / 2, BASE_HEIGHT / 2 - 146, 449, 134);
  image(potionaryLogoDetail, BASE_WIDTH / 2, BASE_HEIGHT / 2 - 76, 155, 30);
  imageMode(CORNER); // Reset to default mode
  pop();

  // ---- Buttons (data only) ----
  // Responsive button sizing based on viewport
  const btnScaleFactor = min(width / 1024, height / 768);
  const btnWidth1 = 190 * btnScaleFactor;
  const btnWidth2 = 331 * btnScaleFactor;
  const btnHeight = 45 * btnScaleFactor;
  const btnTextSize = 17 * btnScaleFactor;

  textFont("Fraunces");
  textSize(btnTextSize);
  textStyle(BOLD);
  textAlign(CENTER, CENTER);
  const startBtn = {
    x: width / 2,
    y: height * 0.52,
    w: btnWidth1,
    h: btnHeight,
    label: gameStarted ? "Back to Map" : "New Game",
  };

  const instrBtn = {
    x: width / 2,
    y: height * 0.6,
    w: btnWidth2,
    h: btnHeight,
    label: "Alchemist's Handbook",
  };
  const quitBtn = {
    x: width / 2,
    y: height * 0.68,
    w: btnWidth1,
    h: btnHeight,
    label: currentLevelNumber > 1 ? "Restart" : "Quit",
  };

  // Draw both buttons
  drawButton(startBtn);
  drawButton(instrBtn);
  drawButton(quitBtn);

  // ---- Cursor feedback ----
  // If the mouse is over either button, show a hand cursor
  // so the player knows it is clickable.
  const over = isHover(startBtn) || isHover(instrBtn) || isHover(quitBtn);
  cursor(over ? HAND : ARROW);
}

// ------------------------------------------------------------
// Mouse input for the start screen.
// ------------------------------------------------------------
// Called from main.js only when currentScreen === "start"
function startMousePressed() {
  // Must match the button sizing in drawStart()
  const btnScaleFactor = min(width / 1024, height / 768);
  const btnWidth1 = 190 * btnScaleFactor;
  const btnWidth2 = 331 * btnScaleFactor;
  const btnHeight = 45 * btnScaleFactor;

  // For input checks, we only need x,y,w,h (label is optional)
  const startBtn = {
    x: width / 2,
    y: height * 0.52,
    w: btnWidth1,
    h: btnHeight,
  };
  const instrBtn = {
    x: width / 2,
    y: height * 0.6,
    w: btnWidth2,
    h: btnHeight,
  };
  const quitBtn = {
    x: width / 2,
    y: height * 0.68,
    w: btnWidth1,
    h: btnHeight,
  };

  // If START is clicked, go to the map screen
  if (isHover(startBtn)) {
    currentScreen = "map";
    try {
      restoreBgMusicVolume();
    } catch (e) {}
  }
  // If GUIDE is clicked, go to the instructions screen
  else if (isHover(instrBtn)) {
    currentScreen = "instr";
  } else if (isHover(quitBtn)) {
    // If past level 1, restart the game; otherwise close the window
    if (currentLevelNumber > 1) {
      currentLevelNumber = 1;
      gameStarted = false; // Reset to show "New Game" on start screen
      currentScreen = "start";
    } else {
      window.close();
    }
  }
}

// ------------------------------------------------------------
// Keyboard input for the start screen
// ------------------------------------------------------------
// Provides keyboard shortcuts:
// - ENTER starts the game
function startKeyPressed() {
  if (keyCode === ENTER) {
    currentScreen = "map";
    try {
      restoreBgMusicVolume();
    } catch (e) {}
  }

  // ESC returns to start (already on start, so no action needed)
  if (keyCode === ESCAPE) {
    // Already on start screen
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
