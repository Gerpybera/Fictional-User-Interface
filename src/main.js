import Health from "./health";

let ctx; // Declare ctx in global scope
let healths = []; // Store health instances

let posX, posY;
let spacing = 130; // Even spacing in pixels

window.onload = () => {
  setup();
};

function setup() {
  const canvas = document.createElement("canvas");
  canvas.id = "canvas";
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  document.body.appendChild(canvas);
  ctx = canvas.getContext("2d");
  console.log("setup done");
  posX = canvas.width / 2 - 1850 / 2 + 50;
  posY = canvas.height / 2 - 50;

  // Create health instances once with even spacing
  healths.push(
    new Health(posX, posY - 2.5 * spacing, ctx, "cyan", "CARDIO", "VASCULAR", 1)
  );
  healths.push(
    new Health(
      posX,
      posY - 1.5 * spacing,
      ctx,
      "green",
      "METABOLIC",
      "LEVELS",
      2
    )
  );
  healths.push(
    new Health(
      posX,
      posY - 0.5 * spacing,
      ctx,
      "Aquamarine",
      "CENTRAL",
      "NERV. SYSTEM",
      3
    )
  );
  healths.push(
    new Health(
      posX,
      posY + 0.5 * spacing,
      ctx,
      "CornflowerBlue",
      "PULMONARY",
      "FUNCTION",
      4
    )
  );
  healths.push(
    new Health(
      posX,
      posY + 1.5 * spacing,
      ctx,
      "green",
      "SYSTEM",
      "INTEGRATION",
      5
    )
  );
  healths.push(
    new Health(
      posX,
      posY + 2.5 * spacing,
      ctx,
      "Olive",
      "LOCOMOTOR",
      "SYSTEM",
      6
    )
  );

  // Setup global event listeners
  setupEventListeners();
  draw();
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
  // Mouse move for hover detection
  window.addEventListener("mousemove", (e) => {
    const mouseX = e.clientX;
    const mouseY = e.clientY;
    let isHoveringAny = false;

    healths.forEach((health) => {
      if (
        mouseX >= health.x &&
        mouseX <= health.x + health.width &&
        mouseY >= health.y &&
        mouseY <= health.y + health.height
      ) {
        health.isHover = true;
        isHoveringAny = true;
      } else {
        health.isHover = false;
      }
    });

    document.body.style.cursor = isHoveringAny ? "pointer" : "default";
  });

  // Click interaction
  window.addEventListener("click", (e) => {
    healths.forEach((health) => {
      if (health.isHover) {
        health.isDanger = !health.isDanger;
        console.log("Clicked! isDanger:", health.isDanger);
      }
    });
  });
}
