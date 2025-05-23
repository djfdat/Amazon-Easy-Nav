/**
 * arin.js
 *
 * Content script for the Amazon Easy Nav extension.
 * This script is injected into Amazon pages. Its primary role is to:
 *  1. Fetch the user's configured navigation links (both predefined and custom)
 *     from Chrome's synchronized storage.
 *  2. Dynamically create and insert these links into the main Amazon navigation bar
 *     (identified by the ID 'nav-xshop').
 *  3. Handle cases where no configuration is found by using a default set of links
 *     and saving these defaults back to storage for future use.
 */

/**
 * Fetches link configurations from `chrome.storage.sync` and adds the enabled links
 * to Amazon's main navigation bar.
 *
 * Side effects:
 *  - Reads from `chrome.storage.sync` to get the 'allUserLinks' configuration.
 *  - If no configuration is found or it's empty, it may write a default set of links
 *    back to `chrome.storage.sync`.
 *  - Modifies the DOM on the current Amazon page by inserting new anchor (<a>) elements
 *    into the navigation bar ('nav-xshop').
 *  - Logs messages to the console (errors, warnings, or informational).
 */
function addAnchorToNav() {
	// Attempt to retrieve the user's saved link configuration from Chrome's synchronized storage.
	// 'allUserLinks' is expected to be an array of link objects.
	chrome.storage.sync.get(['allUserLinks'], (result) => {
		// This callback function is executed once the data is fetched.
		// 'result' is an object where result.allUserLinks contains the fetched data.

		let linksToProcess = result.allUserLinks; // The array of links to consider for display.
		let mustSaveDefaults = false; // Flag to indicate if default links need to be saved back to storage.

		// --- Determine Links to Process: Use Stored or Defaults ---
		// Check if `linksToProcess` (from storage) is a valid, non-empty array.
		// If not (e.g., first time use, or storage was cleared), set up default links.
		if (!Array.isArray(linksToProcess) || linksToProcess.length === 0) {
			// Define the default set of links. These are predefined links that the user can enable/disable.
			// Structure per link: { type, id, name, url, enabled, originalIndex }
			linksToProcess = [
				{ type: "predefined", id: "returns", name: "Returns", url: "/spr/returns/history", enabled: true, originalIndex: 0 },
				{ type: "predefined", id: "support", name: "Support Call", url: "/gp/help/customer/express/c2c/popup.html", enabled: true, originalIndex: 1 }
			];
			// Since we're using defaults, mark that they should be saved to storage
			// so the options page can pick them up and the user sees a consistent state.
			mustSaveDefaults = true;
		}

		// --- Filter and Prepare Links for DOM Insertion ---
		const navLinksToAdd = []; // Array to hold the link objects that will actually be added to the nav bar.

		// Iterate over the `linksToProcess` array.
		linksToProcess.forEach(link => {
			// A link (either predefined or custom) is added to the navigation bar only if it's marked as 'enabled'.
			// The 'options.js' script ensures that all links in storage have an 'enabled' property
			// (defaulting to true for new custom links or those migrated from older versions).
			if (link.enabled === true) {
				// Additionally, ensure the link object has the essential 'url' and 'name' properties
				// before attempting to create an HTML element from it. This is a robustness check.
				if (link.url && link.name) {
					navLinksToAdd.push({
						href: link.url,
						textContent: link.name,
						className: 'nav-a' // Standard Amazon class for navigation links.
					});
				} else {
					// Log a warning if a link object is missing critical data.
					console.warn('ARIN: Link object missing url or name, skipping:', link);
				}
			}
		});

		// --- DOM Manipulation: Add Filtered Links to Nav Bar ---
		// Proceed only if there are actual links to add after filtering.
		if (navLinksToAdd.length > 0) {
			// Try to find Amazon's main navigation bar element by its ID 'nav-xshop'.
			const navElement = document.querySelector("#nav-xshop > ul.nav-ul")

			if (!navElement) {
				// If the navigation bar element isn't found, log an error and stop.
				// This might happen if Amazon changes its page structure.
				console.error('ARIN: Amazon navigation element (nav-xshop) not found on this page.');
				return;
			}

			// Add the links to the navigation bar.
			// The links are reversed before iterating because `insertBefore(newLink, navElement.firstChild)`
			// adds each new link at the beginning of the nav bar.
			// Reversing ensures that the links appear in the order they were defined in `navLinksToAdd`.
			[...navLinksToAdd].reverse().forEach(linkData => {
				// Create new anchor element and assign properties
				// Create a new element li.nav-li > div.nav-div > a.nav-a
				const newLi = document.createElement('li');
				newLi.className = 'nav-li';
				newLi.style.listStyleType = 'none';

				const newDiv = document.createElement('div');
				newDiv.className = 'nav-div';

				const newLink = Object.assign(document.createElement('a'), linkData);
				newLink.tabIndex = 0;

				newDiv.appendChild(newLink);
				newLi.appendChild(newDiv);

				navElement.insertBefore(newLi, navElement.firstChild);
			});
		} else {
			// Log an informational message if no links are active/enabled.
			console.log('ARIN: No active links to add to the navigation bar.');
		}

		// --- Save Defaults if Necessary ---
		// If default links were used (because storage was empty or invalid),
		// save them back to storage now. This ensures consistency with the options page.
		if (mustSaveDefaults) {
			chrome.storage.sync.set({ allUserLinks: linksToProcess }, () => {
				// Callback for the save operation.
				if (chrome.runtime.lastError) {
					// Log an error if saving fails.
					console.error('ARIN: Error saving default links to storage (allUserLinks):', chrome.runtime.lastError.message);
				} else {
					// Log success if defaults are saved.
					console.log('ARIN: Default links saved to storage (allUserLinks).');
				}
			});
		}
	}); // End of chrome.storage.sync.get callback
} // End of addAnchorToNav function

// Execute the main function to add links when the script runs.
addAnchorToNav();
