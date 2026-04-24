const weeklyScratchCards = {
  Husband: {
    messageElement: document.querySelector("#weekly-message-husband"),
    canvas: document.querySelector("#weekly-canvas-husband"),
    prompt: "",
    pointerId: null,
    revealedPromptHistory: new Set(),
  },
  Wife: {
    messageElement: document.querySelector("#weekly-message-wife"),
    canvas: document.querySelector("#weekly-canvas-wife"),
    prompt: "",
    pointerId: null,
    revealedPromptHistory: new Set(),
  },
};

const weeklyRefreshButtons = document.querySelectorAll(".weekly-refresh");
const weeklyRerollAllButton = document.querySelector("#weekly-reroll-all");

let weeklyChallengeConfig = {};

async function loadWeeklyChallengeConfig() {
  const response = await fetch("weekly-challenge-config.json", { cache: "no-store" });
  if (!response.ok) {
    throw new Error("Unable to load weekly-challenge-config.json");
  }

  weeklyChallengeConfig = await response.json();
}

function renderScratchLayer(context, canvas) {
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

function revealAt(card, clientX, clientY) {
  const { canvas } = card;
  const context = canvas.getContext("2d", { willReadFrequently: true });
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

function chooseWeeklyPrompt(owner) {
  const pool = weeklyChallengeConfig?.[owner];
  if (!Array.isArray(pool) || pool.length === 0) {
    return "No weekly challenges are configured yet.";
  }

  const card = weeklyScratchCards[owner];
  const availablePrompts = pool.filter((entry) => !card.revealedPromptHistory.has(entry));
  if (availablePrompts.length === 0) {
    card.revealedPromptHistory.clear();
    return chooseWeeklyPrompt(owner);
  }

  const randomIndex = Math.floor(Math.random() * availablePrompts.length);
  return availablePrompts[randomIndex];
}

function resetWeeklyCard(owner) {
  const card = weeklyScratchCards[owner];
  const context = card.canvas.getContext("2d", { willReadFrequently: true });

  card.prompt = chooseWeeklyPrompt(owner);
  card.revealedPromptHistory.add(card.prompt);
  card.messageElement.textContent = card.prompt;
  renderScratchLayer(context, card.canvas);
}

function resetAllWeeklyCards() {
  resetWeeklyCard("Husband");
  resetWeeklyCard("Wife");
}

function installScratchInteractions(owner) {
  const card = weeklyScratchCards[owner];
  const { canvas } = card;

  canvas.addEventListener("pointerdown", (event) => {
    card.pointerId = event.pointerId;
    canvas.setPointerCapture(card.pointerId);
    revealAt(card, event.clientX, event.clientY);
  });

  canvas.addEventListener("pointermove", (event) => {
    if (event.pointerId !== card.pointerId) {
      return;
    }

    revealAt(card, event.clientX, event.clientY);
  });

  const stopScratching = (event) => {
    if (event.pointerId !== card.pointerId) {
      return;
    }

    canvas.releasePointerCapture(card.pointerId);
    card.pointerId = null;
  };

  canvas.addEventListener("pointerup", stopScratching);
  canvas.addEventListener("pointercancel", stopScratching);
}

function wireWeeklyChallengeActions() {
  weeklyRefreshButtons.forEach((button) => {
    button.addEventListener("click", () => {
      resetWeeklyCard(button.dataset.target);
    });
  });

  weeklyRerollAllButton.addEventListener("click", resetAllWeeklyCards);
}

async function initializeWeeklyChallenge() {
  try {
    await loadWeeklyChallengeConfig();
    installScratchInteractions("Husband");
    installScratchInteractions("Wife");
    wireWeeklyChallengeActions();
    resetAllWeeklyCards();
  } catch (error) {
    document.querySelector("#weekly-challenge-step").innerHTML = `
      <div class="option-group">
        <h2>Config unavailable</h2>
        <p class="hero-copy">${error.message}</p>
      </div>
    `;
  }
}

initializeWeeklyChallenge();
