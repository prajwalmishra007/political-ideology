// State management
let currentCategory = 0;
let currentQuestion = 0;
let answers = {};
const categories = [
  "economic",
  "social",
  "government",
  "foreign",
  "environmental",
];

// DOM Elements
const landingPage = document.getElementById("landing-page");
const testContainer = document.getElementById("test-container");
const resultsPage = document.getElementById("results-page");
const categoryTitle = document.getElementById("category-title");
const progressText = document.getElementById("progress");
const progressBar = document.getElementById("progress-bar");
const questionContainer = document.getElementById("question-container");
const prevBtn = document.getElementById("prev-btn");
const nextBtn = document.getElementById("next-btn");
const startTestBtn = document.getElementById("start-test");
const restartTestBtn = document.getElementById("restart-test");

// Initialize the test
function initTest() {
  currentCategory = 0;
  currentQuestion = 0;
  answers = {};
  showQuestion();
}

// Show the current question
function showQuestion() {
  const category = categories[currentCategory];
  const question = questions[category][currentQuestion];

  categoryTitle.textContent =
    category.charAt(0).toUpperCase() + category.slice(1);
  progressText.textContent = `Question ${currentQuestion + 1} of ${
    questions[category].length
  }`;
  progressBar.style.width = `${
    ((currentQuestion + 1) / questions[category].length) * 100
  }%`;

  const questionHTML = `
        <div class="mb-6">
            <p class="text-lg mb-4">${question.text}</p>
            <div class="space-y-2">
                <label class="flex items-center space-x-2">
                    <input type="radio" name="answer" value="2" class="form-radio">
                    <span>Strongly Agree</span>
                </label>
                <label class="flex items-center space-x-2">
                    <input type="radio" name="answer" value="1" class="form-radio">
                    <span>Agree</span>
                </label>
                <label class="flex items-center space-x-2">
                    <input type="radio" name="answer" value="0" class="form-radio">
                    <span>Neutral</span>
                </label>
                <label class="flex items-center space-x-2">
                    <input type="radio" name="answer" value="-1" class="form-radio">
                    <span>Disagree</span>
                </label>
                <label class="flex items-center space-x-2">
                    <input type="radio" name="answer" value="-2" class="form-radio">
                    <span>Strongly Disagree</span>
                </label>
            </div>
        </div>
    `;

  questionContainer.innerHTML = questionHTML;

  // Set previous answer if exists
  const answerKey = `${category}-${currentQuestion}`;
  if (answers[answerKey]) {
    document.querySelector(
      `input[value="${answers[answerKey]}"]`
    ).checked = true;
  }

  // Show/hide navigation buttons
  prevBtn.style.display = currentQuestion > 0 ? "block" : "none";
  nextBtn.textContent =
    currentQuestion === questions[category].length - 1 ? "Finish" : "Next";
}

// Save answer and move to next question
function saveAnswer() {
  const selectedAnswer = document.querySelector('input[name="answer"]:checked');
  if (!selectedAnswer) {
    alert("Please select an answer before proceeding.");
    return false;
  }

  const category = categories[currentCategory];
  const answerKey = `${category}-${currentQuestion}`;
  answers[answerKey] = parseInt(selectedAnswer.value);

  return true;
}

// Calculate results
function calculateResults() {
  let leftRightScore = 0;
  let authLibScore = 0;
  let categoryScores = {
    economic: 0,
    social: 0,
    government: 0,
    foreign: 0,
    environmental: 0,
  };

  // Calculate scores for each category and axis
  for (const category of categories) {
    let categoryScore = 0;
    questions[category].forEach((question, index) => {
      const answerKey = `${category}-${index}`;
      const answer = answers[answerKey] || 0;
      categoryScore += answer;

      if (question.axis === "left-right") {
        leftRightScore += answer;
      } else {
        authLibScore += answer;
      }
    });
    categoryScores[category] = categoryScore / questions[category].length;
  }

  // Normalize scores to -100 to 100 range
  const totalQuestions = Object.values(questions).reduce(
    (sum, category) => sum + category.length,
    0
  );
  leftRightScore = (leftRightScore / totalQuestions) * 100;
  authLibScore = (authLibScore / totalQuestions) * 100;

  return {
    leftRight: leftRightScore,
    authLib: authLibScore,
    categoryScores,
  };
}

// Helper to interpret the user's political leaning
function interpretPoliticalLeaning(x, y) {
  const absX = Math.abs(x);
  const absY = Math.abs(y);
  let quadrant = "";
  let ideologies = [];
  let description = "";

  if (absX < 20 && absY < 20) {
    quadrant = "Centrist";
    description =
      "You are close to the center, indicating a balanced or moderate approach to both economic and social issues.";
    ideologies = ["Centrism", "Social Liberalism", "Third Way"];
  } else if (x < 0 && y > 0) {
    quadrant = "Left-Authoritarian";
    description =
      "You tend to support economic equality and state intervention, along with traditional authority or social order.";
    ideologies = [
      "State Socialism",
      "Communism",
      "Populist Left",
      "Democratic Socialism (authoritarian variant)",
    ];
  } else if (x < 0 && y < 0) {
    quadrant = "Left-Libertarian";
    description =
      "You support economic equality and redistribution, but also value personal freedoms and social progress.";
    ideologies = [
      "Social Democracy",
      "Libertarian Socialism",
      "Progressivism",
      "Democratic Socialism (libertarian variant)",
    ];
  } else if (x > 0 && y > 0) {
    quadrant = "Right-Authoritarian";
    description =
      "You favor free-market economics and private enterprise, combined with support for tradition, order, or strong government.";
    ideologies = [
      "Conservatism",
      "Nationalism",
      "Right-wing Populism",
      "Authoritarian Capitalism",
    ];
  } else if (x > 0 && y < 0) {
    quadrant = "Right-Libertarian";
    description =
      "You support free-market economics and individual liberty, with a preference for minimal state intervention in both economic and social matters.";
    ideologies = [
      "Classical Liberalism",
      "Libertarianism",
      "Neoliberalism",
      "Anarcho-Capitalism",
    ];
  }

  return { quadrant, description, ideologies };
}

// Display results
function showResults() {
  const results = calculateResults();

  // Remove previous chart if exists
  if (window.politicalCompassChart) {
    window.politicalCompassChart.destroy();
  }

  const ctx = document.getElementById("political-compass").getContext("2d");

  // Custom plugin for quadrant backgrounds and grid
  const quadrantBackgroundPlugin = {
    id: "quadrantBackground",
    beforeDraw: (chart) => {
      const { ctx, chartArea } = chart;
      if (!chartArea) return;
      const { left, right, top, bottom, width, height } = chartArea;
      // Quadrant colors
      ctx.save();
      ctx.fillStyle = "#f87171"; // Top-left (Authoritarian-Left) - red
      ctx.fillRect(left, top, width / 2, height / 2);
      ctx.fillStyle = "#60a5fa"; // Top-right (Authoritarian-Right) - blue
      ctx.fillRect(left + width / 2, top, width / 2, height / 2);
      ctx.fillStyle = "#6ee7b7"; // Bottom-left (Libertarian-Left) - green
      ctx.fillRect(left, top + height / 2, width / 2, height / 2);
      ctx.fillStyle = "#a78bfa"; // Bottom-right (Libertarian-Right) - purple
      ctx.fillRect(left + width / 2, top + height / 2, width / 2, height / 2);
      ctx.restore();
      // Draw grid
      ctx.save();
      ctx.strokeStyle = "#fff";
      ctx.lineWidth = 1;
      const gridCount = 10;
      for (let i = 1; i < gridCount; i++) {
        // Vertical
        const x = left + (width * i) / gridCount;
        ctx.beginPath();
        ctx.moveTo(x, top);
        ctx.lineTo(x, bottom);
        ctx.stroke();
        // Horizontal
        const y = top + (height * i) / gridCount;
        ctx.beginPath();
        ctx.moveTo(left, y);
        ctx.lineTo(right, y);
        ctx.stroke();
      }
      ctx.restore();
    },
  };

  // Custom plugin for axis/corner labels and 'Me' annotation
  const labelPlugin = {
    id: "customLabels",
    afterDraw: (chart) => {
      const { ctx, chartArea, scales } = chart;
      if (!chartArea) return;
      ctx.save();
      // Responsive font size
      const fontSize = Math.max(14, Math.min(chart.width, chart.height) / 25);
      ctx.font = `bold ${fontSize}px sans-serif`;
      ctx.fillStyle = "#555";
      ctx.textAlign = "center";
      // Corners
      ctx.fillText(
        "Authoritarian",
        (scales.x.left + scales.x.right) / 2,
        chartArea.top - fontSize
      );
      ctx.fillText(
        "Libertarian",
        (scales.x.left + scales.x.right) / 2,
        chartArea.bottom + fontSize * 2
      );
      ctx.save();
      ctx.translate(
        chartArea.left - fontSize * 2,
        (scales.y.top + scales.y.bottom) / 2
      );
      ctx.rotate(-Math.PI / 2);
      ctx.fillText("Left", 0, 0);
      ctx.restore();
      ctx.save();
      ctx.translate(
        chartArea.right + fontSize * 2,
        (scales.y.top + scales.y.bottom) / 2
      );
      ctx.rotate(-Math.PI / 2);
      ctx.fillText("Right", 0, 0);
      ctx.restore();
      // Axis scale labels
      ctx.font = `bold ${fontSize * 0.8}px sans-serif`;
      ctx.fillStyle = "#1e40af";
      ctx.textAlign = "left";
      ctx.fillText(
        "←economic scale→",
        (scales.x.left + scales.x.right) / 2 - fontSize * 3,
        chartArea.bottom + fontSize
      );
      ctx.save();
      ctx.translate(
        chartArea.left - fontSize * 1.5,
        (scales.y.top + scales.y.bottom) / 2 + fontSize * 3
      );
      ctx.rotate(-Math.PI / 2);
      ctx.fillText("←social scale→", 0, 0);
      ctx.restore();
      // 'Me' label and line
      const user = chart.getDatasetMeta(0).data[0];
      if (user) {
        ctx.strokeStyle = "red";
        ctx.fillStyle = "red";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(user.x + 10, user.y);
        ctx.lineTo(user.x + 80, user.y - 30);
        ctx.stroke();
        ctx.font = `bold ${fontSize * 0.8}px sans-serif`;
        ctx.fillText("Me", user.x + 90, user.y - 35);
      }
      ctx.restore();
    },
  };

  window.politicalCompassChart = new Chart(ctx, {
    type: "scatter",
    data: {
      datasets: [
        {
          data: [
            {
              x: results.leftRight,
              y: results.authLib,
            },
          ],
          backgroundColor: "red",
          borderColor: "#b91c1c",
          pointRadius: 8,
          pointStyle: "circle",
          showLine: false,
        },
      ],
    },
    options: {
      animation: false,
      scales: {
        x: {
          min: -100,
          max: 100,
          grid: { color: "rgba(0,0,0,0.1)" },
          title: { display: false },
          ticks: { display: false },
        },
        y: {
          min: -100,
          max: 100,
          grid: { color: "rgba(0,0,0,0.1)" },
          title: { display: false },
          ticks: { display: false },
        },
      },
      plugins: {
        legend: { display: false },
      },
      responsive: true,
      maintainAspectRatio: true,
      aspectRatio: 1,
    },
    plugins: [quadrantBackgroundPlugin, labelPlugin],
  });

  // Interpret the user's political leaning
  const interpretation = interpretPoliticalLeaning(
    results.leftRight,
    results.authLib
  );
  const summaryHTML = `
    <div class="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
      <h3 class="text-xl font-bold mb-2">Your Political Leaning: <span class="text-blue-700">${
        interpretation.quadrant
      }</span></h3>
      <p class="mb-2 text-gray-700">${interpretation.description}</p>
      <p class="text-gray-700"><span class="font-semibold">Ideologies that may suit you:</span> ${interpretation.ideologies.join(
        ", "
      )}</p>
    </div>
  `;

  // Build the breakdown HTML
  const breakdownHTML = Object.entries(results.categoryScores)
    .map(
      ([category, score]) => `
        <div class="p-4 bg-gray-50 rounded-lg">
          <h3 class="font-semibold mb-2">${
            category.charAt(0).toUpperCase() + category.slice(1)
          }</h3>
          <div class="w-full bg-gray-200 rounded-full h-2.5">
            <div class="bg-blue-600 h-2.5 rounded-full" style="width: ${
              (score + 2) * 25
            }%"></div>
          </div>
          <p class="text-sm text-gray-600 mt-1">
            ${score > 0 ? "More progressive" : "More conservative"} leaning
          </p>
        </div>
      `
    )
    .join("");

  // Set the summary and breakdown together
  document.getElementById("results-breakdown").innerHTML =
    summaryHTML + breakdownHTML;
}

// Event Listeners
startTestBtn.addEventListener("click", () => {
  landingPage.classList.add("hidden");
  testContainer.classList.remove("hidden");
  initTest();
});

restartTestBtn.addEventListener("click", () => {
  resultsPage.classList.add("hidden");
  testContainer.classList.remove("hidden");
  initTest();
});

prevBtn.addEventListener("click", () => {
  if (currentQuestion > 0) {
    currentQuestion--;
    showQuestion();
  }
});

nextBtn.addEventListener("click", () => {
  if (saveAnswer()) {
    if (currentQuestion < questions[categories[currentCategory]].length - 1) {
      currentQuestion++;
      showQuestion();
    } else if (currentCategory < categories.length - 1) {
      currentCategory++;
      currentQuestion = 0;
      showQuestion();
    } else {
      testContainer.classList.add("hidden");
      resultsPage.classList.remove("hidden");
      showResults();
    }
  }
});
