// Function to load the template
async function loadTemplate() {
  const chrome = window.chrome;
  const templateUrl = chrome.runtime.getURL('templates/qotd-template.html');
  const response = await fetch(templateUrl);
  return await response.text();
}

// Function to check for the element and inject the qotd box
async function injectQotdBox() {
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

  // Load the template
  const templateHtml = await loadTemplate();

  // Create the qotd box
  const newQotdBox = document.createElement('div');
  newQotdBox.setAttribute('id', 'standup-qotd');
  newQotdBox.innerHTML = templateHtml;

  const response = await fetch(chrome.runtime.getURL('questions.json'));
  const questions = await response.json();
  const randomQuestion = questions[Math.floor(Math.random() * questions.length)];
  newQotdBox.querySelector('.qotd-question').textContent = randomQuestion;

  // Add the box to the page
  document.body.appendChild(newQotdBox);
}

// Run initially
injectQotdBox();

// Set up a MutationObserver to watch for DOM changes
const observer = new MutationObserver(() => {
  injectQotdBox();
});

// Start observing the document with the configured parameters
observer.observe(document.body, {
  childList: true,
  subtree: true
});
