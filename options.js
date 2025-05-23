document.addEventListener('DOMContentLoaded', () => {
	const returnsCheckbox = document.getElementById('returns');
	const supportCheckbox = document.getElementById('support');
	const linkNameInput = document.getElementById('linkName');
	const linkUrlInput = document.getElementById('linkUrl');
	const addLinkButton = document.getElementById('addLink');
	const customLinksList = document.getElementById('customLinksList');
	const saveOptionsButton = document.getElementById('saveOptions');
	const statusMessageElement = document.createElement('span'); // For save status
	saveOptionsButton.parentNode.insertBefore(statusMessageElement, saveOptionsButton.nextSibling);

	const PREDEFINED_LINKS_CONFIG = [
		{ name: "Returns", url: "/spr/returns/history", id: "returns" },
		{ name: "Support Call", url: "/gp/help/customer/express/c2c/popup.html", id: "support" }
	];

	const STORAGE_KEY = 'amazonEasyNavLinks';

	// Load saved options
	function loadOptions() {
		chrome.storage.sync.get([STORAGE_KEY], (result) => {
			const savedConfig = result[STORAGE_KEY];

			customLinksList.innerHTML = ''; // Clear current custom links list

			if (savedConfig && savedConfig.predefined) {
				savedConfig.predefined.forEach(pLink => {
					const checkbox = document.getElementById(pLink.id);
					if (checkbox) {
						checkbox.checked = pLink.enabled;
					}
				});
			} else {
				// Default: enable all predefined links
				returnsCheckbox.checked = true;
				supportCheckbox.checked = true;
			}

			if (savedConfig && savedConfig.custom) {
				savedConfig.custom.forEach(cLink => {
					addLinkToDisplayList(cLink.name, cLink.url);
				});
			}
		});
	}

	// Add a link to the visual list in options.html
	function addLinkToDisplayList(name, url) {
		const listItem = document.createElement('li');
		listItem.textContent = `${name} (${url}) `;

		const removeButton = document.createElement('button');
		removeButton.textContent = 'Remove';
		removeButton.addEventListener('click', () => {
			listItem.remove();
			// No immediate save on remove, user must click "Save Options"
		});

		listItem.appendChild(removeButton);
		customLinksList.appendChild(listItem);
	}

	// Handle adding a new custom link
	function handleAddLink() {
		const name = linkNameInput.value.trim();
		const url = linkUrlInput.value.trim();

		if (!name || !url) {
			alert("Link name and URL cannot be empty.");
			return;
		}
		addLinkToDisplayList(name, url);
		linkNameInput.value = ''; // Clear input fields
		linkUrlInput.value = '';
	}

	// Display status message
	function showStatusMessage(message, isError = false) {
		statusMessageElement.textContent = message;
		statusMessageElement.style.color = isError ? 'red' : 'green';
		setTimeout(() => {
			statusMessageElement.textContent = '';
		}, 3000);
	}

	// Save options
	function saveOptions() {
		const currentPredefinedLinks = PREDEFINED_LINKS_CONFIG.map(pLink => ({
			...pLink,
			enabled: document.getElementById(pLink.id).checked
		}));

		const currentCustomLinks = [];
		customLinksList.querySelectorAll('li').forEach(item => {
			const text = item.textContent.replace(' Remove', '');
			const match = text.match(/(.*?) \((.*?)\)/);
			if (match && match[1] && match[2]) {
				currentCustomLinks.push({ name: match[1], url: match[2] });
			}
		});

		const newConfig = {
			predefined: currentPredefinedLinks,
			custom: currentCustomLinks
		};

		chrome.storage.sync.set({ [STORAGE_KEY]: newConfig }, () => {
			if (chrome.runtime.lastError) {
				showStatusMessage('Error saving options: ' + chrome.runtime.lastError.message, true);
			} else {
				showStatusMessage('Options saved!', false);
			}
		});
	}

	// Event Listeners
	addLinkButton.addEventListener('click', handleAddLink);
	saveOptionsButton.addEventListener('click', saveOptions);

	// Initial load
	loadOptions();
});
