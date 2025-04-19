// Function to load the template
async function loadTemplate() {
  const chrome = window.chrome;
  const templateUrl = chrome.runtime.getURL('templates/qotd-template.html');
  const response = await fetch(templateUrl);
  return await response.text();
}

// Function to check for the element and inject the foobar box
async function injectFoobarBox() {
  // Check if the target element exists
  const targetElement = document.querySelector('[data-testid="standups.ui.wrapper"]');
  const foobarBox = document.querySelector('#jira-qotd');

  if (!targetElement) {
    // If target element doesn't exist and foobar box exists, remove it
    if (foobarBox) {
      foobarBox.remove();
    }
    return;
  }

  // Check if the foobar box already exists
  if (foobarBox) return;

  // Load the template
  const templateHtml = await loadTemplate();

  // Create the foobar box
  const newFoobarBox = document.createElement('div');
  newFoobarBox.setAttribute('id', 'jira-qotd');
  newFoobarBox.innerHTML = templateHtml;

  // Example: Set quote and author (you can modify this part based on your needs)
  newFoobarBox.querySelector('.qotd-question').textContent = 'Pineapple on pizza?';

  // Add the box to the page
  document.body.appendChild(newFoobarBox);
}

// Run initially
injectFoobarBox();

// Set up a MutationObserver to watch for DOM changes
const observer = new MutationObserver(() => {
  injectFoobarBox();
});

// Start observing the document with the configured parameters
observer.observe(document.body, {
  childList: true,
  subtree: true
});
