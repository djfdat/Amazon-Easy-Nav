/**
 * options.js
 *
 * Manages the Amazon Easy Nav extension's options page.
 * This script handles the loading, saving, and ordering of navigation links, custom and predefined.
 * It uses the SortableJS library for drag-and-drop functionality.
 *
 * This includes:
 *
 *  - Loading and saving navigation links (predefined and custom).
 *  - Rendering these links in a sortable list.
 *  - Allowing users to add new custom links.
 *  - Allowing users to remove custom links.
 *  - Allowing users to enable/disable any link.
 *  - Implementing drag-and-drop reordering of links using SortableJS.
 *  - Automatically saving all changes to Chrome's synchronized storage.
 *
 */

// Wait for the entire HTML document to be fully loaded and parsed before running the script.
document.addEventListener('DOMContentLoaded', () => {
	// --- DOM Element References ---
	// Get references to various HTML elements needed for the script.
	// These elements are used for user input, displaying links, and providing feedback.

	const linkNameInput = document.getElementById('linkName'); // Input field for the custom link's name.
	const linkUrlInput = document.getElementById('linkUrl');   // Input field for the custom link's URL.
	const addLinkButton = document.getElementById('addLink'); // Button to add a new custom link.
	const linksListContainer = document.getElementById('linksListContainer'); // UL element where links are displayed.

	// The manual save button was removed in favor of auto-saving.
	// const saveOptionsButton = document.getElementById('saveOptions');

	let statusMessageElement = document.getElementById('statusMessage'); // Span to display status messages (e.g., "Options saved").

	// --- Status Message Element Handling ---
	// If the status message element was removed or commented out in options.html,
	// this block creates it dynamically and appends it to a suitable place in the DOM.
	// This ensures that feedback can always be provided to the user.
	if (!statusMessageElement) {
		statusMessageElement = document.createElement('span');
		statusMessageElement.id = 'statusMessage'; // Assign an ID for potential styling.
		statusMessageElement.style.marginLeft = '10px'; // Basic styling.

		// Try to insert the status message near the main content area.
		const manageLinksSection = document.querySelector('h2'); // Find the first h2, assuming it's "Manage Links" or similar.
		if (manageLinksSection && manageLinksSection.parentElement) {
			manageLinksSection.parentElement.appendChild(statusMessageElement);
		} else {
			// Fallback: if a suitable anchor isn't found, append to the body.
			document.body.appendChild(statusMessageElement);
		}
	} else {
		// If the element exists but was hidden (e.g., commented out in HTML and then uncommented by JS changes),
		// ensure it's made visible.
		statusMessageElement.hidden = false;
	}

	// --- Constants and Configuration ---

	// Key used to store the array of all user links in Chrome's synchronized storage.
	const STORAGE_KEY = 'allUserLinks';

	/**
	 * Default predefined links.
	 * This array provides the initial set of links if none are found in storage.
	 * Each link object has the following properties:
	 *  - type: (string) "predefined" - Indicates it's a default, non-removable link (but can be disabled).
	 *  - id: (string) A unique identifier for the predefined link (matches checkbox ID in original HTML).
	 *  - name: (string) The display name of the link.
	 *  - url: (string) The URL path for the link.
	 *  - enabled: (boolean) Whether the link is currently active and should be shown in the extension.
	 *  - originalIndex: (number) The original sort order of this predefined link.
	 */
	const DEFAULT_PREDEFINED_LINKS = [
		{ type: "predefined", id: "returns", name: "Returns", url: "/spr/returns/history", enabled: true, originalIndex: 0 },
		{ type: "predefined", id: "support", name: "Support Call", url: "/gp/help/customer/express/c2c/popup.html", enabled: true, originalIndex: 1 }
	];

	// --- SortableJS Initialization ---
	// Initialize the SortableJS library to enable drag-and-drop reordering of links.
	if (typeof Sortable !== 'undefined') {
		new Sortable(linksListContainer, {
			animation: 150, // Animation speed for sorting (ms).
			handle: '.drag-handle', // CSS selector for the element to use as a drag handle.
			ghostClass: 'sortable-ghost',  // CSS class for the placeholder item while dragging.
			chosenClass: 'sortable-chosen',  // CSS class for the item being dragged.
			dragClass: 'sortable-drag',  // CSS class applied to the item while it's being dragged.

			// Called when a drag-and-drop operation ends (item is dropped).
			onEnd: () => {
				// Auto-save all links to persist the new order.
				autoSaveAllLinks();
			}
		});
	} else {
		// Log an error and show a message if SortableJS is not available.
		console.error("SortableJS library not found. Drag and drop will not work.");
		// Show a persistent error message (duration 0).
		showStatusMessage("Error: SortableJS library not found.", true, 0);
	}

	/**
	 * Loads links from Chrome storage and populates the list in the DOM.
	 * If no links are found in storage, it loads and saves the default predefined links.
	 * Side effects:
	 *  - Modifies the DOM by clearing and then populating `linksListContainer`.
	 *  - May call `autoSaveAllLinks` if default links are loaded, which saves to Chrome storage.
	 */
	function loadLinks() {
		// Fetch the array of links from Chrome's synchronized storage.
		chrome.storage.sync.get([STORAGE_KEY], (result) => {
			// Clear any existing items from the list container before rendering.
			linksListContainer.innerHTML = '';

			let linksToRender = []; // Array to hold the links that will be displayed.
			let saveDefaultsNeeded = false; // Flag to indicate if default links need to be saved.

			// Check if links were successfully retrieved from storage and if the array is not empty.
			if (result[STORAGE_KEY] && Array.isArray(result[STORAGE_KEY]) && result[STORAGE_KEY].length > 0) {
				// Links found in storage.
				linksToRender = result[STORAGE_KEY].map(link => {
					// Backward compatibility: If a custom link from storage doesn't have an 'enabled' property,
					// default it to true. This ensures older stored links are usable.
					if (link.type === "custom" && typeof link.enabled === 'undefined') {
						link.enabled = true;
					}
					return link;
				});
			} else {
				// No links found in storage, or the stored array is empty.
				// Use a deep copy of the default predefined links.
				linksToRender = JSON.parse(JSON.stringify(DEFAULT_PREDEFINED_LINKS));
				saveDefaultsNeeded = true; // Mark that these defaults should be saved to storage.
			}

			// Render each link item in the DOM.
			linksToRender.forEach(linkData => renderLinkItem(linkData));

			// If default links were loaded (because storage was empty), save them to storage.
			// Pass `false` to `autoSaveAllLinks` to prevent showing a status message for this initial setup.
			if (saveDefaultsNeeded) {
				autoSaveAllLinks(false);
			}
		});
	}

	/**
	 * Renders a single link item (<li> element) and appends it to the links list container.
	 * @param {object} linkData - An object containing the data for the link to be rendered.
	 *                            Properties: type, name, url, enabled, id (for predefined), originalIndex (for predefined).
	 * Side effects:
	 *  - Modifies the DOM by creating and appending list item elements.
	 */
	function renderLinkItem(linkData) {
		// Create the main list item (<li>).
		const listItem = document.createElement('li');
		listItem.classList.add('link-item'); // Add class for styling.

		// Store link data directly on the element using data-* attributes.
		// This makes it easy to retrieve the data later, especially when saving.
		listItem.dataset.linkType = linkData.type;
		listItem.dataset.linkName = linkData.name;
		listItem.dataset.linkUrl = linkData.url;

		// Create the drag handle (☰ symbol).
		const dragHandle = document.createElement('span');
		dragHandle.classList.add('drag-handle');
		dragHandle.textContent = '☰'; // Unicode character for a hamburger menu icon, often used as a drag handle.
		listItem.appendChild(dragHandle);

		// Create the checkbox for enabling/disabling the link.
		const checkbox = document.createElement('input');
		checkbox.type = 'checkbox';
		checkbox.checked = linkData.enabled; // Set the initial checked state based on link data.

		// Create the span to display the link's name (and URL for custom links).
		const nameSpan = document.createElement('span');

		// Differentiate between predefined and custom links for specific attributes and display.
		if (linkData.type === 'predefined') {
			listItem.dataset.linkId = linkData.id || ''; // Store the predefined link's unique ID.
			if (linkData.hasOwnProperty('originalIndex')) {
				listItem.dataset.originalIndex = linkData.originalIndex;
			}
			checkbox.classList.add('predefined-link-toggle'); // Add class for specific styling or selection.
			checkbox.dataset.linkId = linkData.id; // Also add linkId to checkbox for easier access if needed.
			nameSpan.textContent = linkData.name; // Predefined links only show their name.
		} else { // Custom link
			checkbox.classList.add('custom-link-toggle'); // Add class for specific styling or selection.
			nameSpan.textContent = `${linkData.name} (${linkData.url})`; // Custom links show "Name (URL)".
		}

		// Append the checkbox and name span to the list item.
		listItem.appendChild(checkbox);
		listItem.appendChild(nameSpan);

		// If it's a custom link, add a "Remove" button.
		if (linkData.type === 'custom') {
			const removeButton = document.createElement('button');
			removeButton.textContent = 'Remove';
			removeButton.classList.add('remove-custom-link'); // Add class for styling and event delegation.
			listItem.appendChild(removeButton);
		}

		// Add the fully constructed list item to the main list container in the DOM.
		linksListContainer.appendChild(listItem);
	}

	/**
	 * Saves the current list of all links (as represented in the DOM) to Chrome's synchronized storage.
	 * This function is called automatically after any modification to the links:
	 * add, remove, reorder (drag-and-drop), or toggle enable/disable state.
	 * @param {boolean} [showMessage=true] - Whether to display a status message (e.g., "Options saved!").
	 *                                       Defaults to true. Set to false for silent saves (e.g., initial default save).
	 * Side effects:
	 *  - Reads link data from DOM elements.
	 *  - Saves an array of link objects to `chrome.storage.sync`.
	 *  - Calls `showStatusMessage` to provide user feedback (if `showMessage` is true).
	 */
	function autoSaveAllLinks(showMessage = false) {
		const newAllUserLinksArray = []; // Array to hold the link objects to be saved.

		// Iterate over each list item (<li>) in the links container.
		linksListContainer.querySelectorAll('li.link-item').forEach(listItem => {
			// Retrieve link data stored in data-* attributes of the list item.
			const type = listItem.dataset.linkType;
			const name = listItem.dataset.linkName;
			const url = listItem.dataset.linkUrl;

			let enabled = true; // Default 'enabled' state, especially for custom links.

			// Find the checkbox within this list item to get its 'enabled' state.
			const checkbox = listItem.querySelector('input[type="checkbox"]');
			if (checkbox) {
				enabled = checkbox.checked;
			}

			// Construct the link object to be saved.
			// Structure: { type, name, url, enabled, id (optional), originalIndex (optional) }
			const linkData = { type, name, url, enabled };

			// If it's a predefined link, also save its 'id' and 'originalIndex'.
			if (type === 'predefined') {
				linkData.id = listItem.dataset.linkId;
				if (listItem.dataset.originalIndex !== undefined) {
					linkData.originalIndex = parseInt(listItem.dataset.originalIndex, 10);
				}
			}
			newAllUserLinksArray.push(linkData);
		});

		// Save the newly constructed array of links to Chrome storage.
		chrome.storage.sync.set({ [STORAGE_KEY]: newAllUserLinksArray }, () => {
			// Callback function after the save operation.
			if (chrome.runtime.lastError) {
				// An error occurred during saving.
				if (showMessage) {
					showStatusMessage('Error saving options: ' + chrome.runtime.lastError.message, true);
				}
				console.error('ARIN Options: Error saving options:', chrome.runtime.lastError.message);
			} else {
				// Options saved successfully.
				if (showMessage) {
					showStatusMessage('Options saved automatically!', false);
				}
				console.log('ARIN Options: Options saved automatically.');
			}
		});
	}

	/**
	 * Handles the "Add Link" button click event.
	 * Creates a new custom link object from user input, renders it in the list,
	 * and triggers an auto-save.
	 * Side effects:
	 *  - Reads values from input fields.
	 *  - Calls `renderLinkItem` to modify the DOM.
	 *  - Calls `autoSaveAllLinks` to save to Chrome storage.
	 *  - Clears input fields.
	 */
	function handleAddLink() {
		// Get the name and URL from the input fields, trimming whitespace.
		const name = linkNameInput.value.trim();
		const url = linkUrlInput.value.trim();

		// Basic validation: ensure name and URL are not empty.
		if (!name || !url) {
			alert("Link name and URL cannot be empty."); // Simple alert for validation.
			return; // Stop further execution.
		}

		// Create the data object for the new custom link.
		// Custom links are always of type "custom" and default to enabled: true.
		const customLinkData = {
			type: "custom",
			name: name,
			url: url,
			enabled: true
		};

		// Render the new link item in the DOM.
		renderLinkItem(customLinkData);

		// Auto-save all links, including the newly added one.
		autoSaveAllLinks(false);

		// Clear the input fields for the next entry.
		linkNameInput.value = '';
		linkUrlInput.value = '';
	}

	/**
	 * Displays a status message to the user.
	 * The message disappears automatically after a set duration, unless duration is 0.
	 * @param {string} message - The text of the message to display.
	 * @param {boolean} [isError=false] - If true, styles the message as an error (e.g., red text).
	 * @param {number} [duration=3000] - How long to display the message in milliseconds.
	 *                                    If 0, the message will be persistent until cleared manually or by another message.
	 * Side effects:
	 *  - Modifies the content and style of `statusMessageElement`.
	 */
	function showStatusMessage(message, isError = false, duration = 3000) {
		// If the status message element doesn't exist for some reason, do nothing.
		if (!statusMessageElement) return;

		statusMessageElement.textContent = message; // Set the message text.
		statusMessageElement.style.color = isError ? 'red' : 'green'; // Set color based on error status.
		statusMessageElement.hidden = false; // Make the message visible.

		// If a duration is specified (greater than 0), set a timeout to hide the message.
		if (duration > 0) {
			setTimeout(() => {
				statusMessageElement.textContent = ''; // Clear the text.
				statusMessageElement.hidden = true;  // Hide the element.
			}, duration);
		}
	}

	// --- Event Listeners ---

	// Listen for clicks on the "Add Link" button.
	addLinkButton.addEventListener('click', handleAddLink);

	// The manual save button and its listener were removed.
	// saveOptionsButton.addEventListener('click', saveOptions);

	// Use event delegation on the links list container for handling clicks on dynamic elements
	// (remove buttons and checkboxes for individual links).
	// This is more efficient than adding an event listener to each button/checkbox.
	linksListContainer.addEventListener('click', (event) => {
		// Check if the clicked element is a "Remove" button for a custom link.
		if (event.target.classList.contains('remove-custom-link')) {
			// Find the closest parent <li> element and remove it from the DOM.
			event.target.closest('li.link-item').remove();
			autoSaveAllLinks(false); // Auto-save after removing a link.
		}
		// Check if the clicked element is a checkbox for enabling/disabling a link.
		// This selector matches checkboxes for both predefined and custom links.
		else if (event.target.matches('.predefined-link-toggle, .custom-link-toggle')) {
			// The checkbox state is visually updated by the browser automatically.
			// We just need to auto-save the new state.
			autoSaveAllLinks(false);
		}
	});

	// --- Initial Load ---
	// Load links from storage (or defaults) when the page is ready.
	loadLinks();

}); // End of DOMContentLoaded listener
