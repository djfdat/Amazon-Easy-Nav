// class Link {
// 	href//: string;
// 	textContent//: string;
// 	className//: string;
// }

const links = [  //: Link[] = [
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

function addAnchorToNav() {

	// Select the nav element using the specified id
	const navElement = document.getElementById('nav-xshop');

	// Check if the nav element exists
	if (!navElement) {
		console.error('ARIN Nav element not found');
		return
	}

	[...links].reverse().forEach((element) => {
		const newLink = Object.assign(document.createElement('a'), element);
		navElement.insertBefore(newLink, navElement.firstChild);
	});
}

addAnchorToNav();
