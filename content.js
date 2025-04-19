// Flag to prevent multiple simultaneous injections
let isInjecting = false;
let questions = [];

// Function to load questions from JSON file
async function loadQuestions() {
  const response = await fetch(chrome.runtime.getURL('questions.json'));
  questions = await response.json();
}

// Function to get used question indices from localStorage
function getUsedQuestionIndices() {
  const usedIndicesJson = localStorage.getItem('standupQOTD-usedQuestionIndices');
  return usedIndicesJson ? JSON.parse(usedIndicesJson) : [];
}

// Function to save used question indices to localStorage
function saveUsedQuestionIndices(indices) {
  localStorage.setItem('standupQOTD-usedQuestionIndices', JSON.stringify(indices));
}

// Function to get a random unused question
function getRandomUnusedQuestion() {
  const usedIndices = getUsedQuestionIndices();
  const availableIndices = questions
    .map((_, index) => index)
    .filter(index => !usedIndices.includes(index));

  if (availableIndices.length === 0) {
    // If all questions have been used, reset the history
    saveUsedQuestionIndices([]);
    return questions[Math.floor(Math.random() * questions.length)];
  }

  const randomIndex = availableIndices[Math.floor(Math.random() * availableIndices.length)];
  usedIndices.push(randomIndex);
  saveUsedQuestionIndices(usedIndices);
  return questions[randomIndex];
}

// Function to display a random question in the container
function displayRandomQuestion(container) {
  const questionElement = container.querySelector('.qotd-question');
  questionElement.textContent = getRandomUnusedQuestion();
}

// Function to load the template
async function loadTemplate() {
  const chrome = window.chrome;
  const templateUrl = chrome.runtime.getURL('templates/qotd-template.html');
  const response = await fetch(templateUrl);
  return await response.text();
}

// Function to check for the element and inject the qotd box
async function injectQotdBox() {
  // Prevent multiple simultaneous injections
  if (isInjecting) return;
  isInjecting = true;

  try {
    // Check if the target element exists
    const targetElement = document.querySelector('[data-testid="standups.ui.wrapper"]');
    const qotdBox = document.querySelector('#standup-qotd');

    if (!targetElement) {
      // If target element doesn't exist and qotd box exists, remove it
      if (qotdBox) {
        qotdBox.remove();
      }
      return;
    }

    // Check if the qotd box already exists
    if (qotdBox) return;

    // Load questions if not already loaded
    if (questions.length === 0) {
      await loadQuestions();
    }

    // Load the template
    const templateHtml = await loadTemplate();

    // Create the qotd box
    const newQotdBox = document.createElement('div');
    newQotdBox.setAttribute('id', 'standup-qotd');
    newQotdBox.innerHTML = templateHtml;

    // Display initial random question
    displayRandomQuestion(newQotdBox);

    // Add event listeners for buttons
    newQotdBox.querySelector('#skip-question').addEventListener('click', () => {
      displayRandomQuestion(newQotdBox);
    });

    newQotdBox.querySelector('#reset-history').addEventListener('click', () => {
      saveUsedQuestionIndices([]);
      displayRandomQuestion(newQotdBox);
    });

    // Add the box to the page
    document.body.appendChild(newQotdBox);
  } finally {
    // Always reset the flag, even if there was an error
    isInjecting = false;
  }
}

// Run initially
injectQotdBox();

// Set up a MutationObserver to watch for DOM changes
const observer = new MutationObserver((mutations) => {
  // Only trigger if the mutations are relevant to our target
  const hasRelevantMutation = mutations.some(mutation => {
    return mutation.type === 'childList' &&
           (mutation.target.querySelector('[data-testid="standups.ui.wrapper"]') ||
            mutation.removedNodes.length > 0);
  });

  if (hasRelevantMutation) {
    injectQotdBox();
  }
});

// Start observing the document with the configured parameters
observer.observe(document.body, {
  childList: true,
  subtree: true
});
