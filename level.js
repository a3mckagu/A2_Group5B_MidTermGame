// -----------------------------------------
// LEVEL 1 — Basic Structure + Interactivity
// -----------------------------------------

const BASE_WIDTH = 1152;
const BASE_HEIGHT = 648;

// Returns scale factor and letterbox offsets for current canvas size
function getScaleAndOffset() {
  const scaleFactor = min(width / BASE_WIDTH, height / BASE_HEIGHT);
  const offsetX = (width - BASE_WIDTH * scaleFactor) / 2;
  const offsetY = (height - BASE_HEIGHT * scaleFactor) / 2;
  return { scaleFactor, offsetX, offsetY };
}
// Layout (easy to tweak later)
const layout = {
  cauldron: { x: BASE_WIDTH / 2, y: 490, w: 300 },
  // moved to bottom-right quadrant (closer to the right/bottom edges)
  // nudged slightly down and a bit smaller
  recipeBook: { x: 1000, y: 540, w: 120 },
  // nudged left a bit to balance layout
  crystal: { x: 820, y: 455, w: 36 },
  orderSheet: { x: 940, y: 210, w: 150 },
  bowl: { x: 820, y: 500, w: 140 },
  envelope: { x: 1100, y: 50, w: 50 },

  shelf: {
    x: 120, // starting X position of the first bottle on the shelf
    y: 132, // Y position for all bottles on the shelf
    spacing: 80, // horizontal distance between consecutive bottles
    bottleWidth: 38, // width of each bottle
  },
};

class Level {
  constructor(assets) {
    this.assets = assets;

    // ---- VIALS CONFIGURATION ----
    // Define all vials (regular bottles + crystal) with their properties
    const vialsConfig = [
      {
        id: "green",
        img: assets.bottleGreen,
        symbol: assets.greenSymbol,
        colour: "green",
      },
      {
        id: "red",
        img: assets.bottleRed,
        symbol: assets.greenSymbol, // Note: red has same symbol as green for now
        colour: "red",
      },
      {
        id: "blue",
        img: assets.bottleBlue,
        symbol: assets.blueSymbol,
        colour: "blue",
      },
      {
        id: "orange",
        img: assets.bottleOrange,
        symbol: assets.orangeSymbol,
        colour: "orange",
      },
      {
        id: "pink",
        img: assets.bottlePink,
        symbol: assets.greenSymbol, // Note: pink has same symbol as green for now
        colour: "pink",
      },
      {
        id: "crystal",
        img: assets.crystalImg,
        symbol: assets.crystalImg, // Crystal uses itself as symbol in recipe
        colour: "crystal",
        isCrystal: true,
      },
    ];

    // Initialize vials array with runtime state
    this.vials = [];
    const maxPerRow = 3; // max bottles per row

    vialsConfig.forEach((config, i) => {
      let x, y, w, h;

      if (config.isCrystal) {
        // Crystal position from layout
        const cr = layout.crystal;
        w = cr.w;
        h = (config.img.height / config.img.width) * w;
        x = cr.x;
        y = cr.y;
      } else {
        // Regular bottles positioned on shelf
        w = layout.shelf.bottleWidth;
        h = (config.img.height / config.img.width) * w;

        const row = Math.floor(i / maxPerRow);
        const col = i % maxPerRow;

        x = layout.shelf.x + col * layout.shelf.spacing;
        y = layout.shelf.y + row * (h + 20);
      }

      this.vials.push({
        ...config,
        x,
        y,
        startX: x,
        startY: y,
        width: w,
        height: h,
        isSelected: false,
        isMoving: false,
        progress: 0,
        used: false,
        isHeld: false,
        scale: 1.0,
        targetScale: 1.0,
        droppedFromHeld: false,
        pourX: 0,
        pourY: 0,
      });
    });

    // For backwards compatibility, alias to bottles
    this.bottles = this.vials;

    this.selectedBottle = null;
    this.isRecipeOpen = false;
    this.isOrderOpen = false;
    this.hasUnreadOrder = true;
    this.envelopeScale = 1;
    this.orderStarted = false;

    // --- SEQUENCE TRACKING ---
    this.addedIngredients = [];
    this.correctOrder = [
      assets.bottleGreen,
      assets.bottleBlue,
      assets.bottleOrange,
    ];
    this.levelResult = null; // "CORRECT" or "WRONG"
    this.crystalAdded = false; // Track whether the crystal has been added to cauldron
    // Drop zone placed above the cauldron; radius adjustable
    // default radius reduced for a smaller outline
    this.dropZone = { x: layout.cauldron.x, y: layout.cauldron.y - 220, r: 26 };
  }

  checkSequence() {
    // Compare only the bottle ingredients (exclude crystal) against the correct order
    const isCorrect =
      this.addedIngredients.length === this.correctOrder.length &&
      this.correctOrder.every(
        (bottleImg, index) => this.addedIngredients[index] === bottleImg,
      );

    this.levelResult = isCorrect ? "CORRECT" : "WRONG";
  }

  draw() {
    // Background
    imageMode(CORNER);
    image(this.assets.levelBg, 0, 0, BASE_WIDTH, BASE_HEIGHT);
    imageMode(CENTER);

    // ---- ORDER SHEET (shown after START ORDER is clicked) ----
    if (this.orderStarted) {
      const o = layout.orderSheet;
      const sheetWidth = 290;
      const sheetHeight =
        (this.assets.blankOrderSheet2.height /
          this.assets.blankOrderSheet2.width) *
        sheetWidth;
      image(this.assets.blankOrderSheet2, o.x, o.y, sheetWidth, sheetHeight);

      // Sheet content with padding
      const sheetLeft = o.x - sheetWidth / 2;
      const sheetTop = o.y - sheetHeight / 2;
      const padding = 30;

      // "Beginner's Luck" heading
      push();
      textAlign(LEFT, TOP);
      textFont("Manufacturing Consent");
      textSize(32);
      fill("#2D0900");
      text("Beginner's Luck", sheetLeft + padding, sheetTop + padding + 10);
      pop();

      // "From: Lord Alistair"
      push();
      textAlign(LEFT, TOP);
      textFont("IM Fell English");
      textStyle(ITALIC);
      textSize(18);
      fill("#6E6E6E");
      text("From: Lord Alistair", sheetLeft + padding, sheetTop + padding + 50);
      pop();

      // Patience section
      const barWidth = sheetWidth - padding * 2;
      const barHeight = 15;
      const barX = sheetLeft + padding;
      const barY = sheetTop + padding + 105;

      // "CUSTOMER PATIENCE" label
      push();
      textAlign(LEFT, BOTTOM);
      textFont("VT323");
      textSize(15);
      fill("#6E6E6E");
      text("CUSTOMER PATIENCE", barX, barY - 4);
      pop();

      // Bar background
      push();
      rectMode(CORNER);
      fill("#CCCCCC");
      noStroke();
      rect(barX, barY, barWidth, barHeight);
      pop();

      // Gradient fill (red → yellow → green)
      push();
      noStroke();
      for (let i = 0; i < barWidth; i++) {
        const t = i / barWidth;
        let c;
        if (t < 0.5) {
          c = lerpColor(color("#D00000"), color("#FFD700"), t * 2);
        } else {
          c = lerpColor(color("#FFD700"), color("#228B22"), (t - 0.5) * 2);
        }
        fill(c);
        rect(barX + i, barY, 1, barHeight);
      }
      pop();

      // Segment lines
      push();
      stroke("#6E6E6E");
      strokeWeight(1);
      for (let i = 1; i < 4; i++) {
        const lineX = barX + (barWidth / 4) * i;
        line(lineX, barY + 1, lineX, barY + barHeight - 1);
      }
      pop();
    }

    // ---- BOWL ----
    const b = layout.bowl;
    const bHeight =
      (this.assets.bowlImg.height / this.assets.bowlImg.width) * b.w;

    // Align bottom of bowl with bottom of recipe book
    const rb = layout.recipeBook;
    const rbHeight =
      (this.assets.recipeBookClosed.height /
        this.assets.recipeBookClosed.width) *
      rb.w;
    const desiredBowlY = rb.y + rbHeight / 2 - bHeight / 2;

    image(this.assets.bowlImg, b.x, desiredBowlY, b.w, bHeight);

    // Keep crystal positioned relative to the bowl when not moving
    const crystalYOffset = layout.bowl.y - layout.crystal.y; // original offset
    const crystalVial = this.vials.find((v) => v.isCrystal);
    if (crystalVial && !crystalVial.isMoving) {
      crystalVial.x = b.x;
      crystalVial.y = desiredBowlY - crystalYOffset;
      crystalVial.startX = crystalVial.x;
      crystalVial.startY = crystalVial.y;
    }

    // ---- CRYSTAL — draw BEHIND cauldron only during the drop phase ----
    const crystal = this.bottles.find((b) => b.isCrystal);
    if (
      crystal &&
      !crystal.used &&
      crystal.isMoving &&
      crystal.progress >= 0.6
    ) {
      const cw = layout.crystal.w;
      const ch = (crystal.img.height / crystal.img.width) * cw;
      push();
      translate(crystal.x, crystal.y);
      noStroke();
      image(crystal.img, 0, 0, cw, ch);
      pop();
    }

    // ---- CAULDRON ----
    const c = layout.cauldron;
    const cHeight =
      (this.assets.cauldronImg.height / this.assets.cauldronImg.width) * c.w;
    image(this.assets.cauldronImg, c.x, c.y, c.w, cHeight);

    // ---- CAULDRON RIM — golden ring precisely at the cauldron opening ----
    if (this.dropZone) {
      // Compute rim position using cauldron image bounds.
      // c.x/c.y are the image center; the top of the cauldron is at c.y - cHeight/2.
      // The visible opening is a bit down from the absolute top; tune with a fraction.
      const openingFraction = 0.08; // slightly higher at the very top of the cauldron
      const rimY = c.y - cHeight / 2 + cHeight * openingFraction;

      // Make the ring fit the opening width (narrower than full cauldron width)
      const ringWidth = c.w * 0.4;
      const ringHeight = cHeight * 0.095; // slightly shallower ellipse

      // Golden ring drawing removed — hit area calculations remain active.
      // Update drop zone so it covers a vertical span that starts a bit
      // above the top of the golden ring and ends at the bottom of the ring.
      // We'll represent the zone as an ellipse (rx, ry) so horizontal hits
      // near the ring edges work reliably.
      const dzExtra = 56; // extra pixels above the ring top to include (shorter)
      const ringTop = rimY - ringHeight / 2;
      const ringBottom = rimY + ringHeight / 2;
      const dzTop = ringTop - dzExtra; // desired top of drop area
      const dzBottom = ringBottom; // desired bottom of drop area
      const dzCenterY = (dzTop + dzBottom) / 2;

      // We'll keep the bottom of the active hit area aligned with the ringBottom
      // and increase its vertical radius so it extends upward more.
      const hitCenterY = rimY; // reference (we'll set actual dropZone.y after computing actualRy)

      // Base horizontal radius (center), and asymmetric top/bottom radii
      const baseRx = (ringWidth / 2) * 1.15; // horizontal radius (a bit wider than ring)
      const ry = (dzBottom - dzTop) / 2; // vertical radius to cover top->bottom

      // Make bottom wider than top so the hit area flares outward near the rim
      const rxTop = baseRx * 0.9; // slightly narrower near the top
      const rxBottom = baseRx * 1.35; // wider near the bottom

      this.dropZone.x = c.x;
      this.dropZone.rx = baseRx; // keep a central reference
      this.dropZone.rxTop = rxTop;
      this.dropZone.rxBottom = rxBottom;
      this.dropZone.ry = ry;
      // store explicit vertical bounds for interpolation in hit-tests
      this.dropZone.top = dzTop;
      this.dropZone.bottom = dzBottom;
      // keep r for backward compatibility (max radius)
      this.dropZone.r = max(baseRx, ry, rxBottom);
      // Actual hit area: match the golden ring width/height, centered slightly higher
      // Make the active hit area wider than the gold ring so it's easier to hit
      const actualRxMultiplier = 1.25; // 25% wider on each side
      this.dropZone.actualRx = (ringWidth / 2) * actualRxMultiplier; // horizontal radius from ring width
      // Increase vertical radius so hit area extends upward while keeping bottom fixed
      const actualRyMultiplier = 2.2; // increase vertical reach (keep bottom fixed)
      this.dropZone.actualRy = (ringHeight / 2) * actualRyMultiplier;
      // Position dropZone.y so bottom of the ellipse matches ringBottom
      this.dropZone.y = ringBottom - this.dropZone.actualRy;

      // Debug: draw the drop-zone hitbox rectangle for tuning
      push();
      rectMode(CENTER);
      noFill();
      stroke(255, 255, 255, 180);
      strokeWeight(1.4);
      rect(
        this.dropZone.x,
        this.dropZone.y,
        this.dropZone.actualRx * 2,
        this.dropZone.actualRy * 2,
      );
      // Also draw center and bottom marker for clarity
      stroke(255, 200);
      strokeWeight(1);
      point(this.dropZone.x, this.dropZone.y);
      line(
        this.dropZone.x,
        this.dropZone.y + this.dropZone.actualRy,
        this.dropZone.x,
        this.dropZone.y + this.dropZone.actualRy + 6,
      );
      pop();
    }

    // ---- RECIPE BOOK ----
    const r = layout.recipeBook;
    const rHeight =
      (this.assets.recipeBookClosed.height /
        this.assets.recipeBookClosed.width) *
      r.w;

    if (this.isRecipeOpen) {
      push();
      // Brown overlay placeholder (will be replaced with an image)
      fill("#68452E");
      rectMode(CORNER);
      rect(0, 0, BASE_WIDTH, BASE_HEIGHT);
      pop();

      const openBook = this.assets.recipeBookOpen;
      const bookWidth = 600;
      const bookHeight = (openBook.height / openBook.width) * bookWidth;
      imageMode(CENTER);
      image(openBook, BASE_WIDTH / 2, BASE_HEIGHT / 2, bookWidth, bookHeight);

      const bookLeft = BASE_WIDTH / 2 - bookWidth / 2;
      const bookTop = BASE_HEIGHT / 2 - bookHeight / 2;

      const textX = BASE_WIDTH / 2 - bookWidth / 2 + 40;
      let textY = BASE_HEIGHT / 2 - bookHeight / 2 + 50;
      const lineHeight = 30;
      const symbolWidth = 20;

      textSize(18);
      textStyle(BOLD);
      fill(0);
      text("Beginner's Luck", textX + 100, textY);
      textStyle(NORMAL);
      textSize(14);
      textAlign(LEFT, TOP);
      textY += lineHeight * 2;

      text("1. Pour a vial of ", textX, textY);
      image(
        greenSymbol,
        textX + 116,
        textY + 6,
        symbolWidth,
        (greenSymbol.height / greenSymbol.width) * symbolWidth,
      );
      text("into the", textX + 134, textY);
      text(
        "cauldron to tilt fate in your favour.",
        textX + 16,
        textY + lineHeight - 10,
      );
      textY += lineHeight;

      text("2. Mix in ", textX, textY + 20);
      image(
        blueSymbol,
        textX + 70,
        textY + 26,
        symbolWidth,
        (blueSymbol.height / blueSymbol.width) * symbolWidth,
      );
      text(" to strengthen the brew.", textX + 84, textY + 20);
      textY += lineHeight;

      text("3. Add ", textX, textY + 20);
      image(
        orangeSymbol,
        textX + 60,
        textY + 26,
        symbolWidth,
        (orangeSymbol.height / orangeSymbol.width) * symbolWidth,
      );
      text("to bind the ingredients.", textX + 80, textY + 20);
      textY += lineHeight;

      text("4. Drop in ", textX, textY + 26);
      image(
        crystalImg,
        textX + 80,
        textY + 30,
        symbolWidth,
        (crystalImg.height / crystalImg.width) * symbolWidth,
      );
      text(" to seal the spell and", textX + 95, textY + 26);
      text("awaken its magic.", textX + 16, textY + lineHeight + 16);

      const btnSize = 30;
      const btnX = bookLeft + bookWidth - btnSize / 2;
      const btnY = bookTop + btnSize / 2;
      // Compute adjusted mouse coords for hover detection (scaled canvas)
      const {
        scaleFactor: _sf,
        offsetX: _ox,
        offsetY: _oy,
      } = getScaleAndOffset();
      const adjustedMX_book = (mouseX - _ox) / _sf;
      const adjustedMY_book = (mouseY - _oy) / _sf;

      const isCloseBtnHovered =
        adjustedMX_book > btnX - btnSize / 2 &&
        adjustedMX_book < btnX + btnSize / 2 &&
        adjustedMY_book > btnY - btnSize / 2 &&
        adjustedMY_book < btnY + btnSize / 2;

      push();
      rectMode(CENTER);
      fill(isCloseBtnHovered ? "#E83030" : "#D00000");
      noStroke();
      rect(btnX, btnY, btnSize, btnSize, 5);
      fill("#FFF4E5");
      textAlign(CENTER, CENTER);
      textSize(18);
      text("×", btnX, btnY - 1);
      pop();

      return;
    }

    // Draw closed book
    image(this.assets.recipeBookClosed, r.x, r.y, r.w, rHeight);

    // ---- Bottles (Vials) ----
    this.vials.forEach((vial) => {
      // Update held bottle position to follow mouse in real-time
      if (vial.isHeld && !vial.isMoving) {
        const { scaleFactor, offsetX, offsetY } = getScaleAndOffset();
        const mx = (mouseX - offsetX) / scaleFactor;
        const my = (mouseY - offsetY) / scaleFactor;
        vial.x = mx;
        vial.y = my;

        // Check if held bottle is inside the (asymmetric) drop zone — auto-trigger pour
        const dx = vial.x - this.dropZone.x;
        const dy = vial.y - this.dropZone.y;
        const rxTop =
          this.dropZone.rxTop || this.dropZone.rx || this.dropZone.r || 0;
        const rxBottom =
          this.dropZone.rxBottom || this.dropZone.rx || this.dropZone.r || 0;
        const ry = this.dropZone.ry || this.dropZone.r || 0;
        const dzTop =
          this.dropZone.top !== undefined
            ? this.dropZone.top
            : this.dropZone.y - ry;
        const dzBottom =
          this.dropZone.bottom !== undefined
            ? this.dropZone.bottom
            : this.dropZone.y + ry;

        // Use rectangular hitbox (centered) when available
        const halfW =
          this.dropZone.actualRx || rxBottom || this.dropZone.rx || this.dropZone.r || 0;
        const halfH = this.dropZone.actualRy || ry || this.dropZone.r || 0;

        const left = this.dropZone.x - halfW;
        const right = this.dropZone.x + halfW;
        const top = this.dropZone.y - halfH;
        const bottom = this.dropZone.y + halfH;

        const insideRect =
          halfW > 0 &&
          halfH > 0 &&
          vial.x >= left &&
          vial.x <= right &&
          vial.y >= top &&
          vial.y <= bottom;

        if (insideRect) {
          // Auto-drop: bottle pours in place, then returns to shelf
          vial.droppedFromHeld = true;
          vial.pourX = vial.x;
          vial.pourY = vial.y;
          vial.isMoving = true;
          vial.isHeld = false;
          // keep the picked-up scale while pouring
          vial.targetScale = 1.15;
          vial.progress = 0;
        }
      }

      // Smooth scale transition for pick-up/drop effect
      vial.scale = lerp(vial.scale, vial.targetScale, 0.18);

      if (vial.isMoving) {
        const speed = vial.isCrystal
          ? vial.progress < 0.6
            ? 0.012
            : 0.008
          : 0.02;
        vial.progress += speed;

        if (vial.isCrystal) {
          const targetX = layout.cauldron.x;
          const cauldronHeight =
            (this.assets.cauldronImg.height / this.assets.cauldronImg.width) *
            layout.cauldron.w;
          const pauseY = layout.cauldron.y - cauldronHeight / 2 - 90;
          const finalY = layout.cauldron.y + cauldronHeight / 4;

          if (vial.progress < 0.6) {
            const t = vial.progress / 0.6;
            vial.x = lerp(vial.startX, targetX, t);
            vial.y = lerp(vial.startY, pauseY, t);
          } else if (vial.progress < 1) {
            const t = (vial.progress - 0.6) / 0.4;
            vial.x = targetX;
            vial.y = lerp(pauseY, finalY, t);
          } else {
            vial.isMoving = false;
            vial.isSelected = false;
            vial.progress = 0;
            vial.x = targetX;
            vial.y = finalY;
            vial.used = true;
            this.crystalAdded = true;

            this.checkSequence();
          }
        } else {
          // Regular bottle animation
          if (vial.droppedFromHeld) {
            // New flow: pour in place, then return to shelf
            if (vial.progress < 1.5) {
              // Pouring phase (tilting happens during this)
              vial.x = vial.pourX;
              vial.y = vial.pourY;
              if (!this.addedIngredients.includes(vial.img)) {
                this.addedIngredients.push(vial.img);
                console.log("Added ingredient:", vial.img);
              }
            } else if (vial.progress < 2.5) {
              // Return to shelf
              const back = vial.progress - 1.5;
              vial.x = lerp(vial.pourX, vial.startX, back);
              vial.y = lerp(vial.pourY, vial.startY, back);
            } else {
              // Animation complete
              vial.isMoving = false;
              vial.isSelected = false;
              vial.progress = 0;
              vial.x = vial.startX;
              vial.y = vial.startY;
              // restore normal scale and clear dropped flag
              vial.targetScale = 1.0;
              vial.droppedFromHeld = false;
            }
          } else {
            // Original flow: move to cauldron, pour, return to shelf
            const targetX = layout.cauldron.x - 20;
            const targetY = layout.cauldron.y - 160;

            if (vial.progress < 1) {
              vial.x = lerp(vial.startX, targetX, vial.progress);
              vial.y = lerp(vial.startY, targetY, vial.progress);
            } else if (vial.progress < 1.5) {
              vial.x = targetX;
              vial.y = targetY;
              if (!this.addedIngredients.includes(vial.img)) {
                this.addedIngredients.push(vial.img);
                console.log("Added ingredient:", vial.img);
              }
            } else if (vial.progress < 2.5) {
              const back = vial.progress - 1.5;
              vial.x = lerp(targetX, vial.startX, back);
              vial.y = lerp(targetY, vial.startY, back);
            } else {
              vial.isMoving = false;
              vial.isSelected = false;
              vial.progress = 0;
              vial.x = vial.startX;
              vial.y = vial.startY;
            }
          }
        }
      }

      // ---- Draw vial ----

      // Skip crystal during drop phase — already drawn behind cauldron above
      if (vial.isCrystal && !vial.used && vial.isMoving && vial.progress >= 0.6)
        return;

      // Don't draw crystal once it's fully inside the cauldron
      if (vial.isCrystal && vial.used) return;

      push();
      translate(vial.x, vial.y);
      scale(vial.scale);

      let angle = 0;
      if (!vial.isCrystal && vial.isMoving) {
        const baseTilt = PI / 3.5;
        const isRightSide = this.dropZone ? vial.x > this.dropZone.x : false;
        const tilt = isRightSide ? -baseTilt : baseTilt;

        if (vial.droppedFromHeld && vial.progress < 1.5) {
          // Smoothly ramp into the tilt over the first portion of the pour
          const rampDuration = 0.6; // progress range used to reach full tilt
          const t = constrain(vial.progress / rampDuration, 0, 1);
          const eased = sin((t * PI) / 2); // ease-out
          angle = tilt * eased;
        } else if (
          !vial.droppedFromHeld &&
          vial.progress >= 0.5 &&
          vial.progress < 2
        ) {
          // Ramp from 0 to full tilt between progress 0.5 -> 1.0, then hold
          const rampStart = 0.5;
          const rampEnd = 1.0;
          let t = 1;
          if (vial.progress < rampEnd) {
            t = constrain(
              (vial.progress - rampStart) / (rampEnd - rampStart),
              0,
              1,
            );
            t = sin((t * PI) / 2);
          }
          angle = tilt * t;
        }
      }

      rotate(angle);

      // selection visual removed per UI update

      noStroke();
      image(vial.img, 0, 0, vial.width, vial.height);
      pop();

      // ---- LIQUID STREAM during pour ----
      // Draw a natural-looking liquid stream when bottle is tilted and pouring
      const isPouringDropped = vial.droppedFromHeld && vial.progress > 0.15 && vial.progress < 1.4;
      const isPouringOriginal = !vial.droppedFromHeld && vial.progress >= 0.6 && vial.progress < 1.45;
      const isPouring = !vial.isCrystal && vial.isMoving && (isPouringDropped || isPouringOriginal);

      if (isPouring && this.dropZone) {
        push();
        // Compute angle for tilt direction
        const baseTilt = PI / 3.5;
        const isRightSide = vial.x > this.dropZone.x;
        const tiltDir = isRightSide ? -1 : 1;

        // Compute current tilt amount for stream visibility
        let tiltAmount = 0;
        if (vial.droppedFromHeld) {
          const rampDuration = 0.6;
          const t = constrain(vial.progress / rampDuration, 0, 1);
          tiltAmount = sin((t * PI) / 2);
        } else {
          const rampStart = 0.5;
          const rampEnd = 1.0;
          let t = 1;
          if (vial.progress < rampEnd) {
            t = constrain((vial.progress - rampStart) / (rampEnd - rampStart), 0, 1);
            t = sin((t * PI) / 2);
          }
          tiltAmount = t;
        }

        // Only draw stream once tilt is significant
        if (tiltAmount > 0.3) {
          // Calculate bottle opening position (top of bottle, offset by tilt)
          const openingOffsetX = tiltDir * (vial.height / 2) * sin(baseTilt * tiltAmount);
          const openingOffsetY = -(vial.height / 2) * cos(baseTilt * tiltAmount);
          const streamStartX = vial.x + openingOffsetX * vial.scale;
          const streamStartY = vial.y + openingOffsetY * vial.scale;

          // Stream ends at the bottom of the drop zone, aligned under the opening
          const streamEndY = this.dropZone.y + this.dropZone.actualRy;
          const halfW = this.dropZone.actualRx || this.dropZone.rx || this.dropZone.r || 0;
          const left = this.dropZone.x - halfW;
          const right = this.dropZone.x + halfW;
          // target directly below the opening, clamped to the hitbox horizontal bounds
          let streamEndX = constrain(streamStartX, left + 4, right - 4);
          // Nudge slightly towards the center-of-hitbox depending on pour side
          const nudge = 8;
          if (streamStartX < this.dropZone.x) {
            // pouring from left: nudge right
            streamEndX = min(streamEndX + nudge, right - 2);
          } else {
            // pouring from right: nudge left
            streamEndX = max(streamEndX - nudge, left + 2);
          }

          // Stream colour based on vial
          const colourMap = {
            green: color(72, 180, 72, 200),
            red: color(200, 50, 50, 200),
            blue: color(60, 120, 220, 200),
            orange: color(230, 140, 40, 200),
            pink: color(220, 100, 160, 200),
          };
          const streamColour = colourMap[vial.colour] || color(150, 150, 150, 200);

          // Animated wave offset for natural flow
          const waveSpeed = 0.15;
          const waveAmp = 4;
          const timeOffset = frameCount * waveSpeed;

          // Draw multiple bezier curves for a thicker, more organic stream
          noFill();
          strokeWeight(5);
          stroke(streamColour);

          // Control points for bezier — creates a gentle arc
          const cp1x = streamStartX + tiltDir * 15 + sin(timeOffset) * waveAmp;
          const cp1y = lerp(streamStartY, streamEndY, 0.3);
          const cp2x = streamEndX + sin(timeOffset + 1.5) * waveAmp * 0.5;
          const cp2y = lerp(streamStartY, streamEndY, 0.7);

          bezier(
            streamStartX, streamStartY,
            cp1x, cp1y,
            cp2x, cp2y,
            streamEndX, streamEndY
          );

          // Draw a thinner highlight for depth
          strokeWeight(2);
          stroke(red(streamColour) + 40, green(streamColour) + 40, blue(streamColour) + 40, 150);
          bezier(
            streamStartX - tiltDir * 1.5, streamStartY,
            cp1x - tiltDir * 1, cp1y,
            cp2x, cp2y,
            streamEndX, streamEndY
          );

          // Small splash/drip effect at the end
          noStroke();
          fill(streamColour);
          const splashSize = 6 + sin(timeOffset * 2) * 2;
          ellipse(streamEndX, streamEndY, splashSize, splashSize * 0.6);
        }
        pop();
      }
    });

    // Show result
    if (this.levelResult) {
      push();
      textAlign(CENTER, CENTER);
      textSize(48);
      fill(this.levelResult === "CORRECT" ? "green" : "red");
      text(this.levelResult, BASE_WIDTH / 2, BASE_HEIGHT / 2);
      pop();
    }

    // ---- ENVELOPE ICON ----
    const env = layout.envelope;
    const envHeight =
      (this.assets.envelopeImg.height / this.assets.envelopeImg.width) * env.w;

    // Check if mouse is hovering over envelope
    const { scaleFactor, offsetX, offsetY } = getScaleAndOffset();
    const adjustedMX = (mouseX - offsetX) / scaleFactor;
    const adjustedMY = (mouseY - offsetY) / scaleFactor;
    const isEnvHovered =
      adjustedMX > env.x - env.w / 2 &&
      adjustedMX < env.x + env.w / 2 &&
      adjustedMY > env.y - envHeight / 2 &&
      adjustedMY < env.y + envHeight / 2;

    // Smooth scale transition
    const targetScale = isEnvHovered ? 1.1 : 1;
    this.envelopeScale = lerp(this.envelopeScale, targetScale, 0.25);

    push();
    translate(env.x, env.y);
    scale(this.envelopeScale);
    image(this.assets.envelopeImg, 0, 0, env.w, envHeight);
    pop();

    // Draw notification badge if unread
    if (this.hasUnreadOrder) {
      push();
      const badgeX = env.x + env.w / 2 - 5;
      const badgeY = env.y - envHeight / 2 + 5;

      // Pulsing ring effect behind the badge (only when panel is closed)
      if (!this.isOrderOpen) {
        const pulse = (sin(frameCount * 0.05) + 1) / 2; // 0 to 1
        const ringRadius = 14 + pulse * 10; // 14 to 24
        const ringAlpha = 150 * (1 - pulse); // 150 to 0
        fill(208, 0, 0, ringAlpha);
        noStroke();
        ellipse(badgeX, badgeY, ringRadius * 2, ringRadius * 2);
      }

      // Solid badge circle
      fill("#D00000");
      noStroke();
      ellipse(badgeX, badgeY, 26, 26);
      fill(255);
      textAlign(CENTER, CENTER);
      textFont("VT323");
      textSize(18);
      textStyle(BOLD);
      text("1", badgeX, badgeY);
      pop();
    }

    // ---- ORDER OVERLAY ----
    if (this.isOrderOpen) {
      // Dim background
      push();
      fill(0, 150);
      rectMode(CORNER);
      rect(0, 0, BASE_WIDTH, BASE_HEIGHT);
      pop();

      // Redraw envelope icon on top of dimmed background
      push();
      translate(env.x, env.y);
      scale(this.envelopeScale);
      image(this.assets.envelopeImg, 0, 0, env.w, envHeight);
      pop();

      // Draw notification panel on right side under envelope
      const panelWidth = 350;
      const panelHeight = 296;
      const panelRight = env.x + env.w / 2;
      const panelTop = env.y + envHeight / 2 + 15;
      const panelLeft = panelRight - panelWidth;

      push();
      rectMode(CORNER);
      fill("#68452E");
      noStroke();
      rect(panelLeft, panelTop, panelWidth, panelHeight, 8);
      pop();

      // ORDERS label
      push();
      textAlign(LEFT, TOP);
      textFont("VT323");
      textSize(24);
      fill(255);
      text("ORDERS", panelLeft + 20, panelTop + 15);
      pop();

      // Dividing line
      push();
      stroke("#2E1006");
      strokeWeight(3);
      strokeCap(SQUARE);
      line(panelLeft, panelTop + 50, panelLeft + panelWidth, panelTop + 50);
      pop();

      // Inner order area
      const cardMargin = 15;
      const cardLeft = panelLeft + cardMargin;
      const cardTop = panelTop + 60;
      const cardWidth = panelWidth - cardMargin * 2;
      const cardHeight = panelHeight - 75;

      if (!this.orderStarted) {
        // Show order card when order is active
        push();
        rectMode(CORNER);
        fill("#F5E6D1");
        noStroke();
        rect(cardLeft, cardTop, cardWidth, cardHeight, 8);
        pop();

        // Card heading - "Beginner's Luck"
        push();
        textAlign(LEFT, TOP);
        textFont("Manufacturing Consent");
        textSize(36);
        fill("#2D0900");
        text("Beginner's Luck", cardLeft + 20, cardTop + 20);
        pop();

        // "From: Lord Alistair"
        push();
        textAlign(LEFT, TOP);
        textFont("IM Fell English");
        textStyle(ITALIC);
        textSize(20);
        fill("#6E6E6E");
        text("From: Lord Alistair", cardLeft + 20, cardTop + 65);
        pop();

        // Patience bar (above START ORDER button)
        const startBtnMargin = 20;
        const startBtnWidth = cardWidth - startBtnMargin * 2;
        const barHeight = 16;
        const barX = cardLeft + startBtnMargin;
        const barY = cardTop + cardHeight - 42 - 15 - barHeight - 18; // 18px gap above button

        // "CUSTOMER PATIENCE" label
        push();
        textAlign(LEFT, BOTTOM);
        textFont("VT323");
        textSize(16);
        fill("#6E6E6E");
        text("CUSTOMER PATIENCE", barX, barY - 4);
        pop();

        // Bar background (light grey - depleted portion)
        push();
        rectMode(CORNER);
        fill("#CCCCCC");
        noStroke();
        rect(barX, barY, startBtnWidth, barHeight);
        pop();

        // Gradient fill (red → yellow → green, left to right)
        push();
        noStroke();
        const gradientSteps = startBtnWidth;
        for (let i = 0; i < gradientSteps; i++) {
          const t = i / gradientSteps;
          let c;
          if (t < 0.5) {
            // Red to yellow
            c = lerpColor(color("#D00000"), color("#FFD700"), t * 2);
          } else {
            // Yellow to green
            c = lerpColor(color("#FFD700"), color("#228B22"), (t - 0.5) * 2);
          }
          fill(c);
          rect(barX + i, barY, 1, barHeight);
        }
        pop();

        // Increment lines (2 minutes = 120 seconds, lines every 30 seconds = 4 segments)
        push();
        stroke("#6E6E6E");
        strokeWeight(1);
        for (let i = 1; i < 4; i++) {
          const lineX = barX + (startBtnWidth / 4) * i;
          line(lineX, barY + 1, lineX, barY + barHeight - 1);
        }
        pop();

        // "Start Order" button
        const startBtnHeight = 42;
        const startBtnX = cardLeft + startBtnMargin;
        const startBtnY = cardTop + cardHeight - startBtnHeight - 15;

        // Check if hovering over START ORDER button
        const isStartBtnHovered =
          adjustedMX > startBtnX &&
          adjustedMX < startBtnX + startBtnWidth &&
          adjustedMY > startBtnY &&
          adjustedMY < startBtnY + startBtnHeight;

        push();
        rectMode(CORNER);
        fill(isStartBtnHovered ? "#4A2010" : "#2E1006");
        noStroke();
        rect(startBtnX, startBtnY, startBtnWidth, startBtnHeight, 8);
        textAlign(CENTER, CENTER);
        textFont("VT323");
        textSize(24);
        fill("#FFF4E5");
        text(
          "START ORDER",
          startBtnX + startBtnWidth / 2,
          startBtnY + startBtnHeight / 2,
        );
        pop();
      } else {
        // No active order — show centered message
        push();
        textAlign(CENTER, CENTER);
        textFont("IM Fell English");
        textStyle(ITALIC);
        textSize(24);
        fill("#FFF4E5");
        text(
          "No new orders",
          panelLeft + panelWidth / 2,
          panelTop + panelHeight / 2,
        );
        pop();
      }

      // Close button
      const btnSize = 24;
      const btnX = panelLeft + panelWidth - btnSize / 2 - 8;
      const btnY = panelTop + btnSize / 2 + 8;

      // Check if hovering over close button
      const isCloseBtnHovered =
        adjustedMX > btnX - btnSize / 2 &&
        adjustedMX < btnX + btnSize / 2 &&
        adjustedMY > btnY - btnSize / 2 &&
        adjustedMY < btnY + btnSize / 2;

      push();
      rectMode(CENTER);
      fill(isCloseBtnHovered ? "#E83030" : "#D00000");
      noStroke();
      rect(btnX, btnY, btnSize, btnSize, 5);
      fill("#FFF4E5");
      textAlign(CENTER, CENTER);
      textSize(18);
      text("×", btnX, btnY - 1);
      pop();

      // Redraw notification badge on top of overlay (without pulsing animation)
      if (this.hasUnreadOrder) {
        push();
        const badgeX = env.x + env.w / 2 - 5;
        const badgeY = env.y - envHeight / 2 + 5;

        // Solid badge circle
        fill("#D00000");
        noStroke();
        ellipse(badgeX, badgeY, 26, 26);
        fill(255);
        textAlign(CENTER, CENTER);
        textFont("VT323");
        textSize(18);
        textStyle(BOLD);
        text("1", badgeX, badgeY);
        pop();
      }

      return;
    }
  }

  selectBottle(mx, my) {
    this.vials.forEach((vial) => {
      if (
        !vial.used &&
        mx > vial.x - vial.width / 2 &&
        mx < vial.x + vial.width / 2 &&
        my > vial.y - vial.height / 2 &&
        my < vial.y + vial.height / 2
      ) {
        this.selectedBottle = vial;
        vial.isSelected = true;
      } else {
        vial.isSelected = false;
      }
    });
  }

  pourSelectedBottle() {
    if (!this.selectedBottle || this.selectedBottle.isMoving) return;

    // Lock gameplay once crystal has been added
    if (this.crystalAdded && !this.selectedBottle.isCrystal) return;

    this.selectedBottle.isMoving = true;
    this.selectedBottle.progress = 0;
  }
}

// -----------------------------
// DRAW WRAPPER
// -----------------------------
function drawLevel() {
  background(0);

  if (!levelInstance) return;

  const { scaleFactor, offsetX, offsetY } = getScaleAndOffset();

  push();
  translate(offsetX, offsetY);
  scale(scaleFactor);
  levelInstance.draw();
  pop();
}

function levelMousePressed() {
  if (!levelInstance) return;

  const { scaleFactor, offsetX, offsetY } = getScaleAndOffset();
  const adjustedX = (mouseX - offsetX) / scaleFactor;
  const adjustedY = (mouseY - offsetY) / scaleFactor;

  // Check if a bottle is currently being held
  const heldVial = levelInstance.vials.find((v) => v.isHeld);

  if (heldVial) {
    // Click while holding = cancel and return to shelf
    heldVial.isHeld = false;
    heldVial.isSelected = false;
    heldVial.x = heldVial.startX;
    heldVial.y = heldVial.startY;
    heldVial.scale = 1.0;
    heldVial.targetScale = 1.0;
    return;
  }

  // No bottle held — try to pick one up by clicking on it
  levelInstance.vials.forEach((vial) => {
    if (
      !vial.used &&
      !vial.isMoving &&
      adjustedX > vial.x - vial.width / 2 &&
      adjustedX < vial.x + vial.width / 2 &&
      adjustedY > vial.y - vial.height / 2 &&
      adjustedY < vial.y + vial.height / 2
    ) {
      vial.isSelected = true;
      vial.isHeld = true;
      vial.targetScale = 1.15;
    } else {
      vial.isSelected = false;
    }
  });

  // ---- Order Overlay Close Button ----
  if (levelInstance.isOrderOpen) {
    const env = layout.envelope;
    const envHeight =
      (levelInstance.assets.envelopeImg.height /
        levelInstance.assets.envelopeImg.width) *
      env.w;

    // Panel coordinates matching draw code
    const panelWidth = 350;
    const panelHeight = 296;
    const panelRight = env.x + env.w / 2;
    const panelTop = env.y + envHeight / 2 + 15;
    const panelLeft = panelRight - panelWidth;

    // Card coordinates matching draw code
    const cardMargin = 15;
    const cardLeft = panelLeft + cardMargin;
    const cardTop = panelTop + 60;
    const cardWidth = panelWidth - cardMargin * 2;
    const cardHeight = panelHeight - 75;

    // START ORDER button coordinates
    const startBtnMargin = 20;
    const startBtnWidth = cardWidth - startBtnMargin * 2;
    const startBtnHeight = 42;
    const startBtnX = cardLeft + startBtnMargin;
    const startBtnY = cardTop + cardHeight - startBtnHeight - 15;

    if (
      adjustedX > startBtnX &&
      adjustedX < startBtnX + startBtnWidth &&
      adjustedY > startBtnY &&
      adjustedY < startBtnY + startBtnHeight
    ) {
      levelInstance.orderStarted = true;
      levelInstance.hasUnreadOrder = false;
      levelInstance.isOrderOpen = false;
      return;
    }

    const btnSize = 24;
    const btnX = panelLeft + panelWidth - btnSize / 2 - 8;
    const btnY = panelTop + btnSize / 2 + 8;

    if (
      adjustedX > btnX - btnSize / 2 &&
      adjustedX < btnX + btnSize / 2 &&
      adjustedY > btnY - btnSize / 2 &&
      adjustedY < btnY + btnSize / 2
    ) {
      levelInstance.isOrderOpen = false;
      return;
    }

    // Allow clicking envelope to close when open
    if (
      adjustedX > env.x - env.w / 2 &&
      adjustedX < env.x + env.w / 2 &&
      adjustedY > env.y - envHeight / 2 &&
      adjustedY < env.y + envHeight / 2
    ) {
      levelInstance.isOrderOpen = false;
      return;
    }

    return; // block clicks behind overlay
  }

  // ---- Envelope Icon Click ----
  const env = layout.envelope;
  const envHeight =
    (levelInstance.assets.envelopeImg.height /
      levelInstance.assets.envelopeImg.width) *
    env.w;
  if (
    adjustedX > env.x - env.w / 2 &&
    adjustedX < env.x + env.w / 2 &&
    adjustedY > env.y - envHeight / 2 &&
    adjustedY < env.y + envHeight / 2
  ) {
    levelInstance.isOrderOpen = true;
    return;
  }

  // ---- Recipe Book Close Button ----
  if (levelInstance.isRecipeOpen) {
    const openBook = levelInstance.assets.recipeBookOpen;
    const bookWidth = 600;
    const bookHeight = (openBook.height / openBook.width) * bookWidth;
    const bookLeft = BASE_WIDTH / 2 - bookWidth / 2;
    const bookTop = BASE_HEIGHT / 2 - bookHeight / 2;

    const btnSize = 30;
    const btnX = bookLeft + bookWidth - btnSize / 2;
    const btnY = bookTop + btnSize / 2;

    if (
      adjustedX > btnX - btnSize / 2 &&
      adjustedX < btnX + btnSize / 2 &&
      adjustedY > btnY - btnSize / 2 &&
      adjustedY < btnY + btnSize / 2
    ) {
      levelInstance.isRecipeOpen = false;
      return;
    }
    return; // block clicks behind overlay
  }

  // ---- Check if closed recipe book clicked ----
  const r = layout.recipeBook;
  const rHeight =
    (levelInstance.assets.recipeBookClosed.height /
      levelInstance.assets.recipeBookClosed.width) *
    r.w;
  if (
    adjustedX > r.x - r.w / 2 &&
    adjustedX < r.x + r.w / 2 &&
    adjustedY > r.y - rHeight / 2 &&
    adjustedY < r.y + rHeight / 2
  ) {
    levelInstance.isRecipeOpen = true;
    return;
  }
}

function levelKeyPressed() {
  // ESC returns to start screen
  if (keyCode === ESCAPE) {
    currentScreen = "start";
  }
}
