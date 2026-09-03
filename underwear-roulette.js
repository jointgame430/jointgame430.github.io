const rouletteState = {
  player: "",
  primaryOwner: "",
  primaryType: null,
  secondaryOwner: "",
};

const rouletteSelectionStep = document.querySelector("#roulette-selection-step");
const rouletteResultStep = document.querySelector("#roulette-result-step");
const rouletteNextButton = document.querySelector("#roulette-next-button");
const rouletteSummaryText = document.querySelector("#roulette-summary-text");
const rouletteChangeSelectionButton = document.querySelector("#roulette-change-selection");
const rouletteSecondaryResult = document.querySelector("#roulette-result-secondary");
const rouletteOtherButton = document.querySelector("#roulette-other-button");
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
    return null;
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

function getTypeOptions(owner) {
  const options = rouletteConfig.underwearTypes?.[owner] ?? [];

  // Support the old string format while configs are migrated to scored entries.
  return options.map((option, index) => (
    typeof option === "string" ? { name: option, score: index + 1 } : option
  ));
}

function chooseType(owner, minimumScore = 0) {
  const options = getTypeOptions(owner);
  const eligibleOptions = options.filter((option) => Number(option.score) >= minimumScore);
  return chooseRandomEntry(eligibleOptions.length > 0 ? eligibleOptions : options);
}

function generateOptions(owner, minimumScore = 0) {
  return {
    owner,
    type: chooseType(owner, minimumScore),
    material: chooseRandomEntry(rouletteConfig.materials),
  };
}

function renderResult(result, suffix) {
  document.querySelector(`#roulette-owner-${suffix}`).textContent = result.owner || "Not configured";
  document.querySelector(`#roulette-type-${suffix}`).textContent = result.type?.name || "Not configured";
  document.querySelector(`#roulette-material-${suffix}`).textContent = result.material || "Not configured";
  document.querySelector(`#roulette-${suffix === "primary" ? "primary" : "secondary"}-heading`).textContent = result.owner || "Result";
}

function choosePrimaryOwner() {
  // The selected player is the person playing, not necessarily whose underwear is chosen.
  return chooseRandomEntry(rouletteConfig.whoseUnderwear);
}

function setupJointFollowUp() {
  rouletteState.secondaryOwner = rouletteState.primaryOwner === "Husband" ? "Wife" : "Husband";
  rouletteOtherButton.textContent = `Generate ${rouletteState.secondaryOwner}'s options`;
  rouletteOtherButton.classList.remove("hidden");
  rouletteSecondaryResult.classList.add("hidden");
}

function generatePrimaryResult() {
  rouletteState.primaryOwner = choosePrimaryOwner();
  const result = generateOptions(rouletteState.primaryOwner);
  rouletteState.primaryType = result.type;
  renderResult(result, "primary");
}

function generateSecondaryResult() {
  const result = generateOptions(
    rouletteState.secondaryOwner,
    Number(rouletteState.primaryType?.score) || 0
  );
  renderResult(result, "secondary");
  rouletteSecondaryResult.classList.remove("hidden");
  rouletteOtherButton.classList.add("hidden");
}

function showRouletteResultStep() {
  rouletteSummaryText.textContent = `${rouletteState.player} is playing`;
  rouletteSelectionStep.classList.add("hidden");
  rouletteResultStep.classList.remove("hidden");
  generatePrimaryResult();

  if (rouletteState.player === "Joint") {
    setupJointFollowUp();
  } else {
    rouletteOtherButton.classList.add("hidden");
    rouletteSecondaryResult.classList.add("hidden");
  }
}

function rerollRouletteResult() {
  generatePrimaryResult();
  if (rouletteState.player === "Joint") {
    setupJointFollowUp();
  }
}

function showRouletteSelectionStep() {
  rouletteResultStep.classList.add("hidden");
  rouletteSelectionStep.classList.remove("hidden");
}

function resetRouletteSelections() {
  rouletteState.player = "";
  rouletteState.primaryOwner = "";
  rouletteState.primaryType = null;
  rouletteState.secondaryOwner = "";
  document.querySelectorAll("[data-group='player'] .choice-chip").forEach((chip) => {
    chip.classList.remove("selected");
  });
  updateRouletteNextButton();
  showRouletteSelectionStep();
}

function wireRouletteActions() {
  rouletteNextButton.addEventListener("click", showRouletteResultStep);
  rouletteChangeSelectionButton.addEventListener("click", showRouletteSelectionStep);
  rouletteOtherButton.addEventListener("click", generateSecondaryResult);
  rouletteRerollButton.addEventListener("click", rerollRouletteResult);
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
