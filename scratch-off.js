const selectionState = {
  relationship: "",
  status: "",
};

const selectionStep = document.querySelector("#selection-step");
const scratchStep = document.querySelector("#scratch-step");
const nextButton = document.querySelector("#next-button");
const summaryText = document.querySelector("#summary-text");
const scratchMessage = document.querySelector("#scratch-message");
const changeSelectionButton = document.querySelector("#change-selection");
const resetButton = document.querySelector("#reset-button");
const skipButton = document.querySelector("#skip-button");
const canvas = document.querySelector("#scratch-canvas");
const context = canvas.getContext("2d", { willReadFrequently: true });

let promptConfig = {};
let activePrompt = "";
let activePointerId = null;
const revealedPromptHistory = new Set();

async function loadConfig() {
  const response = await fetch("scratch-off-config.json", { cache: "no-store" });
  if (!response.ok) {
    throw new Error("Unable to load scratch-off-config.json");
  }

  promptConfig = await response.json();
}

function resetPromptHistory() {
  revealedPromptHistory.clear();
  activePrompt = "";
}

function wireSelectionButtons() {
  document.querySelectorAll(".option-group").forEach((group) => {
    group.addEventListener("click", (event) => {
      const button = event.target.closest(".choice-chip");
      if (!button) {
        return;
      }

      const groupName = group.dataset.group;
      const previousValue = selectionState[groupName];
      selectionState[groupName] = button.dataset.value;

      if (previousValue && previousValue !== button.dataset.value) {
        resetPromptHistory();
      }

      group.querySelectorAll(".choice-chip").forEach((chip) => {
        chip.classList.toggle("selected", chip === button);
      });

      updateNextButtonVisibility();
    });
  });
}

function updateNextButtonVisibility() {
  const ready = selectionState.relationship && selectionState.status;
  nextButton.classList.toggle("hidden", !ready);
}

function getPromptPool() {
  const relationshipOptions = promptConfig?.[selectionState.relationship];
  const statusOptions = relationshipOptions?.[selectionState.status];

  if (!Array.isArray(statusOptions) || statusOptions.length === 0) {
    return [];
  }

  return statusOptions;
}

function choosePrompt() {
  const pool = getPromptPool();
  if (pool.length === 0) {
    return "No challenges are configured for this combination yet.";
  }

  const availablePrompts = pool.filter((entry) => !revealedPromptHistory.has(entry));
  if (availablePrompts.length === 0) {
    revealedPromptHistory.clear();
    return choosePrompt();
  }

  const randomIndex = Math.floor(Math.random() * availablePrompts.length);
  return availablePrompts[randomIndex];
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

  for (let i = 0; i < 80; i += 1) {
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
  context.font = "700 30px Manrope";
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

function resetScratchCard() {
  activePrompt = choosePrompt();
  revealedPromptHistory.add(activePrompt);
  scratchMessage.textContent = activePrompt;
  renderScratchLayer();
}

function showScratchStep() {
  summaryText.textContent = `${selectionState.relationship} / ${selectionState.status}`;
  selectionStep.classList.add("hidden");
  scratchStep.classList.remove("hidden");
  resetScratchCard();
}

function showSelectionStep() {
  scratchStep.classList.add("hidden");
  selectionStep.classList.remove("hidden");
}

function resetSelections() {
  selectionState.relationship = "";
  selectionState.status = "";
  resetPromptHistory();

  document.querySelectorAll(".choice-chip").forEach((chip) => {
    chip.classList.remove("selected");
  });

  updateNextButtonVisibility();
  showSelectionStep();
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
  nextButton.addEventListener("click", showScratchStep);
  changeSelectionButton.addEventListener("click", showSelectionStep);
  resetButton.addEventListener("click", resetSelections);
  skipButton.addEventListener("click", resetScratchCard);
}

async function initializeGame() {
  try {
    await loadConfig();
    wireSelectionButtons();
    installScratchInteractions();
    wireActions();
  } catch (error) {
    nextButton.classList.add("hidden");
    selectionStep.innerHTML = `
      <div class="option-group">
        <h2>Config unavailable</h2>
        <p class="hero-copy">${error.message}</p>
      </div>
    `;
  }
}

initializeGame();
