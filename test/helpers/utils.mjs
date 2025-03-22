// https://www.sitepoint.com/delay-sleep-pause-wait/
export function sleep (ms) {
	return new Promise(resolve => setTimeout(resolve, ms));
};