// -----------------------------------------
// LEVEL 1 — Basic Structure + Interactivity
// -----------------------------------------

const BASE_WIDTH = 1152;
const BASE_HEIGHT = 648;

// Layout (easy to tweak later)
const layout = {
  cauldron: { x: 576, y: 480, w: 300 },
  recipeBook: { x: 190, y: 530, w: 100 },
  crystal: { x: 900, y: 455, w: 36 },
  orderSheet: { x: 970, y: 150, w: 150 },
  bowl: { x: 900, y: 500, w: 140 },
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

    // Bottles
    this.bottles = [];
    const bottleImages = [
      assets.bottleGreen,
      assets.bottleRed,
      assets.bottleBlue,
      assets.bottleOrange,
      assets.bottlePink,
    ];

    const maxPerRow = 3; // max bottles per row
    bottleImages.forEach((img, i) => {
      const bottleWidth = layout.shelf.bottleWidth;
      const bottleHeight = (img.height / img.width) * bottleWidth;

      const row = Math.floor(i / maxPerRow);
      const col = i % maxPerRow;

      const x = layout.shelf.x + col * layout.shelf.spacing;
      const y = layout.shelf.y + row * (bottleHeight + 20);

      this.bottles.push({
        img,
        x,
        y,
        startX: x,
        startY: y,
        isSelected: false,
        isMoving: false,
        progress: 0,
      });
    });

    // Add the crystal as a special "bottle"
    const cr = layout.crystal;
    const crystalWidth = cr.w;
    const crystalHeight =
      (assets.crystalImg.height / assets.crystalImg.width) * crystalWidth;
    this.bottles.push({
      img: assets.crystalImg,
      x: cr.x,
      y: cr.y,
      startX: cr.x,
      startY: cr.y,
      isSelected: false,
      isMoving: false,
      progress: 0,
      isCrystal: true, // flag to treat differently in animation
    });

    this.selectedBottle = null;
    this.isRecipeOpen = false;
    this.isOrderOpen = false;
    this.hasUnreadOrder = true;
    this.envelopeScale = 1;

    // --- SEQUENCE TRACKING ---
    this.addedIngredients = [];
    this.correctOrder = [
      assets.bottleGreen,
      assets.bottleBlue,
      assets.bottleOrange,
    ];
    this.levelResult = null; // "CORRECT" or "WRONG"
    this.crystalAdded = false; // Track whether the crystal has been added to cauldron
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

    // ---- ORDER SHEET ----
    const o = layout.orderSheet;
    const oHeight =
      (this.assets.orderSheet.height / this.assets.orderSheet.width) * o.w;
    image(this.assets.orderSheet, o.x, o.y, o.w, oHeight);

    // ---- ORDER TEXT ----
    push();
    textAlign(LEFT, TOP);
    textSize(15);
    fill(0);
    noStroke();
    const textPaddingX = -o.w / 2 + 20;
    const textPaddingY = -oHeight / 2 + 40;
    text(
      "Order\n\nCustomer:\nLord Alistair\n\nPotion:\nBeginner's Luck",
      o.x + textPaddingX,
      o.y + textPaddingY,
    );
    pop();

    // ---- BOWL ----
    const b = layout.bowl;
    const bHeight =
      (this.assets.bowlImg.height / this.assets.bowlImg.width) * b.w;
    image(this.assets.bowlImg, b.x, b.y, b.w, bHeight);

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

    // ---- RECIPE BOOK ----
    const r = layout.recipeBook;
    const rHeight =
      (this.assets.recipeBookClosed.height /
        this.assets.recipeBookClosed.width) *
      r.w;

    if (this.isRecipeOpen) {
      push();
      fill(0, 150);
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
      push();
      rectMode(CENTER);
      fill(255, 0, 0);
      noStroke();
      rect(btnX, btnY, btnSize, btnSize, 5);
      fill(255);
      textAlign(CENTER, CENTER);
      textSize(16);
      text("X", btnX, btnY);
      pop();

      return;
    }

    // Draw closed book
    image(this.assets.recipeBookClosed, r.x, r.y, r.w, rHeight);

    // ---- Bottles ----
    this.bottles.forEach((b) => {
      if (b.isMoving) {
        const speed = b.isCrystal ? (b.progress < 0.6 ? 0.012 : 0.008) : 0.02;
        b.progress += speed;

        if (b.isCrystal) {
          const targetX = layout.cauldron.x;
          const cauldronHeight =
            (this.assets.cauldronImg.height / this.assets.cauldronImg.width) *
            layout.cauldron.w;
          const pauseY = layout.cauldron.y - cauldronHeight / 2 - 90;
          const finalY = layout.cauldron.y + cauldronHeight / 4;

          if (b.progress < 0.6) {
            const t = b.progress / 0.6;
            b.x = lerp(b.startX, targetX, t);
            b.y = lerp(b.startY, pauseY, t);
          } else if (b.progress < 1) {
            const t = (b.progress - 0.6) / 0.4;
            b.x = targetX;
            b.y = lerp(pauseY, finalY, t);
          } else {
            b.isMoving = false;
            b.isSelected = false;
            b.progress = 0;
            b.x = targetX;
            b.y = finalY;
            b.used = true;
            this.crystalAdded = true;

            this.checkSequence();
          }
        } else {
          const targetX = layout.cauldron.x - 20;
          const targetY = layout.cauldron.y - 160;

          if (b.progress < 1) {
            b.x = lerp(b.startX, targetX, b.progress);
            b.y = lerp(b.startY, targetY, b.progress);
          } else if (b.progress < 1.5) {
            b.x = targetX;
            b.y = targetY;
            if (!this.addedIngredients.includes(b.img)) {
              this.addedIngredients.push(b.img);
              console.log("Added ingredient:", b.img);
            }
          } else if (b.progress < 2.5) {
            const back = b.progress - 1.5;
            b.x = lerp(targetX, b.startX, back);
            b.y = lerp(targetY, b.startY, back);
          } else {
            b.isMoving = false;
            b.isSelected = false;
            b.progress = 0;
            b.x = b.startX;
            b.y = b.startY;
          }
        }
      }

      // ---- Draw bottle ----

      // Skip crystal during drop phase — already drawn behind cauldron above
      if (b.isCrystal && !b.used && b.isMoving && b.progress >= 0.6) return;

      // Don't draw crystal once it's fully inside the cauldron
      if (b.isCrystal && b.used) return;

      const bottleWidth = b.isCrystal
        ? layout.crystal.w
        : layout.shelf.bottleWidth;
      const bottleHeight = (b.img.height / b.img.width) * bottleWidth;

      push();
      translate(b.x, b.y);

      let angle = 0;
      if (!b.isCrystal && b.isMoving && b.progress >= 0.5 && b.progress < 2) {
        angle = PI / 2.5;
      }

      rotate(angle);

      if (b.isSelected) {
        noFill();
        stroke(255);
        strokeWeight(2);
        rectMode(CENTER);
        rect(0, 0, bottleWidth + 10, bottleHeight + 10, 8);
      }

      noStroke();
      image(b.img, 0, 0, bottleWidth, bottleHeight);
      pop();
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
    const scaleFactor = min(width / BASE_WIDTH, height / BASE_HEIGHT);
    const offsetX = (width - BASE_WIDTH * scaleFactor) / 2;
    const offsetY = (height - BASE_HEIGHT * scaleFactor) / 2;
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

      // Pulsing ring effect behind the badge
      const pulse = (sin(frameCount * 0.05) + 1) / 2; // 0 to 1
      const ringRadius = 14 + pulse * 10; // 14 to 24
      const ringAlpha = 150 * (1 - pulse); // 150 to 0
      fill(208, 0, 0, ringAlpha);
      noStroke();
      ellipse(badgeX, badgeY, ringRadius * 2, ringRadius * 2);

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
      push();
      fill(0, 150);
      rectMode(CORNER);
      rect(0, 0, BASE_WIDTH, BASE_HEIGHT);
      pop();

      // Draw order card
      const cardWidth = 400;
      const cardHeight = 500;
      push();
      rectMode(CENTER);
      fill(245, 235, 220);
      stroke(139, 90, 43);
      strokeWeight(3);
      rect(BASE_WIDTH / 2, BASE_HEIGHT / 2, cardWidth, cardHeight, 15);
      pop();

      const cardLeft = BASE_WIDTH / 2 - cardWidth / 2;
      const cardTop = BASE_HEIGHT / 2 - cardHeight / 2;

      // Order content
      push();
      textAlign(LEFT, TOP);
      textSize(24);
      textStyle(BOLD);
      fill(60, 30, 10);
      text("Order", cardLeft + 30, cardTop + 30);

      textStyle(NORMAL);
      textSize(16);
      let textY = cardTop + 80;
      const lineHeight = 28;

      text("Customer:", cardLeft + 30, textY);
      textStyle(BOLD);
      text("Lord Alistair", cardLeft + 120, textY);
      textStyle(NORMAL);
      textY += lineHeight * 1.5;

      text("Potion:", cardLeft + 30, textY);
      textStyle(BOLD);
      text("Beginner's Luck", cardLeft + 100, textY);
      textStyle(NORMAL);
      textY += lineHeight * 2;

      text("Description:", cardLeft + 30, textY);
      textY += lineHeight;
      textSize(14);
      text("A simple potion to help with fortune", cardLeft + 30, textY);
      textY += lineHeight * 0.8;
      text("and bring good luck to the drinker.", cardLeft + 30, textY);
      pop();

      // Close button
      const btnSize = 30;
      const btnX = cardLeft + cardWidth - btnSize / 2;
      const btnY = cardTop + btnSize / 2;
      push();
      rectMode(CENTER);
      fill(255, 0, 0);
      noStroke();
      rect(btnX, btnY, btnSize, btnSize, 5);
      fill(255);
      textAlign(CENTER, CENTER);
      textSize(16);
      text("X", btnX, btnY);
      pop();

      return;
    }
  }

  selectBottle(mx, my) {
    this.bottles.forEach((b) => {
      const w = layout.shelf.bottleWidth;
      const h = (b.img.height / b.img.width) * w;

      if (
        !b.used &&
        mx > b.x - w / 2 &&
        mx < b.x + w / 2 &&
        my > b.y - h / 2 &&
        my < b.y + h / 2
      ) {
        this.selectedBottle = b;
        b.isSelected = true;
      } else {
        b.isSelected = false;
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

  const scaleFactor = min(width / BASE_WIDTH, height / BASE_HEIGHT);
  const offsetX = (width - BASE_WIDTH * scaleFactor) / 2;
  const offsetY = (height - BASE_HEIGHT * scaleFactor) / 2;

  push();
  translate(offsetX, offsetY);
  scale(scaleFactor);
  levelInstance.draw();
  pop();
}

function levelMousePressed() {
  if (!levelInstance) return;

  const scaleFactor = min(width / BASE_WIDTH, height / BASE_HEIGHT);
  const offsetX = (width - BASE_WIDTH * scaleFactor) / 2;
  const offsetY = (height - BASE_HEIGHT * scaleFactor) / 2;

  const adjustedX = (mouseX - offsetX) / scaleFactor;
  const adjustedY = (mouseY - offsetY) / scaleFactor;

  levelInstance.selectBottle(adjustedX, adjustedY);

  // ---- CAULDRON CLICK ----
  const c = layout.cauldron;
  const cWidth = c.w;
  const cHeight =
    (levelInstance.assets.cauldronImg.height /
      levelInstance.assets.cauldronImg.width) *
    c.w;
  if (
    adjustedX > c.x - cWidth / 2 &&
    adjustedX < c.x + cWidth / 2 &&
    adjustedY > c.y - cHeight / 2 &&
    adjustedY < c.y + cHeight / 2
  ) {
    levelInstance.pourSelectedBottle();
  }

  // ---- Order Overlay Close Button ----
  if (levelInstance.isOrderOpen) {
    const cardWidth = 400;
    const cardHeight = 500;
    const cardLeft = BASE_WIDTH / 2 - cardWidth / 2;
    const cardTop = BASE_HEIGHT / 2 - cardHeight / 2;

    const btnSize = 30;
    const btnX = cardLeft + cardWidth - btnSize / 2;
    const btnY = cardTop + btnSize / 2;

    if (
      adjustedX > btnX - btnSize / 2 &&
      adjustedX < btnX + btnSize / 2 &&
      adjustedY > btnY - btnSize / 2 &&
      adjustedY < btnY + btnSize / 2
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
    levelInstance.hasUnreadOrder = false;
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
