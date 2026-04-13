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
// Toggle to show spoon hitbox debug overlay.
let SPOON_DEBUG_HITBOX = false;
// Toggle to show all level hitboxes (vials, cauldron, crystal, spoon)
let LEVEL_DEBUG_HITBOX = false;
// Vertical offset (pixels) applied to the spoon hitbox. Negative moves the
// hit area up, positive moves it down. Adjust while debugging.
let SPOON_HITBOX_Y_OFFSET = -10;
// Vertical scale multiplier for the spoon hitbox: <1 makes the ellipse thinner.
let SPOON_HITBOX_HEIGHT_SCALE = 0.85;
// Horizontal scale multiplier for the spoon hitbox: <1 makes the ellipse narrower.
let SPOON_HITBOX_WIDTH_SCALE = 0.9;
// Layout (easy to tweak later)
const layout = {
  cauldron: { x: BASE_WIDTH / 2, y: 465, w: 300 },
  // moved to bottom-right quadrant (closer to the right/bottom edges)
  // nudged slightly down and a bit smaller
  cauldronOvalOverlay: { w: 300, h: 150 }, // Oval clipping mask for spoon (invisible)
  recipeBook: { x: 1000, y: 540, w: 120 },
  // nudged left a bit to balance layout
  crystal: { x: 820, y: 455, w: 36 },
  orderSheet: { x: 940, y: 210, w: 150 },
  bowl: { x: 840, y: 500, w: 95 },
  envelope: { x: 1092, y: 55, w: 50 },

  shelf: {
    x: 80, // starting X position of the first bottle on the shelf (moved left)
    y: 116, // Y position for all bottles on the shelf (moved up)
    spacing: 75, // horizontal distance between consecutive bottles
    bottleWidth: 38, // width of each bottle
    rowSpacing: 20, // vertical gap between rows (tunable)
  },
};

class Level {
  constructor(assetsOrLevelNumber, levelNumber) {
    // Handle both old API (assets only) and new API (assets with levelNumber)
    let assets;
    if (assetsOrLevelNumber && assetsOrLevelNumber.bottleBlack) {
      // New API: first param is assets with levelNumber property
      assets = assetsOrLevelNumber;
      this.levelNumber = assetsOrLevelNumber.levelNumber || 1;
    } else {
      // Old API fallback
      assets = assetsOrLevelNumber;
      this.levelNumber = levelNumber || 1;
    }
    this.assets = assets;

    // Debug overlay settings: adjust the dim/background rectangle that appears
    // behind the intro dialog. Values are pixel insets from each screen edge.
    this.overlayDebug = {
      enabled: true, // when true, overlay is drawn using these insets
      // default insets leave a thin decorative border visible; slightly narrower
      // insets make the black background wider as requested
      left: 6,
      top: 6,
      right: 6,
      bottom: 6,
      alpha: 255,
    };

    // Flashlight mode: when active (Level 3 only), recipe screen is masked
    // except for a circular area centered on the player's cursor. Radius in px.
    this.flashlightActive = false;
    this.flashlightRadius = 100;

    // Help button state (question-mark to the left of the envelope)
    this.helpButtonScale = 1.0;
    this.isHelpOpen = false; // kept for future use if overlay is desired

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
      ...(this.levelNumber === 2
        ? []
        : [
            {
              id: "yellow",
              img: assets.bottleYellow,
              openImg: assets.bottleOpenYellow,
              symbol: assets.orangeSymbol,
              colour: "yellow",
            },
          ]),
      // Level 2+ only: additional row of 4 vials
      ...(this.levelNumber > 1
        ? [
            {
              id: "lightorange2",
              img: assets.bottleOrange2,
              openImg: assets.bottleOpenOrange2,
              symbol: assets.orangeSymbol,
              colour: "lightorange2",
            },
            {
              id: "lightpink2",
              img: assets.bottleLightpink2,
              openImg: assets.bottleOpenLightpink2,
              symbol: assets.greenSymbol,
              colour: "lightpink2",
            },
            {
              id: "lightblue2",
              img: assets.bottleLightblue2,
              openImg: assets.bottleOpenLightblue2,
              symbol: assets.blueSymbol,
              colour: "lightblue2",
            },
            {
              id: "yellow2",
              img: assets.bottleYellow2,
              openImg: assets.bottleOpenYellow2,
              symbol: assets.orangeSymbol,
              colour: "yellow2",
            },
          ]
        : []),
      // Level 2+ only: additional vials (Level 2 shares these with Level 3)
      ...(this.levelNumber > 1
        ? [
            ...(this.levelNumber === 2
              ? []
              : [
                  {
                    id: "black2",
                    img: assets.bottleBlack2,
                    openImg: assets.bottleOpenBlack2,
                    symbol: assets.greenSymbol,
                    colour: "black2",
                  },
                ]),
            {
              id: "darkgreen2",
              img: assets.bottleDarkgreen2,
              openImg: assets.bottleOpenDarkgreen2,
              symbol: assets.greenSymbol,
              colour: "darkgreen2",
            },
            // Level 3 additional vials
            ...(this.levelNumber > 2
              ? [
                  {
                    id: "lightpurple2",
                    img: assets.bottleLightpurple2,
                    openImg: assets.bottleOpenLightpurple2,
                    symbol: assets.greenSymbol,
                    colour: "lightpurple2",
                  },
                  {
                    id: "teal2",
                    img: assets.bottleTeal2,
                    openImg: assets.bottleOpenTeal2,
                    symbol: assets.blueSymbol,
                    colour: "teal2",
                  },
                ]
              : []),
          ]
        : []),
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

    // Ensure crystal is excluded from shelf placement. Position the crystal
    // separately at its dedicated layout location.
    // Level 1: 12 vials (3 rows × 4)
    // Level 2+: 16 vials (4 rows × 4)
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
    this.sequenceInvalid = false;
    this.recipeIntroShown = false; // whether the Level 3 intro has been shown
    this.showRecipeIntro = false; // runtime flag to display the intro modal
    this._recipeIntroBtn = null;

    // Envelope / first-vial tutorial guides removed for Level 1

    // Customer patience timer (starts when level first draws)
    // Per-level durations:
    // Level 1 -> 1.5 minutes (90,000 ms)
    // Level 2 -> 2 minutes (120,000 ms) [default]
    // Level 3 -> 3 minutes (180,000 ms)
    if (this.levelNumber === 1) this.patienceDuration = 90000;
    else if (this.levelNumber === 2) this.patienceDuration = 120000;
    else if (this.levelNumber === 3) this.patienceDuration = 180000;
    else this.patienceDuration = 120000;
    this.patienceStart = null; // set on first draw()
    this.patiencePaused = false;
    this.patienceElapsedAtPause = 0;
    this.patienceDisplayFrac = 1; // visual smoothing
    this._patienceGradientCache = {}; // cache gradient graphics by width+height
    this._recipeLabelGfx = null; // cached high-res labels graphic

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

    // Return a cached gradient p5.Graphics for mix meter (same red→yellow→green as patience)
    this._mixGradientCache = {}; // cache gradient graphics by width+height
    this._getMixGradient = (width, height) => {
      const key = width + "x" + height;
      if (this._mixGradientCache[key]) return this._mixGradientCache[key];
      const g = createGraphics(width, height);
      g.noStroke();
      for (let i = 0; i < width; i++) {
        const t = i / width;
        let c;
        if (t < 0.5) {
          c = lerpColor(g.color("#1E40AF"), g.color("#5B21B6"), t * 2);
        } else {
          c = lerpColor(g.color("#5B21B6"), g.color("#4C1D95"), (t - 0.5) * 2);
        }
        g.fill(c);
        g.rect(i, 0, 1, height);
      }
      this._mixGradientCache[key] = g;
      return g;
    };

    // Helper: check if a point is inside the vial bottle hitbox (not the image)
    this._isPointInVialHitbox = (px, py, vial) => {
      if (vial.isCrystal) return false; // crystal uses different hitbox

      const vialW = vial.width * vial.scale * 0.75; // thinner overall
      const vialH = vial.height * vial.scale + 1; // increased length by 3px
      const adjustedVialY = vial.y + 6; // moved down by 6px

      const rectHeight = vialH * 0.8 - 7; // rectangle body, 7px shorter
      const neckHeight = vialH * 0.2 + 3; // thin rectangle top (neck), 3px larger
      const neckWidth = vialW * 0.35; // neck is thin

      // Check body rectangle
      const bodyLeft = vial.x - vialW / 2;
      const bodyRight = vial.x + vialW / 2;
      const bodyTop = adjustedVialY - rectHeight / 2;
      const bodyBottom = adjustedVialY + rectHeight / 2;

      if (
        px >= bodyLeft &&
        px <= bodyRight &&
        py >= bodyTop &&
        py <= bodyBottom
      ) {
        return true;
      }

      // Check neck rectangle
      const neckLeft = vial.x - neckWidth / 2;
      const neckRight = vial.x + neckWidth / 2;
      const neckTop = adjustedVialY - rectHeight / 2 - neckHeight;
      const neckBottom = adjustedVialY - rectHeight / 2;

      if (
        px >= neckLeft &&
        px <= neckRight &&
        py >= neckTop &&
        py <= neckBottom
      ) {
        return true;
      }

      return false;
    };

    // Helper: check if a point is inside the crystal diamond hitbox
    this._isPointInCrystalHitbox = (px, py, vial) => {
      if (!vial.isCrystal) return false; // only for crystals

      const crystalW = vial.width * vial.scale;
      const crystalH = vial.height * vial.scale;
      const halfW = crystalW / 2;
      const halfH = crystalH / 2;

      const centerX = vial.x;
      const centerY = vial.y;

      // Diamond shape: top triangle + bottom triangle
      // Check if point is in top triangle
      const inTopTriangle =
        px >= centerX - halfW &&
        px <= centerX + halfW &&
        py <= centerY &&
        // Point-in-triangle test for top triangle
        (px - centerX) * (centerY - py) +
          Math.abs(px - centerX) * (py - (centerY - halfH)) <=
          halfW * halfH;

      // Check if point is in bottom triangle
      const inBottomTriangle =
        px >= centerX - halfW &&
        px <= centerX + halfW &&
        py >= centerY &&
        // Point-in-triangle test for bottom triangle
        (centerX - px) * (py - centerY) +
          Math.abs(px - centerX) * (centerY + halfH - py) <=
          halfW * halfH;

      return inTopTriangle || inBottomTriangle;
    };

    // --- SEQUENCE TRACKING ---
    this.addedIngredients = [];
    // Level 1: only 3 vials (id: lightgreen, midblue, lightred)
    // Level 2: single Sparks Flying recipe using the 5-symbol sequence
    // Level 3+: lightgreen, midblue, black, lightpurple, lightred
    if (this.levelNumber === 1) {
      this.correctOrder = [
        assets.bottleDarkgreen,
        assets.bottleClosedOrange,
        assets.bottleTeal,
      ];
      this.sequences = null; // Level 1 uses single sequence (correctOrder)
      this.currentSequenceIndex = 0;
      this.completedSequences = [];
    } else if (this.levelNumber === 2) {
      // Level 2: single recipe with MIX step that can occur at different points.
      // Both of these sequences are valid:
      // 1) Black, Light Red, Mid Blue, Light Purple, MIX, Light Green
      // 2) Black, Light Red, Mid Blue, Light Purple, Light Green, MIX
      this.sequences = [
        // Sequence A: MIX before Light Green
        [
          assets.bottleBlack,
          assets.bottleLightred,
          assets.bottleMidblue,
          assets.bottleLightpurple,
          "MIX",
          assets.bottleLightgreen,
        ],
        // Sequence B: Light Green before MIX
        [
          assets.bottleBlack,
          assets.bottleLightred,
          assets.bottleMidblue,
          assets.bottleLightpurple,
          assets.bottleLightgreen,
          "MIX",
        ],
      ];
      this.correctOrder = null; // Use sequences instead
      this.currentSequenceIndex = 0;
      this.completedSequences = [false, false]; // Track both sequences
    } else {
      // Level 3: explicit ordered steps including a mixing step which
      // must be completed (mixMeterComplete) at the right time. Use the
      // sentinel string 'MIX' to represent the required mix step.
      this.correctOrder = [
        assets.bottleLightpink2, // 1. symbol-lightpink2
        assets.bottleYellow2, // 2. symbol-yellow2
        assets.bottleLightblue2, // 3. symbol-lightblue2
        assets.bottleLightpink, // 4. symbol-lightpink
        "MIX",
        assets.bottleOrange2, // 5. symbol-orange2
        assets.bottleDarkpurple, // 6. symbol-darkpurple
        assets.bottleLightpurple2, // 7. symbol-lightpurple2
      ];
      this.sequences = null; // Level 3+ uses single sequence (correctOrder)
      this.currentSequenceIndex = 0;
      this.completedSequences = [];
    }
    this.levelResult = null; // "CORRECT" or "WRONG"
    this.crystalAdded = false; // Track whether the crystal has been added to cauldron
    // Track displayed completion cards for each sequence
    this.sequenceResultsToDisplay = []; // Array of { sequenceIndex, isCorrect } for card display
    // Drop zone placed above the cauldron; radius adjustable
    // default radius reduced for a smaller outline
    this.dropZone = { x: layout.cauldron.x, y: layout.cauldron.y - 220, r: 26 };
    this.recipeBookLift = 0; // persistent lift for smooth hover animation
    this.spoonLift = 0; // persistent lift for smooth hover animation on spoon
    // Spoon interaction state
    this.spoonIsHeld = false;
    this.spoonScale = 1.0;
    this.targetSpoonScale = 1.0;
    this.spoonRotation = (-33 * PI) / 180; // current rotation in radians
    this.targetSpoonRotation = (-33 * PI) / 180; // target rotation
    this.spoonDisplayX = 0; // current display X position (will be set from layout)
    this.targetSpoonDisplayX = 0; // target X position
    this.spoonBaseX = 0; // original offset X position (BASE_WIDTH / 2 - 78)
    this.spoonBaseRotation = (-33 * PI) / 180; // original rotation
    this.spoonMouseStartX = 0; // mouse X position when spoon was first clicked
    this.spoonMouseStartY = 0; // mouse Y position when spoon was first clicked
    this.orderScrollOffset = 0; // scroll position for order cards container
    // Mix meter tracking
    this.mixCount = 0; // number of completed stirs (0-5)
    this.previousSpoonOffsetAmount = 0; // to track direction changes for stir counting
    this.mixMeterComplete = false; // when 5 stirs reached, meter fills completely
    this.mixMeterDisplayFraction = 0; // animated fill fraction (0 to 1) for visual effect
    // Time-based mixing (ms accumulated while spoon is moving). If you prefer
    // count-based mixing this can be ignored — default required time is 3000ms.
    this.mixAccumMs = 0; // accumulated mixing time in milliseconds
    this.MIX_REQUIRED_MS = 2000; // ms required to complete mix (configurable)
    this.mixSuccessShowFrame = null; // frameCount when success message should appear and then disappear
    this.mixStartedWhenAtMixStep = false; // tracks if player began mixing at required mix step (Level 2)
    // Stirring sound tracking
    this.stirringSound = null; // reference to HTML audio element
    this.isActivelyStirring = false; // true when player is actually moving spoon left/right
    this.lastStirMovementFrame = 0; // frameCount of last detected left/right movement
    this.stirringMotionThreshold = 10; // minimum pixels of movement to count as "active stirring"
    this.holdNoMovementStartFrame = null; // frameCount when player started holding without moving

    // Level 2 new-item overlay
    // Only show the Level 2 "new item" overlay the first time the player
    // reaches Level 2. Respect a global flag so clicking "Proceed" prevents
    // automatic redisplay or timed auto-advance.
    this.showNewItemOverlay =
      this.levelNumber === 2 && !window._seenNewItemOverlay;
    this.newItemOverlayStartTime = null; // ms timestamp when overlay started
    this.newItemOverlayDuration = 2000; // 5 seconds in milliseconds
    this.newItemButtonPos = { x: 0, y: 0, w: 0, h: 0 }; // button position tracking
  }

  _shuffleArray(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const tmp = arr[i];
      arr[i] = arr[j];
      arr[j] = tmp;
    }
  }

  _reshuffleShelfVials() {
    const shelfVials = this.vials.filter((vial) => !vial.isCrystal);
    if (!shelfVials.length) return;

    this._shuffleArray(shelfVials);

    const maxPerRow = 4;
    const rowHeight = Math.max(...shelfVials.map((vial) => vial.height));
    const rowGap = layout.shelf.rowSpacing || 20;

    shelfVials.forEach((vial, idx) => {
      const row = Math.floor(idx / maxPerRow);
      const col = idx % maxPerRow;
      const x = layout.shelf.x + col * layout.shelf.spacing;
      const y =
        layout.shelf.y +
        row * (rowHeight + rowGap) +
        (rowHeight - vial.height) / 2;

      vial.x = x;
      vial.y = y;
      vial.startX = x;
      vial.startY = y;
    });

    const crystalVials = this.vials.filter((vial) => vial.isCrystal);
    this.vials = [...shelfVials, ...crystalVials];
    this.bottles = this.vials;
  }

  checkSequence() {
    // Level 2 with multiple valid sequences (either sequence A or B is OK)
    if (this.sequences) {
      // For Level 2, check if the sequence matches ANY of the valid sequences
      if (this.levelNumber === 2) {
        // Check if added ingredients match any of the valid sequences
        let matchedSequenceIndex = -1;
        for (let i = 0; i < this.sequences.length; i++) {
          const seq = this.sequences[i];
          const isMatch =
            this.addedIngredients.length === seq.length &&
            seq.every(
              (bottleImg, index) => this.addedIngredients[index] === bottleImg,
            );
          if (isMatch) {
            matchedSequenceIndex = i;
            break;
          }
        }

        // Check if adding more ingredients could invalidate all sequences
        if (this.addedIngredients.length > 0) {
          let canStillMatch = false;
          for (let i = 0; i < this.sequences.length; i++) {
            const seq = this.sequences[i];
            // Check if current ingredients match start of this sequence
            if (
              this.addedIngredients.length <= seq.length &&
              this.addedIngredients.every(
                (bottleImg, index) => bottleImg === seq[index],
              )
            ) {
              canStillMatch = true;
              break;
            }
          }

          // If no sequence can still match and we have ingredients, it's wrong
          if (!canStillMatch && this.addedIngredients.length > 0) {
            this.levelResult = "WRONG";
            return;
          }
        }

        // Only process when crystal is added
        if (!this.crystalAdded) return;

        // If mixing was performed out of order, override result to WRONG
        if (this.sequenceInvalid) {
          this.levelResult = "WRONG";
          return;
        }

        // If a valid sequence was matched
        if (matchedSequenceIndex >= 0) {
          this.levelResult = "CORRECT";
        } else {
          this.levelResult = "WRONG";
        }
        return;
      }

      // Original multi-sequence logic for other levels
      const currentSequence = this.sequences[this.currentSequenceIndex];
      const isSequenceCorrect =
        this.addedIngredients.length === currentSequence.length &&
        currentSequence.every(
          (bottleImg, index) => this.addedIngredients[index] === bottleImg,
        );

      // Check if sequence is incorrect (failed before crystal is added)
      const isSequenceIncorrect =
        this.addedIngredients.length > 0 &&
        this.addedIngredients.length <= currentSequence.length &&
        this.addedIngredients.some(
          (bottleImg, index) => bottleImg !== currentSequence[index],
        );

      // If sequence is incorrect, set fail result immediately (before crystal)
      if (isSequenceIncorrect && this.addedIngredients.length > 0) {
        this.levelResult = "WRONG";
        return;
      }

      // Only process when crystal is added
      if (!this.crystalAdded) return;

      // If sequence is correct when crystal is added
      if (isSequenceCorrect) {
        this.completedSequences[this.currentSequenceIndex] = true;
        // Track that this sequence was completed correctly for display card
        this.sequenceResultsToDisplay.push({
          sequenceIndex: this.currentSequenceIndex,
          isCorrect: true,
        });

        // Check if all sequences are completed
        const allSequencesCompleted = this.completedSequences.every((s) => s);
        if (allSequencesCompleted) {
          this.levelResult = "CORRECT";
        } else {
          // Move to next sequence - reset for the next one
          this.currentSequenceIndex++;
          this.addedIngredients = [];
          this.crystalAdded = false; // Allow crystal to be used again for next sequence

          // Reset crystal vial so it can be picked up again
          const crystalVial = this.vials.find((v) => v.isCrystal);
          if (crystalVial) {
            crystalVial.used = false;
            crystalVial.isMoving = false;
            crystalVial.isSelected = false;
            crystalVial.progress = 0;
            crystalVial.targetScale = 1.0;
            crystalVial.droppedFromHeld = false;
            crystalVial.x = crystalVial.startX;
            crystalVial.y = crystalVial.startY;
          }
        }
      } else {
        // Sequence is incorrect
        // Track that this sequence failed for display card
        this.sequenceResultsToDisplay.push({
          sequenceIndex: this.currentSequenceIndex,
          isCorrect: false,
        });
      }
      return;
    }

    // Single sequence (Level 1 and Level 3+)
    // Custom comparison: the 'MIX' slot requires a full MIX only.
    let isCorrect =
      this.addedIngredients.length === this.correctOrder.length &&
      this.correctOrder.every((bottleImg, index) => {
        const added = this.addedIngredients[index];
        if (bottleImg === "MIX") {
          return added === "MIX";
        }
        return added === bottleImg;
      });

    // If mixing was performed incorrectly (out-of-order or partial at required
    // step), the sequence is considered invalid — defer final display until
    // the crystal is added but ensure the check fails.
    if (this.sequenceInvalid) isCorrect = false;

    // Only set a result when the crystal has been added; the final result
    // (CORRECT / WRONG) should occur after the player completes the sequence
    // and drops the crystal into the cauldron.
    if (!this.crystalAdded) return;

    this.levelResult = isCorrect ? "CORRECT" : "WRONG";
  }

  draw(paused = false) {
    // Level 2 new-item overlay: display for 5 seconds at the start
    if (this.showNewItemOverlay && this.levelNumber === 2) {
      // Initialize overlay start time on first draw
      if (this.newItemOverlayStartTime === null) {
        this.newItemOverlayStartTime = millis();
      }

      // Display the overlay image
      imageMode(CORNER);
      if (this.assets && this.assets.newItemImg) {
        image(this.assets.newItemImg, 0, 0, BASE_WIDTH, BASE_HEIGHT);
      }

      push();

      // Centered dialog box (matching Level 3 style)
      const dialogW = 520;
      const dialogH = 110;
      const dialogX = BASE_WIDTH / 2 - dialogW / 2;
      // Place dialog near the bottom of the screen with a small margin
      // reduce margin so the dialog sits slightly lower on screen
      const dialogY = BASE_HEIGHT - dialogH - 24;

      // Outer border with gold trim
      // Small visual offset for the box; increase slightly to move the box down
      const boxOffsetY = 8;
      // Small offset to move the dialog content (text/button) down slightly
      const contentOffsetY = 4;
      stroke(200, 150, 60);
      strokeWeight(3);
      // Use the same dark inner panel color for the outer panel for a flatter look
      fill(30, 22, 18);
      rectMode(CORNER);
      rect(dialogX, dialogY + boxOffsetY, dialogW, dialogH, 10);

      // Inner panel for depth (also offset)
      noStroke();
      fill(30, 22, 18);
      const innerPad = 12;
      rect(
        dialogX + innerPad,
        dialogY + innerPad + boxOffsetY,
        dialogW - innerPad * 2,
        dialogH - innerPad * 2,
        8,
      );

      // Centered message inside the dialog
      const cx = BASE_WIDTH / 2;
      // Move the description up slightly so it sits higher in the visual box
      let y = dialogY + dialogH * 0.32 + contentOffsetY;
      textAlign(CENTER, CENTER);
      textFont(FONT_IM_FELL_ENGLISH);
      textStyle(NORMAL);
      textSize(14);
      // Use pure white for better contrast on this overlay
      fill(255);
      const descText =
        "A gift of great power. Use it wisely \u2014 its magic only awakens at the right moment.";
      // Render on a single line (no width param) so it doesn't wrap
      text(descText, cx, y);

      // Button positioned inside the dialog
      const btnW = 160;
      const btnH = 44;
      const btnX = cx - btnW / 2;
      // Nudge the button up very slightly for better spacing
      const btnY = dialogY + dialogH * 0.58 + contentOffsetY - 6;
      this.newItemButtonPos = { x: btnX, y: btnY, w: btnW, h: btnH };

      // Button style with hover state
      rectMode(CORNER);
      const {
        scaleFactor: _sf,
        offsetX: _ox,
        offsetY: _oy,
      } = getScaleAndOffset();
      const adjustedMX = (mouseX - _ox) / _sf;
      const adjustedMY = (mouseY - _oy) / _sf;
      const isBtnHovered =
        adjustedMX > btnX &&
        adjustedMX < btnX + btnW &&
        adjustedMY > btnY &&
        adjustedMY < btnY + btnH;

      if (isBtnHovered) {
        fill(162, 126, 50); // lighter on hover
      } else {
        fill(148, 110, 34);
      }
      noStroke();
      rect(btnX, btnY, btnW, btnH, 8);
      textFont(FONT_VT323);
      textStyle(NORMAL);
      textSize(18);
      fill(255, 245, 220);
      textAlign(CENTER, CENTER);
      text("Proceed", cx, btnY + btnH / 2);

      pop();

      return;
    }

    // Background: if the recipe book is open and a recipe background is available,
    // show the recipe-book background; otherwise use the normal level background.
    imageMode(CORNER);
    const bgImage =
      this.isRecipeOpen && this.assets.recipeBookBg
        ? this.assets.recipeBookBg
        : this.assets.levelBg;
    image(bgImage, 0, 0, BASE_WIDTH, BASE_HEIGHT);
    imageMode(CENTER);

    // If a Level 3 intro modal is requested, render it and block input.
    if (this.showRecipeIntro) {
      push();
      // Compute the book bounding box so we can place the intro text/button inside it
      const openBook =
        this.assets && this.assets.recipeBookOpen
          ? this.assets.recipeBookOpen
          : null;
      const bookW = 600;
      const bookH = openBook ? (openBook.height / openBook.width) * bookW : 420;
      const bookLeft = BASE_WIDTH / 2 - bookW / 2;
      const bookTop = BASE_HEIGHT / 2 - bookH / 2;

      // Draw the recipe-screen background first so the decorative border is visible
      if (this.assets && this.assets.recipeBookBg) {
        imageMode(CORNER);
        image(this.assets.recipeBookBg, 0, 0, BASE_WIDTH, BASE_HEIGHT);
      }

      // Draw overlay: either full-screen or using debug insets/alpha
      const od = this.overlayDebug || {
        left: 0,
        top: 0,
        right: 0,
        bottom: 0,
        alpha: 255,
        enabled: true,
      };
      noStroke();
      rectMode(CORNER);
      if (od.enabled === false) {
        // debug disabled → full black background
        fill(0, od.alpha || 255);
        rect(0, 0, BASE_WIDTH, BASE_HEIGHT);
      } else {
        // draw inset overlay according to debug values
        const ox = od.left || 0;
        const oy = od.top || 0;
        const ow = BASE_WIDTH - (od.left || 0) - (od.right || 0);
        const oh = BASE_HEIGHT - (od.top || 0) - (od.bottom || 0);
        fill(0, od.alpha || 255);
        rect(ox, oy, ow, oh);
      }

      // Draw a centered dialog box (dark panel with gold border) matching the screenshot
      const dialogW = 384;
      const dialogH = 236;
      const dialogX = BASE_WIDTH / 2 - dialogW / 2;
      const dialogY = BASE_HEIGHT / 2 - dialogH / 2;

      // Outer border (use the inner dark panel color for the outer fill)
      stroke(200, 150, 60);
      strokeWeight(3);
      fill(30, 22, 18);
      rectMode(CORNER);
      rect(dialogX, dialogY, dialogW, dialogH, 10);

      // Slight inner panel to give depth
      noStroke();
      fill(30, 22, 18);
      const innerPad = 12;
      rect(
        dialogX + innerPad,
        dialogY + innerPad,
        dialogW - innerPad * 2,
        dialogH - innerPad * 2,
        8,
      );

      // Centered message inside the dialog
      const cx = BASE_WIDTH / 2;
      let y = dialogY + dialogH * 0.34;
      textAlign(CENTER, CENTER);
      textFont(FONT_IM_FELL_ENGLISH);
      textStyle(ITALIC);
      textSize(26);
      fill(245, 225, 180);
      const quote =
        "The lights have gone out...\ngood thing you have a candle.";
      text(quote, cx, y);

      // Button placed inside the dialog near the lower-middle area
      const btnW = 220;
      const btnH = 44;
      const btnX = cx - btnW / 2;
      const btnY = dialogY + dialogH * 0.62;
      this._recipeIntroBtn = { x: btnX, y: btnY, w: btnW, h: btnH };

      // Button style and label with hover state
      rectMode(CORNER);
      // Convert mouse to BASE coordinates for hit testing
      const {
        scaleFactor: _sf_btn,
        offsetX: _ox_btn,
        offsetY: _oy_btn,
      } = getScaleAndOffset();
      const adjustedMX_btn = (mouseX - _ox_btn) / _sf_btn;
      const adjustedMY_btn = (mouseY - _oy_btn) / _sf_btn;
      const isBtnHovered =
        adjustedMX_btn > btnX &&
        adjustedMX_btn < btnX + btnW &&
        adjustedMY_btn > btnY &&
        adjustedMY_btn < btnY + btnH;

      if (isBtnHovered) {
        fill(162, 126, 50); // slightly lighter on hover (reduced brightness)
        cursor(HAND);
      } else {
        fill(148, 110, 34);
        cursor(ARROW);
      }
      noStroke();
      rect(btnX, btnY, btnW, btnH, 8);
      textFont(FONT_VT323);
      textStyle(NORMAL);
      textSize(20);
      fill(255, 245, 220);
      text("Very Well", cx, btnY + btnH / 2);

      // (interactive overlay debug HUD removed)

      pop();
      return;
    }

    // If the recipe book is open, render the focused recipe screen here and
    // return early so no gameplay elements are drawn or interactable.
    if (this.isRecipeOpen) {
      if (this.orderStarted) {
        this._drawRecipeBookOpen();
      } else {
        this._drawRecipeBookLocked();
      }
      return;
    }

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

      // Update background music playback rate based on remaining patience
      // As time runs low, speed up the music incrementally. Use the same
      // maximum playback rate for all levels for consistent behaviour.
      // 1.0x (full patience) → 1.3x (empty)
      const maxPlaybackRate = 1.3;
      const musicPlaybackRate = lerp(
        maxPlaybackRate,
        1.0,
        constrain(patienceFrac, 0, 1),
      );
      const bgMusic = document.getElementById("bg-music");
      if (bgMusic) {
        bgMusic.playbackRate = musicPlaybackRate;
      }
    }

    // Render the mix meter whenever the spoon is held (order state doesn't matter)
    if (this.spoonIsHeld && !this.mixMeterComplete) {
      const o = layout.orderSheet;
      const sheetWidth = 290;
      const sheetHeight =
        (this.assets.blankOrderSheet2.height /
          this.assets.blankOrderSheet2.width) *
        sheetWidth;
      const sheetLeft = o.x - sheetWidth / 2;
      const sheetTop = o.y - sheetHeight / 2;
      const padding = 30;
      const barWidth = sheetWidth - padding * 2;
      const barHeight = 15;
      const barX = sheetLeft + padding;
      const barY = sheetTop + padding + 105;

      // Update animated fill fraction (driven by accumulated mix time)
      const mixTargetFraction = Math.max(
        0,
        Math.min(1, this.mixAccumMs / this.MIX_REQUIRED_MS),
      );
      this.mixMeterDisplayFraction = lerp(
        this.mixMeterDisplayFraction,
        mixTargetFraction,
        0.25,
      );
      const mixMeterGap = 12 + 42 + 25;
      const mixMeterX = barX;
      const mixMeterY = barY + barHeight + mixMeterGap;
      const mixMeterWidth = barWidth;
      const mixMeterHeight = 15;

      // Label
      push();
      textAlign(LEFT, BOTTOM);
      textFont("VT323");
      textSize(15);
      fill("#2D2D2D");
      text("MIX METER", mixMeterX, mixMeterY - 4);
      pop();

      // Background bar
      push();
      rectMode(CORNER);
      fill("#CCCCCC");
      noStroke();
      rect(mixMeterX, mixMeterY, mixMeterWidth, mixMeterHeight);
      pop();

      // Gradient fill
      push();
      imageMode(CORNER);
      rectMode(CORNER);
      const mixGradient = this._getMixGradient(mixMeterWidth, mixMeterHeight);
      image(mixGradient, mixMeterX, mixMeterY);
      const filledMixW = Math.max(
        0,
        mixMeterWidth * this.mixMeterDisplayFraction,
      );
      fill("#CCCCCC");
      noStroke();
      rect(
        mixMeterX + filledMixW,
        mixMeterY,
        mixMeterWidth - filledMixW,
        mixMeterHeight,
      );
      pop();

      // Evenly spaced dividers (3 dividers -> 4 segments)
      push();
      stroke("#6E6E6E");
      strokeWeight(1);
      for (let i = 1; i < 4; i++) {
        const lineX = mixMeterX + (mixMeterWidth / 4) * i;
        line(lineX, mixMeterY + 1, lineX, mixMeterY + mixMeterHeight - 1);
      }
      pop();
    }

    // Show success message and full meter when mix completes (persistent)
    if (this.mixMeterComplete) {
      const o = layout.orderSheet;
      const sheetWidth = 290;
      const sheetHeight =
        (this.assets.blankOrderSheet2.height /
          this.assets.blankOrderSheet2.width) *
        sheetWidth;
      const sheetLeft = o.x - sheetWidth / 2;
      const sheetTop = o.y - sheetHeight / 2;
      const padding = 30;
      const barWidth = sheetWidth - padding * 2;
      const barHeight = 15;
      const barX = sheetLeft + padding;
      const barY = sheetTop + padding + 105;

      const mixMeterGap = 12 + 42 + 25;
      const mixMeterX = barX;
      const mixMeterY = barY + barHeight + mixMeterGap;
      const mixMeterWidth = barWidth;
      const mixMeterHeight = 15;

      // Label (keep same title as when meter is active)
      push();
      textAlign(LEFT, BOTTOM);
      textFont("VT323");
      textSize(15);
      fill("#2D2D2D");
      text("MIX METER", mixMeterX, mixMeterY - 4);
      pop();

      // Draw full meter and success text (persistent)
      push();
      rectMode(CORNER);
      fill("#CCCCCC");
      noStroke();
      rect(mixMeterX, mixMeterY, mixMeterWidth, mixMeterHeight);
      pop();

      push();
      imageMode(CORNER);
      rectMode(CORNER);
      const mixGradient = this._getMixGradient(mixMeterWidth, mixMeterHeight);
      image(mixGradient, mixMeterX, mixMeterY);
      pop();

      push();
      stroke("#6E6E6E");
      strokeWeight(1);
      for (let i = 1; i < 4; i++) {
        const lineX = mixMeterX + (mixMeterWidth / 4) * i;
        line(lineX, mixMeterY + 1, lineX, mixMeterY + mixMeterHeight - 1);
      }
      pop();

      // Show the brief success text for a short window after completion
      if (this.mixSuccessShowFrame === null)
        this.mixSuccessShowFrame = frameCount;
      const framesSinceSuccess = frameCount - this.mixSuccessShowFrame;
      const SUCCESS_DISPLAY_FRAMES = 70;
      const FADE_FRAMES = 10; // final frames used to fade out the text
      if (framesSinceSuccess < SUCCESS_DISPLAY_FRAMES) {
        // Compute alpha: full opacity initially, then linearly fade over FADE_FRAMES
        let alpha = 255;
        if (framesSinceSuccess >= SUCCESS_DISPLAY_FRAMES - FADE_FRAMES) {
          const t =
            (framesSinceSuccess - (SUCCESS_DISPLAY_FRAMES - FADE_FRAMES)) /
            FADE_FRAMES;
          alpha = lerp(255, 0, constrain(t, 0, 1));
        }
        push();
        textAlign(LEFT, TOP);
        textFont("VT323");
        textStyle(NORMAL);
        textSize(15);
        fill(255, alpha);
        text("Successful Mixture!", mixMeterX, mixMeterY + mixMeterHeight + 8);
        pop();
      }
    }

    // ---- ORDER SHEET (shown after START ORDER is clicked) ----
    // Only show the blank order sheet if orderStarted and no sequences have been completed yet
    if (this.orderStarted && this.sequenceResultsToDisplay.length === 0) {
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
      let wallOrderTitle;
      let wallOrderSender;
      if (this.levelNumber === 2) {
        wallOrderTitle = "Sparks Flying";
        wallOrderSender = "From: Lady Beaumont";
      } else if (this.levelNumber === 3) {
        wallOrderTitle = "Last Light";
        wallOrderSender = "From: King Percival";
      } else {
        wallOrderTitle = "Beginner's Luck";
        wallOrderSender = "From: Lord Alistair";
      }

      // Active order heading
      push();
      textAlign(LEFT, TOP);
      textFont("Manufacturing Consent");
      textSize(32);
      fill("#2D0900");
      text(wallOrderTitle, sheetLeft + padding, sheetTop + padding + 10);
      pop();

      // Active order sender
      push();
      textAlign(LEFT, TOP);
      textFont("IM Fell English");
      textStyle(ITALIC);
      textSize(18);
      fill("#6E6E6E");
      text(wallOrderSender, sheetLeft + padding, sheetTop + padding + 50);
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
      rectMode(CORNER);
      const g = this._getPatienceGradient(barWidth, barHeight);
      image(g, barX, barY);
      // overlay depleted area with background color using fractional width
      const filledWFloat = Math.max(0, barWidth * displayFrac);
      fill("#CCCCCC");
      noStroke();
      rect(barX + filledWFloat, barY, barWidth - filledWFloat, barHeight);
      pop();

      // Segment divider lines: vary by level so each segment equals 30s
      // Level 1 -> 2 dividers (3 sections of 30s = 90s)
      // Level 2 -> 3 dividers (4 sections of 30s = 120s) [default]
      // Level 3 -> 5 dividers (6 sections of 30s = 180s)
      push();
      stroke("#6E6E6E");
      strokeWeight(1);
      let numDividers = 3; // default for level 2
      if (this.levelNumber === 1) numDividers = 2;
      else if (this.levelNumber === 3) numDividers = 5;
      for (let i = 1; i <= numDividers; i++) {
        const lineX = barX + (barWidth / (numDividers + 1)) * i;
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
    const crystalCompletionY = c.y - cHeight * 0.12;
    image(this.assets.cauldronImg, c.x, c.y, c.w, cHeight);

    // Debug marker for the Y position where the crystal completes its drop.
    // push();
    // stroke(255, 60, 60, 220);
    // strokeWeight(2);
    // line(
    //   c.x - c.w * 0.22,
    //   crystalCompletionY,
    //   c.x + c.w * 0.22,
    //   crystalCompletionY,
    // );
    // pop();

    // Overlay cauldron glow image on top of default cauldron
    if (this.assets.cauldronImgGlow) {
      // Check if any vial is currently being held
      const anyVialHeld = this.vials.some((v) => v.isHeld);
      const glowOpacity = anyVialHeld ? 255 : 0;

      push();
      tint(255, glowOpacity);
      image(this.assets.cauldronImgGlow, c.x, c.y, c.w, cHeight);
      pop();
    }

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
      this.dropZone.arcCenterY = ringBottom - ringHeight / 2 + 33;
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
      if (this.orderStarted) {
        this._drawRecipeBookOpen();
      } else {
        this._drawRecipeBookLocked();
      }
      return;
    }

    // ---- Bottles (Vials) ----
    // Determine if any vial is currently held or active (moving/pouring)
    // so we can suppress hover effects and defer drawing the held vial on top.
    const anyVialHeld = this.vials.some((v) => v.isHeld);
    const anyVialActive = this.vials.some((v) => v.isMoving);
    // Consider spoon 'active' when picked up and moved away from its base
    const spoonActive =
      this.spoonIsHeld &&
      Math.abs((this.spoonDisplayX || 0) - (this.spoonBaseX || 0)) > 1;

    // Draw closed book with smooth hover lift (visual only; click area unchanged)
    let desiredLift = 0;
    // Don't lift the book while interacting with a vial/crystal or when paused
    if (
      !paused &&
      !this.isOrderOpen &&
      !anyVialHeld &&
      !anyVialActive &&
      !this.crystalAdded &&
      !spoonActive
    ) {
      const { scaleFactor, offsetX, offsetY } = getScaleAndOffset();
      const adjustedMX = (mouseX - offsetX) / scaleFactor;
      const adjustedMY = (mouseY - offsetY) / scaleFactor;
      const bookLeft = r.x - r.w / 2;
      const bookTop = r.y - rHeight / 2;
      // Use the currently-drawn book position (account for persistent lift)
      const bookTopAdj = bookTop + (this.recipeBookLift || 0);
      const bookBottomAdj = bookTopAdj + rHeight;
      if (
        adjustedMX >= bookLeft &&
        adjustedMX <= bookLeft + r.w &&
        adjustedMY >= bookTopAdj &&
        adjustedMY <= bookBottomAdj
      ) {
        desiredLift = -5; // target lift (px)
      }
    }
    this.recipeBookLift = lerp(this.recipeBookLift || 0, desiredLift, 0.18);
    image(
      this.assets.recipeBookClosed,
      r.x,
      r.y + this.recipeBookLift,
      r.w,
      rHeight,
    );

    // ---- SPOON OVERLAY WITH OVAL MASK ----
    // Draw spoon centered on screen with height set to half page height, width auto
    // Only visible within the red oval
    // Drawn before vials so vials appear on top
    // Only show spoon for Levels 2 and 3 (hide on Level 1)
    if (this.assets.spoonImg && this.levelNumber !== 1) {
      const spoonHeight = BASE_HEIGHT / 5; //spoon
      const spoonAspectRatio =
        this.assets.spoonImg.width / this.assets.spoonImg.height;
      const spoonWidth = spoonHeight * spoonAspectRatio;
      const spoonX = BASE_WIDTH / 2 - 78;
      const spoonY = BASE_HEIGHT / 2 + 25;

      // Store base position and rotation on first frame
      if (this.spoonBaseX === 0) {
        this.spoonBaseX = spoonX;
        this.spoonDisplayX = spoonX;
        this.targetSpoonDisplayX = spoonX;
      }

      // Store spoon dimensions for hover detection and interaction
      this.spoonX = spoonX;
      this.spoonY = spoonY;
      this.spoonWidth = spoonWidth;
      this.spoonHeight = spoonHeight;

      // Hover detection for spoon
      const {
        scaleFactor: _sfSpoon,
        offsetX: _oxSpoon,
        offsetY: _oySpoon,
      } = getScaleAndOffset();
      const adjustedMX_spoon = (mouseX - _oxSpoon) / _sfSpoon;
      const adjustedMY_spoon = (mouseY - _oySpoon) / _sfSpoon;

      // Check if mouse is over spoon area (rotated, scaled ellipse match)
      const anyVialHeld = this.vials.some((v) => v.isHeld);
      const anyVialActive = this.vials.some((v) => v.isMoving);
      // Compute detection center: use displayed X when held, otherwise base X
      const spoonDetectX =
        this.spoonIsHeld && this.spoonDisplayX ? this.spoonDisplayX : spoonX;
      const spoonDetectY =
        spoonY +
        (this.spoonLift || 0) +
        (typeof SPOON_HITBOX_Y_OFFSET !== "undefined"
          ? SPOON_HITBOX_Y_OFFSET
          : 0);

      // Rotated-ellipse test (inverse-transform math, same as click test)
      let insideEllipse = false;
      try {
        const dx = adjustedMX_spoon - spoonDetectX;
        const dy = adjustedMY_spoon - spoonDetectY;
        const r = this.spoonRotation || 0;
        const s = this.spoonScale || 1;
        const cosR = Math.cos(r);
        const sinR = Math.sin(r);
        const lx = (dx * cosR + dy * sinR) / s;
        const ly = (-dx * sinR + dy * cosR) / s;
        const aUnscaled =
          (spoonWidth / 2) *
          (typeof SPOON_HITBOX_WIDTH_SCALE !== "undefined"
            ? SPOON_HITBOX_WIDTH_SCALE
            : 1);
        const bUnscaled =
          (spoonHeight / 2) *
          (typeof SPOON_HITBOX_HEIGHT_SCALE !== "undefined"
            ? SPOON_HITBOX_HEIGHT_SCALE
            : 1);
        insideEllipse =
          aUnscaled > 0 &&
          bUnscaled > 0 &&
          (lx * lx) / (aUnscaled * aUnscaled) +
            (ly * ly) / (bUnscaled * bUnscaled) <=
            1;
      } catch (e) {
        insideEllipse = false;
      }

      const isSpoonHover =
        !this.isOrderOpen &&
        !anyVialHeld &&
        !anyVialActive &&
        !this.spoonIsHeld &&
        insideEllipse &&
        !this.mixMeterComplete; // don't lift spoon when mix is complete

      // Subtle lift on hover: same as vial behavior
      const targetSpoonLift = isSpoonHover ? -3 : 0;
      this.spoonLift = this.spoonLift === undefined ? 0 : this.spoonLift;
      this.spoonLift = lerp(this.spoonLift, targetSpoonLift, 0.22);

      // Force spoon back to resting position when mix is successful
      if (this.mixMeterComplete && this.spoonIsHeld) {
        this.spoonIsHeld = false;
        this.isActivelyStirring = false;
        this.holdNoMovementStartFrame = null;
        if (this.stirringSound && !this.stirringSound.paused) {
          this.stirringSound.pause();
          this.stirringSound.currentTime = 0;
        }
        // Reset spoon animation targets to resting state
        this.targetSpoonScale = 1.0;
        this.targetSpoonRotation = this.spoonBaseRotation;
        this.targetSpoonDisplayX = this.spoonBaseX;
        this.spoonMouseStartX = 0;
        this.spoonMouseStartY = 0;
      }

      // Update animation targets based on held state
      if (this.spoonIsHeld) {
        // When held: enlarge by 9px (divide by original to get scale), center X, no rotation
        this.targetSpoonScale = 1 + 9 / spoonWidth;
        this.targetSpoonRotation = 0;

        // Track mouse movement to determine spoon horizontal offset
        // Initialize start position on first hold
        if (this.spoonMouseStartX === 0 && this.spoonMouseStartY === 0) {
          this.spoonMouseStartX = adjustedMX_spoon;
          this.spoonMouseStartY = adjustedMY_spoon;
        }

        // Calculate mouse delta from start position
        const mouseDeltaX = adjustedMX_spoon - this.spoonMouseStartX;
        const SPOON_OFFSET = 55; // pixels to move spoon left/right max
        const MOUSE_RANGE = 40; // pixels of mouse movement needed for full offset

        // Continuously map mouse movement to spoon position (left to right, no center stop)
        // Clamp the spoon offset within ±SPOON_OFFSET range
        const spoonOffsetAmount = constrain(
          map(
            mouseDeltaX,
            -MOUSE_RANGE,
            MOUSE_RANGE,
            -SPOON_OFFSET,
            SPOON_OFFSET,
          ),
          -SPOON_OFFSET,
          SPOON_OFFSET,
        );
        this.targetSpoonDisplayX = BASE_WIDTH / 2 + spoonOffsetAmount;

        // Detect movement magnitude this frame (based on spoon offset change)
        const movementDelta = Math.abs(
          spoonOffsetAmount - (this.previousSpoonOffsetAmount || 0),
        );

        // Consider any movement >= 1px as mixing time (per user request)
        const MIX_MOVEMENT_MIN = 1; // pixels required to count time for mixing
        const dt = typeof deltaTime !== "undefined" ? deltaTime : 16.67; // ms since last frame
        if (movementDelta >= MIX_MOVEMENT_MIN) {
          // Accumulate mixing time
          this.mixAccumMs = (this.mixAccumMs || 0) + dt;
          // Cap the accumulator
          if (this.mixAccumMs >= this.MIX_REQUIRED_MS) {
            this.mixAccumMs = this.MIX_REQUIRED_MS;
            if (!this.mixMeterComplete) {
              this.mixMeterComplete = true;
              if (this.mixSuccessShowFrame === null)
                this.mixSuccessShowFrame = frameCount;
              // If this is Level 2 or Level 3, mixing must occur as the specific step.
              if (this.levelNumber === 2 || this.levelNumber === 3) {
                // Expected index for the MIX sentinel (0-based).
                // Level 2 accepts MIX at index 4 (after 4 vials) OR index 5
                // (after all 5 vials), since both sequences are valid.
                // Level 3 requires MIX at index 4 only.
                const ingredientCount = (this.addedIngredients || []).length;
                const mixStepValid =
                  this.levelNumber === 2
                    ? ingredientCount === 4 || ingredientCount === 5
                    : ingredientCount === 4;
                // If player has not added the expected preceding vials,
                // mixing now is invalid -> mark sequence invalid (defer final
                // result until crystal is added so overlay doesn't show yet).
                if (!mixStepValid) {
                  this.sequenceInvalid = true;
                } else {
                  // Record the mix step so sequence comparisons succeed later.
                  // If a PARTIAL_MIX was previously recorded, upgrade it to a full MIX.
                  const PARTIAL_INDEX = (this.addedIngredients || []).indexOf(
                    "PARTIAL_MIX",
                  );
                  if (PARTIAL_INDEX !== -1) {
                    this.addedIngredients[PARTIAL_INDEX] = "MIX";
                  } else if (!this.addedIngredients.includes("MIX")) {
                    this.addedIngredients.push("MIX");
                  }
                }
              }
            }
          }
        }

        // Active stirring (for sound/UX): only play while the spoon is moving.
        // Require a non-trivial movement delta to start the sound; pause
        // immediately when movement stops so sound only plays during motion.
        const STIRRING_MOTION_THRESHOLD = this.stirringMotionThreshold;
        const absOffsetAmount = Math.abs(spoonOffsetAmount);

        // Consider 'moving' when the spoon displacement changes by at least 1px
        const MOVEMENT_REQUIRED = 1;
        const STIR_DEBOUNCE_FRAMES = 12; // keep sound for a short window after motion
        if (movementDelta >= MOVEMENT_REQUIRED) {
          this.isActivelyStirring = true;
          this.lastStirMovementFrame = frameCount;
          this.holdNoMovementStartFrame = null;
          if (!this.stirringSound)
            this.stirringSound = document.getElementById("stirring-sound");
          if (
            this.stirringSound &&
            (this.stirringSound.paused || this.stirringSound.currentTime === 0)
          ) {
            this.stirringSound.volume = 1.0;
            this.stirringSound.loop = true;
            this.stirringSound.play().catch(() => {});
          }
        } else {
          this.isActivelyStirring = false;
          // Only stop the sound if we haven't detected movement for several frames
          if (
            this.lastStirMovementFrame &&
            frameCount - this.lastStirMovementFrame > STIR_DEBOUNCE_FRAMES
          ) {
            if (this.stirringSound && !this.stirringSound.paused) {
              this.stirringSound.pause();
              this.stirringSound.currentTime = 0;
            }
          }
          if (this.holdNoMovementStartFrame === null)
            this.holdNoMovementStartFrame = frameCount;
        }

        // Always store previous amount for next frame comparison
        this.previousSpoonOffsetAmount = spoonOffsetAmount;
      } else {
        // When not held: original state
        this.targetSpoonScale = 1.0;
        this.targetSpoonRotation = this.spoonBaseRotation;
        this.targetSpoonDisplayX = this.spoonBaseX;
        // Reset mouse tracking
        this.spoonMouseStartX = 0;
        this.spoonMouseStartY = 0;
        // Stop stirring sound when spoon is released
        this.isActivelyStirring = false;
        this.holdNoMovementStartFrame = null; // reset no-movement timer when released
        if (this.stirringSound && !this.stirringSound.paused) {
          this.stirringSound.pause();
          this.stirringSound.currentTime = 0;
        }
        // Reset mix meter if not yet complete (must do required mixing time in one hold)
        if (!this.mixMeterComplete) {
          this.mixCount = 0;
          this.previousSpoonOffsetAmount = 0;
          this.mixMeterDisplayFraction = 0;
          this.mixAccumMs = 0;
        }
      }

      // Smoothly animate scale, rotation, and position
      this.spoonScale = lerp(this.spoonScale, this.targetSpoonScale, 0.15);
      this.spoonRotation = lerp(
        this.spoonRotation,
        this.targetSpoonRotation,
        0.15,
      );
      // Faster animation for position when held (0.25) to follow cursor closely, faster when returning to default (0.15)
      const positionLerpSpeed = this.spoonIsHeld ? 0.25 : 0.15;
      this.spoonDisplayX = lerp(
        this.spoonDisplayX,
        this.targetSpoonDisplayX,
        positionLerpSpeed,
      );

      // Apply elliptical mask (oval clipping)
      const cauldronOval = layout.cauldronOvalOverlay;
      const ovalX = layout.cauldron.x;
      const ovalY = layout.cauldron.y - 155;

      push();
      drawingContext.save();

      // Create clipping path for the oval
      drawingContext.beginPath();
      drawingContext.ellipse(
        ovalX,
        ovalY,
        cauldronOval.w / 2,
        cauldronOval.h / 2,
        0,
        0,
        TWO_PI,
      );
      drawingContext.clip();

      // Translate to center, rotate, and draw (with lift applied, animated scale and rotation)
      push();
      translate(this.spoonDisplayX, spoonY + this.spoonLift);
      rotate(this.spoonRotation);
      scale(this.spoonScale);
      imageMode(CENTER);
      image(this.assets.spoonImg, 0, 0, spoonWidth, spoonHeight);
      pop();

      imageMode(CORNER);

      // Restore clipping
      drawingContext.restore();
      pop();

      // Debug: draw spoon hitbox area (in BASE coordinates)
      if (SPOON_DEBUG_HITBOX) {
        push();
        // Use displayed position when held, otherwise base position
        const detectX =
          this.spoonIsHeld && this.spoonDisplayX
            ? this.spoonDisplayX
            : this.spoonX;
        const detectY =
          this.spoonY +
          (this.spoonLift || 0) +
          (typeof SPOON_HITBOX_Y_OFFSET !== "undefined"
            ? SPOON_HITBOX_Y_OFFSET
            : 0);

        // Draw rotated ellipse matching spoon orientation and size
        noFill();
        stroke(0, 255, 120);
        strokeWeight(2);
        push();
        translate(detectX, detectY);
        rotate(this.spoonRotation || 0);
        const drawW =
          this.spoonWidth *
          (this.spoonScale || 1) *
          (typeof SPOON_HITBOX_WIDTH_SCALE !== "undefined"
            ? SPOON_HITBOX_WIDTH_SCALE
            : 1);
        const drawH =
          this.spoonHeight *
          (this.spoonScale || 1) *
          (typeof SPOON_HITBOX_HEIGHT_SCALE !== "undefined"
            ? SPOON_HITBOX_HEIGHT_SCALE
            : 1);
        ellipse(0, 0, drawW, drawH);
        pop();

        // Readout
        noStroke();
        fill(255);
        textAlign(LEFT, TOP);
        textSize(12);
        const infoX = 12;
        const infoY = BASE_HEIGHT - 80;
        text(
          `Spoon hitbox\nX=${detectX.toFixed(1)} Y=${detectY.toFixed(1)}\nW=${this.spoonWidth.toFixed(1)} H=${this.spoonHeight.toFixed(1)}`,
          infoX,
          infoY,
        );
        pop();
      }

      // When mix is complete and the mouse is over the spoon, show a tooltip
      // instead of lifting the spoon. Tooltip appears above the spoon and
      // points to it with a small triangular pointer.
      // Suppress the tooltip immediately after the automatic spoon return
      // that occurs when the mix meter fills. Allow it at any later time.
      const justAutoReturned =
        this.mixSuccessShowFrame && frameCount - this.mixSuccessShowFrame < 100;

      const showAlreadyMixedTooltip =
        insideEllipse &&
        !this.spoonIsHeld &&
        this.mixMeterComplete &&
        !this.isOrderOpen &&
        !anyVialHeld &&
        !anyVialActive &&
        !justAutoReturned;

      if (showAlreadyMixedTooltip) {
        push();
        rectMode(CENTER);
        noStroke();

        // Tooltip dimensions (base coords) — much smaller
        const tooltipW = 140;
        const tooltipH = 28;
        const tipH = 6; // triangle height
        // Position the tooltip just above the spoon detection point,
        // shifted left by 30px per design request
        const tx = spoonDetectX - 30;
        const ty =
          spoonDetectY - (this.spoonHeight || 120) / 2 - 6 - tooltipH / 2;

        // Draw tooltip with a stroked gold border and dark fill
        push();
        rectMode(CENTER);
        stroke("#90701A");
        strokeWeight(2);
        fill("#2D1A10");
        rect(tx, ty, tooltipW, tooltipH, 8);
        pop();

        // Pointer: draw triangle using the same gold color as the stroke
        const tipX = tx;
        const tipY = ty + tooltipH / 2 + tipH / 2 + 1;
        push();
        stroke("#90701A");
        strokeWeight(2);
        fill("#90701A");
        triangle(
          tipX - 7,
          tipY - tipH / 2 + 1,
          tipX + 7,
          tipY - tipH / 2 + 1,
          tipX,
          tipY + tipH / 2 - 1,
        );
        pop();

        // Text
        fill("#F5E6D1");
        textAlign(CENTER, CENTER);
        textFont("IM Fell English");
        textSize(14);
        text("Already mixed!", tx, ty + 2);

        pop();
      }
    }

    this.vials.forEach((vial) => {
      // When paused, skip state-updates (movement, input handling)
      if (!paused) {
        // Update held bottle position to follow mouse in real-time (smooth)
        if (vial.isHeld && !vial.isMoving) {
          const { scaleFactor, offsetX, offsetY } = getScaleAndOffset();
          const mx = (mouseX - offsetX) / scaleFactor;
          const my = (mouseY - offsetY) / scaleFactor;

          // Smoothly follow the cursor with a trailing effect (smaller -> more delay/float)
          const followSpeed = 0.7; // smaller value = more trailing delay behind cursor
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

            // Play liquid pouring sound at 60% volume when pour begins
            const pouringSound = document.getElementById(
              "liquid-pouring-sound",
            );
            if (pouringSound) {
              pouringSound.currentTime = 0; // reset to start
              pouringSound.volume = 0.6; // 60% volume
              pouringSound.loop = false; // play once
              pouringSound.play().catch(() => {});
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

        // Use vial bottle hitbox detection instead of image dimensions
        const isPointInHitbox = vial.isCrystal
          ? this._isPointInCrystalHitbox(adjustedMX_v, adjustedMY_v, vial)
          : this._isPointInVialHitbox(adjustedMX_v, adjustedMY_v, vial);

        const isHoverV =
          !vial.isHeld &&
          !vial.isMoving &&
          !this.isOrderOpen &&
          !anyVialHeld && // suppress other vial hover while one is held
          !anyVialActive && // suppress hover while any vial is active (pouring)
          !spoonActive && // suppress vial hover while spoon is active
          isPointInHitbox;
        // Subtle lift on hover: smaller offset and gentler interpolation
        const targetLift = isHoverV ? -3 : 0; // negative Y moves up (reduced from -4)
        vial.lift = vial.lift === undefined ? 0 : vial.lift;
        vial.lift = lerp(vial.lift, targetLift, 0.22);

        if (vial.isMoving) {
          // Determine animation speed based on phase
          let speed = vial.isCrystal
            ? vial.progress < 0.6
              ? 0.012
              : 0.008
            : 0.02;

          // For return to shelf phase, do not aggressively speed up — keep
          // a slightly slower, more natural return timing.
          const isRegularBottleReturning =
            !vial.isCrystal && vial.progress >= 1.5 && vial.progress < 3.0;
          if (isRegularBottleReturning) {
            speed *= 1.0; // no forced doubling; progress-driven timing used instead
          }

          vial.progress += speed;

          if (vial.isCrystal) {
            const targetX = layout.cauldron.x;
            const cauldronHeight =
              (this.assets.cauldronImg.height / this.assets.cauldronImg.width) *
              layout.cauldron.w;
            const pauseY = layout.cauldron.y - cauldronHeight / 2 - 90;
            const originalFinalY = layout.cauldron.y + cauldronHeight / 4;
            const finalY = layout.cauldron.y - cauldronHeight * 0.12;
            const crystalCompleteProgress =
              0.6 +
              0.4 *
                (Math.abs(finalY - pauseY) / Math.abs(originalFinalY - pauseY));

            if (vial.droppedFromHeld) {
              // If crystal was dropped from the user's hand, fall straight down
              // from the visual pour X position; only interpolate Y towards finalY.
              const originalDroppedDistance = Math.abs(
                originalFinalY - vial.pourY,
              );
              const currentDroppedDistance = Math.abs(finalY - vial.pourY);
              const desiredDroppedTime =
                100 * (currentDroppedDistance / originalDroppedDistance);
              const droppedCrystalCompleteProgress =
                desiredDroppedTime <= 50
                  ? desiredDroppedTime * 0.012
                  : 0.6 + (desiredDroppedTime - 50) * 0.008;

              if (vial.progress < droppedCrystalCompleteProgress) {
                const t = constrain(
                  vial.progress / droppedCrystalCompleteProgress,
                  0,
                  1,
                );
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
              } else if (vial.progress < crystalCompleteProgress) {
                const t =
                  (vial.progress - 0.6) / (crystalCompleteProgress - 0.6);
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
            const targetX = layout.cauldron.x - 20;
            const targetY = layout.cauldron.y - 160;
            const referenceReturnDistance = dist(
              targetX,
              targetY,
              vial.startX,
              vial.startY,
            );

            if (vial.droppedFromHeld) {
              // New flow: pour in place, then return to shelf
              const returnDistance = dist(
                vial.pourX,
                vial.pourY,
                vial.startX,
                vial.startY,
              );
              // Make returns feel consistent: enforce a larger minimum and
              // slightly increase the distance multiplier so mid-placed pours
              // don't snap back too fast.
              const returnDuration = max(
                0.6,
                (returnDistance / max(referenceReturnDistance, 1)) * 1.2,
              );

              if (vial.progress < 1.5) {
                // Pouring phase (tilting happens during this)
                vial.x = vial.pourX;
                vial.y = vial.pourY;
                if (!this.addedIngredients.includes(vial.closedImg)) {
                  this.addedIngredients.push(vial.closedImg);
                }
              } else if (vial.progress < 1.5 + returnDuration) {
                // Return to shelf
                const back = constrain(
                  (vial.progress - 1.5) / returnDuration,
                  0,
                  1,
                );
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

                // First-vial tutorial handling removed

                // Play glass cling sound when vial returns to shelf (at 40% volume)
                const glassReturnSound =
                  document.getElementById("glass-cling-sound");
                if (glassReturnSound) {
                  glassReturnSound.currentTime = 0;
                  glassReturnSound.volume = 0.4; // 40% volume
                  glassReturnSound.loop = false;
                  glassReturnSound.play().catch(() => {});
                }
              }
            } else {
              // Original flow: move to cauldron, pour, return to shelf
              if (vial.progress < 1) {
                vial.x = lerp(vial.startX, targetX, vial.progress);
                vial.y = lerp(vial.startY, targetY, vial.progress);
              } else if (vial.progress < 1.5) {
                vial.x = targetX;
                vial.y = targetY;
                if (!this.addedIngredients.includes(vial.closedImg)) {
                  this.addedIngredients.push(vial.closedImg);
                }
              } else if (vial.progress < 3.0) {
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

                // First-vial tutorial handling removed

                // Play glass cling sound when vial returns to shelf (at 40% volume)
                const glassReturnSound =
                  document.getElementById("glass-cling-sound");
                if (glassReturnSound) {
                  glassReturnSound.currentTime = 0;
                  glassReturnSound.volume = 0.4; // 40% volume
                  glassReturnSound.loop = false;
                  glassReturnSound.play().catch(() => {});
                }
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
      // Also: when results are showing for CORRECT or WRONG (i.e. the
      // crystal was added and the level has a final result), hide the
      // crystal entirely so it doesn't appear behind the overlay.
      if (vial.isCrystal) {
        if (this.levelResult === "CORRECT" || this.levelResult === "WRONG") {
          return;
        }
      }
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
            // allow plain 'orange' id to map to the same colour
            orange: color("#FD9D07"),
            teal: color("#1F8087"),
            yellow: color("#EFD000"),
          };

          // Normalize vial id by stripping trailing digits (level suffixes like '2')
          const idBase = (vial.id || "").toString().replace(/\d+$/, "");
          // Use id-based mapping (fall back to grey if unknown)
          const baseColour = colourMap[idBase] || color(150, 150, 150);
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

    // ========== DEBUG: DRAW ALL HITBOXES WHEN LEVEL_DEBUG_HITBOX IS ENABLED ==========
    if (LEVEL_DEBUG_HITBOX) {
      push();
      noFill();
      strokeWeight(2);

      // Draw vial hitboxes as bottle shape (rectangle + thin rectangle on top)
      this.vials.forEach((vial) => {
        if (!vial.isCrystal) {
          // Regular vial: bottle shape (rectangle + thin rectangle on top)
          stroke(100, 200, 255); // cyan

          const vialW = vial.width * vial.scale * 0.75; // thinner overall
          const vialH = vial.height * vial.scale + 1; // increased length by 3px
          const adjustedVialY = vial.y + 6; // moved down by 6px

          const rectHeight = vialH * 0.8 - 7; // rectangle body, 7px shorter
          const neckHeight = vialH * 0.2 + 3; // neck, 3px larger
          const halfW = vialW / 2;
          const neckWidth = vialW * 0.35; // neck is even thinner

          // Draw main rectangle body with rounded corners
          rectMode(CENTER);
          const rectY = adjustedVialY + neckHeight / 2; // offset for neck
          rect(vial.x, rectY, vialW, rectHeight, 8); // 8 is corner radius

          // Draw thin rectangle on top (bottle neck)
          const neckY = adjustedVialY - rectHeight / 2 - neckHeight / 2;
          rect(vial.x, neckY, neckWidth, neckHeight, 4); // 4 is corner radius for neck
        }
      });

      // Draw crystal hitbox as diamond (two triangles)
      const crystalVial = this.vials.find((v) => v.isCrystal);
      if (crystalVial) {
        stroke(255, 100, 200); // magenta

        const crystalW = crystalVial.width * crystalVial.scale;
        const crystalH = crystalVial.height * crystalVial.scale;
        const halfW = crystalW / 2;
        const halfH = crystalH / 2;

        // Diamond shape: top triangle + bottom triangle (inverted)
        // Top triangle
        triangle(
          crystalVial.x,
          crystalVial.y - halfH, // top point
          crystalVial.x - halfW,
          crystalVial.y, // left
          crystalVial.x + halfW,
          crystalVial.y, // right
        );

        // Bottom triangle (upside down)
        triangle(
          crystalVial.x,
          crystalVial.y + halfH, // bottom point
          crystalVial.x - halfW,
          crystalVial.y, // left
          crystalVial.x + halfW,
          crystalVial.y, // right
        );
      }

      // Draw cauldron dropzone (ellipse)
      if (this.dropZone) {
        stroke(255, 200, 50); // orange
        // Draw the main ellipse/semi-oval
        ellipseMode(CENTER);
        const rx =
          this.dropZone.actualRx ||
          this.dropZone.radiusX ||
          this.dropZone.r ||
          0;
        const ry =
          this.dropZone.actualRy ||
          this.dropZone.radiusY ||
          this.dropZone.r ||
          0;
        ellipse(this.dropZone.x, this.dropZone.y, rx * 2, ry * 2);

        // Draw crystal zone if different
        if (this.dropZone.crystalRx !== undefined) {
          stroke(200, 50, 255); // purple
          const cRx = this.dropZone.crystalRx;
          const cRy = this.dropZone.crystalRy;
          const cExtendUp = this.dropZone.crystalExtendUp || 0;
          // Draw arc
          ellipse(
            this.dropZone.crystalCx,
            this.dropZone.crystalCy,
            cRx * 2,
            cRy * 2,
          );
          // Draw rectangle extension upward
          rectMode(CENTER);
          rect(
            this.dropZone.crystalCx,
            this.dropZone.crystalCy - cExtendUp / 2,
            cRx * 2,
            cExtendUp,
          );
        }
      }

      // Draw spoon hitbox
      if (this.spoonX !== undefined && this.spoonY !== undefined) {
        stroke(50, 255, 100); // green
        const detectX =
          this.spoonIsHeld && this.spoonDisplayX
            ? this.spoonDisplayX
            : this.spoonX;
        const detectY =
          this.spoonY +
          (this.spoonLift || 0) +
          (typeof SPOON_HITBOX_Y_OFFSET !== "undefined"
            ? SPOON_HITBOX_Y_OFFSET
            : 0);

        push();
        translate(detectX, detectY);
        rotate(this.spoonRotation || 0);
        const drawW =
          this.spoonWidth *
          (this.spoonScale || 1) *
          (typeof SPOON_HITBOX_WIDTH_SCALE !== "undefined"
            ? SPOON_HITBOX_WIDTH_SCALE
            : 1);
        const drawH =
          this.spoonHeight *
          (this.spoonScale || 1) *
          (typeof SPOON_HITBOX_HEIGHT_SCALE !== "undefined"
            ? SPOON_HITBOX_HEIGHT_SCALE
            : 1);
        ellipseMode(CENTER);
        ellipse(0, 0, drawW, drawH);
        pop();
      }

      // Debug info display
      noStroke();
      fill(255, 255, 100);
      textAlign(LEFT, TOP);
      textSize(13);
      const infoX = 12;
      const infoY = BASE_HEIGHT - 140;
      text(
        `Level Hitboxes (H toggle):\nCyan = Vials (Norman Window)\nMagenta = Crystal (Diamond)\nOrange = Cauldron\nPurple = Crystal zone\nGreen = Spoon`,
        infoX,
        infoY,
      );

      pop();
    }

    // Envelope and first-vial tutorial overlays removed

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
      !spoonActive &&
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

    // ---- Help Button (rounded square left of envelope) ----
    // Position and hover detection (suppressed while interacting with vials/spoon)
    const helpBtnSize = 40; // slightly larger for tap targets
    const helpBtnGap = 8; // gap between envelope and button
    const helpBtnExtraLeft = 28; // additional left offset to move the button further away (nudged right 4px)
    const helpBtnX =
      env.x - env.w / 2 - helpBtnSize / 2 - helpBtnGap - helpBtnExtraLeft;
    const helpBtnY = env.y;
    const isHelpHovered =
      !anyVialHeld &&
      !this.vials.some((v) => v.isMoving) &&
      !spoonActive &&
      adjustedMX > helpBtnX - helpBtnSize / 2 &&
      adjustedMX < helpBtnX + helpBtnSize / 2 &&
      adjustedMY > helpBtnY - helpBtnSize / 2 &&
      adjustedMY < helpBtnY + helpBtnSize / 2;

    // Smooth hover scale
    const targetHelpScale = isHelpHovered ? 1.06 : 1.0;
    if (!paused)
      this.helpButtonScale = lerp(this.helpButtonScale, targetHelpScale, 0.25);

    push();
    translate(helpBtnX, helpBtnY);
    scale(this.helpButtonScale);
    rectMode(CENTER);
    // Fill and border colors: user requested final fill and border matching question mark
    // Use a single static fill so hover does not change the color
    const fillColor = "#F9E6C8"; // normalized to #F9E6C8 for both normal and hover
    const markColor = "#5A331F"; // question-mark and border color
    stroke(markColor);
    strokeWeight(2);
    fill(fillColor);
    // Draw rounded square (curved corners)
    rect(0, 0, helpBtnSize, helpBtnSize, 8);
    // Question mark in dark brown for contrast; slightly smaller
    noStroke();
    fill(markColor);
    textAlign(CENTER, CENTER);
    textFont("VT323");
    textSize(24);
    text("?", 0, 0);
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
      const cardHeight = panelHeight - 75; // available viewport height for cards

      // Calculate how many cards are present
      const numCards = 1;
      const cardSpacing = 12;

      const singleCardHeight = cardHeight;

      // Calculate total content height based on level
      let totalContentHeight = singleCardHeight;

      // Clamp scroll offset to valid range
      const maxScroll = Math.max(0, totalContentHeight - cardHeight);
      this.orderScrollOffset = Math.max(
        0,
        Math.min(this.orderScrollOffset, maxScroll),
      );

      // Set up clip region for the card area
      push();
      drawingContext.save();
      drawingContext.beginPath();
      drawingContext.rect(cardLeft, cardTop, cardWidth, cardHeight);
      drawingContext.clip();

      if (!this.orderStarted) {
        // Card background (beige rounded rectangle)
        push();
        rectMode(CORNER);
        noStroke();
        fill("#F5E6D1");
        rect(cardLeft, cardTop, cardWidth, singleCardHeight, 10);
        pop();
        // ---- FIRST CARD: Beginner's Luck ----
        // Optional debug info (render only when debug overlay enabled)
        if (typeof SPOON_DEBUG_HITBOX !== "undefined" && SPOON_DEBUG_HITBOX) {
          push();
          rectMode(CORNER);
          fill("#F5E6D1");
          noStroke();
          const detectX =
            this.spoonIsHeld && this.spoonDisplayX
              ? this.spoonDisplayX
              : this.spoonX;
          const detectY =
            this.spoonY +
            (this.spoonLift || 0) +
            (typeof SPOON_HITBOX_Y_OFFSET !== "undefined"
              ? SPOON_HITBOX_Y_OFFSET
              : 0);
          const drawW =
            this.spoonWidth *
            (this.spoonScale || 1) *
            (typeof SPOON_HITBOX_WIDTH_SCALE !== "undefined"
              ? SPOON_HITBOX_WIDTH_SCALE
              : 1);
          const drawH =
            this.spoonHeight *
            (this.spoonScale || 1) *
            (typeof SPOON_HITBOX_HEIGHT_SCALE !== "undefined"
              ? SPOON_HITBOX_HEIGHT_SCALE
              : 1);
          const infoX = 12;
          const infoY = BASE_HEIGHT - 80;
          text(
            `Spoon hitbox\nX=${detectX.toFixed(1)} Y=${detectY.toFixed(1)}\nW=${drawW.toFixed(1)} H=${drawH.toFixed(1)}\nY-offset=${typeof SPOON_HITBOX_Y_OFFSET !== "undefined" ? SPOON_HITBOX_Y_OFFSET : 0}\nW-scale=${typeof SPOON_HITBOX_WIDTH_SCALE !== "undefined" ? SPOON_HITBOX_WIDTH_SCALE : 1} H-scale=${typeof SPOON_HITBOX_HEIGHT_SCALE !== "undefined" ? SPOON_HITBOX_HEIGHT_SCALE : 1}`,
            infoX,
            infoY,
          );
          pop();
        }

        // Card heading - varies by level
        push();
        textAlign(LEFT, TOP);
        textFont("Manufacturing Consent");
        textSize(36);
        fill("#2D0900");
        let orderTitle;
        if (this.levelNumber === 2) orderTitle = "Sparks Flying";
        else if (this.levelNumber === 3) orderTitle = "Last Light";
        else orderTitle = "Beginner's Luck";
        text(orderTitle, cardLeft + 20, cardTop + 20 - this.orderScrollOffset);
        pop();

        // Sender line
        push();
        textAlign(LEFT, TOP);
        textFont("IM Fell English");
        textStyle(ITALIC);
        textSize(20);
        fill("#6E6E6E");
        const senderText =
          this.levelNumber === 2
            ? "From: Lady Beaumont"
            : this.levelNumber === 3
              ? "From: King Percival"
              : "From: Lord Alistair";
        text(senderText, cardLeft + 20, cardTop + 65 - this.orderScrollOffset);
        pop();

        // Patience bar (above START ORDER button)
        const startBtnMargin = 20;
        const startBtnWidth = cardWidth - startBtnMargin * 2;
        const barHeight = 16;
        const barX = cardLeft + startBtnMargin;
        const barY =
          cardTop +
          singleCardHeight -
          42 -
          15 -
          barHeight -
          18 -
          this.orderScrollOffset;

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
        rectMode(CORNER);
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

        // Segment divider lines: vary by level so each segment equals 30s
        // Level 1 -> 2 dividers (3 sections of 30s = 90s)
        // Level 2 -> 3 dividers (4 sections of 30s = 120s) [default]
        // Level 3 -> 5 dividers (6 sections of 30s = 180s)
        push();
        stroke("#6E6E6E");
        strokeWeight(1);
        let numDividersPanel = 3; // default for level 2
        if (this.levelNumber === 1) numDividersPanel = 2;
        else if (this.levelNumber === 3) numDividersPanel = 5;
        for (let i = 1; i <= numDividersPanel; i++) {
          const lineX = barX + (startBtnWidth / (numDividersPanel + 1)) * i;
          line(lineX, barY + 1, lineX, barY + barHeight - 1);
        }
        pop();

        // "Start Order" button
        const startBtnHeight = 42;
        const startBtnX = cardLeft + startBtnMargin;
        const startBtnY =
          cardTop +
          singleCardHeight -
          startBtnHeight -
          15 -
          this.orderScrollOffset;

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
        // ---- OTHER LEVELS (1, 3+) when order started ----
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

      // End clip region
      drawingContext.restore();
      pop();

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
      // Use appropriate hitbox detection based on vial type
      const isPointInHitbox = vial.isCrystal
        ? this._isPointInCrystalHitbox(mx, my, vial)
        : this._isPointInVialHitbox(mx, my, vial);

      if (!vial.used && isPointInHitbox) {
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

    // Play liquid pouring sound at 60% volume when pour begins
    const pouringSound = document.getElementById("liquid-pouring-sound");
    if (pouringSound) {
      pouringSound.currentTime = 0; // reset to start
      pouringSound.volume = 0.6; // 60% volume
      pouringSound.loop = false; // play once
      pouringSound.play().catch(() => {});
    }
  }

  // -------------------------------------------------------
  // _drawRecipeBookLocked()
  // Draws the locked recipe view shown before the player starts an order.
  // -------------------------------------------------------
  _drawRecipeBookLocked() {
    const openBook = this.assets.recipeBookOpen;
    const bookWidth = 600;
    const bookHeight = (openBook.height / openBook.width) * bookWidth;
    const bookLeft = BASE_WIDTH / 2 - bookWidth / 2;
    const bookTop = BASE_HEIGHT / 2 - bookHeight / 2;
    const leftPageCX = bookLeft + bookWidth * 0.25;
    const leftPageL = bookLeft + 28;
    const leftPageR = bookLeft + bookWidth / 2 - 24;
    const leftPageW = leftPageR - leftPageL;

    push();
    noStroke();
    textFont(FONT_IM_FELL_ENGLISH);
    textStyle(ITALIC);
    textSize(28);
    textAlign(CENTER, TOP);
    fill(55, 30, 10, 230);

    const lockedMessage =
      "The secrets of this book only reveal themselves to those with an order at hand.";
    const words = lockedMessage.split(" ");
    const wrapWidth = leftPageW * 0.86;
    const lineHeight = 32;
    let line = "";
    let textY = bookTop + 100;

    for (const word of words) {
      const testLine = line ? `${line} ${word}` : word;
      if (textWidth(testLine) > wrapWidth) {
        text(line, leftPageCX, textY);
        line = word;
        textY += lineHeight;
      } else {
        line = testLine;
      }
    }

    if (line) {
      text(line, leftPageCX, textY);
    }

    this._drawRecipeBookCloseButton(bookLeft, bookTop, bookWidth);
    pop();
  }

  _getRecipeCloseButtonPos(bookLeft, bookTop, bookWidth) {
    // Reusable helper to compute close button position consistently
    // in both draw and click handlers.
    const btnSize = 36;
    let btnX, btnY;
    if (this.levelNumber === 3 && this.orderStarted) {
      // Level 3 post-order: place in top-right corner of BASE_WIDTH/HEIGHT
      // Shift left to avoid overlapping the envelope icon
      btnX = BASE_WIDTH - 80 - btnSize / 2; // 80px from right edge
      btnY = btnSize / 2 + 56; // 56px from top edge (moved down)
    } else {
      // Pre-order or other levels: attach to book
      btnX = bookLeft + bookWidth - btnSize / 2 + 32;
      btnY = bookTop + btnSize / 2 - 26;
    }
    return { btnX, btnY, btnSize };
  }

  _drawRecipeBookCloseButton(bookLeft, bookTop, bookWidth) {
    const { btnX, btnY, btnSize } = this._getRecipeCloseButtonPos(
      bookLeft,
      bookTop,
      bookWidth,
    );

    const {
      scaleFactor: _sf,
      offsetX: _ox,
      offsetY: _oy,
    } = getScaleAndOffset();
    // Compute adjusted mouse in BASE coords for hover detection
    const adjustedMX_btn = (mouseX - _ox) / _sf;
    const adjustedMY_btn = (mouseY - _oy) / _sf;
    const isCloseBtnHovered =
      adjustedMX_btn > btnX - btnSize / 2 &&
      adjustedMX_btn < btnX + btnSize / 2 &&
      adjustedMY_btn > btnY - btnSize / 2 &&
      adjustedMY_btn < btnY + btnSize / 2;

    // Determine hover color; make it slightly lighter for Level 3 post-order
    const defaultHoverColor = "#E83030";
    const level3LighterHover = "#FF4747"; // very slightly lighter hover for Level 3 post-order
    const baseFillColor = "#D00000";
    const hoverColor = isCloseBtnHovered
      ? this.levelNumber === 3 && this.orderStarted
        ? level3LighterHover
        : defaultHoverColor
      : baseFillColor;

    // Draw close button (drawn in BASE coords, will be scaled by drawLevel transform)
    rectMode(CENTER);
    noStroke();
    fill(hoverColor);
    rect(btnX, btnY, btnSize, btnSize, 5);
    fill("#FFF4E5");
    textAlign(CENTER, CENTER);
    textSize(26);
    text("×", btnX, btnY + 3);

    // Update cursor
    if (isCloseBtnHovered) cursor(HAND);
    else cursor(ARROW);
  }

  // -------------------------------------------------------
  // _drawRecipeBookOpen()
  // Draws the open recipe book with the pentagon symbol diagram
  // on the right page. Called whenever isRecipeOpen is true.
  // -------------------------------------------------------
  _drawRecipeBookOpen() {
    const openBook = this.assets.recipeBookOpen;
    const bookWidth = 600;
    const bookHeight = (openBook.height / openBook.width) * bookWidth;
    imageMode(CENTER);
    // Intentionally do not draw the open-book svg asset (openBook)
    // The recipe screen will render its content without the SVG background.

    const bookLeft = BASE_WIDTH / 2 - bookWidth / 2;
    const bookTop = BASE_HEIGHT / 2 - bookHeight / 2;

    // ---- Left page content ----
    const leftPageCX = bookLeft + bookWidth * 0.25; // centre of left half
    const leftPageL = bookLeft + 28; // left text margin
    const leftPageR = bookLeft + bookWidth / 2 - 24;
    const leftPageW = leftPageR - leftPageL; // usable text width
    const bookBottom = bookTop + bookHeight;

    // — VOL. I / VOL. II —
    noStroke();
    textFont(FONT_VT323);
    textSize(15);
    textAlign(CENTER, TOP);
    fill(96, 56, 19, 140);
    const volLabel =
      this.levelNumber === 3
        ? "VOL. III"
        : this.levelNumber === 2
          ? "VOL. II"
          : "VOL. I";
    text(volLabel, leftPageCX, bookTop + 36);

    // — Top ornamental rule + diamond —
    const ruleY1 = bookTop + 56;
    stroke(96, 56, 19, 75);
    strokeWeight(0.8);
    // Draw two segments so there's a clear gap around the central diamond
    const diamondSize = 5;
    const gap = 10; // px space on either side of diamond
    const leftLineX1 = leftPageL + 22;
    const leftLineX2 = leftPageCX - gap;
    const rightLineX1 = leftPageCX + gap;
    const rightLineX2 = leftPageR - 22;
    line(leftLineX1, ruleY1, leftLineX2, ruleY1);
    line(rightLineX1, ruleY1, rightLineX2, ruleY1);
    noStroke();
    fill(96, 56, 19, 95);
    push();
    translate(leftPageCX, ruleY1);
    rotate(QUARTER_PI);
    rectMode(CENTER);
    rect(0, 0, diamondSize, diamondSize);
    pop();

    // — Potion title —
    noStroke();
    textFont(FONT_MANUFACTURING_CONSENT);
    // Increased size for better readability in recipe contents
    textSize(30);
    textAlign(CENTER, TOP);
    fill(55, 30, 10);
    let potionTitle;
    if (this.levelNumber === 1) potionTitle = "Beginner's Luck";
    else if (this.levelNumber === 2) potionTitle = "Sparks Flying";
    else potionTitle = "Last Light";
    text(potionTitle, leftPageCX, bookTop + 66);

    // — Thin rule below title — (removed)
    // Intentionally omitted to keep the left page cleaner; diamond ornament
    // above remains as the only decorative divider.

    // — Description (Monsieur La Doulaise italic, word-wrapped) —
    textFont(FONT_MONSIEUR_LA_DOULAISE);
    textStyle(ITALIC);
    // Slightly larger to improve readability; center on the left page
    textSize(22);
    textAlign(CENTER, TOP);
    fill(55, 30, 10, 210);

    const _desc =
      this.levelNumber === 1
        ? "Brewed at the height of noon, said to tip fate's scales in the drinker\u2019s favour before a wager or a duel."
        : this.levelNumber === 2
          ? "When stars align and ingredients ignite, magic stirs the heart and sets passion alight."
          : "When all else fails and hope wears thin, this remedy is said to restore life at death's edge.";

    // Manual word-wrap
    const _words = _desc.split(" ");
    let _line = "";
    // Start a little lower so the description sits comfortably under the title
    let _ty = bookTop + 126;
    const _lh = 24;
    // Use a narrower wrap width so the description breaks onto more lines
    // and draw centered at the left page's center X.
    const _wrapW = leftPageW * 0.62;
    const _wrapX = leftPageCX;
    for (const w of _words) {
      const test = _line ? _line + " " + w : w;
      if (textWidth(test) > _wrapW) {
        text(_line, _wrapX, _ty);
        _line = w;
        _ty += _lh;
      } else {
        _line = test;
      }
    }
    if (_line) text(_line, _wrapX, _ty);
    textStyle(NORMAL);

    // — Bottom warning rule — (removed)
    const _warnRuleY = bookBottom - 58;
    // line removed to avoid extra dividing rules on the left page
    // (we still use _warnRuleY for positioning the warning text)

    // // — Warning text —
    // textFont(FONT_IM_FELL_ENGLISH);
    // textStyle(ITALIC);
    // textSize(12);
    // textAlign(CENTER, TOP);
    // fill(96, 56, 19, 175);
    // // Shift these warning lines further upward so they are well inside the page
    // text("Tread carefully.", leftPageCX, _warnRuleY - 33);
    // textStyle(NORMAL);
    // textSize(10.5);
    // fill(96, 56, 19, 120);
    // text("A misstep cannot be undone.", leftPageCX, _warnRuleY - 16);

    // (Right-page warning will be rendered below after diagram coords are set)

    // ---- Pentagon diagram on right page ----
    // All coordinates are in BASE_WIDTH / BASE_HEIGHT space.
    // Diagram centroid sits at (726, 298) — right half of the open book.
    const SHIFT_X = 12; // nudge entire diagram right by this many pixels
    const DIAGRAM_NUDGE_UP = 28; // move diagram higher on the page
    const CX = 726 + SHIFT_X;
    // Default centroid Y (nudged up). For Level 1 and 2, nudge down a bit
    // so the diagram sits lower on the page; keep Level 3 unchanged.
    let CY = 298 - DIAGRAM_NUDGE_UP; // centroid (nudged up)
    if (this.levelNumber !== 3) CY += 20; // move Level 1 & 2 diagrams down by 20px
    // Nudge entire diagram down very slightly for visual alignment
    CY += 8; // moved down 2px more
    const RING_R = 89; // outer ring radius
    const INNER_R = 36; // inner ring radius
    const SYM = 28; // symbol render size (square)
    const LABEL_ALPHA = 200; // opacity for flavour text (0-255)

    // Allow the ring radius to expand for special layouts (e.g., Level 3 star)
    const effectiveRingR = this.levelNumber === 3 ? RING_R * 1.35 : RING_R;

    // ---- Right page bottom warning (aligned with "Nearly there.") ----
    textFont(FONT_IM_FELL_ENGLISH);
    textStyle(ITALIC);
    textSize(12);
    textAlign(CENTER, TOP);
    fill(96, 56, 19, 175);
    // Align X with the 'Nearly there.' label at 726 + SHIFT_X
    const rightWarnX = 726 + SHIFT_X;
    // Move the line down slightly for Level 3 so it doesn't overlap the star
    const rightWarnYOffset = this.levelNumber === 3 ? -17 : -27;
    text(
      "Activate with Catalyst Crystal",
      rightWarnX,
      _warnRuleY + rightWarnYOffset,
    );
    textStyle(NORMAL);

    // Define vertices based on level
    // Level 1: Triangle with 3 vials
    // Level 2: Pentagon with 5 vials
    // Level 3: 7-point star (heptagram) with 7 vials
    let vertices;
    if (this.levelNumber === 1) {
      // Triangle layout on the outer ring: bottom-left, bottom-right, top-center
      const triangleRadius = RING_R;
      vertices = [
        {
          x: CX + Math.cos((5 * Math.PI) / 6) * triangleRadius,
          y: CY + Math.sin((5 * Math.PI) / 6) * triangleRadius,
          img: this.assets.symbolDarkgreen,
          label: "Begin here.",
        },
        {
          x: CX + Math.cos(Math.PI / 6) * triangleRadius,
          y: CY + Math.sin(Math.PI / 6) * triangleRadius,
          img: this.assets.symbolOrange,
          label: "Follows the first.",
        },
        {
          x: CX,
          y: CY - triangleRadius,
          img: this.assets.symbolTeal,
          label: "Last vial.",
        },
      ];
    } else if (this.levelNumber === 3) {
      // 7-point star layout: compute 7 outer points on the outer ring
      const STAR_POINTS = 7;
      // make the star 'thinner' by using a larger outer radius
      const starOuterR = RING_R * 1.35;
      // Map specific symbols to each of the 7 points (Point 1..7 correspond
      // to indices 0..6). Requested mapping:
      // Point 1 -> symbol-lightpink
      // Point 2 -> symbol-lightpink2
      // Point 3 -> symbol-darkpurple
      // Point 4 -> symbol-lightblue2
      // Point 5 -> symbol-orange2
      // Point 6 -> symbol-yellow2
      // Point 7 -> symbol-lightpurple2
      const symbolList = [
        this.assets.symbolLightpink,
        this.assets.symbolLightpink2,
        // swapped: place Orange2 at point 3 and Darkpurple at point 5
        this.assets.symbolOrange2,
        this.assets.symbolLightblue2,
        this.assets.symbolDarkpurple,
        this.assets.symbolYellow2,
        this.assets.symbolLightpurple2,
      ];
      vertices = [];
      // Start at -90deg so one point is at the top
      const startAng = -HALF_PI;
      // Labels requested by the user for points 1..7
      const labelsList = [
        "Midpoint, mix after.",
        "Where healing starts.",
        "Penultimate.",
        "Before the fourth.",
        "Past the middle.",
        "Follows the start.",
        "Final drop.",
      ];

      for (let i = 0; i < STAR_POINTS; i++) {
        const ang = startAng + (TWO_PI * i) / STAR_POINTS;
        const vx = CX + Math.cos(ang) * starOuterR;
        const vy = CY + Math.sin(ang) * starOuterR;
        vertices.push({
          x: vx,
          y: vy,
          img: symbolList[i % symbolList.length],
          label: labelsList[i % labelsList.length],
        });
      }
    } else {
      // Pentagon layout for level 2 and level 4+
      // Compute vertices on a regular pentagon aligned with the outer circle (RING_R)
      const pentagonRadius = RING_R;
      const pentagonStartAngle = -HALF_PI; // Start at top (-90°)
      const pentagonSymbols = [
        { img: this.assets.symbolRed, label: "The second." },
        { img: this.assets.symbolLightgreen, label: "Mix, then end." },
        { img: this.assets.symbolMidblue, label: "After the second." },
        { img: this.assets.symbolBlack, label: "The root." },
        { img: this.assets.symbolLightpurple, label: "Nearly there." },
      ];
      vertices = [];
      // Generate vertices: start from top and go clockwise (indices 4, 0, 1, 2, 3)
      // to match label order (Nearly there is at index 4, but displayed last in order)
      const vertexOrder = [4, 0, 1, 2, 3]; // Reorder to start from "Nearly there" (top)
      for (let i = 0; i < 5; i++) {
        const idx = vertexOrder[i];
        const angle = pentagonStartAngle + (TWO_PI * i) / 5;
        const vx = CX + Math.cos(angle) * pentagonRadius;
        const vy = CY + Math.sin(angle) * pentagonRadius;
        vertices.push({
          x: vx,
          y: vy,
          img: pentagonSymbols[idx].img,
          label: pentagonSymbols[idx].label,
        });
      }
    }

    push();

    // -- Outer and inner rings --
    noFill();
    stroke(90, 55, 18, 46); // rgba(90,55,18,0.18) → alpha ~46
    strokeWeight(1);
    ellipseMode(CENTER);
    circle(CX, CY, effectiveRingR * 2);
    stroke(90, 55, 18, 26);
    circle(CX, CY, INNER_R * 2);

    // -- Outline (polygon or star depending on level) --
    stroke(90, 55, 18, 28);
    strokeWeight(1);
    noFill();
    if (this.levelNumber === 3) {
      // Draw a heptagram by connecting every 2nd outer point (7-point star)
      const n = vertices.length;
      const step = 2; // {7/2} heptagram
      beginShape();
      let idx = 0;
      for (let i = 0; i < n; i++) {
        vertex(vertices[idx].x, vertices[idx].y);
        idx = (idx + step) % n;
      }
      endShape(CLOSE);
    } else {
      beginShape();
      for (const v of vertices) vertex(v.x, v.y);
      endShape(CLOSE);
    }

    // -- Spokes from centroid to each vertex --
    stroke(90, 55, 18, 18);
    strokeWeight(this.levelNumber === 3 ? 0.6 : 0.8);
    for (const v of vertices) {
      line(CX, CY, v.x, v.y);
    }

    // -- Symbols (vial images) centred on each vertex --
    imageMode(CENTER);
    noStroke();
    // reduce symbol size slightly for Level 3 so they don't overlap
    const symbolSize = this.levelNumber === 3 ? SYM * 0.85 : SYM;
    for (const v of vertices) {
      if (v.img) {
        // Allow a slight size boost for symbol-orange2 on Level 3
        let drawSize = symbolSize;
        if (this.levelNumber === 3 && v.img === this.assets.symbolOrange2) {
          drawSize = symbolSize * 1.25; // increase by ~25% (15% + ~10% more)
        }
        const h = (v.img.height / v.img.width) * drawSize;
        image(v.img, v.x, v.y, drawSize, h);
      }
    }

    // Render the flavour labels into a cached high-resolution graphics
    // (2x) so they remain crisp when the whole BASE space is scaled.
    const makeRecipeLabelGfx = () => {
      const DPR = 2;
      const w = BASE_WIDTH * DPR;
      const h = BASE_HEIGHT * DPR;
      const g = createGraphics(w, h);
      g.pixelDensity(1);
      g.clear();
      g.push();
      g.textFont(FONT_MONSIEUR_LA_DOULAISE);
      g.textSize(20 * DPR);
      g.textAlign(LEFT, CENTER);
      g.textStyle(NORMAL);
      g.noStroke();
      // Label color: #2D0A03 -> RGB(45,10,3). Preserve LABEL_ALPHA for opacity.
      g.fill(45, 10, 3, LABEL_ALPHA);
      for (const v of vertices) {
        // Compute symbol render height to offset label clear of the symbol graphic
        const symbolH = (v.img.height / v.img.width) * SYM;
        const offset = symbolH / 2 + 8; // px clear distance from symbol edge
        const extraDown = 6; // additional downward nudge for lower labels

        let lx = v.x;
        let ly;

        if (this.levelNumber === 1) {
          // Triangle layout: "Last vial" above, others below
          ly =
            v.label === "Last vial." ? v.y - offset : v.y + offset + extraDown;
          if (v.label === "Last vial.") {
            g.textAlign(CENTER, BOTTOM);
          } else {
            g.textAlign(CENTER, TOP);
          }
        } else if (this.levelNumber === 3) {
          // Level 3 (star): position the top-most (Midpoint.) label above the symbol, others below
          // Apply small horizontal nudges per user request to shift some labels
          // Move selected labels horizontally per user tweaks.
          if (
            v.label === "Final drop." ||
            v.label === "Where healing starts." ||
            v.label === "Penultimate."
          ) {
            lx -= 14; // move left a bit (unchanged)
          }
          // Move 'Past the middle.' to the right a bit per request
          if (v.label === "Past the middle.") {
            lx -= 18; // move left a bit
          }
          // Move these two to the right a bit more
          if (
            v.label === "Follows the start." ||
            v.label === "Before the fourth."
          ) {
            lx += 22; // move right a bit
          }

          if (v.label === "Midpoint, mix after.") {
            // Nudge the Midpoint label slightly closer to the symbol
            ly = v.y - offset + 8;
            g.textAlign(CENTER, BOTTOM);
          } else {
            ly = v.y + offset + extraDown;
            g.textAlign(CENTER, TOP);
          }
        } else {
          // Pentagon layout: "Nearly there." above, others below
          ly =
            v.label === "Nearly there."
              ? v.y - offset
              : v.y + offset + extraDown;
          // Increase horizontal spacing between lower-left and lower-right labels
          if (v.label === "Begin here.") lx += 12;
          else if (v.label === "Follows the first.") lx -= 12;
          // Fine-tune newer Level 2 labels: push 'Mix, then end.' right
          // and 'After the second.' left for better alignment.
          else if (v.label === "Mix, then end.") lx += 16;
          else if (v.label === "After the second.") lx -= 16;
          else if (v.label === "Mix, then activate.") lx += 16;
          // Use centered alignment; choose vertical anchor per position
          if (v.label === "Nearly there.") {
            g.textAlign(CENTER, BOTTOM);
          } else {
            g.textAlign(CENTER, TOP);
          }
        }
        g.text(v.label, lx * DPR, ly * DPR);
      }
      g.pop();
      return g;
    };

    if (!this._recipeLabelGfx) this._recipeLabelGfx = makeRecipeLabelGfx();
    // If you want dynamic updates (e.g., locale changes) you'd recreate the gfx.
    // Draw the high-res labels onto the main canvas (scale-down by drawing at BASE size).
    imageMode(CORNER);
    image(this._recipeLabelGfx, 0, 0, BASE_WIDTH, BASE_HEIGHT);
    imageMode(CENTER);

    // If flashlight mode is active, mask the screen so only a circular area
    // around the cursor is visible (everything else black).
    if (this.flashlightActive && this.levelNumber === 3) {
      // Convert mouse to BASE coordinates (drawLevel applies scale/offset)
      const {
        scaleFactor: _sf,
        offsetX: _ox,
        offsetY: _oy,
      } = getScaleAndOffset();
      const mx = (mouseX - _ox) / _sf;
      const my = (mouseY - _oy) / _sf;
      const r = this.flashlightRadius;

      // Draw a radial gradient directly onto the main canvas to avoid
      // offscreen scaling/alignment issues. Gradient goes from transparent
      // center to opaque black at the edges for soft feathering.
      const ctx = drawingContext;
      ctx.save();
      // Determine overlay rectangle using same insets as the dialog overlay
      const od = this.overlayDebug || { left: 0, top: 0, right: 0, bottom: 0 };
      const ox = od.left || 0;
      const oy = od.top || 0;
      const ow = BASE_WIDTH - (od.left || 0) - (od.right || 0);
      const oh = BASE_HEIGHT - (od.top || 0) - (od.bottom || 0);

      // Clip drawing to the overlay rectangle so the gradient only covers that area
      ctx.beginPath();
      ctx.rect(ox, oy, ow, oh);
      ctx.clip();

      const inner = Math.max(2, r * 0.12);
      const outer = r;
      const grad = ctx.createRadialGradient(mx, my, inner, mx, my, outer);
      grad.addColorStop(0, "rgba(0,0,0,0)");
      grad.addColorStop(0.6, "rgba(0,0,0,0.6)");
      grad.addColorStop(1, "rgba(0,0,0,1)");
      ctx.fillStyle = grad;
      ctx.fillRect(ox, oy, ow, oh);
      ctx.restore();
    }

    // Draw close button on top so it remains visible above flashlight overlay
    this._drawRecipeBookCloseButton(bookLeft, bookTop, bookWidth);

    pop();
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
  const paused = !!levelInstance.levelResult || levelInstance.isPaused;
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

  // ---- New Item Overlay Button ----
  if (levelInstance.showNewItemOverlay) {
    const { x, y, w, h } = levelInstance.newItemButtonPos;
    // Button position {x, y, w, h} uses top-left corner positioning (from rectMode CORNER)
    if (
      adjustedX > x &&
      adjustedX < x + w &&
      adjustedY > y &&
      adjustedY < y + h
    ) {
      // Mark overlay as seen so it won't reappear or auto-advance later.
      window._seenNewItemOverlay = true;
      levelInstance.showNewItemOverlay = false;
      return;
    }
    // Block all clicks while overlay is showing
    return;
  }

  // Consider spoon 'active' when picked up and moved away from its base
  const spoonActive =
    levelInstance.spoonIsHeld &&
    Math.abs(
      (levelInstance.spoonDisplayX || 0) - (levelInstance.spoonBaseX || 0),
    ) > 1;

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
      // Reset mix / sequence state for a fresh attempt
      levelInstance.sequenceInvalid = false;
      levelInstance.addedIngredients = [];
      levelInstance.crystalAdded = false;
      levelInstance.mixAccumMs = 0;
      levelInstance.mixMeterComplete = false;
      levelInstance.mixSuccessShowFrame = null;
      levelInstance.mixStartedWhenAtMixStep = false;
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

  // ---- Spoon Click (moved early) ----
  // Skip spoon interactions on Level 1
  if (levelInstance.levelNumber !== 1) {
    // Use the current displayed spoon position when held, otherwise use base coords.
    const spoonDetectX =
      levelInstance.spoonIsHeld && levelInstance.spoonDisplayX
        ? levelInstance.spoonDisplayX
        : levelInstance.spoonX;
    const spoonDetectY =
      levelInstance.spoonY +
      (levelInstance.spoonLift || 0) +
      (typeof SPOON_HITBOX_Y_OFFSET !== "undefined"
        ? SPOON_HITBOX_Y_OFFSET
        : 0);
    // If the spoon is currently held, any click should drop it (user requested).
    if (levelInstance.spoonIsHeld) {
      // Drop spoon and reset tracking immediately regardless of click location
      levelInstance.spoonIsHeld = false;
      levelInstance.isActivelyStirring = false;
      levelInstance.holdNoMovementStartFrame = null;
      if (levelInstance.stirringSound && !levelInstance.stirringSound.paused) {
        levelInstance.stirringSound.pause();
        levelInstance.stirringSound.currentTime = 0;
      }
      // If player started mixing at the correct step but didn't finish,
      // mark the sequence invalid (partial mixes are not allowed).
      if (
        levelInstance.levelNumber === 2 &&
        levelInstance.mixStartedWhenAtMixStep &&
        !levelInstance.mixMeterComplete
      ) {
        const ingredientCount = (levelInstance.addedIngredients || []).length;
        if (ingredientCount === 4 || ingredientCount === 5) {
          levelInstance.sequenceInvalid = true;
        }
      }

      // Reset targets so spoon smoothly returns
      levelInstance.targetSpoonScale = 1.0;
      levelInstance.targetSpoonRotation = levelInstance.spoonBaseRotation;
      levelInstance.targetSpoonDisplayX = levelInstance.spoonBaseX;
      levelInstance.spoonMouseStartX = 0;
      levelInstance.spoonMouseStartY = 0;
      // Clear the mix-start flag
      levelInstance.mixStartedWhenAtMixStep = false;
      return;
    }

    if (spoonDetectX) {
      // Rotated-ellipse hit test using canvas Path2D to match the drawn ellipse exactly.
      const drawW =
        levelInstance.spoonWidth *
        (levelInstance.spoonScale || 1) *
        (typeof SPOON_HITBOX_WIDTH_SCALE !== "undefined"
          ? SPOON_HITBOX_WIDTH_SCALE
          : 1);
      const drawH =
        levelInstance.spoonHeight *
        (levelInstance.spoonScale || 1) *
        (typeof SPOON_HITBOX_HEIGHT_SCALE !== "undefined"
          ? SPOON_HITBOX_HEIGHT_SCALE
          : 1);
      const a = drawW / 2;
      const b = drawH / 2;
      // Create a Path2D ellipse centered at spoonDetectX, spoonDetectY with rotation
      try {
        // Use Path2D if available, but ensure we test using the same transform
        // as drawing: translate -> rotate -> scale. To avoid transform mismatch
        // issues, transform the click point into the spoon's local space
        // using the inverse transform and test against the unscaled ellipse.
        const dx = adjustedX - spoonDetectX;
        const dy = adjustedY - spoonDetectY;
        const r = levelInstance.spoonRotation || 0; // radians
        const s = levelInstance.spoonScale || 1;
        const cosR = Math.cos(r);
        const sinR = Math.sin(r);
        // Apply inverse rotation (-r) then inverse scale (divide by s)
        const lx = (dx * cosR + dy * sinR) / s;
        const ly = (-dx * sinR + dy * cosR) / s;
        // Use unscaled semi-axes (based on original image size)
        const aUnscaled =
          (levelInstance.spoonWidth / 2) *
          (typeof SPOON_HITBOX_WIDTH_SCALE !== "undefined"
            ? SPOON_HITBOX_WIDTH_SCALE
            : 1);
        const bUnscaled =
          (levelInstance.spoonHeight / 2) *
          (typeof SPOON_HITBOX_HEIGHT_SCALE !== "undefined"
            ? SPOON_HITBOX_HEIGHT_SCALE
            : 1);
        const insideEllipseMath =
          aUnscaled > 0 &&
          bUnscaled > 0 &&
          (lx * lx) / (aUnscaled * aUnscaled) +
            (ly * ly) / (bUnscaled * bUnscaled) <=
            1;
        if (insideEllipseMath) {
          // Prevent picking up the spoon while any vial/crystal is being
          // interacted with (held or in motion).
          const anyVialInteracting = levelInstance.vials.some(
            (v) => v.isHeld || v.isMoving,
          );
          if (!anyVialInteracting) {
            levelInstance.spoonIsHeld = true;
            levelInstance.spoonMouseStartX = 0;
            levelInstance.spoonMouseStartY = 0;
            // Record if player starts holding spoon at Level 2 when the
            // sequence has reached the fourth added ingredient (mix step)
            // so we can allow a partial mix as a valid non-mix.
            if (
              levelInstance.levelNumber === 2 &&
              ((levelInstance.addedIngredients || []).length === 4 ||
                (levelInstance.addedIngredients || []).length === 5)
            ) {
              levelInstance.mixStartedWhenAtMixStep = true;
            }
            return;
          }
          // Otherwise, ignore the spoon pickup so click can fall through
          // to vial interactions below.
        }
      } catch (e) {
        // If Path2D/ellipse not supported, fall back to math test
        const dx = adjustedX - spoonDetectX;
        const dy = adjustedY - spoonDetectY;
        const r = levelInstance.spoonRotation || 0;
        const cosR = Math.cos(r);
        const sinR = Math.sin(r);
        const lx = dx * cosR + dy * sinR;
        const ly = -dx * sinR + dy * cosR;
        const aScaled =
          (a || 0) *
          (typeof SPOON_HITBOX_WIDTH_SCALE !== "undefined"
            ? SPOON_HITBOX_WIDTH_SCALE
            : 1);
        const bScaled =
          (b || 0) *
          (typeof SPOON_HITBOX_HEIGHT_SCALE !== "undefined"
            ? SPOON_HITBOX_HEIGHT_SCALE
            : 1);
        const insideEllipse =
          aScaled > 0 &&
          bScaled > 0 &&
          (lx * lx) / (aScaled * aScaled) + (ly * ly) / (bScaled * bScaled) <=
            1;
        if (insideEllipse) {
          // Prevent picking up the spoon while any vial/crystal is being
          // interacted with (held or in motion). If a vial is interacting,
          // allow the click to continue to vial handlers below.
          const anyVialInteracting = levelInstance.vials.some(
            (v) => v.isHeld || v.isMoving,
          );
          if (!anyVialInteracting) {
            levelInstance.spoonIsHeld = true;
            levelInstance.spoonMouseStartX = 0;
            levelInstance.spoonMouseStartY = 0;
            if (
              levelInstance.levelNumber === 2 &&
              ((levelInstance.addedIngredients || []).length === 4 ||
                (levelInstance.addedIngredients || []).length === 5)
            ) {
              levelInstance.mixStartedWhenAtMixStep = true;
            }
            return;
          }
        }
      }
    }
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
    // Use appropriate hitbox detection based on vial type
    const isPointInHitbox = vial.isCrystal
      ? levelInstance._isPointInCrystalHitbox(adjustedX, adjustedY, vial)
      : levelInstance._isPointInVialHitbox(adjustedX, adjustedY, vial);

    if (!vial.used && !vial.isMoving && isPointInHitbox) {
      vial.isSelected = true;
      vial.isHeld = true;
      // swap to open asset and slightly enlarge while held
      vial.img = vial.openImg || vial.closedImg;
      vial.targetScale = vial.isCrystal ? 1.18 : 1.08;

      // Level 1 first-vial tutorial removed

      // Play glass cling sound for all vials
      const glassSound = document.getElementById("glass-cling-sound");
      if (glassSound) {
        glassSound.currentTime = 0; // reset to start
        glassSound.volume = 0.5; // 50% volume
        glassSound.loop = false; // play once
        glassSound.play().catch(() => {});
      }

      // Play crystal shine sound when picking up the crystal (at 55% volume)
      if (vial.isCrystal) {
        const crystalSound = document.getElementById("crystal-shine-sound");
        if (crystalSound) {
          crystalSound.currentTime = 0; // reset to start
          crystalSound.volume = 0.55; // 55% volume
          crystalSound.loop = false; // play once
          crystalSound.play().catch(() => {});
        }
      }
    } else {
      vial.isSelected = false;
    }
  });

  // ---- Envelope Icon Click ----
  // Skip envelope clicking if recipe is open (close button takes priority)
  // or if intro modal is showing ("Very Well" button takes priority)
  if (!levelInstance.isRecipeOpen && !levelInstance.showRecipeIntro) {
    const env = layout.envelope;
    const envHeight =
      (levelInstance.assets.envelopeImg.height /
        levelInstance.assets.envelopeImg.width) *
      env.w;

    // Help button click handling (rounded square left of envelope)
    const helpBtnSize = 40;
    const helpBtnGap = 8;
    const helpBtnExtraLeft = 28; // Updated position (nudged right 4px from 32)
    const helpBtnX =
      env.x - env.w / 2 - helpBtnSize / 2 - helpBtnGap - helpBtnExtraLeft;
    const helpBtnY = env.y;
    if (
      adjustedX > helpBtnX - helpBtnSize / 2 &&
      adjustedX < helpBtnX + helpBtnSize / 2 &&
      adjustedY > helpBtnY - helpBtnSize / 2 &&
      adjustedY < helpBtnY + helpBtnSize / 2
    ) {
      // Open instructions from help button: pause game and set flag
      instrOpenedFromHelp = true;
      previousScreenBeforeHelp = currentScreen;
      if (levelInstance) {
        levelInstance.isPaused = true;
        levelInstance._helpPauseStart = millis();
      }
      currentScreen = "instr";
      return;
    }
    if (
      !spoonActive &&
      adjustedX > env.x - env.w / 2 &&
      adjustedX < env.x + env.w / 2 &&
      adjustedY > env.y - envHeight / 2 &&
      adjustedY < env.y + envHeight / 2
    ) {
      levelInstance.isOrderOpen = true;

      // Play paper sound when envelope is clicked
      // Play page-flip sound when envelope is clicked
      const pageFlipSound = document.getElementById("page-flip-sound");
      if (pageFlipSound) {
        pageFlipSound.currentTime = 0; // reset to start
        pageFlipSound.volume = 1.0; // full volume
        pageFlipSound.loop = false; // play once
        pageFlipSound.play().catch(() => {});
      }

      // Envelope click behaviour: open order panel (tutorial removed)

      return;
    }
  }

  // If intro modal is visible, handle its button click (block all other clicks)
  if (levelInstance.showRecipeIntro) {
    const b = levelInstance._recipeIntroBtn;
    if (b) {
      if (
        adjustedX > b.x &&
        adjustedX < b.x + b.w &&
        adjustedY > b.y &&
        adjustedY < b.y + b.h
      ) {
        levelInstance.showRecipeIntro = false;
        levelInstance.isRecipeOpen = true; // now show the actual recipe
        // Unlock and enable flashlight only for Level 3 (persist across opens)
        if (levelInstance.levelNumber === 3) {
          levelInstance.flashlightUnlocked = true;
          levelInstance.flashlightActive = true;
          // Use a slightly smaller flashlight radius for post-unlock experience
          levelInstance.flashlightRadius = 70;
        }
        return;
      }
    }
    return;
  }

  // ---- Recipe Book Close Button ----
  if (levelInstance.isRecipeOpen) {
    const openBook = levelInstance.assets.recipeBookOpen;
    const bookWidth = 600;
    const bookHeight = (openBook.height / openBook.width) * bookWidth;
    const bookLeft = BASE_WIDTH / 2 - bookWidth / 2;
    const bookTop = BASE_HEIGHT / 2 - bookHeight / 2;

    // Use the same position calculation as the draw function
    const { btnX, btnY, btnSize } = levelInstance._getRecipeCloseButtonPos(
      bookLeft,
      bookTop,
      bookWidth,
    );

    // Convert mouse to BASE coordinates
    const adjustedBtnX = (mouseX - offsetX) / scaleFactor;
    const adjustedBtnY = (mouseY - offsetY) / scaleFactor;

    // Check if click is within button bounds (in BASE coords)
    if (
      adjustedBtnX > btnX - btnSize / 2 &&
      adjustedBtnX < btnX + btnSize / 2 &&
      adjustedBtnY > btnY - btnSize / 2 &&
      adjustedBtnY < btnY + btnSize / 2
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
    !spoonActive &&
    adjustedX > r.x - r.w / 2 &&
    adjustedX < r.x + r.w / 2 &&
    adjustedY > r.y - rHeight / 2 &&
    adjustedY < r.y + rHeight / 2
  ) {
    // If Level 3 and the order has started, show the intro modal the first
    // time the player opens the recipe book.
    if (
      levelInstance.levelNumber === 3 &&
      levelInstance.orderStarted &&
      !levelInstance.recipeIntroShown
    ) {
      levelInstance.showRecipeIntro = true;
      levelInstance.recipeIntroShown = true;
      return;
    }

    levelInstance.isRecipeOpen = true;
    // Play paper sound when recipe is opened
    const paperSound = document.getElementById("paper-sound");
    if (paperSound) {
      paperSound.currentTime = 0; // reset to start
      paperSound.volume = 1.0; // full volume
      paperSound.loop = false; // play once
      paperSound.play().catch(() => {});
    }
    // If the player previously unlocked the flashlight (pressed "Very well."),
    // enable it automatically when opening the recipe on Level 3.
    if (levelInstance.levelNumber === 3 && levelInstance.flashlightUnlocked) {
      levelInstance.flashlightActive = true;
      // Ensure the unlocked flashlight uses the smaller radius
      levelInstance.flashlightRadius = 70;
    }
    return;
  }
}

function levelMouseWheel(e) {
  if (!levelInstance || !levelInstance.isOrderOpen) return;

  // Only allow scrolling on Level 2
  if (levelInstance.levelNumber !== 2) return;

  // Scroll sensitivity
  const scrollSpeed = 10;
  levelInstance.orderScrollOffset += e.deltaY > 0 ? scrollSpeed : -scrollSpeed;

  e.preventDefault();
}

function levelKeyPressed() {
  // Escape is handled globally in main.js
  if (!levelInstance) return;
  // Debug shortcut: press '3' to jump to Level 3
  if (typeof key !== "undefined" && key === "3") {
    currentLevelNumber = 3;
    createLevelInstance();
    currentScreen = "level";
    return;
  }

  // Debug: press 'T' to toggle flashlight overlay on Level 3 recipe
  if (key === "t" || key === "T") {
    if (levelInstance.levelNumber === 3 && levelInstance.isRecipeOpen) {
      levelInstance.flashlightActive = !levelInstance.flashlightActive;
      return;
    }
  }

  // No other interactive overlay debug controls
}
