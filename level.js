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
  bowl: { x: 840, y: 500, w: 95 },
  envelope: { x: 1100, y: 50, w: 50 },

  shelf: {
    x: 80, // starting X position of the first bottle on the shelf (moved left)
    y: 116, // Y position for all bottles on the shelf (moved up)
    spacing: 75, // horizontal distance between consecutive bottles
    bottleWidth: 38, // width of each bottle
    rowSpacing: 20, // vertical gap between rows (tunable)
  },
};

class Level {
  constructor(assets) {
    this.assets = assets;

    // ---- VIALS CONFIGURATION ----
    // Define all vials (regular bottles + crystal) with their properties
    const vialsConfig = [
      {
        id: "black",
        img: assets.bottleBlack,
        openImg: assets.bottleOpenBlack,
        symbol: assets.greenSymbol,
        colour: "black",
      },
      {
        id: "darkgreen",
        img: assets.bottleDarkgreen,
        openImg: assets.bottleOpenDarkgreen,
        symbol: assets.greenSymbol,
        colour: "darkgreen",
      },
      {
        id: "darkpurple",
        img: assets.bottleDarkpurple,
        openImg: assets.bottleOpenDarkpurple,
        symbol: assets.greenSymbol,
        colour: "darkpurple",
      },
      {
        id: "lightblue",
        img: assets.bottleLightblue,
        openImg: assets.bottleOpenLightblue,
        symbol: assets.blueSymbol,
        colour: "lightblue",
      },
      {
        id: "lightgreen",
        img: assets.bottleLightgreen,
        openImg: assets.bottleOpenLightgreen,
        symbol: assets.greenSymbol,
        colour: "lightgreen",
      },
      {
        id: "lightpink",
        img: assets.bottleLightpink,
        openImg: assets.bottleOpenLightpink,
        symbol: assets.greenSymbol,
        colour: "lightpink",
      },
      {
        id: "lightpurple",
        img: assets.bottleLightpurple,
        openImg: assets.bottleOpenLightpurple,
        symbol: assets.greenSymbol,
        colour: "lightpurple",
      },
      {
        id: "lightred",
        img: assets.bottleLightred,
        openImg: assets.bottleOpenLightred,
        symbol: assets.orangeSymbol,
        colour: "lightred",
      },
      {
        id: "midblue",
        img: assets.bottleMidblue,
        openImg: assets.bottleOpenMidblue,
        symbol: assets.blueSymbol,
        colour: "midblue",
      },
      {
        id: "lightorange",
        img: assets.bottleClosedOrange,
        openImg: assets.bottleOpenOrange,
        symbol: assets.orangeSymbol,
        colour: "lightorange",
      },
      {
        id: "teal",
        img: assets.bottleTeal,
        openImg: assets.bottleOpenTeal,
        symbol: assets.blueSymbol,
        colour: "teal",
      },
      {
        id: "yellow",
        img: assets.bottleYellow,
        openImg: assets.bottleOpenYellow,
        symbol: assets.orangeSymbol,
        colour: "yellow",
      },
      {
        id: "crystal",
        img: assets.crystalImg,
        symbol: assets.crystalImg, // Crystal uses itself as symbol in recipe
        colour: "crystal",
        isCrystal: true,
      },
    ];

    // Randomize vial order so shelf layout changes each run
    const shuffleArray = (arr) => {
      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        const tmp = arr[i];
        arr[i] = arr[j];
        arr[j] = tmp;
      }
    };
    shuffleArray(vialsConfig);

    // Initialize vials array with runtime state
    this.vials = [];
    const maxPerRow = 4; // max bottles per row

    // Compute a uniform row height (based on the tallest bottle) so
    // vertical spacing between rows remains even regardless of
    // per-vial image aspect variations. Center each bottle vertically
    // within its row cell.
    const nonCrystalHeights = vialsConfig
      .filter((c) => !c.isCrystal)
      .map((c) => {
        const w = c.overrideWidth || layout.shelf.bottleWidth;
        return (c.img.height / c.img.width) * w;
      });
    const rowHeight = nonCrystalHeights.length
      ? Math.max(...nonCrystalHeights)
      : layout.shelf.bottleWidth;

    const rowGap = layout.shelf.rowSpacing || 20;

    // Ensure crystal is excluded from shelf placement so the shelf always
    // contains exactly 3 rows of 4 bottles (12 slots). Position the crystal
    // separately at its dedicated layout location.
    const nonCrystalConfigs = vialsConfig.filter((c) => !c.isCrystal);
    const crystalConfig = vialsConfig.find((c) => c.isCrystal);

    nonCrystalConfigs.forEach((config, idx) => {
      const w = config.overrideWidth || layout.shelf.bottleWidth;
      const h = (config.img.height / config.img.width) * w;

      const row = Math.floor(idx / maxPerRow);
      const col = idx % maxPerRow;

      const x = layout.shelf.x + col * layout.shelf.spacing;
      const y =
        layout.shelf.y + row * (rowHeight + rowGap) + (rowHeight - h) / 2;

      this.vials.push({
        ...config,
        closedImg: config.img,
        openImg: config.openImg || config.img,
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
        lift: 0,
      });
    });

    // Add crystal vial last (positioned from layout.crystal). If not present,
    // nothing is pushed.
    if (crystalConfig) {
      const cr = layout.crystal;
      // Slightly reduce crystal size for better visual fit
      const w = cr.w * 0.85;
      const h = (crystalConfig.img.height / crystalConfig.img.width) * w;
      const x = cr.x;
      const y = cr.y;

      this.vials.push({
        ...crystalConfig,
        closedImg: crystalConfig.img,
        openImg: crystalConfig.openImg || crystalConfig.img,
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
        lift: 0,
      });
    }

    // For backwards compatibility, alias to bottles
    this.bottles = this.vials;

    this.selectedBottle = null;
    this.isRecipeOpen = false;
    this.isOrderOpen = false;
    this.hasUnreadOrder = true;
    this.envelopeScale = 1;
    this.orderStarted = false;

    // Customer patience timer (starts when level first draws)
    this.patienceDuration = 120000; // 2 minutes in ms
    this.patienceStart = null; // set on first draw()
    this.patiencePaused = false;
    this.patienceElapsedAtPause = 0;
    this.patienceDisplayFrac = 1; // visual smoothing
    this._patienceGradientCache = {}; // cache gradient graphics by width+height

    // Return a cached gradient p5.Graphics of given size (creates if missing)
    this._getPatienceGradient = (width, height) => {
      const key = width + "x" + height;
      if (this._patienceGradientCache[key])
        return this._patienceGradientCache[key];
      const g = createGraphics(width, height);
      g.noStroke();
      for (let i = 0; i < width; i++) {
        const t = i / width;
        let c;
        if (t < 0.5) {
          c = lerpColor(g.color("#D00000"), g.color("#FFD700"), t * 2);
        } else {
          c = lerpColor(g.color("#FFD700"), g.color("#228B22"), (t - 0.5) * 2);
        }
        g.fill(c);
        g.rect(i, 0, 1, height);
      }
      this._patienceGradientCache[key] = g;
      return g;
    };
    // --- SEQUENCE TRACKING ---
    this.addedIngredients = [];
    this.correctOrder = [
      assets.bottleLightgreen,
      assets.bottleMidblue,
      assets.bottleBlack,
      assets.bottleLightpurple,
      assets.bottleLightred,
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

    // Only set a result when the crystal has been added; the final result
    // (CORRECT / WRONG) should occur after the player completes the sequence
    // and drops the crystal into the cauldron.
    if (!this.crystalAdded) return;

    this.levelResult = isCorrect ? "CORRECT" : "WRONG";
  }

  draw(paused = false) {
    // Background
    imageMode(CORNER);
    image(this.assets.levelBg, 0, 0, BASE_WIDTH, BASE_HEIGHT);
    imageMode(CENTER);

    // Initialize patience timer and update display only when not paused
    let displayFrac = this.patienceDisplayFrac;
    if (!paused) {
      if (this.patienceStart === null || this.patienceStart === undefined) {
        this.patienceStart = millis();
      }
      let patienceElapsed;
      if (this.patiencePaused) {
        patienceElapsed = this.patienceElapsedAtPause || 0;
      } else {
        patienceElapsed = millis() - (this.patienceStart || 0);
      }
      const patienceFrac = constrain(
        1 - patienceElapsed / (this.patienceDuration || 120000),
        0,
        1,
      );
      // Smooth the displayed fraction for a less choppy animation
      this.patienceDisplayFrac = lerp(
        this.patienceDisplayFrac || 1,
        patienceFrac,
        0.08,
      );
      displayFrac = this.patienceDisplayFrac;
      // If patience has fully depleted (instantaneous fraction) and the crystal wasn't added,
      // trigger a TIMEOUT result (only once). Use the raw patienceFrac rather than
      // the smoothed displayFrac so the timeout reliably fires.
      if (patienceFrac <= 0 && !this.crystalAdded && !this.levelResult) {
        this.levelResult = "TIMEOUT";
        if (typeof Results !== "undefined") Results.reset();
      }
    }

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

      // Gradient fill (red → yellow → green) rendered from a cached graphic
      push();
      imageMode(CORNER);
      const g = this._getPatienceGradient(barWidth, barHeight);
      image(g, barX, barY);
      // overlay depleted area with background color using fractional width
      const filledWFloat = Math.max(0, barWidth * displayFrac);
      fill("#CCCCCC");
      noStroke();
      rect(barX + filledWFloat, barY, barWidth - filledWFloat, barHeight);
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

    // ---- BOWL (single brown bowl) ----
    const b = layout.bowl;

    // Align bottom of bowl with bottom of recipe book
    const rb = layout.recipeBook;
    const rbHeight =
      (this.assets.recipeBookClosed.height /
        this.assets.recipeBookClosed.width) *
      rb.w;

    // Compute single bowl height from aspect ratio and shared width
    const bowlHeight =
      (this.assets.bowlImg.height / this.assets.bowlImg.width) * b.w;

    // Place the bowl so its bottom aligns with the bottom of the recipe book
    const desiredBowlY = rb.y + rbHeight / 2 - bowlHeight / 2;

    // Draw the single brown bowl
    image(this.assets.bowlImg, b.x, desiredBowlY, b.w, bowlHeight);

    // Keep crystal positioned relative to the bowl when not moving
    const crystalYOffset = layout.bowl.y - layout.crystal.y; // original offset
    const crystalVial = this.vials.find((v) => v.isCrystal);
    if (!paused) {
      if (crystalVial && !crystalVial.isMoving && !crystalVial.isHeld) {
        crystalVial.x = b.x;
        // Place crystal slightly above the bowl center based on original offset
        // Nudge slightly upward for finer alignment
        crystalVial.y = desiredBowlY - crystalYOffset + 10;
        crystalVial.startX = crystalVial.x;
        crystalVial.startY = crystalVial.y;
      }
    }

    // ---- CRYSTAL ----
    // The crystal is included in `this.vials` so it will be handled by
    // the main vial loop (hover, click, move, draw). Previously we drew
    // it separately; that special-case is removed so the crystal behaves
    // like any other vial for interaction.

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

      const ringTop = rimY - ringHeight / 2;
      const ringBottom = rimY + ringHeight / 2;

      // Elliptical hitbox centered above the rim. minClearance ensures the
      // vial is always far enough above the rim for the stream to arc naturally.
      const minClearance = 30; // minimum px above rim bottom
      const ellipseHalfH = 40; // vertical radius of the hit ellipse
      const hitboxYOffset = 24; // move hitbox downward by this many pixels (increased)
      const ellipseCenterY =
        ringBottom - minClearance - ellipseHalfH + hitboxYOffset;
      const ellipseHalfW = (ringWidth / 2) * 1.2; // slightly wider than opening

      // Compute previous ellipse bottom (lowest point)
      const ellipseBottom = ellipseCenterY + ellipseHalfH;

      // Create a semicircle hitbox whose diameter (flat edge) sits on the
      // previous ellipse bottom. Use ellipseHalfW as the semicircle radius
      // so the semicircle width matches the earlier ellipse width.
      const semiRx = ellipseHalfW; // keep width
      const heightMultiplier = 0.7; // reduce height to make a semi-oval
      const semiRy = semiRx * heightMultiplier;
      // Place the oval center so its flat diameter (the arc endpoints)
      // sits exactly at the previous ellipse bottom: centerY = ellipseBottom
      const semiCenterY = ellipseBottom;

      // Nudge the interactive hit area slightly lower for better alignment
      const hitTestShift = 12; // px downward
      this.dropZone.x = c.x;
      this.dropZone.y = semiCenterY + hitTestShift; // oval center (shifted)
      // store radii for ellipse checks and compatibility
      this.dropZone.actualRx = semiRx;
      this.dropZone.actualRy = semiRy;
      this.dropZone.radiusX = semiRx;
      this.dropZone.radiusY = semiRy;
      this.dropZone.rimY = ringBottom;
      // Store arc center so other code (streams) can reference the exact
      // visual center of the cauldron rim arc; keeps everything in sync
      // if the cauldron image or layout changes or when scaling.
      this.dropZone.arcCenterY = ringBottom - ringHeight / 2;
      this.dropZone.ringWidth = ringWidth;
      this.dropZone.ringHeight = ringHeight;
      this.dropZone.r = max(semiRx, semiRy);

      // Crystal hitbox: bottom arc matches the orange ring arc exactly.
      // The arc center and radii are identical to the ring arc. Above the arc
      // center, the hit zone extends upward by crystalExtendUp pixels (rectangle).
      const crystalArcCx = c.x;
      const crystalArcCy = ringBottom - ringHeight / 2; // same as arcCenterY / ring arc center
      const crystalRx = ringWidth / 2; // match ring arc rx so sides align with ring bottom arc
      const crystalRy = ringHeight / 2; // match ring arc ry exactly
      const crystalExtendUp = 55; // how many px above arc center the flat top sits
      this.dropZone.crystalRx = crystalRx;
      this.dropZone.crystalRy = crystalRy;
      this.dropZone.crystalCx = crystalArcCx;
      this.dropZone.crystalCy = crystalArcCy + hitTestShift;
      this.dropZone.crystalExtendUp = crystalExtendUp;
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
    // Determine if any vial is currently held or active (moving/pouring)
    // so we can suppress hover effects and defer drawing the held vial on top.
    const anyVialHeld = this.vials.some((v) => v.isHeld);
    const anyVialActive = this.vials.some((v) => v.isMoving);
    this.vials.forEach((vial) => {
      // When paused, skip state-updates (movement, input handling)
      if (!paused) {
        // Update held bottle position to follow mouse in real-time (smooth)
        if (vial.isHeld && !vial.isMoving) {
          const { scaleFactor, offsetX, offsetY } = getScaleAndOffset();
          const mx = (mouseX - offsetX) / scaleFactor;
          const my = (mouseY - offsetY) / scaleFactor;

          // Smoothly follow the cursor to avoid snapping (still centers on cursor over time)
          const followSpeed = 0.94; // larger -> snappier, smaller -> more float
          vial.x = lerp(vial.x, mx, followSpeed);
          vial.y = lerp(vial.y, my, followSpeed);

          // Continuous collision detection: sample 10 points along the mouse path
          // between last frame and this frame to catch fast movement that skips the hitbox.
          const {
            scaleFactor: sf2,
            offsetX: ox2,
            offsetY: oy2,
          } = getScaleAndOffset();
          const prevMx = (pmouseX - ox2) / sf2;
          const prevMy = (pmouseY - oy2) / sf2;

          // Default to the semi-oval/vial hitbox
          let eCx = this.dropZone.x;
          let eCy = this.dropZone.y; // center of semi-oval by default
          let rx =
            this.dropZone.actualRx ||
            this.dropZone.radiusX ||
            this.dropZone.r ||
            0;
          let ry =
            this.dropZone.actualRy ||
            this.dropZone.radiusY ||
            this.dropZone.r ||
            0;
          // If the held vial is the crystal, use the crystal-specific oval
          if (vial.isCrystal && this.dropZone.crystalRx !== undefined) {
            eCx = this.dropZone.crystalCx;
            eCy = this.dropZone.crystalCy;
            rx = this.dropZone.crystalRx;
            ry = this.dropZone.crystalRy;
          }

          // Helper: is a single point inside the active drop zone?
          const pointInZone = (px, py) => {
            const pdx = (px - eCx) / rx;
            const pdy = (py - eCy) / ry;
            const inEllipse = rx > 0 && ry > 0 && pdx * pdx + pdy * pdy <= 1;
            if (vial.isCrystal) {
              const extendUp = this.dropZone.crystalExtendUp || 0;
              const inArc = inEllipse && py >= eCy;
              const inRect =
                Math.abs(px - eCx) <= rx && py >= eCy - extendUp && py <= eCy;
              return inArc || inRect;
            }
            return inEllipse && py <= eCy;
          };

          let insideRect = false;
          if (vial.isCrystal) {
            // Require the bottom three points of the crystal bounding box to be
            // inside the zone — bottom-left, bottom-center, bottom-right.
            // The top of the crystal can stick out above the rim naturally.
            const hw = (vial.width * vial.scale) / 2;
            const hh = (vial.height * vial.scale) / 2;
            insideRect =
              pointInZone(vial.x - hw, vial.y + hh) && // bottom-left
              pointInZone(vial.x, vial.y + hh) && // bottom-center
              pointInZone(vial.x + hw, vial.y + hh); // bottom-right
          } else {
            // Vials: sample points along the mouse path
            const STEPS = 10;
            for (let i = 0; i <= STEPS; i++) {
              const t = i / STEPS;
              if (pointInZone(lerp(prevMx, mx, t), lerp(prevMy, my, t))) {
                insideRect = true;
                break;
              }
            }
          }

          if (insideRect) {
            // Use the vial's lerped visual position so the pour always starts
            // from where the vial actually appears on screen, not the mouse.
            vial.droppedFromHeld = true;
            vial.pourX = vial.x;
            vial.pourY = vial.y;
            vial.isMoving = true;
            vial.isHeld = false;
            vial.targetScale = vial.isCrystal ? 1.18 : 1.08;
            vial.progress = 0;
            // Lock the stream end point so it never jumps during the animation
            vial.lockedStreamEndX = null; // will be set on first draw frame
            if (vial.isCrystal) {
              this.patiencePaused = true;
              this.patienceElapsedAtPause =
                millis() - (this.patienceStart || 0);
            }
          }
        }

        // Smooth scale transition for pick-up/drop effect
        vial.scale = lerp(vial.scale, vial.targetScale, 0.18);

        // Hover detection and smooth lift: lift a bit when the mouse is over
        // the vial and it's not being held or moved.
        const {
          scaleFactor: _sf,
          offsetX: _ox,
          offsetY: _oy,
        } = getScaleAndOffset();
        const adjustedMX_v = (mouseX - _ox) / _sf;
        const adjustedMY_v = (mouseY - _oy) / _sf;
        const halfW_v = vial.width * 0.5 * vial.scale;
        const halfH_v = vial.height * 0.5 * vial.scale;
        const isHoverV =
          !vial.isHeld &&
          !vial.isMoving &&
          !anyVialHeld && // suppress other vial hover while one is held
          !anyVialActive && // suppress hover while any vial is active (pouring)
          adjustedMX_v > vial.x - halfW_v &&
          adjustedMX_v < vial.x + halfW_v &&
          adjustedMY_v > vial.y - halfH_v &&
          adjustedMY_v < vial.y + halfH_v;
        // Subtle lift on hover: smaller offset and gentler interpolation
        const targetLift = isHoverV ? -3 : 0; // negative Y moves up (reduced from -4)
        vial.lift = vial.lift === undefined ? 0 : vial.lift;
        vial.lift = lerp(vial.lift, targetLift, 0.22);

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

            if (vial.droppedFromHeld) {
              // If crystal was dropped from the user's hand, fall straight down
              // from the visual pour X position; only interpolate Y towards finalY.
              if (vial.progress < 1) {
                const t = constrain(vial.progress, 0, 1);
                vial.x = vial.pourX; // keep X fixed at drop point
                vial.y = lerp(vial.pourY, finalY, t);
              } else {
                vial.isMoving = false;
                vial.isSelected = false;
                vial.progress = 0;
                vial.x = vial.pourX;
                vial.y = finalY;
                vial.used = true;
                this.crystalAdded = true;

                this.checkSequence();
              }
            } else {
              // Original flow when crystal is triggered by non-held action
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
            }
          } else {
            // Regular bottle animation
            if (vial.droppedFromHeld) {
              // New flow: pour in place, then return to shelf
              if (vial.progress < 1.5) {
                // Pouring phase (tilting happens during this)
                vial.x = vial.pourX;
                vial.y = vial.pourY;
                if (!this.addedIngredients.includes(vial.closedImg)) {
                  this.addedIngredients.push(vial.closedImg);
                  console.log("Added ingredient:", vial.closedImg);
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
                vial.img = vial.closedImg;
                vial.droppedFromHeld = false;
                vial.lockedStreamEndX = null;
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
                if (!this.addedIngredients.includes(vial.closedImg)) {
                  this.addedIngredients.push(vial.closedImg);
                  console.log("Added ingredient:", vial.closedImg);
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
                // restore closed appearance after returning to shelf
                vial.img = vial.closedImg;
              }
            }
          }
        }
      }

      // ---- Draw vial ----

      // Crystal is now handled in the same flow as other vials so it
      // participates in hover/click/held behaviors. No special-case skip.

      // If this vial is currently held, skip drawing here so we can
      // render it later on top of UI elements (envelope, badges).
      if (vial.isHeld) return;

      // ---- LIQUID STREAM during pour (drawn behind the vial)
      // Draw a natural-looking liquid stream when bottle is tilted and pouring
      const isPouringDropped =
        vial.droppedFromHeld && vial.progress > 0.15 && vial.progress < 1.4;
      const isPouringOriginal =
        !vial.droppedFromHeld && vial.progress >= 0.6 && vial.progress < 1.45;
      const isPouring =
        !vial.isCrystal &&
        vial.isMoving &&
        (isPouringDropped || isPouringOriginal);

      if (isPouring && this.dropZone) {
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
            t = constrain(
              (vial.progress - rampStart) / (rampEnd - rampStart),
              0,
              1,
            );
            t = sin((t * PI) / 2);
          }
          tiltAmount = t;
        }

        if (tiltAmount > 0.3) {
          // Calculate bottle opening position (top of bottle, offset by tilt)
          const openingOffsetX =
            tiltDir * (vial.height / 2) * sin(baseTilt * tiltAmount);
          const openingOffsetY =
            -(vial.height / 2) * cos(baseTilt * tiltAmount);
          const streamStartX = vial.x + openingOffsetX * vial.scale;
          const streamStartY = vial.y + openingOffsetY * vial.scale;

          // Stream should end at a point on the cauldron rim bottom arc.
          // Use stored ring dimensions from dropZone to compute the arc point.
          const cx = this.dropZone.x;
          const ringW =
            this.dropZone.ringWidth || this.dropZone.actualRx * 2 || 0;
          const ringH =
            this.dropZone.ringHeight || this.dropZone.actualRy * 2 || 0;
          const rx = ringW / 2;
          const ry = ringH / 2;
          // Arc center Y such that bottom of arc = rimY. Prefer the precomputed
          // value from dropZone so the arc position always matches the cauldron.
          const arcCenterY =
            this.dropZone.arcCenterY ||
            (this.dropZone.rimY || this.dropZone.y + this.dropZone.actualRy) -
              ry;

          // Choose an X on the ring arc close to the stream start X, clamped to the ring bounds
          // Lock streamEndX on the first frame of the pour so it never jumps.
          if (
            vial.lockedStreamEndX === null ||
            vial.lockedStreamEndX === undefined
          ) {
            // The stream end should land outward in the direction of the tilt.
            // tiltDir: -1 = clockwise (vial on right, pours left) → endX < startX
            //           1 = counter-clockwise (vial on left, pours right) → endX > startX
            const nudge = 20;
            // Start from the stream start X and push outward by tiltDir
            let computedEndX = streamStartX + tiltDir * nudge;
            // Clamp to stay within the cauldron rim bounds
            computedEndX = constrain(computedEndX, cx - rx + 2, cx + rx - 2);
            vial.lockedStreamEndX = computedEndX;
          }
          const streamEndX = vial.lockedStreamEndX;

          // Solve ellipse equation for Y: y = arcCenterY + ry * sqrt(1 - ((x-cx)^2 / rx^2))
          const dx = streamEndX - cx;
          let inside = 1 - (dx * dx) / (rx * rx);
          if (inside < 0) inside = 0;
          // Offset the stream end slightly above the ring arc so the splash
          // appears just above the rim rather than exactly on it.
          const streamOffsetY = 5; // pixels above the ring arc
          const streamEndY = arcCenterY + ry * sqrt(inside) - streamOffsetY;

          const colourMap = {
            // Per-vial id colours (from user)
            black: color("#231F20"),
            darkgreen: color("#215523"),
            darkpurple: color("#511E68"),
            lightblue: color("#8EB3D6"),
            lightgreen: color("#41810B"),
            lightpink: color("#D0518E"),
            lightpurple: color("#7474B9"),
            lightred: color("#BE272C"),
            midblue: color("#5388C5"),
            lightorange: color("#FD9D07"),
            teal: color("#1F8087"),
            yellow: color("#EFD000"),
          };

          // Use id-based mapping only
          const baseColour = colourMap[vial.id] || color(150, 150, 150);
          // Ensure fully opaque stream colour (alpha = 255)
          const streamColour = color(
            red(baseColour),
            green(baseColour),
            blue(baseColour),
            255,
          );

          // Refined flow: use a single phase and smaller lateral amplitude so
          // the stream sag downward smoothly instead of bouncing side-to-side.
          const waveSpeed = 0.08; // slower, smoother motion
          const waveAmp = 5; // reduced lateral amplitude
          const timeOffset = paused ? 0 : frameCount * waveSpeed;
          const phase = sin(timeOffset); // common phase for both control points

          // Rounded stroke caps for liquid appearance
          strokeCap(ROUND);
          strokeJoin(ROUND);

          noFill();
          stroke(streamColour);

          // Compute control points with same phase so both move together
          const cp1x = streamStartX + tiltDir * 12 + phase * waveAmp * 0.6;
          const cp1y =
            lerp(streamStartY, streamEndY, 0.32) + sin(timeOffset * 0.6) * 1.5;
          const cp2x = streamEndX + phase * waveAmp * 0.3;
          const cp2y =
            lerp(streamStartY, streamEndY, 0.68) + cos(timeOffset * 0.65) * 1.2;

          // Helper function to evaluate cubic bezier at parameter t
          const bezierPoint = (t, p0, p1, p2, p3) => {
            const mt = 1 - t;
            const mt2 = mt * mt;
            const mt3 = mt2 * mt;
            const t2 = t * t;
            const t3 = t2 * t;
            return mt3 * p0 + 3 * mt2 * t * p1 + 3 * mt * t2 * p2 + t3 * p3;
          };

          // Draw base strand with tapering (thin at top, thick at bottom)
          const segments = 20;
          for (let i = 0; i < segments; i++) {
            const t1 = i / segments;
            const t2 = (i + 1) / segments;

            const p1x = bezierPoint(t1, streamStartX, cp1x, cp2x, streamEndX);
            const p1y = bezierPoint(t1, streamStartY, cp1y, cp2y, streamEndY);
            const p2x = bezierPoint(t2, streamStartX, cp1x, cp2x, streamEndX);
            const p2y = bezierPoint(t2, streamStartY, cp1y, cp2y, streamEndY);

            // Taper weight: thin at top (1.5px), thick at bottom (7px)
            const weight = lerp(1.5, 7, t1);
            strokeWeight(weight);
            line(p1x, p1y, p2x, p2y);
          }

          // Draw secondary strand (offset) with same tapering
          const offsetA = tiltDir * 1.8 + phase * 1.0;
          for (let i = 0; i < segments; i++) {
            const t1 = i / segments;
            const t2 = (i + 1) / segments;

            const p1x = bezierPoint(
              t1,
              streamStartX - offsetA,
              cp1x - offsetA * 0.6,
              cp2x - offsetA * 0.4,
              streamEndX - offsetA * 0.2,
            );
            const p1y = bezierPoint(t1, streamStartY, cp1y, cp2y, streamEndY);
            const p2x = bezierPoint(
              t2,
              streamStartX - offsetA,
              cp1x - offsetA * 0.6,
              cp2x - offsetA * 0.4,
              streamEndX - offsetA * 0.2,
            );
            const p2y = bezierPoint(t2, streamStartY, cp1y, cp2y, streamEndY);

            const weight = lerp(1.0, 4.5, t1);
            strokeWeight(weight);
            line(p1x, p1y, p2x, p2y);
          }

          // Draw center highlight (thin at top, slightly thicker at bottom)
          for (let i = 0; i < segments; i++) {
            const t1 = i / segments;
            const t2 = (i + 1) / segments;

            const p1x = bezierPoint(
              t1,
              streamStartX - tiltDir * 0.9,
              cp1x - tiltDir * 0.45,
              cp2x - tiltDir * 0.3,
              streamEndX,
            );
            const p1y = bezierPoint(t1, streamStartY, cp1y, cp2y, streamEndY);
            const p2x = bezierPoint(
              t2,
              streamStartX - tiltDir * 0.9,
              cp1x - tiltDir * 0.45,
              cp2x - tiltDir * 0.3,
              streamEndX,
            );
            const p2y = bezierPoint(t2, streamStartY, cp1y, cp2y, streamEndY);

            const weight = lerp(0.5, 2.0, t1);
            strokeWeight(weight);
            line(p1x, p1y, p2x, p2y);
          }

          // Slight splash at the end
          noStroke();
          fill(streamColour);
          const splashSize = 7 + sin(timeOffset * 1.2) * 1.5;
          ellipse(streamEndX, streamEndY, splashSize, splashSize * 0.6);
        }
      }

      // Now draw the vial on top of the stream
      push();
      // Apply hover lift (vertical offset) when translating to draw position
      const drawY = vial.y + (vial.lift || 0);

      // Crystal clipping: only while actively falling — clip drawing to the
      // region above rimY so the crystal is progressively cropped as it sinks,
      // as if being swallowed by the cauldron opening.
      const applyCrystalClip =
        vial.isCrystal && vial.isMoving && this.dropZone && this.dropZone.rimY;
      if (applyCrystalClip) {
        const dz = this.dropZone;
        const arcCx = dz.x;
        const arcCy = dz.arcCenterY;
        const arcRx = (dz.ringWidth || 0) / 2;
        const arcRy = (dz.ringHeight || 0) / 2;

        drawingContext.save();
        drawingContext.beginPath();
        // Manually trace clip region: everything above the rim arc.
        // Bottom boundary follows the top half of the rim ellipse (curves downward
        // toward the sides), matching the orange arc exactly.
        drawingContext.moveTo(0, 0);
        drawingContext.lineTo(BASE_WIDTH, 0);
        drawingContext.lineTo(BASE_WIDTH, arcCy);
        // Top half of ellipse: angle 0 (right) → PI (left), sin is positive so curves down
        const CLIP_STEPS = 40;
        for (let i = 0; i <= CLIP_STEPS; i++) {
          const a = (i / CLIP_STEPS) * Math.PI;
          drawingContext.lineTo(
            arcCx + arcRx * Math.cos(a),
            arcCy + arcRy * Math.sin(a),
          );
        }
        drawingContext.lineTo(0, arcCy);
        drawingContext.closePath();
        drawingContext.clip();
      }

      translate(vial.x, drawY);
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
      if (applyCrystalClip) {
        drawingContext.restore();
      }
      pop();
    });

    // (Held vial is drawn later so it can appear above UI elements)

    // ---- RESULT SCREEN ----
    // Results overlay is drawn by the outer drawLevel wrapper.

    // ---- ENVELOPE ICON ----
    const env = layout.envelope;
    const envHeight =
      (this.assets.envelopeImg.height / this.assets.envelopeImg.width) * env.w;

    // Check if mouse is hovering over envelope. Suppress hover while a vial is held.
    const { scaleFactor, offsetX, offsetY } = getScaleAndOffset();
    const adjustedMX = (mouseX - offsetX) / scaleFactor;
    const adjustedMY = (mouseY - offsetY) / scaleFactor;
    const isEnvHovered =
      !anyVialHeld &&
      !this.vials.some((v) => v.isMoving) &&
      adjustedMX > env.x - env.w / 2 &&
      adjustedMX < env.x + env.w / 2 &&
      adjustedMY > env.y - envHeight / 2 &&
      adjustedMY < env.y + envHeight / 2;

    // Smooth scale transition (only when not paused)
    const targetScale = isEnvHovered ? 1.1 : 1;
    if (!paused) {
      this.envelopeScale = lerp(this.envelopeScale, targetScale, 0.25);
    }

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
        const pulse = paused ? 0 : (sin(frameCount * 0.05) + 1) / 2; // 0 to 1
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

    // ---- Draw held vial above envelope/badge (normal state) ----
    const heldVial = this.vials.find((v) => v.isHeld);
    if (heldVial && !this.isOrderOpen) {
      push();
      const drawY = heldVial.y + (heldVial.lift || 0);
      translate(heldVial.x, drawY);
      scale(heldVial.scale);
      noStroke();
      image(heldVial.img, 0, 0, heldVial.width, heldVial.height);
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

        // Gradient fill (red → yellow → green) rendered from cached graphic
        push();
        imageMode(CORNER);
        const g2 = this._getPatienceGradient(startBtnWidth, barHeight);
        image(g2, barX, barY);
        const filledWFloat2 = Math.max(0, startBtnWidth * displayFrac);
        fill("#CCCCCC");
        noStroke();
        rect(
          barX + filledWFloat2,
          barY,
          startBtnWidth - filledWFloat2,
          barHeight,
        );
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

      // If a vial is held, draw it above the overlay elements so it remains visible
      const heldVialOverlay = this.vials.find((v) => v.isHeld);
      if (heldVialOverlay) {
        push();
        const drawY = heldVialOverlay.y + (heldVialOverlay.lift || 0);
        translate(heldVialOverlay.x, drawY);
        scale(heldVialOverlay.scale);
        noStroke();
        image(
          heldVialOverlay.img,
          0,
          0,
          heldVialOverlay.width,
          heldVialOverlay.height,
        );
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
    if (this.selectedBottle.isCrystal) {
      this.patiencePaused = true;
      this.patienceElapsedAtPause = millis() - (this.patienceStart || 0);
    }
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
  const paused = !!levelInstance.levelResult;
  levelInstance.draw(paused);
  // If the level has a result, draw the results overlay (in BASE coords)
  if (levelInstance.levelResult && typeof Results !== "undefined") {
    Results.draw(levelInstance.levelResult);
  }
  pop();
}

function levelMousePressed() {
  if (!levelInstance) return;

  const { scaleFactor, offsetX, offsetY } = getScaleAndOffset();
  const adjustedX = (mouseX - offsetX) / scaleFactor;
  const adjustedY = (mouseY - offsetY) / scaleFactor;

  // If a result overlay is active, forward clicks to it (BASE coords)
  if (levelInstance.levelResult && typeof Results !== "undefined") {
    Results.mousePressed(adjustedX, adjustedY);
    return;
  }

  // Route clicks to result screen if active
  if (levelInstance.levelResult) {
    Results.mousePressed(adjustedX, adjustedY);
    return;
  }

  // Check if a bottle is currently being held
  const heldVial = levelInstance.vials.find((v) => v.isHeld);

  if (heldVial) {
    // Click while holding = cancel and return to shelf
    heldVial.isHeld = false;
    heldVial.isSelected = false;
    heldVial.x = heldVial.startX;
    heldVial.y = heldVial.startY;
    // restore closed appearance
    heldVial.img = heldVial.closedImg;
    heldVial.scale = 1.0;
    heldVial.targetScale = 1.0;
    return;
  }

  // Prevent picking up another vial while any vial is active (moving/pouring)
  const anyVialActive = levelInstance.vials.some((v) => v.isMoving);
  if (anyVialActive) return;

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
      // swap to open asset and slightly enlarge while held
      vial.img = vial.openImg || vial.closedImg;
      vial.targetScale = vial.isCrystal ? 1.18 : 1.08;
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
  if (!levelInstance) return;

  if (keyCode === ESCAPE) {
    currentScreen = "start";
    return;
  }

  // Debug keys: 1 = success, 2 = wrong, 3 = timeout
  // Only allow CORRECT/WRONG debug triggers when the crystal has been added
  // and (for CORRECT) the ingredient sequence matches.
  if (key === "1") {
    if (levelInstance.crystalAdded) {
      // verify sequence is correct before forcing CORRECT
      const isCorrect =
        levelInstance.addedIngredients.length ===
          levelInstance.correctOrder.length &&
        levelInstance.correctOrder.every(
          (b, i) => levelInstance.addedIngredients[i] === b,
        );
      if (isCorrect) {
        levelInstance.levelResult = "CORRECT";
        if (typeof Results !== "undefined") Results.reset();
      }
    }
    return;
  }
  if (key === "2") {
    if (levelInstance.crystalAdded) {
      // only force WRONG if sequence isn't correct
      const isCorrect =
        levelInstance.addedIngredients.length ===
          levelInstance.correctOrder.length &&
        levelInstance.correctOrder.every(
          (b, i) => levelInstance.addedIngredients[i] === b,
        );
      if (!isCorrect) {
        levelInstance.levelResult = "WRONG";
        if (typeof Results !== "undefined") Results.reset();
      }
    }
    return;
  }
  if (key === "3") {
    if (!levelInstance.crystalAdded) {
      levelInstance.levelResult = "TIMEOUT";
      if (typeof Results !== "undefined") Results.reset();
    }
    return;
  }
}
