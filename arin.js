function addAnchorToNav() {
	console.log('ARIN script loaded');
	// Select the nav element using the specified id
	const navElement = document.getElementById('nav-xshop');

	// Check if the nav element exists
	if (!navElement) {
		console.log('ARIN Nav element not found');
		return
	}

	console.log('ARIN Nav element found:', navElement);

	const newAnchor = document.createElement('a');
	newAnchor.href = 'https://www.amazon.com/spr/returns/history';
	newAnchor.textContent = 'Returns';
	newAnchor.className = 'nav-a';
	navElement.insertBefore(newAnchor, navElement.firstChild);
}

addAnchorToNav()
