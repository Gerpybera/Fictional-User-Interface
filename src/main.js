import Health from "./health";

let ctx; // Declare ctx in global scope
let canvas;

let ctx2;
let canvas2;

let ctx3;
let canvas3;

let healths = []; // Store health instances
let isButtonPressed = false;
let warningActive = false; // Track if warning is currently showing
let hasWarningShown = false; // Track if warning has been shown before
let lastDangerCount = 0; // Track previous danger count to detect changes
let isPaused = false; // Track if health bars are paused
let terminationTimer = null; // Timer when all healths are in danger
let terminated = false; // Permanent termination state

let alphaText = 1.0; // For fade effects
let warningAnimating = false;
let currentWarningLevel = null; // "warning" | "critical" | null

//variable to manage glowing effect
const glowBase = 10;

// Performance optimization variables
let lastResizeTime = 0;
const RESIZE_DEBOUNCE = 150; // ms
let cachedGlowValue = glowBase;
let glowUpdateCounter = 0;
const GLOW_UPDATE_FREQUENCY = 3; // Update glow every N frames

//Audio parts

const warningLoop = new Audio("computer-malfunction.wav");
warningLoop.preload = "auto";

const criticalAlarm = new Audio("life-functions-critical.wav");
criticalAlarm.preload = "auto";

// Health bar configuration data
/*
const healthConfigs = [
  { color: "cyan", textUp: "CARDIO", textUn: "VASCULAR" },
  { color: "green", textUp: "METABOLIC", textUn: "LEVELS" },
  { color: "Aquamarine", textUp: "CENTRAL", textUn: "NERV. SYSTEM" },
  { color: "CornflowerBlue", textUp: "PULMONARY", textUn: "FUNCTION" },
  { color: "green", textUp: "SYSTEM", textUn: "INTEGRATION" },
  { color: "Olive", textUp: "LOCOMOTOR", textUn: "SYSTEM" },
];
*/
const healthConfigs = [
  { color: "#2B97A4", textUp: "CARDIO", textUn: "VASCULAR", speed: 0.2 },
  { color: "#1D6E2C", textUp: "METABOLIC", textUn: "LEVELS", speed: 1.2 },
  { color: "#2FA783", textUp: "CENTRAL", textUn: "NERV. SYSTEM", speed: 0.8 },
  { color: "#5584B1", textUp: "PULMONARY", textUn: "FUNCTION", speed: 0.4 },
  { color: "#47ACCA", textUp: "SYSTEM", textUn: "INTEGRATION", speed: 1.2 },
  { color: "#3D4523", textUp: "LOCOMOTOR", textUn: "SYSTEM", speed: 1.4 },
];

window.onload = () => {
  if (!criticalAlarm.readyState || !warningLoop.readyState) return;
  CreateMainMenu();
};
//Create Main Menu
let switchColor = false;
let mainMenuInterval = null; // Store interval ID to clear it later

function CreateMainMenu() {
  // Clear any existing interval to prevent stacking
  if (mainMenuInterval) {
    clearInterval(mainMenuInterval);
    mainMenuInterval = null;
  }

  canvas2 = document.createElement("canvas");
  canvas2.id = "canvas2";
  canvas2.width = window.innerWidth;
  canvas2.height = window.innerHeight;
  canvas2.style.willChange = "transform"; // GPU acceleration hint
  document.body.appendChild(canvas2);
  ctx2 = canvas2.getContext("2d", { alpha: false }); // Disable alpha for performance
  mainMenuInterval = setInterval(() => {
    switchColor = !switchColor;
  }, 500);
  drawMainMenu();
}
function drawMainMenu() {
  ctx2.fillStyle = "black";
  ctx2.fillRect(0, 0, canvas2.width, canvas2.height);

  let titleSizeX = canvas2.width;
  let titleSizeY = canvas2.height;
  let fontColor = "white";
  let titleFontSize = Math.min(canvas2.width, canvas2.height) * 0.08;

  createButton(
    canvas2.width / 2 - titleSizeX / 2,
    canvas2.height / 2 - titleSizeY / 2,
    titleSizeX,
    titleSizeY
  );
  requestAnimationFrame(drawMainMenu);
}
function createButton(x, y, width, height) {
  ctx2.fillStyle = switchColor ? "green" : "#A00012";
  ctx2.lineWidth = 5;
  ctx2.fillRect(x, y, width, height);

  const fontSize = Math.min(canvas2.width, canvas2.height) * 0.2;
  ctx2.font = `${fontSize}px Eurostile_Cond_Heavy`;
  ctx2.textAlign = "center";
  ctx2.textBaseline = "middle";

  // --- OPTIMIZED GLOW (update less frequently) ---
  glowUpdateCounter++;
  if (glowUpdateCounter >= GLOW_UPDATE_FREQUENCY) {
    const t = performance.now() / 200;
    const flicker = 0.6 + 0.4 * Math.sin(t);
    cachedGlowValue = glowBase * flicker;
    glowUpdateCounter = 0;
  }

  // Reduced shadow blur for better mobile performance
  ctx2.shadowColor = "rgba(255, 255, 255, 0.9)";
  ctx2.shadowBlur = cachedGlowValue * 0.7; // Reduced intensity
  ctx2.shadowOffsetX = 0;
  ctx2.shadowOffsetY = 0;

  ctx2.fillStyle = "white";

  const centerX = x + width / 2;
  const centerY = y + height / 2;
  const lineSpacing = fontSize * 0.1; // distance between lines

  // Top line: LIFE FUNCTION
  ctx2.textBaseline = "bottom";
  ctx2.fillText("LIFE FUNCTION", centerX, centerY - lineSpacing / 2);

  // Bottom line: SIMULATION
  ctx2.textBaseline = "top";
  ctx2.fillText("SIMULATION", centerX, centerY + lineSpacing / 2);

  // Optional: reset shadow if you draw other things later with ctx2
  ctx2.shadowBlur = 0;

  // Button press handling stays the same
  function handleButtonPress(clientX, clientY) {
    if (
      clientX >= x &&
      clientX <= x + width &&
      clientY >= y &&
      clientY <= y + height
    ) {
      warningLoop.muted = true;
      warningLoop
        .play()
        .then(() => {
          warningLoop.pause();
          warningLoop.muted = false;
        })
        .catch((e) => console.warn("Warning audio unlock failed", e));

      criticalAlarm.muted = true;
      criticalAlarm
        .play()
        .then(() => {
          criticalAlarm.pause();
          criticalAlarm.muted = false;
        })
        .catch((e) => console.warn("Critical audio unlock failed", e));

      isButtonPressed = true;
      document.body.removeChild(canvas2);
      InitializeHealth();
    }
  }

  canvas2.addEventListener("mousedown", (e) => {
    handleButtonPress(e.clientX, e.clientY);
  });

  canvas2.addEventListener("touchend", (e) => {
    if (e.changedTouches.length > 0) {
      const touch = e.changedTouches[0];
      handleButtonPress(touch.clientX, touch.clientY);
    }
  });
}

//Creating Health Bars

function InitializeHealth() {
  canvas = document.createElement("canvas");
  canvas.id = "canvas";
  canvas.style.willChange = "transform"; // GPU acceleration hint
  document.body.appendChild(canvas);
  ctx = canvas.getContext("2d", { alpha: false }); // Disable alpha for performance

  // Initial resize and create health bars
  resizeCanvas();

  // Setup resize listener with throttling for better performance
  window.addEventListener("resize", () => {
    const now = Date.now();
    if (now - lastResizeTime > RESIZE_DEBOUNCE) {
      lastResizeTime = now;
      resizeCanvas();
    }
  });

  // Setup global event listeners
  setupEventListeners();
  draw();
}

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  // Recreate health bars with new positions
  createHealthBars();
}

function createHealthBars() {
  // Preserve isDanger state from existing health bars
  const dangerStates = healths.map((h) => h.isDanger);

  healths = [];

  const numBars = healthConfigs.length;

  // Calculate dimensions based on canvas size
  const barHeight = canvas.height * 0.1;
  const gap = canvas.height * 0.02; // 2% of canvas height as gap between bars
  const spacing = barHeight + gap;

  // Calculate total height of all bars including gaps
  const totalHeight = numBars * barHeight + (numBars - 1) * gap;

  // Center vertically: start Y so that the group is centered
  const startY = (canvas.height - totalHeight) / 2;

  // Calculate total width of a health bar:
  // panelWidth (canvas.width/6) + 10 grid squares (each is (barHeight/4) * 5)
  const panelWidth = canvas.width * 0.15;
  const gridSquareWidth = (barHeight / 4) * 5;
  const totalBarWidth = panelWidth + 10 * gridSquareWidth;

  // X position: center horizontally
  const posX = (canvas.width - totalBarWidth) / 2;

  // Create health bars
  healthConfigs.forEach((config, index) => {
    const y = startY + index * spacing;
    const health = new Health(
      posX,
      y,
      ctx,
      config.color,
      config.textUp,
      config.textUn,
      index + 1,
      config.speed
    );

    // Restore isDanger state if it existed
    if (dangerStates[index] !== undefined) {
      health.isDanger = dangerStates[index];
    }

    healths.push(health);
  });
}

function draw() {
  // Check for danger condition (2 or more in danger mode) FIRST
  checkDangerCondition();

  background("black");

  // Just call draw on existing instances, pass isPaused state
  healths.forEach((health) => health.draw(isPaused));

  requestAnimationFrame(draw);
}
function background(color) {
  const canvas = document.getElementById("canvas");
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = color || "#A00012";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function setupEventListeners() {
  // Mouse move for hover detection (desktop)
  window.addEventListener("mousemove", (e) => {
    handleHover(e.clientX, e.clientY);
  });

  // Touch move for hover detection (mobile/tablet)
  window.addEventListener(
    "touchmove",
    (e) => {
      if (e.touches.length > 0) {
        handleHover(e.touches[0].clientX, e.touches[0].clientY);
      }
    },
    { passive: true }
  );

  // Click interaction (desktop)
  window.addEventListener("click", (e) => {
    handleInteraction(e.clientX, e.clientY);
  });

  // Touch interaction (mobile/tablet)
  window.addEventListener("touchend", (e) => {
    if (e.changedTouches.length > 0) {
      const touch = e.changedTouches[0];
      handleInteraction(touch.clientX, touch.clientY);
    }
  });

  // Prevent double-tap zoom on mobile
  window.addEventListener(
    "touchstart",
    (e) => {
      if (e.touches.length > 1) {
        e.preventDefault();
      }
    },
    { passive: false }
  );
}

function handleHover(x, y) {
  if (terminated || isPaused) return; // no hover when paused/terminated
  let isHoveringAny = false;

  healths.forEach((health) => {
    if (
      x >= health.x &&
      x <= health.x + health.width &&
      y >= health.y &&
      y <= health.y + health.height
    ) {
      health.isHover = true;
      isHoveringAny = true;
    } else {
      health.isHover = false;
    }
  });

  document.body.style.cursor = isHoveringAny ? "pointer" : "default";
}

function handleInteraction(x, y) {
  if (terminated || isPaused) return; // disable interaction when terminated or paused
  healths.forEach((health) => {
    if (
      x >= health.x &&
      x <= health.x + health.width &&
      y >= health.y &&
      y <= health.y + health.height
    ) {
      if (isPaused) return; // Ignore interaction if paused
      if (health.isDanger) {
        health.isDanger = !health.isDanger;
        //console.log("Interacted! isDanger:", health.isDanger);
      }
    }
  });
}

//Create Warning System

function checkDangerCondition() {
  const dangerCount = healths.filter((health) => health.isDanger).length;

  // Show critical warning when 4 or more are in danger
  if (
    dangerCount >= 4 &&
    !warningActive &&
    dangerCount !== lastDangerCount &&
    !isShowingCriticalWarning &&
    !terminated
  ) {
    showWarning("critical");
    isShowingCriticalWarning = true;
  }
  // Show warning when 2-4 are in danger (but NOT if already in critical mode)
  else if (
    dangerCount >= 2 &&
    dangerCount < 4 &&
    !warningActive &&
    !hasWarningShown &&
    dangerCount !== lastDangerCount &&
    !isShowingCriticalWarning &&
    !isInCriticalMode &&
    !terminated
  ) {
    showWarning("warning");
    hasWarningShown = true;
  }

  lastDangerCount = dangerCount;
  if (dangerCount < 1) {
    hasWarningShown = false; // Reset once danger count drops below 2
    stopAllSounds(); // Stop all sounds if no health is in danger
  }
  if (dangerCount < 4) {
    isShowingCriticalWarning = false; // Reset when dropping below critical threshold
    isInCriticalMode = false; // Allow warning mode to trigger again
  }

  // Termination logic: all healths in danger -> start 3s timer
  if (!terminated && dangerCount === healths.length && healths.length > 0) {
    if (!terminationTimer) {
      terminationTimer = setTimeout(() => {
        // Still all in danger? Double-check
        const stillAllDanger = healths.every((h) => h.isDanger);
        if (stillAllDanger) {
          terminate();
        }
        terminationTimer = null;
      }, 3000); // 3 seconds
    }
  } else {
    if (terminationTimer) {
      clearTimeout(terminationTimer);
      terminationTimer = null;
    }
  }
}

function showWarning(level) {
  if (terminated) return;

  const dangerCount2 = healths.filter((health) => health.isDanger).length;

  // always update the current level
  currentWarningLevel = level;

  // if no canvas yet, create it
  if (!canvas3) {
    canvas3 = document.createElement("canvas");
    canvas3.id = "canvas3";
    canvas3.width = window.innerWidth;
    canvas3.height = window.innerHeight;
    canvas3.style.position = "absolute";
    canvas3.style.top = "0";
    canvas3.style.left = "0";
    canvas3.style.pointerEvents = "none";
    canvas3.style.willChange = "transform";
    canvas3.style.imageRendering = "crisp-edges"; // Disable anti-aliasing
    document.body.appendChild(canvas3);
    ctx3 = canvas3.getContext("2d", {
      alpha: false,
      desynchronized: true, // Better performance on tablets
    });
    // Disable font smoothing to prevent ghosting
    ctx3.imageSmoothingEnabled = false;
  }

  // pause bars and enter warning state
  warningActive = true;
  isPaused = true;
  healths.forEach((h) => h.pauseDanger());

  // reset alpha every time a warning is triggered
  alphaText = 1.0;

  // auto-remove after 3s (overlay only)
  setTimeout(() => {
    if (canvas3 && canvas3.parentNode) {
      document.body.removeChild(canvas3);
      canvas3 = null;
      ctx3 = null;
    }
    warningActive = false;
    isPaused = false;
    healths.forEach((h) => h.resumeDanger());
    currentWarningLevel = null;
  }, 3000);

  // sounds
  if (level === "warning") {
    playWarningSound();
  } else if (level === "critical") {
    playCriticalSound();
  } else {
    stopAllSounds();
  }
  if (dangerCount2 < 2) {
    stopAllSounds();
  }

  // always (re)start animation; do not guard with warningAnimating
  drawWarning();
}

let isInWarningMode = false;
let isInCriticalMode = false;
let isShowingCriticalWarning = false;

// call this instead of showWarning("warning") directly
function triggerWarning(level) {
  if (terminated) return;
  currentWarningLevel = level;
  warningActive = true;
  alphaText = 1.0;

  // start fade if not already running
  if (!warningAnimating) {
    warningAnimating = true;
    drawWarning();
  }
}

function drawWarning() {
  requestAnimationFrame(drawWarning);
  if (terminated || !warningActive || !ctx3 || !canvas3) return;

  let level = currentWarningLevel;
  if (!level) return; // nothing to draw

  let bgColor, line1, line2;

  if (level === "critical") {
    bgColor = "#AB4717";
    line1 = "LIFE FUNCTIONS";
    line2 = "CRITICAL";
    isInWarningMode = false;
    isInCriticalMode = true;
  } else {
    bgColor = "#A00012";
    line1 = "COMPUTER";
    line2 = "MALFUNCTION";
    isInWarningMode = true;
    isInCriticalMode = false;
  }

  // Clear with solid background (copy mode ensures no blending)
  ctx3.fillStyle = bgColor;
  ctx3.fillRect(0, 0, canvas3.width, canvas3.height);

  // Only draw text if alpha is above threshold
  if (alphaText > 0.01) {
    const fontSize = Math.min(canvas3.width, canvas3.height) * 0.2;
    ctx3.font = `bold ${fontSize}px Eurostile_Cond_Heavy`;
    ctx3.textAlign = "center";

    const centerX = canvas3.width / 2;
    const centerY = canvas3.height / 2;
    const lineSpacing = fontSize * 0.1;

    // Use white text with global alpha
    ctx3.globalAlpha = alphaText;
    ctx3.fillStyle = "white";

    ctx3.textBaseline = "bottom";
    ctx3.fillText(line1, centerX, centerY - lineSpacing / 2);

    ctx3.textBaseline = "top";
    ctx3.fillText(line2, centerX, centerY + lineSpacing / 2);

    ctx3.globalAlpha = 1.0; // Reset alpha for next frame's background
  }

  //ctx3.restore();

  alphaText -= 0.005; // Fade speed
  if (alphaText < 0) {
    alphaText = 0;
    warningAnimating = false; // stop animation when fully faded
    return; // stop drawing when fully faded
  }
  //if (alphaText < 0) alphaText = 0;
  /*

  if (alphaText > 0 && warningActive) {
    requestAnimationFrame(drawWarning);
  }
    */
}

function resetGameToMainMenu() {
  // stop sounds
  stopAllSounds();

  // Clear main menu interval if it exists
  if (mainMenuInterval) {
    clearInterval(mainMenuInterval);
    mainMenuInterval = null;
  }

  // remove canvases if they exist
  if (canvas && canvas.parentNode) {
    document.body.removeChild(canvas);
  }
  if (canvas2 && canvas2.parentNode) {
    document.body.removeChild(canvas2);
  }
  if (canvas3 && canvas3.parentNode) {
    document.body.removeChild(canvas3);
  }

  // reset globals
  healths = [];
  isButtonPressed = false;
  warningActive = false;
  hasWarningShown = false;
  isShowingCriticalWarning = false;
  lastDangerCount = 0;
  isPaused = false;
  terminationTimer = null;
  terminated = false;
  alphaText = 1.0;
  warningAnimating = false;
  currentWarningLevel = null;
  isInWarningMode = false;
  isInCriticalMode = false;

  // reset contexts and canvases
  ctx = ctx2 = ctx3 = null;
  canvas = canvas2 = canvas3 = null;

  // recreate main menu
  CreateMainMenu();
}

function terminate() {
  terminated = true;
  isPaused = true;
  warningActive = true;

  healths.forEach((h) => {
    if (typeof h.pauseDanger === "function") h.pauseDanger();
  });
  stopAllSounds();

  canvas3 = document.createElement("canvas");
  canvas3.id = "canvas3";
  canvas3.width = window.innerWidth;
  canvas3.height = window.innerHeight;
  canvas3.style.position = "absolute";
  canvas3.style.top = "0";
  canvas3.style.left = "0";
  canvas3.style.pointerEvents = "auto"; // important: allow clicks
  canvas3.style.willChange = "transform";
  document.body.appendChild(canvas3);

  ctx3 = canvas3.getContext("2d", { alpha: false });

  // CLICK / TOUCH TO RESET BACK TO MAIN MENU
  function handleResetClick() {
    // prevent multiple calls
    if (!terminated) return;
    resetGameToMainMenu();
  }
  canvas3.addEventListener("click", handleResetClick);
  canvas3.addEventListener("touchend", (e) => {
    e.preventDefault();
    handleResetClick();
  });

  function renderTerminate() {
    ctx3.fillStyle = "#A00012";
    ctx3.fillRect(0, 0, canvas3.width, canvas3.height);

    const fontSize = Math.min(canvas3.width, canvas3.height) * 0.2;
    ctx3.font = `bold ${fontSize}px Eurostile_Cond_Heavy`;
    ctx3.textAlign = "center";

    // Optimized glow - update less frequently
    glowUpdateCounter++;
    if (glowUpdateCounter >= GLOW_UPDATE_FREQUENCY) {
      const t = performance.now() / 200;
      const flicker = 0.6 + 0.4 * Math.sin(t);
      cachedGlowValue = glowBase * flicker;
      glowUpdateCounter = 0;
    }

    ctx3.shadowColor = "rgba(255, 255, 255, 0.9)";
    ctx3.shadowBlur = cachedGlowValue * 0.7; // Reduced for mobile
    ctx3.shadowOffsetX = 0;
    ctx3.shadowOffsetY = 0;

    ctx3.fillStyle = "white";

    const centerX = canvas3.width / 2;
    const centerY = canvas3.height / 2;
    const lineSpacing = fontSize * 0.1;

    ctx3.textBaseline = "bottom";
    ctx3.fillText("LIFE FUNCTIONS", centerX, centerY - lineSpacing / 2);

    ctx3.textBaseline = "top";
    ctx3.fillText("TERMINATED", centerX, centerY + lineSpacing / 2);

    if (terminated) requestAnimationFrame(renderTerminate);
  }

  renderTerminate();
}

/*

const WARNING_LOOP_OFFSET = 0.2; // seconds before end to restart
const CRITICAL_LOOP_OFFSET = 0.1; // seconds before end to restart

let warningLoopInterval = null;
let criticalLoopInterval = null;

function playWarningSound() {
  alphaText = 1.0;
  // Stop critical alarm if playing
  criticalAlarm.pause();
  criticalAlarm.currentTime = 0;

  // Only play if not already playing
  if (warningLoop.paused) {
    warningLoop.currentTime = 0;
    warningLoop.play();
  }

  // Clear any previous interval
  if (warningLoopInterval) clearInterval(warningLoopInterval);

  // Custom loop with offset
  warningLoopInterval = setInterval(() => {
    if (
      isInWarningMode &&
      !terminated &&
      warningLoop.duration &&
      warningLoop.currentTime >= warningLoop.duration - WARNING_LOOP_OFFSET
    ) {
      warningLoop.currentTime = 0;
      warningLoop.play();
      alphaText = 1.0;
    }
    // Stop looping if not active
    if (!isInWarningMode || terminated) {
      clearInterval(warningLoopInterval);
      warningLoopInterval = null;
    }
  }, 30);
}

function playCriticalSound() {
  // Stop warning loop if playing
  warningLoop.pause();
  warningLoop.currentTime = 0;

  alphaText = 1.0;

  // Only play if not already playing
  if (criticalAlarm.paused) {
    criticalAlarm.currentTime = 0;
    criticalAlarm.play();
  }

  // Clear any previous interval
  if (criticalLoopInterval) clearInterval(criticalLoopInterval);

  // Custom loop with offset
  criticalLoopInterval = setInterval(() => {
    if (
      isInCriticalMode &&
      !terminated &&
      criticalAlarm.duration &&
      criticalAlarm.currentTime >= criticalAlarm.duration - CRITICAL_LOOP_OFFSET
    ) {
      criticalAlarm.currentTime = 0;
      criticalAlarm.play();
      alphaText = 1.0;
    }
    // Stop looping if not active
    if (!isInCriticalMode || terminated) {
      clearInterval(criticalLoopInterval);
      criticalLoopInterval = null;
    }
  }, 30);
}

function stopAllSounds() {
  warningLoop.pause();
  warningLoop.currentTime = 0;
  criticalAlarm.pause();
  criticalAlarm.currentTime = 0;
  if (warningLoopInterval) {
    clearInterval(warningLoopInterval);
    warningLoopInterval = null;
  }
  if (criticalLoopInterval) {
    clearInterval(criticalLoopInterval);
    criticalLoopInterval = null;
  }
}
  */

function playWarningSound() {
  criticalAlarm.pause();
  criticalAlarm.currentTime = 0;

  warningLoop.currentTime = 0;
  warningLoop.play();
}

function playCriticalSound() {
  warningLoop.pause();
  warningLoop.currentTime = 0;

  criticalAlarm.currentTime = 0;
  criticalAlarm.play();
}

function stopAllSounds() {
  warningLoop.pause();
  warningLoop.currentTime = 0;
  warningLoop.loop = false; // Stop looping
  criticalAlarm.pause();
  criticalAlarm.currentTime = 0;
  criticalAlarm.loop = false; // Stop looping
}
warningLoop.addEventListener("ended", () => {
  if (isInWarningMode && !terminated) {
    playWarningSound();
  }
  if (!terminated && warningActive && currentWarningLevel === "warning") {
    alphaText = 1.0;
    drawWarning();
  }
});

criticalAlarm.addEventListener("ended", () => {
  if (isInCriticalMode && !terminated) {
    playCriticalSound();
  }
  if (!terminated && warningActive && currentWarningLevel === "critical") {
    alphaText = 1.0;
    drawWarning();
  }
});
