const rouletteState = {
  player: "",
};

const rouletteSelectionStep = document.querySelector("#roulette-selection-step");
const rouletteResultStep = document.querySelector("#roulette-result-step");
const rouletteNextButton = document.querySelector("#roulette-next-button");
const rouletteSummaryText = document.querySelector("#roulette-summary-text");
const rouletteChangeSelectionButton = document.querySelector("#roulette-change-selection");
const rouletteOwner = document.querySelector("#roulette-owner");
const rouletteType = document.querySelector("#roulette-type");
const rouletteMaterial = document.querySelector("#roulette-material");
const rouletteRerollButton = document.querySelector("#roulette-reroll-button");
const rouletteResetButton = document.querySelector("#roulette-reset-button");

let rouletteConfig = {};

async function loadRouletteConfig() {
  const response = await fetch("underwear-roulette-config.json", { cache: "no-store" });
  if (!response.ok) {
    throw new Error("Unable to load underwear-roulette-config.json");
  }

  rouletteConfig = await response.json();
}

function chooseRandomEntry(entries) {
  if (!Array.isArray(entries) || entries.length === 0) {
    return "";
  }

  const randomIndex = Math.floor(Math.random() * entries.length);
  return entries[randomIndex];
}

function updateRouletteNextButton() {
  rouletteNextButton.classList.toggle("hidden", !rouletteState.player);
}

function wireRouletteSelectionButtons() {
  document.querySelectorAll("[data-group='player']").forEach((group) => {
    group.addEventListener("click", (event) => {
      const button = event.target.closest(".choice-chip");
      if (!button) {
        return;
      }

      rouletteState.player = button.dataset.value;

      group.querySelectorAll(".choice-chip").forEach((chip) => {
        chip.classList.toggle("selected", chip === button);
      });

      updateRouletteNextButton();
    });
  });
}

function generateRouletteResult() {
  const whoseUnderwear = chooseRandomEntry(rouletteConfig.whoseUnderwear);
  const typePool = rouletteConfig.underwearTypes?.[whoseUnderwear] ?? [];
  const underwearType = chooseRandomEntry(typePool);
  const material = chooseRandomEntry(rouletteConfig.materials);

  rouletteOwner.textContent = whoseUnderwear || "Not configured";
  rouletteType.textContent = underwearType || "Not configured";
  rouletteMaterial.textContent = material || "Not configured";
}

function showRouletteResultStep() {
  rouletteSummaryText.textContent = `${rouletteState.player} is playing`;
  rouletteSelectionStep.classList.add("hidden");
  rouletteResultStep.classList.remove("hidden");
  generateRouletteResult();
}

function showRouletteSelectionStep() {
  rouletteResultStep.classList.add("hidden");
  rouletteSelectionStep.classList.remove("hidden");
}

function resetRouletteSelections() {
  rouletteState.player = "";
  document.querySelectorAll("[data-group='player'] .choice-chip").forEach((chip) => {
    chip.classList.remove("selected");
  });
  updateRouletteNextButton();
  showRouletteSelectionStep();
}

function wireRouletteActions() {
  rouletteNextButton.addEventListener("click", showRouletteResultStep);
  rouletteChangeSelectionButton.addEventListener("click", showRouletteSelectionStep);
  rouletteRerollButton.addEventListener("click", generateRouletteResult);
  rouletteResetButton.addEventListener("click", resetRouletteSelections);
}

async function initializeRouletteGame() {
  try {
    await loadRouletteConfig();
    wireRouletteSelectionButtons();
    wireRouletteActions();
  } catch (error) {
    rouletteNextButton.classList.add("hidden");
    rouletteSelectionStep.innerHTML = `
      <div class="option-group">
        <h2>Config unavailable</h2>
        <p class="hero-copy">${error.message}</p>
      </div>
    `;
  }
}

initializeRouletteGame();
