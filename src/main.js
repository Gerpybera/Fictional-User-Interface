import Health from "./health";

let ctx; // Declare ctx in global scope
let canvas;
let healths = []; // Store health instances

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
  setup();
};

function setup() {
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
  const barHeight = canvas.height * 0.11;
  const gap = canvas.height * 0.02; // 2% of canvas height as gap between bars
  const spacing = barHeight + gap;

  // Calculate total height of all bars including gaps
  const totalHeight = numBars * barHeight + (numBars - 1) * gap;

  // Center vertically: start Y so that the group is centered
  const startY = (canvas.height - totalHeight) / 2;

  // Calculate total width of a health bar:
  // panelWidth (canvas.width/6) + 10 grid squares (each is (barHeight/4) * 5)
  const panelWidth = canvas.width / 6;
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
  background("black");

  // Just call draw on existing instances
  healths.forEach((health) => health.draw());
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
  healths.forEach((health) => {
    if (
      x >= health.x &&
      x <= health.x + health.width &&
      y >= health.y &&
      y <= health.y + health.height
    ) {
      health.isDanger = !health.isDanger;
      console.log("Interacted! isDanger:", health.isDanger);
    }
  });
}
