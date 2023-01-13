function randomFromArray(array: any) {
	return array[Math.floor(Math.random() * array.length)];
}

export function getDefaultUserName() {
	const levels = randomFromArray([
		'Junior',
		'Senior',
		'10x',
		'Staff',
		'Rockstar',
		'Mid',
		'Basic ass'
	]);

	const roles = randomFromArray([
		'PM',
		'Developer',
		'Designer',
		'PO',
		'Scrum Master',
		'Enginner',
		"UX'er"
	]);

	return `${levels} ${roles}`;
}
