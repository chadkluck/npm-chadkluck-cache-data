exports.rss = (body) => {
	return `<?xml version="1.0" encoding="UTF-8" ?><rss version="2.0">${body}</rss>`;
}

exports.contentType = "application/rss+xml";
exports.headers = {
	"Access-Control-Allow-Origin": "*",
	"Content-Type": contentType
};

exports.status200 = {
	statusCode: 200,
	headers: headers,
	body: rss("<hello>Success</hello>")
};

exports.status404 = {
	statusCode: 404,
	headers: headers,
	body: rss("<error>Not Found</error>")
};

exports.status500 = {
	statusCode: 500,
	headers: headers,
	body: rss("<error>Internal Server Error</error>")
};

/**
 * 
 * @param {number|string} statusCode 
 * @returns {{statusCode: number, headers: object, body: Array|Object|string}}
 */
exports.status = function (statusCode) {
	// convert to int
	statusCode = parseInt(statusCode, 10);

	switch (statusCode) {
		case 200:
			return exports.status200;
		case 404:
			return exports.status404;
		case 500:
			return exports.status500;
		default:
			return exports.status500;
	}
};