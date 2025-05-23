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
	const navElement = document.querySelector("#nav-xshop > ul.nav-ul")

	// Check if the navigation element is found
	// Error and exit if navigation element isn't found on the page
	if (!navElement) {
		console.error('Amazon Nav element not found');
		return
	}

	let taxIndex = links.length; // Start tabIndex from the number of links to be added

	// Create and insert new links in reverse order since they are inserted at the beginning
	[...links].reverse().forEach((element) => {
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

		// Insert the new link at the beginning of the navigation
		navElement.insertBefore(newLi, navElement.firstChild);
	});
}

addAnchorToNav();
