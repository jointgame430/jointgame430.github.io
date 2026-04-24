const positionImage = document.querySelector("#position-image");
const positionTitle = document.querySelector("#position-title");
const positionLinkButton = document.querySelector("#position-link-button");
const positionRerollButton = document.querySelector("#position-reroll-button");
const positionScratchStep = document.querySelector("#position-scratch-step");
const canvas = document.querySelector("#position-scratch-canvas");
const context = canvas.getContext("2d", { willReadFrequently: true });

let activePointerId = null;
let positions = [];
let activePosition = null;
const revealedPositionHistory = new Set();

async function loadPositions() {
  const response = await fetch("positions.csv", { cache: "no-store" });
  if (!response.ok) {
    throw new Error("Unable to load positions.csv");
  }

  const csvText = await response.text();
  positions = parseCsv(csvText);
}

function parseCsv(text) {
  const rows = [];
  let currentValue = "";
  let currentRow = [];
  let insideQuotes = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const nextChar = text[index + 1];

    if (char === "\"") {
      if (insideQuotes && nextChar === "\"") {
        currentValue += "\"";
        index += 1;
      } else {
        insideQuotes = !insideQuotes;
      }
      continue;
    }

    if (char === "," && !insideQuotes) {
      currentRow.push(currentValue);
      currentValue = "";
      continue;
    }

    if ((char === "\n" || char === "\r") && !insideQuotes) {
      if (char === "\r" && nextChar === "\n") {
        index += 1;
      }

      currentRow.push(currentValue);
      if (currentRow.some((value) => value !== "")) {
        rows.push(currentRow);
      }
      currentRow = [];
      currentValue = "";
      continue;
    }

    currentValue += char;
  }

  if (currentValue !== "" || currentRow.length > 0) {
    currentRow.push(currentValue);
    rows.push(currentRow);
  }

  const [headerRow, ...dataRows] = rows;
  if (!headerRow) {
    return [];
  }

  return dataRows
    .map((row) => Object.fromEntries(headerRow.map((header, index) => [header, row[index] ?? ""])))
    .filter((row) => row.name && row.link && row.image_url);
}

function renderScratchLayer() {
  const width = canvas.width;
  const height = canvas.height;

  context.globalCompositeOperation = "source-over";
  context.clearRect(0, 0, width, height);

  const gradient = context.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, "#babec9");
  gradient.addColorStop(0.55, "#8a8f9c");
  gradient.addColorStop(1, "#d7dce6");

  context.fillStyle = gradient;
  context.fillRect(0, 0, width, height);

  for (let i = 0; i < 90; i += 1) {
    context.fillStyle = `rgba(255, 255, 255, ${Math.random() * 0.25})`;
    context.beginPath();
    context.arc(
      Math.random() * width,
      Math.random() * height,
      1 + Math.random() * 3,
      0,
      Math.PI * 2
    );
    context.fill();
  }

  context.fillStyle = "rgba(255, 255, 255, 0.75)";
  context.font = "700 32px Manrope";
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillText("Scratch Here", width / 2, height / 2);
}

function revealAt(clientX, clientY) {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  const x = (clientX - rect.left) * scaleX;
  const y = (clientY - rect.top) * scaleY;

  context.globalCompositeOperation = "destination-out";
  context.beginPath();
  context.arc(x, y, 20, 0, Math.PI * 2);
  context.fill();
}

function choosePosition() {
  if (!Array.isArray(positions) || positions.length === 0) {
    return null;
  }

  const availablePositions = positions.filter((position) => !revealedPositionHistory.has(position.link));
  if (availablePositions.length === 0) {
    revealedPositionHistory.clear();
    return choosePosition();
  }

  const randomIndex = Math.floor(Math.random() * availablePositions.length);
  return availablePositions[randomIndex];
}

function updatePositionReveal() {
  activePosition = choosePosition();
  if (!activePosition) {
    positionTitle.textContent = "No positions are available.";
    positionImage.removeAttribute("src");
    positionImage.alt = "";
    positionLinkButton.href = "#";
    positionLinkButton.setAttribute("aria-disabled", "true");
    renderScratchLayer();
    return;
  }

  revealedPositionHistory.add(activePosition.link);
  positionTitle.textContent = activePosition.name;
  positionImage.src = activePosition.image_url;
  positionImage.alt = activePosition.name;
  positionLinkButton.href = activePosition.link;
  positionLinkButton.removeAttribute("aria-disabled");
  renderScratchLayer();
}

function installScratchInteractions() {
  canvas.addEventListener("pointerdown", (event) => {
    activePointerId = event.pointerId;
    canvas.setPointerCapture(activePointerId);
    revealAt(event.clientX, event.clientY);
  });

  canvas.addEventListener("pointermove", (event) => {
    if (event.pointerId !== activePointerId) {
      return;
    }

    revealAt(event.clientX, event.clientY);
  });

  const stopScratching = (event) => {
    if (event.pointerId !== activePointerId) {
      return;
    }

    canvas.releasePointerCapture(activePointerId);
    activePointerId = null;
  };

  canvas.addEventListener("pointerup", stopScratching);
  canvas.addEventListener("pointercancel", stopScratching);
}

function wireActions() {
  positionRerollButton.addEventListener("click", updatePositionReveal);
}

async function initializePositionScratchOff() {
  try {
    await loadPositions();
    installScratchInteractions();
    wireActions();
    updatePositionReveal();
  } catch (error) {
    positionScratchStep.innerHTML = `
      <div class="option-group">
        <h2>CSV unavailable</h2>
        <p class="hero-copy">${error.message}</p>
      </div>
    `;
  }
}

initializePositionScratchOff();
