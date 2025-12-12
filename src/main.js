import Health from "./health";

let ctx; // Declare ctx in global scope
let canvas;
let healths = []; // Store health instances

let ctx2;
let canvas2;

let ctx3;
let canvas3;

let isButtonPressed = false;
let warningActive = false; // Track if warning is currently showing
let hasWarningShown = false; // Track if warning has been shown before
let hasCriticalShown = false; // Track if critical warning has been shown before
let lastDangerCount = 0; // Track previous danger count to detect changes
let isPaused = false; // Track if health bars are paused
let terminationTimer = null; // Timer when all healths are in danger
let terminated = false; // Permanent termination state

let alphaText = 1.0; // For fade effects
//Audio parts

const warningLoop = new Audio("computer-malfunction.wav");
warningLoop.preload = "auto";

const criticalAlarm = new Audio("life-functions-critical.wav");
criticalAlarm.preload = "auto";

// Health bar configuration data
const healthConfigs = [
  { color: "cyan", textUp: "CARDIO", textUn: "VASCULAR" },
  { color: "green", textUp: "METABOLIC", textUn: "LEVELS" },
  { color: "Aquamarine", textUp: "CENTRAL", textUn: "NERV. SYSTEM" },
  { color: "CornflowerBlue", textUp: "PULMONARY", textUn: "FUNCTION" },
  { color: "green", textUp: "SYSTEM", textUn: "INTEGRATION" },
  { color: "Olive", textUp: "LOCOMOTOR", textUn: "SYSTEM" },
];

window.onload = () => {
  if (!criticalAlarm.readyState || !warningLoop.readyState) return;
  CreateMainMenu();
};
//Create Main Meun

let switchColor = false;

function CreateMainMenu() {
  canvas2 = document.createElement("canvas");
  canvas2.id = "canvas2";
  canvas2.width = window.innerWidth;
  canvas2.height = window.innerHeight;
  document.body.appendChild(canvas2);
  ctx2 = canvas2.getContext("2d");
  setInterval(() => {
    switchColor = !switchColor;
  }, 500);
  drawMainMenu();
}
function drawMainMenu() {
  ctx2.fillStyle = "black";
  ctx2.fillRect(0, 0, canvas2.width, canvas2.height);

  let titleSizeX = canvas2.width * 0.8;
  let titleSizeY = canvas2.height * 0.4;
  let fontColor = "white";
  let titleFontSize = Math.min(canvas2.width, canvas2.height) * 0.08;

  ctx2.fillStyle = switchColor ? "green" : "red";
  ctx2.fillRect(
    canvas2.width / 2 - titleSizeX / 2,
    canvas2.height / 2 - titleSizeY / 2,
    titleSizeX,
    titleSizeY
  );
  ctx2.font = `bold ${titleFontSize}px Arial`;
  ctx2.fillStyle = fontColor;
  ctx2.textAlign = "center";
  ctx2.fillText(
    "LIFE FUNCTIONS SIMULATION",
    canvas2.width / 2,
    canvas2.height / 2 + titleFontSize / 4
  );

  let buttonWidth = canvas2.width * 0.15;
  let buttonHeight = canvas2.height * 0.1;
  createButton(
    canvas2.width / 2 - buttonWidth / 2,
    canvas2.height * 0.8 - buttonHeight / 2,
    buttonWidth,
    buttonHeight
  );
  requestAnimationFrame(drawMainMenu);
}
function createButton(x, y, width, height) {
  ctx2.strokeStyle = "white";
  ctx2.lineWidth = 5;

  ctx2.strokeRect(x, y, width, height);
  ctx2.font = `${Math.min(width, height) * 0.4}px Arial`;
  ctx2.fillStyle = "white";
  ctx2.textAlign = "center";
  ctx2.textBaseline = "middle";
  ctx2.fillText("START", x + width / 2, y + height / 2);

  // Handle button press (shared logic)
  function handleButtonPress(clientX, clientY) {
    if (
      clientX >= x &&
      clientX <= x + width &&
      clientY >= y &&
      clientY <= y + height
    ) {
      // Unlock audio for iOS/iPad
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

  // Mouse click (desktop)
  canvas2.addEventListener("mousedown", (e) => {
    handleButtonPress(e.clientX, e.clientY);
  });

  // Touch (mobile/tablet)
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
  document.body.appendChild(canvas);
  ctx = canvas.getContext("2d");

  // Initial resize and create health bars
  resizeCanvas();

  // Setup resize listener for responsiveness
  window.addEventListener("resize", resizeCanvas);

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
      index + 1
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
  ctx.fillStyle = color || "red";
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
    !hasCriticalShown &&
    !terminated
  ) {
    showWarning("critical");
    hasCriticalShown = true;
  }
  // Show warning when 2-4 are in danger
  else if (
    dangerCount >= 2 &&
    dangerCount < 4 &&
    !warningActive &&
    !hasWarningShown &&
    dangerCount !== lastDangerCount &&
    !terminated
  ) {
    showWarning("warning");
    hasWarningShown = true;
  }

  lastDangerCount = dangerCount;
  if (dangerCount < 2) {
    hasWarningShown = false; // Reset once danger count drops below 2
    stopAllSounds(); // Stop all sounds if no health is in danger
  }
  if (dangerCount < 4) {
    hasCriticalShown = false; // Reset once danger count drops below 4
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
  if (terminated) return; // Do not show warnings if terminated
  const dangerCount2 = healths.filter((health) => health.isDanger).length;
  if (warningActive) return; // Prevent multiple warnings

  //alphaText = getDecreaseAlpha();
  warningActive = true;
  isPaused = true; // Pause health bar progression
  healths.forEach((h) => h.pauseDanger());
  canvas3 = document.createElement("canvas");
  canvas3.id = "canvas3";
  canvas3.width = window.innerWidth;
  canvas3.height = window.innerHeight;
  canvas3.style.position = "absolute";
  canvas3.style.top = "0";
  canvas3.style.left = "0";
  canvas3.style.pointerEvents = "none"; // Allow clicks to pass through
  document.body.appendChild(canvas3);
  ctx3 = canvas3.getContext("2d");

  // Remove warning after 3 seconds
  setTimeout(() => {
    if (canvas3 && canvas3.parentNode) {
      document.body.removeChild(canvas3);
    }
    warningActive = false;
    isPaused = false; // Resume health bar progression
    healths.forEach((h) => h.resumeDanger());
  }, 3000);

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
  drawWarning(level);
}
let isInWarningMode = false;
let isInCriticalMode = false;

function drawWarning(level) {
  if (terminated) return; // Do not draw warnings if terminated
  // Different colors and text based on warning level
  let bgColor, text;
  if (level === "critical") {
    bgColor = "rgba(255, 174, 0, 1)"; // Purple for critical
    text = "LIFE FUNCTIONS CRITICAL";
    isInWarningMode = false;
    isInCriticalMode = true;
  } else {
    bgColor = "rgba(255, 0, 0, 1)"; // Red for warning
    text = "COMPUTER MALFUNCTION";
    isInWarningMode = true;
    isInCriticalMode = false;
  }

  ctx3.fillStyle = bgColor;
  ctx3.fillRect(0, 0, canvas3.width, canvas3.height);

  // Add warning text
  const fontSize = Math.min(canvas3.width, canvas3.height) * 0.09;
  ctx3.font = `bold ${fontSize}px Arial`;
  ctx3.fillStyle = `rgba(255, 255, 255, ${alphaText})`;
  //ctx3.fillStyle = `white`;
  ctx3.textAlign = "center";
  ctx3.textBaseline = "middle";
  ctx3.fillText(text, canvas3.width / 2, canvas3.height / 2);
  alphaText -= 0.01;
  if (alphaText < 0) alphaText = 0;

  requestAnimationFrame(() => drawWarning(level));
}

function terminate() {
  terminated = true;
  isPaused = true;
  warningActive = true;
  // Pause danger timers on each health
  healths.forEach((h) => {
    if (typeof h.pauseDanger === "function") h.pauseDanger();
  });
  stopAllSounds();

  // Create permanent canvas3 overlay that blocks interactions
  canvas3 = document.createElement("canvas");
  canvas3.id = "canvas3";
  canvas3.width = window.innerWidth;
  canvas3.height = window.innerHeight;
  canvas3.style.position = "absolute";
  canvas3.style.top = "0";
  canvas3.style.left = "0";
  canvas3.style.pointerEvents = "auto"; // Block interactions
  document.body.appendChild(canvas3);
  ctx3 = canvas3.getContext("2d");
  ctx3.fillStyle = "rgba(255, 0, 0, 1)";
  ctx3.fillRect(0, 0, canvas3.width, canvas3.height);
  const fontSize = Math.min(canvas3.width, canvas3.height) * 0.09;
  ctx3.font = `bold ${fontSize}px Arial`;
  ctx3.fillStyle = "white";
  ctx3.textAlign = "center";
  ctx3.textBaseline = "middle";
  ctx3.fillText(
    "LIFE FUNCTIONS TERMINATED",
    canvas3.width / 2,
    canvas3.height / 2
  );
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
  alphaText = 1.0;
  // Stop critical alarm if playing
  criticalAlarm.pause();
  criticalAlarm.currentTime = 0;

  // Only play if not already playing
  if (warningLoop.paused) {
    warningLoop.currentTime = 0;
    //warningLoop.loop = true; // Restore default looping
    warningLoop.play();
  }
}

function playCriticalSound() {
  // Stop warning loop if playing
  warningLoop.pause();
  warningLoop.currentTime = 0;

  alphaText = 1.0;

  // Only play if not already playing
  if (criticalAlarm.paused) {
    criticalAlarm.currentTime = 0;
    //criticalAlarm.loop = true; // Restore default looping
    criticalAlarm.play();
  }
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
  //alphaText = 1.0;
  playWarningSound();
});

criticalAlarm.addEventListener("ended", () => {
  //alphaText = 1.0;
  playCriticalSound();
});
