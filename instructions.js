// INSTRUCTIONS SCREEN
// NOTE: Do NOT add setup() or draw() in this file
// setup() and draw() live in main.js
// This file only defines:
// 1) drawInstr()        → what the instructions screen looks like
// 2) instrMousePressed() → input handling
// 3) instrKeyPressed()   → keyboard shortcuts

// ── Layout constants ──
// All positions in BASE_WIDTH / BASE_HEIGHT (1152 × 648) space,
// then scaled + translated exactly like drawStart() uses its own scale.
// We re-use getScaleAndOffset() from level.js (already global).

const INSTR_BASE_W = 1152;
const INSTR_BASE_H = 648;

// ── Back button rect in BASE coords (written each draw, read in mousePressed) ──
let _instrBackBtn = { x: 0, y: 0, w: 0, h: 0 };

// ------------------------------
// drawInstr()
// ------------------------------
function drawInstr() {
  // Use the start screen background image so instructions share the same backdrop
  if (typeof startBg !== "undefined") {
    const sf = min(width / INSTR_BASE_W, height / INSTR_BASE_H);
    const ox = (width - INSTR_BASE_W * sf) / 2;
    const oy = (height - INSTR_BASE_H * sf) / 2;
    push();
    translate(ox, oy);
    scale(sf);
    image(startBg, 0, 0, INSTR_BASE_W, INSTR_BASE_H);
    pop();
  } else {
    background(0);
  }

  const scaleFactor = min(width / INSTR_BASE_W, height / INSTR_BASE_H);
  const offsetX = (width - INSTR_BASE_W * scaleFactor) / 2;
  const offsetY = (height - INSTR_BASE_H * scaleFactor) / 2;

  push();
  translate(offsetX, offsetY);
  scale(scaleFactor);

  _drawInstrScroll();

  pop();

  // Cursor feedback — recompute hover in screen space
  const { x, y, w, h } = _instrBackBtn;
  const bx = offsetX + x * scaleFactor;
  const by = offsetY + y * scaleFactor;
  const bw = w * scaleFactor;
  const bh = h * scaleFactor;
  const over =
    mouseX > bx - bw / 2 &&
    mouseX < bx + bw / 2 &&
    mouseY > by - bh / 2 &&
    mouseY < by + bh / 2;
  cursor(over ? HAND : ARROW);
}

// ------------------------------
// _drawInstrScroll()   (all coords in BASE space)
// ------------------------------
function _drawInstrScroll() {
  const cx = INSTR_BASE_W / 2;
  const cy = INSTR_BASE_H / 2;

  // ── Scroll dimensions ──
  const SW = 660; // scroll width
  const SH = 500; // scroll body height (between rod centres)
  const ROD_H = 18; // rod diameter
  const sx = cx - SW / 2; // scroll left edge
  const topRodY = cy - SH / 2; // top rod centre Y
  const botRodY = cy + SH / 2; // bottom rod centre Y
  const bodyTop = topRodY; // parchment starts at top rod centre
  const bodyH = SH;

  // ── Colours (matching results.js palette) ──
  const rodCol = color(42, 24, 8);
  const trimCol = color(200, 160, 48); // gold
  const parchCol = color(242, 228, 196); // warm cream
  const inkDark = color(45, 18, 5); // near-black brown
  const inkMid = color(96, 56, 19); // mid brown
  const inkFaint = color(96, 56, 19, 80); // faint rule

  // ── Parchment body ──
  push();
  noStroke();
  fill(parchCol);
  rectMode(CORNER);
  rect(sx, bodyTop, SW, bodyH);
  // subtle vignette on parchment edges
  const vg = drawingContext;
  const grad = vg.createLinearGradient(sx, 0, sx + SW, 0);
  grad.addColorStop(0, "rgba(100,60,10,0.13)");
  grad.addColorStop(0.08, "rgba(100,60,10,0)");
  grad.addColorStop(0.92, "rgba(100,60,10,0)");
  grad.addColorStop(1, "rgba(100,60,10,0.13)");
  vg.fillStyle = grad;
  vg.fillRect(sx, bodyTop, SW, bodyH);
  pop();

  // ── Gold trim bars (top and bottom, covering rod area) ──
  push();
  noStroke();
  fill(trimCol);
  rectMode(CORNER);
  rect(sx, bodyTop - 4, SW, 14); // top trim
  rect(sx, bodyTop + bodyH - 10, SW, 14); // bottom trim
  pop();

  // ── Helper: draw one rod ──
  function drawRod(ry) {
    push();
    noStroke();
    // rod body
    fill(rodCol);
    rectMode(CENTER);
    rect(cx, ry, SW + 40, ROD_H, ROD_H / 2);
    // highlight streak
    fill(80, 50, 20, 100);
    rect(cx, ry - 3, SW + 40, ROD_H / 2, ROD_H / 4);
    // left finial
    fill(rodCol);
    circle(sx - 20, ry, 28);
    fill(60, 38, 14, 160);
    circle(sx - 24, ry - 5, 10);
    // right finial
    fill(rodCol);
    circle(sx + SW + 20, ry, 28);
    fill(60, 38, 14, 160);
    circle(sx + SW + 16, ry - 5, 10);
    pop();
  }

  // ── Helper: draw fabric loops for one rod ──
  function drawLoops(ry) {
    push();
    noStroke();
    rectMode(CENTER);
    const loopPositions = [0.18, 0.32, 0.5, 0.68, 0.82];
    loopPositions.forEach((t) => {
      const lx = sx + SW * t;
      fill(red(trimCol) * 0.75, green(trimCol) * 0.75, blue(trimCol) * 0.75);
      rect(lx, ry, 18, 22, 4);
      fill(red(trimCol) * 0.5, green(trimCol) * 0.5, blue(trimCol) * 0.5);
      rect(lx, ry + 8, 18, 8, 2);
    });
    pop();
  }

  drawRod(topRodY);
  drawRod(botRodY);
  drawLoops(topRodY);
  drawLoops(botRodY);

  // ── Content area ──
  const PAD_X = 64; // horizontal padding inside scroll
  const contentL = sx + PAD_X;
  const contentR = sx + SW - PAD_X;
  const contentW = contentR - contentL;
  const contentCX = cx;

  // Starting Y — leave room below top rod + trim
  let y = bodyTop + 32;

  // ── Title ──
  push();
  noStroke();
  textFont(FONT_MANUFACTURING_CONSENT);
  textSize(30);
  textAlign(CENTER, TOP);
  fill(inkDark);
  text("Alchemist's Handbook", contentCX, y);
  pop();

  y += 40;
  // ornamental divider with diamond centered under the title
  _instrRule(cx, y, 260, trimCol, true);
  y += 20;

  // (Instruction block moved lower to sit above the warning)

  // ── Flavour intro ──
  push();
  noStroke();
  textFont(FONT_IM_FELL_ENGLISH);
  textStyle(ITALIC);
  textSize(14);
  textAlign(CENTER, TOP);
  fill(red(inkDark), green(inkDark), blue(inkDark), 210);
  const intro =
    "After years of scrubbing cauldrons and organizing shelves, your mentor has\n" +
    "finally entrusted you with her potion shop. The ingredients are stocked.\n" +
    "The customers are waiting. It\u2019s time to start brewing\u2026";
  text(intro, contentCX, y);
  textStyle(NORMAL);
  pop();

  y += 72;

  // ── Instruction entries (removed) ──
  // Labels and body text have been cleared per request.
  const entries = [];

  // Two-column layout: label on left, rule in middle, body on right
  const LABEL_COL_W = 160;
  const GAP = 20;
  const LABEL_END = contentL + LABEL_COL_W;
  const RULE_X = LABEL_END + GAP;

  // Small horizontal gap between the rule and body column so the body hugs the rule
  const BODY_START = RULE_X + 2; // tighten gap
  const BODY_W = contentR - BODY_START - 4; // small right padding
  const entryLineH = 48;

  push();
  noStroke();
  // Use middle baseline for consistent vertical centering
  drawingContext.textBaseline = "middle";
  entries.forEach((e) => {
    const midY = y + entryLineH / 2;

    // Label — right-aligned so it hugs the rule from the left
    textFont(FONT_MANUFACTURING_CONSENT);
    textSize(13);
    textAlign(RIGHT, CENTER);
    fill(inkDark);
    text(e.label, LABEL_END, midY);

    // Vertical rule (aligned with other rows)
    stroke(red(inkMid), green(inkMid), blue(inkMid), 55);
    strokeWeight(1);
    line(RULE_X, y + 8, RULE_X, y + entryLineH - 8);
    noStroke();

    // Body text — left-aligned, starts just right of the rule
    textFont(FONT_IM_FELL_ENGLISH);
    textSize(13.5);
    textAlign(LEFT, CENTER);
    fill(red(inkDark), green(inkDark), blue(inkDark), 215);
    text(e.body, BODY_START, midY, BODY_W);

    y += entryLineH + 4;
  });

  // Restore default baseline
  drawingContext.textBaseline = "alphabetic";
  pop();

  y += 10;

  // --- Single instruction above warning ---
  push();
  noStroke();
  // Label in Manufacturing Consent
  textFont(FONT_MANUFACTURING_CONSENT);
  textSize(16);
  textAlign(CENTER, TOP);
  fill(inkDark);
  text("Start an Order", contentCX, y);
  // Body text below label
  textFont(FONT_IM_FELL_ENGLISH);
  textStyle(NORMAL);
  textSize(13.5);
  fill(red(inkDark), green(inkDark), blue(inkDark), 215);
  text(
    "Keep an eye on your mailbox \u2014 potion requests will arrive here.",
    contentCX,
    y + 26,
    contentW,
  );
  pop();
  y += 64;

  // --- Second instruction ---
  push();
  noStroke();
  textFont(FONT_MANUFACTURING_CONSENT);
  textSize(16);
  textAlign(CENTER, TOP);
  fill(inkDark);
  text("Consult the Recipe", contentCX, y);
  textFont(FONT_IM_FELL_ENGLISH);
  textStyle(NORMAL);
  textSize(13.5);
  fill(red(inkDark), green(inkDark), blue(inkDark), 215);
  text(
    "Your book holds the secrets to every brew.",
    contentCX,
    y + 22,
    contentW,
  );
  pop();
  y += 64;

  // --- Third instruction ---
  push();
  noStroke();
  textFont(FONT_MANUFACTURING_CONSENT);
  textSize(16);
  textAlign(CENTER, TOP);
  fill(inkDark);
  text("Brew with Care", contentCX, y);
  textFont(FONT_IM_FELL_ENGLISH);
  textStyle(NORMAL);
  textSize(13.5);
  fill(red(inkDark), green(inkDark), blue(inkDark), 215);
  text(
    "Click ingredients and move them to the cauldron to add them one by one.",
    contentCX,
    y + 22,
    contentW,
  );
  pop();
  y += 64;

  // ── Warning ──
  push();
  noStroke();
  textFont(FONT_IM_FELL_ENGLISH);
  textStyle(ITALIC);
  textSize(13);
  textAlign(CENTER, TOP);
  fill(red(inkMid), green(inkMid), blue(inkMid), 175);
  text("Tread carefully.", contentCX, y);
  textStyle(NORMAL);
  textSize(11.5);
  fill(red(inkMid), green(inkMid), blue(inkMid), 115);
  text("Missteps cannot be undone.", contentCX, y + 20);
  pop();

  // ── Back button ──
  const btnW = 180;
  const btnH = 34;
  const btnX = cx;
  const btnY = botRodY - 50;

  _instrBackBtn = { x: btnX, y: btnY, w: btnW, h: btnH };

  // Hover detection in BASE coords
  const sf = min(width / INSTR_BASE_W, height / INSTR_BASE_H);
  const ox = (width - INSTR_BASE_W * sf) / 2;
  const oy = (height - INSTR_BASE_H * sf) / 2;
  const mx = (mouseX - ox) / sf;
  const my_ = (mouseY - oy) / sf;
  const btnHover =
    mx > btnX - btnW / 2 &&
    mx < btnX + btnW / 2 &&
    my_ > btnY - btnH / 2 &&
    my_ < btnY + btnH / 2;

  push();
  rectMode(CENTER);
  noFill();
  stroke(
    btnHover
      ? color("#83c5be")
      : color(red(trimCol), green(trimCol), blue(trimCol), 140),
  );
  strokeWeight(1);
  rect(btnX, btnY, btnW, btnH, 2);
  noStroke();
  fill(btnHover ? color("#83c5be") : trimCol);
  textFont(FONT_MANUFACTURING_CONSENT);
  textSize(14);
  textAlign(CENTER, CENTER);
  drawingContext.textBaseline = "middle";
  text("\u2190  Return", btnX, btnY);
  drawingContext.textBaseline = "alphabetic";
  pop();
}

// ── Ornamental rule helper ──
// cx, y: centre position. halfW: half-width. col: stroke color. diamond: show diamond?
function _instrRule(cx, y, halfW, col, diamond) {
  push();
  stroke(col);
  strokeWeight(diamond ? 0.9 : 0.6);
  if (diamond) {
    // leave a small gap around the diamond ornament
    const gap = 14; // total gap width in px
    const halfGap = gap / 2;
    line(cx - halfW, y, cx - halfGap, y);
    line(cx + halfGap, y, cx + halfW, y);
    noStroke();
    fill(col);
    push();
    translate(cx, y);
    rotate(QUARTER_PI);
    rectMode(CENTER);
    rect(0, 0, 8, 8);
    pop();
  } else {
    line(cx - halfW, y, cx + halfW, y);
  }
  pop();
}

// ------------------------------
// Mouse input
// ------------------------------
function instrMousePressed() {
  const sf = min(width / INSTR_BASE_W, height / INSTR_BASE_H);
  const ox = (width - INSTR_BASE_W * sf) / 2;
  const oy = (height - INSTR_BASE_H * sf) / 2;
  const mx = (mouseX - ox) / sf;
  const my = (mouseY - oy) / sf;

  const { x, y, w, h } = _instrBackBtn;
  if (mx > x - w / 2 && mx < x + w / 2 && my > y - h / 2 && my < y + h / 2) {
    // If instructions were opened from help button, return to game (resume it)
    // Otherwise return to start menu as normal
    if (instrOpenedFromHelp) {
      instrOpenedFromHelp = false;
      if (levelInstance) {
        // Shift patienceStart forward by the pause duration so the
        // timer resumes exactly where it left off.
        if (
          levelInstance._helpPauseStart &&
          levelInstance.patienceStart != null
        ) {
          const pauseDuration = millis() - levelInstance._helpPauseStart;
          levelInstance.patienceStart += pauseDuration;
        }
        levelInstance._helpPauseStart = null;
        levelInstance.isPaused = false;
      }
      currentScreen = previousScreenBeforeHelp || "level";
      previousScreenBeforeHelp = null;
    } else {
      currentScreen = "start";
    }
  }
}

// ------------------------------
// Keyboard input
// ------------------------------
function instrKeyPressed() {
  if (keyCode === ESCAPE) {
    // If instructions were opened from help button, return to game (resume it)
    // Otherwise return to start menu as normal
    if (instrOpenedFromHelp) {
      instrOpenedFromHelp = false;
      if (levelInstance) {
        if (
          levelInstance._helpPauseStart &&
          levelInstance.patienceStart != null
        ) {
          const pauseDuration = millis() - levelInstance._helpPauseStart;
          levelInstance.patienceStart += pauseDuration;
        }
        levelInstance._helpPauseStart = null;
        levelInstance.isPaused = false;
      }
      currentScreen = previousScreenBeforeHelp || "level";
      previousScreenBeforeHelp = null;
    } else {
      currentScreen = "start";
    }
  }
}
