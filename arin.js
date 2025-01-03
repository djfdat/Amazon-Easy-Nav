// Define an array of link configurations to be added to the navigation
const links = [
	{
		href: '/spr/returns/history',
		textContent: 'Returns',
		className: 'nav-a'
	},
	{
		href: '/gp/help/customer/express/c2c/popup.html',
		textContent: 'Support Call',
		className: 'nav-a'
	}
]

/**
 * Adds new navigation links to Amazon's top navigation bar
 * Links are added at the beginning of the nav element
 * in reverse order to maintain desired sequence
 */
function addAnchorToNav() {
	// Select Amazon's navigation container element
	const navElement = document.getElementById('nav-xshop');

	// Error and exit if navigation element isn't found on the page
	if (!navElement) {
		console.error('ARIN Nav element not found');
		return
	}

	// Create and insert new links in reverse order since they are inserted at the beginning
	[...links].reverse().forEach((element) => {
		// Create new anchor element and assign properties from links array
		const newLink = Object.assign(document.createElement('a'), element);
		// Insert the new link at the beginning of the navigation
		navElement.insertBefore(newLink, navElement.firstChild);
	});
}

addAnchorToNav();
