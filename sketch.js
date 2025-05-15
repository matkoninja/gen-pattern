resolution = {
  x: 800,
  y: 800,
};
number_of_points = 140;
distance = 80;
splitMode = false;
speed = 7;
nodeWidth = 2;
strokeWidth = 0.4;

// UI elements
let resXInput, resYInput;
let pointSlider, distanceSlider, speedSlider, nodeWidthSlider, strokeSlider;

let circuitNodes = [];
let currentPalette = 0;
let labels = {}; // Store label elements by name

function setup() {
  palettes = [
    { bg: color(242, 212, 92), line: color(0) }, // Yellow and Black
    { bg: color(242, 212, 92), line: color(0, 175, 63) }, // Yellow and Green
    { bg: color(0, 175, 63), line: color(242, 212, 92) }, // Yellow and Green
    { bg: color(0, 175, 63), line: color(255) }, // Green and White
    { bg: color(0, 0, 220), line: color(255) }, // Blue and White
    { bg: color(255), line: color(0) }, // White and Black
    { bg: color(0), line: color(255) }, // White and Black
  ];

  createCanvas(resolution.x, resolution.y);
  noFill();
  strokeCap(ROUND);
  // Helper to make labeled controls
  function createLabeledControl(label, element, key) {
    let container = createDiv()
      .style("display", "flex")
      .style("flex-direction", "column")
      .style("min-width", "130px");

    let p = createP(`${label}:`)
      .style("margin", "0 0 4px 0")
      .style("font-size", "14px");
    labels[key] = p; // Save reference
    container.child(p);
    container.child(element);
    panel.child(container);
  }
  // === UI PANEL ===
  let panel = createDiv()
    .class("ui")
    .style("display", "flex")
    .style("flex-wrap", "wrap")
    .style("gap", "10px")
    .style("padding", "10px")
    .style("max-width", "300px");

  // Inputs
  resXInput = createInput(resolution.x.toString());
  createLabeledControl("Resolution X", resXInput);

  resYInput = createInput(resolution.y.toString());
  createLabeledControl("Resolution Y", resYInput);

  pointSlider = createSlider(5, 200, number_of_points, 1);
  createLabeledControl("Number of Points", pointSlider, "number_of_points");

  distanceSlider = createSlider(20, 300, distance, 1);
  createLabeledControl("Connection Distance", distanceSlider, "distance");

  speedSlider = createSlider(1, 20, speed, 1);
  createLabeledControl("Speed", speedSlider, "speed");

  nodeWidthSlider = createSlider(1, 10, nodeWidth, 0.1);
  createLabeledControl("Node Width", nodeWidthSlider, "nodeWidth");

  strokeSlider = createSlider(0.1, 5, strokeWidth, 0.1);
  createLabeledControl("Stroke Width", strokeSlider, "strokeWidth");

  // Buttons
  let buttonGroup = createDiv().style("display", "flex").style("gap", "10px");
  let applyBtn = createButton("Apply");
  applyBtn.mousePressed(() => {
    resolution.x = int(resXInput.value());
    resolution.y = int(resYInput.value());
    resizeCanvas(resolution.x, resolution.y);
    number_of_points = pointSlider.value();
    distance = distanceSlider.value();
    speed = speedSlider.value();
    nodeWidth = nodeWidthSlider.value();
    strokeWidth = strokeSlider.value();
    reinitializeNodes();
  });

  let restartBtn = createButton("Restart");
  restartBtn.mousePressed(() => {
    reinitializeNodes();
  });

  buttonGroup.child(applyBtn);
  buttonGroup.child(restartBtn);
  panel.child(buttonGroup);

  reinitializeNodes();
}

function draw() {
  // Read live slider values every frame
  number_of_points = pointSlider.value();
  distance = distanceSlider.value();
  speed = speedSlider.value();
  nodeWidth = nodeWidthSlider.value();
  strokeWidth = strokeSlider.value();

  // Update label text dynamically
  labels.number_of_points.html(`Number of Points: ${number_of_points}`);
  labels.distance.html(`Connection Distance: ${distance}`);
  labels.speed.html(`Speed: ${speed}`);
  labels.nodeWidth.html(`Node Width: ${nf(nodeWidth, 1, 1)}`);
  labels.strokeWidth.html(`Stroke Width: ${nf(strokeWidth, 1, 1)}`);

  if (splitMode) {
    // Draw left half with palette[0] bg
    noStroke();
    fill(palettes[0].bg);
    rect(0, 0, width / 2, height);

    // Draw right half with palette[1] bg
    fill(palettes[3].bg);
    rect(width / 2, 0, width / 2, height);

    drawSplitCircuits();
  } else {
    background(palettes[currentPalette].bg);
    drawCircuits();
  }
  updateNodes();
}

// Create a node with position, target, speed
function createNode() {
  return {
    x: random(width),
    y: random(height),
    tx: random(width),
    ty: random(height),
    speed: random(0.001, speed / 1000),
  };
}

// Animate and connect circuit nodes
function drawCircuits() {
  let palette = palettes[currentPalette];

  for (let node of circuitNodes) {
    // Move toward target
    node.x = lerp(node.x, node.tx, node.speed);
    node.y = lerp(node.y, node.ty, node.speed);

    // Draw connecting lines to close nodes
    for (let other of circuitNodes) {
      if (node !== other) {
        let d = dist(node.x, node.y, other.x, other.y);
        if (d < distance) {
          let alpha = map(d, 0, distance, 255, 0);
          let lineCol = color(
            red(palette.line),
            green(palette.line),
            blue(palette.line),
            alpha
          );
          // Draw node
          stroke(palette.line);
          strokeWeight(nodeWidth);
          point(node.x, node.y);

          stroke(lineCol);

          strokeWeight(strokeWidth);
          line(node.x, node.y, other.x, other.y);
        }
      }
    }
  }
}
function drawSplitCircuits() {
  let leftPalette = palettes[0];
  let rightPalette = palettes[3];

  for (let node of circuitNodes) {
    node.x = lerp(node.x, node.tx, node.speed);
    node.y = lerp(node.y, node.ty, node.speed);

    let isLeft = node.x < width / 2;
    let palette = isLeft ? leftPalette : rightPalette;

    // Node point
    stroke(palette.line);
    strokeWeight(nodeWidth);
    point(node.x, node.y);

    for (let other of circuitNodes) {
      if (node !== other) {
        let otherIsLeft = other.x < width / 2;

        let d = dist(node.x, node.y, other.x, other.y);
        if (d < distance) {
          let alpha = map(d, 0, distance, 255, 0);

          // Use different stroke for cross-connection
          let connColor;
          if (isLeft !== otherIsLeft) {
            // Cross-group connection (blend color or use a neutral)
            connColor = color(map(d, 0, distance, 150, 255), alpha); // purplish
          } else {
            // Same group: use appropriate palette
            connColor = color(
              red(palette.line),
              green(palette.line),
              blue(palette.line),
              alpha
            );
          }

          stroke(connColor);
          strokeWeight(strokeWidth);
          line(node.x, node.y, other.x, other.y);
        }
      }
    }
  }
}

// When close to target, assign a new one
function updateNodes() {
  for (let node of circuitNodes) {
    let d = dist(node.x, node.y, node.tx, node.ty);
    if (d < 5) {
      node.tx = random(width);
      node.ty = random(height);
    }
  }
}

function saveHighRes(w, h) {
  let pg = createGraphics(w, h);
  let scaleFactor = w / width;
  let palette = palettes[currentPalette];

  pg.background(palette.bg);
  pg.strokeCap(ROUND);

  for (let node of circuitNodes) {
    let x = node.x * scaleFactor;
    let y = node.y * scaleFactor;
    let tx = node.tx * scaleFactor;
    let ty = node.ty * scaleFactor;

    pg.stroke(palette.line);
    pg.strokeWeight(nodeWidth * scaleFactor);
    pg.point(x, y);

    for (let other of circuitNodes) {
      if (node !== other) {
        let ox = other.x * scaleFactor;
        let oy = other.y * scaleFactor;
        let d = dist(x, y, ox, oy);
        if (d < distance * scaleFactor) {
          let alpha = map(d, 0, distance * scaleFactor, 255, 0);
          let lineCol = color(
            red(palette.line),
            green(palette.line),
            blue(palette.line),
            alpha
          );
          pg.stroke(lineCol);
          pg.strokeWeight(strokeWidth * scaleFactor);
          pg.line(x, y, ox, oy);
        }
      }
    }
  }

  // This part saves the canvas buffer to a PNG
  pg.canvas.toBlob(function (blob) {
    let a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "circuit_pattern_300dpi.png";
    a.click();
  }, "image/png");
}

function keyPressed() {
  // Switch color palettes with 1–7
  if (key >= "1" && key <= "7") {
    currentPalette = int(key) - 1;
  }

  // Save canvas with 'S' or 's'
  if (key === "S" || key === "s") {
    console.log("S pressed");
    saveHighRes(2481, 3507);
  }
  if (key === "M" || key === "m") {
    splitMode = !splitMode;
  }
}

function reinitializeNodes() {
  circuitNodes = [];
  for (let i = 0; i < number_of_points; i++) {
    circuitNodes.push(createNode());
  }
}
