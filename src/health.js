export default class Health {
  constructor(x, y, ctx, bColor, textUp, textUn, index) {
    // Design PART
    this.width = ctx.canvas.width * 0.15;
    this.height = ctx.canvas.height * 0.1;
    this.x = x;
    this.y = y;
    this.textUpper = textUp;
    this.textUnder = textUn;
    this.color = bColor;
    this.originalColor = bColor;
    this.baseX = this.x + this.width;
    this.baseY = this.y + this.height / 2;
    this.angle = 0; // phase in radians
    this.speed = 0.05; // how fast the wave moves
    this.amplitude = 40; // wave height in px
    this.trail = [];
    this.randomSpeed = Math.random() * 2 + 0.1;
    this.ctx = ctx;
    // Interaction PART
    this.isHover = false;
    this.isDanger = false;
    this.index = index;
    this.setup();

    console.log(this.width / 2 + (this.height / 4) * 5);
  }
  setup() {
    this.draw();
    this.dangerEvent();
  }
  draw(isPaused = false) {
    //this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    //this.backgroundSet("black");
    this.healthCheck();
    this.pannelName(this.x, this.y);

    for (let i = 0; i < 10; i++) {
      this.ctx.lineWidth = 1;
      this.gridSquare(
        this.x + this.width + i * (this.height / 4) * 5,
        this.y,
        this.height / 4,
        5,
        4
      );
      this.ctx.lineWidth = 4;
      this.ctx.strokeStyle = this.color;
      this.ctx.strokeRect(
        this.x + this.width + i * (this.height / 4) * 5,
        this.y,
        (this.height / 4) * 5,
        this.height
      );
    }

    this.healthSignal(isPaused);
  }
  backgroundSet(color) {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.fillStyle = color || "#A00012";
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

  healthSignal(isPaused = false) {
    // Only progress if not paused
    if (!isPaused) {
      this.baseX += 1; // Increment x position
    }

    const y = this.baseY + this.heartbeat(this.baseX) * this.amplitude;

    if (!isPaused) {
      this.trail.push({ x: this.baseX, y }); // Save history
      if (this.trail.length > 1000) this.trail.shift(); // Limit length
    }

    // Draw trail with lines connecting points and fading from left to right
    this.ctx.lineWidth = 2;

    for (let i = 0; i < this.trail.length - 1; i++) {
      // Fade alpha from 0 (left/old) to 1 (right/new)
      const alpha = i / this.trail.length;
      this.ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;

      this.ctx.beginPath();
      this.ctx.moveTo(this.trail[i].x, this.trail[i].y);
      this.ctx.lineTo(this.trail[i + 1].x, this.trail[i + 1].y);
      this.ctx.stroke();
    }

    if (this.baseX > this.x + this.width + 10 * (this.height / 4) * 5) {
      this.baseX = this.x + this.width; // Reset to start position
      this.trail = []; // Clear trail on reset
    }
    if (!isPaused) {
      this.angle += this.speed; // advance along the sine wave
    }
    //console.log(this.baseX);
  }
  circle(x, y, radius) {
    this.ctx.beginPath();
    this.ctx.arc(x, y, radius, 0, Math.PI * 2);
    this.ctx.fillStyle = "white";
    this.ctx.fill();
    this.ctx.closePath();
  }
  pannelName(x, y) {
    //this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.fillStyle = this.color;
    this.ctx.fillRect(x, y, this.width, this.height);
    this.ctx.strokeStyle = this.color;
    this.ctx.lineWidth = 4;
    this.ctx.strokeRect(x, y, this.width, this.height);
    this.textPannelName(x, y, this.text);
  }
  textPannelName(x, y, text) {
    this.ctx.fillStyle = "white";
    // Responsive font size based on panel height
    const fontSize = Math.max(this.height * 0.25, 12); // 25% of height, minimum 12px
    this.ctx.font = `bold ${fontSize}px Arial`;

    // Responsive text positioning
    const paddingX = this.width * 0.1;
    const lineHeight = this.height * 0.35;
    this.ctx.fillText(this.textUpper, x + paddingX, y + lineHeight);
    this.ctx.fillText(this.textUnder, x + paddingX, y + lineHeight * 2);
  }
  gridSquare(x, y, size, numX, numY) {
    this.ctx.lineWidth = 1;
    for (let i = 0; i < numX; i++) {
      for (let j = 0; j < numY; j++) {
        this.ctx.strokeStyle = `rgba(` + this.hexToRgb(this.color) + `, 0.3)`;
        this.ctx.strokeRect(x + i * size, y + j * size, size, size);
        //this.ctx.fillStyle = "#A00012";
        //this.ctx.fillRect(x + i * size, y + j * size, size, size);
      }
    }
  }

  hexToRgb(color) {
    // Handle hex colors
    if (color.startsWith("#")) {
      const hex = color.slice(1);
      const r = parseInt(hex.substring(0, 2), 16);
      const g = parseInt(hex.substring(2, 4), 16);
      const b = parseInt(hex.substring(4, 6), 16);
      return `${r}, ${g}, ${b}`;
    }

    // Handle named colors
    const colorMap = {
      cyan: "0, 255, 255",
      green: "0, 128, 0",
      aquamarine: "127, 255, 212",
      cornflowerblue: "100, 149, 237",
      olive: "128, 128, 0",
      red: "255, 0, 0",
      white: "255, 255, 255",
    };

    return colorMap[color.toLowerCase()] || "255, 255, 255";
  }
  healthCheck() {
    if (this.isDanger) {
      this.dangerState();
    } else {
      this.healthyState();
    }
  }
  dangerEvent() {
    this._dangerPaused = false;
    this._dangerInterval = setInterval(() => {
      if (!this._dangerPaused) {
        this.isDanger = true;
      }
    }, Math.random() * 15000 + 2000);
  }

  pauseDanger() {
    this._dangerPaused = true;
  }

  resumeDanger() {
    this._dangerPaused = false;
  }
  healthyState() {
    this.color = this.originalColor;
    this.amplitude = 40;
  }
  dangerState() {
    this.color = "#A00012";
    this.amplitude = 0;
  }
  js;
  heartbeat(x) {
    // Normalize x to a cycle (0 to 1) - cycle every 80 pixels for visible pattern
    const period = 0.5;
    const t = (((x / 80) % period) + period) % period;

    let y = 0;

    switch (this.index) {
      case 1: {
        // Small early bump, then long noisy baseline with a bigger bump later in the cycle.

        // Baseline jitter / noise
        const noise = 0.02 * Math.sin(60 * t) + 0.015 * Math.sin(110 * t + 1.1);

        // Start with flat baseline around 0
        y = 0;

        // First small bump near the beginning
        y += 0.4 * Math.exp(-Math.pow((t - 0.1) / 0.04, 2));

        // Second larger bump later in the cycle
        y += 0.8 * Math.exp(-Math.pow((t - 0.55) / 0.06, 2));

        return y + noise;
      }

      case 2: {
        // Smooth ramp up, brief drop, then ramp up again, ending with a sharp fall
        // plus some jitter to match the noisy edges.

        // Base jitter / noise
        const noise = 0.03 * Math.sin(40 * t) + 0.02 * Math.sin(85 * t + 0.7);

        if (t < 0.25) {
          // First smooth rise
          y = -0.4 + 1.0 * (t / 0.25); // from -0.4 to +0.6
        } else if (t < 0.32) {
          // Quick drop
          y = 0.6 - 0.9 * ((t - 0.25) / 0.07); // down from 0.6 toward -0.3
        } else if (t < 0.75) {
          // Second smooth rise / plateau
          y = -0.3 + 1.1 * ((t - 0.32) / 0.43); // back up to around +0.8
        } else if (t < 0.9) {
          // Sharp fall at the end of the cycle
          y = 0.8 - 1.6 * ((t - 0.75) / 0.15); // fall from 0.8 down to about -0.4
        } else {
          // Tail near baseline before next cycle
          y = -0.4;
        }

        return y + noise;
      }

      case 3: {
        // Larger, slower bumps on a gentle noisy baseline.

        // Lower‑frequency, softer noise
        const noise = 0.4 * Math.sin(10 * t) + 0.015 * Math.sin(18 * t + 0.8);

        // Baseline offset
        y = -0.05;

        // Wide bump late in the cycle (much taller and slower)
        y += 1.0 * Math.exp(-Math.pow((t - 0.65) / 0.1, 2));

        return y + noise;
      }

      case 4: {
        // Baseline slight slope
        y += 0.02 * (t - 0.5);

        // Small up-ramp before spike
        if (t > 0.05 && t < 0.2) {
          y += (0.15 * (t - 0.05)) / (0.2 - 0.05);
        }

        // Q dip
        y -= 0.25 * Math.exp(-Math.pow((t - 0.28) / 0.01, 2));

        // R main spike
        y += 1.4 * Math.exp(-Math.pow((t - 0.3) / 0.008, 2));

        // S small dip after spike
        y -= 0.35 * Math.exp(-Math.pow((t - 0.33) / 0.01, 2));

        // T wave (broad bump)
        y += 0.45 * Math.exp(-Math.pow((t - 0.55) / 0.06, 2));
        return y;
      }
      case 5: {
        const noise = 0.03 * Math.sin(40 * t) + 0.02 * Math.sin(90 * t + 1.3);
        if (t < 0.2) {
          y = -0.6;
        } else if (t < 0.3) {
          y = -0.6 + (t - 0.2) / 0.1;
        } else if (t < 0.75) {
          y = 0.4;
        } else if (t < 0.85) {
          y = 0.4 - (t - 0.75) / 0.1;
        } else {
          y = -0.6;
        }
        return y + noise;
      }

      case 6: {
        // Chaotic noisy spikes (fibrillation-like)
        // Baseline high‑frequency noise
        y +=
          0.12 * Math.sin(40 * t) +
          0.08 * Math.sin(75 * t + 1.7) +
          0.05 * Math.sin(130 * t + 0.3);

        // Add several narrow spikes at fixed positions in the cycle
        const spikeCenters = [
          0.05, 0.12, 0.19, 0.27, 0.34, 0.42, 0.51, 0.6, 0.69, 0.78, 0.87, 0.95,
        ];
        for (let i = 0; i < spikeCenters.length; i++) {
          const s = spikeCenters[i];
          const d = t - s;
          // wrap distance so spikes near edges still look continuous
          const wrapped = Math.min(
            Math.abs(d),
            Math.abs(d + period),
            Math.abs(d - period)
          );
          y += 0.6 * Math.exp(-Math.pow(wrapped / 0.008, 2));
        }

        return y;
      }
    }
  }
}
