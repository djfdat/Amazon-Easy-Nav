/**
 * Adds new navigation links to Amazon's top navigation bar
 * Links are added at the beginning of the nav element
 * in reverse order to maintain desired sequence
 */
function addAnchorToNav() {
	chrome.storage.sync.get(['amazonEasyNavLinks'], (result) => {
		let activeLinks = [];
		const defaultPredefinedLinks = [
			{ name: "Returns", url: '/spr/returns/history', id: 'returns', enabled: true },
			{ name: "Support Call", url: '/gp/help/customer/express/c2c/popup.html', id: 'support', enabled: true }
		];

		let useDefaults = true;
		let saveDefaultsToStorage = false;

		if (result.amazonEasyNavLinks) {
			const { predefined, custom } = result.amazonEasyNavLinks;
			if (predefined && Array.isArray(predefined)) {
				predefined.forEach(link => {
					if (link.enabled) {
						activeLinks.push({ href: link.url, textContent: link.name, className: 'nav-a' });
					}
				});
			}
			if (custom && Array.isArray(custom)) {
				custom.forEach(link => {
					activeLinks.push({ href: link.url, textContent: link.name, className: 'nav-a' });
				});
			}

			if (activeLinks.length > 0) {
				useDefaults = false;
			} else {
				// Storage exists but is effectively empty (no enabled predefined, no custom)
				// Still use defaults, but don't necessarily overwrite storage unless it was completely empty.
				// The options page should ideally handle this, but to be safe,
				// we will save if result.amazonEasyNavLinks was literally undefined.
				// This logic is simplified to: if activeLinks is empty after processing, use and save defaults.
				saveDefaultsToStorage = true; // Overwrite with defaults if all were disabled/empty
			}
		} else {
			// No configuration found in storage at all, definitely use and save defaults.
			saveDefaultsToStorage = true;
		}

		if (useDefaults || activeLinks.length === 0) { // Ensure defaults are used if activeLinks is empty for any reason
			activeLinks = []; // Reset activeLinks to ensure only defaults are used
			defaultPredefinedLinks.forEach(link => {
				if (link.enabled) { // Check enabled, though for defaults it's always true
					activeLinks.push({ href: link.url, textContent: link.name, className: 'nav-a' });
				}
			});

			if (saveDefaultsToStorage) {
				chrome.storage.sync.set({
					amazonEasyNavLinks: {
						predefined: defaultPredefinedLinks, // Save the full default structure
						custom: []
					}
				}, () => {
					if (chrome.runtime.lastError) {
						console.error('ARIN: Error saving default links to storage:', chrome.runtime.lastError.message);
					} else {
						console.log('ARIN: Default links saved to storage.');
					}
				});
			}
		}

		if (activeLinks.length === 0) {
			console.log('ARIN: No active links to add.');
			return;
		}

		// Select Amazon's navigation container element
		const navElement = document.querySelector("#nav-xshop > ul.nav-ul")

		// Error and exit if navigation element isn't found on the page
		if (!navElement) {
			console.error('ARIN Nav element not found');
			return;
		}

		// Create and insert new links in reverse order since they are inserted at the beginning
		[...activeLinks].reverse().forEach((element) => {
			// Create new anchor element and assign properties
			// Create a new element li.nav-li > div.nav-div > a.nav-a
			const newLi = document.createElement('li');
			newLi.className = 'nav-li';

			const newDiv = document.createElement('div');
			newDiv.className = 'nav-div';

			const newLink = document.createElement('a');
			newLink.className = element.className;
			newLink.href = element.href;
			newLink.textContent = element.textContent;
			newLink.tabIndex = 0;

			newDiv.appendChild(newLink);
			newLi.appendChild(newDiv);
			navElement.insertBefore(newLi, navElement.firstChild);
		});
	});
}

addAnchorToNav();
