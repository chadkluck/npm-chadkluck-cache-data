contentType = "application/rss+xml";

headers = {
	"Access-Control-Allow-Origin": "*",
	"Content-Type": contentType
};

rss = (body) => {
	return `<?xml version="1.0" encoding="UTF-8" ?><rss version="2.0">${body}</rss>`;
}

response200 = {
	statusCode: 200,
	headers: headers,
	body: rss("<hello>Success</hello>")
};

response404 = {
	statusCode: 404,
	headers: headers,
	body: rss("<error>Not Found</error>")
};

response500 = {
	statusCode: 500,
	headers: headers,
	body: rss("<error>Internal Server Error</error>")
};

/**
 * 
 * @param {number|string} statusCode 
 * @returns {{statusCode: number, headers: object, body: Array|Object|string}}
 */
response = function (statusCode) {
	// convert to int
	statusCode = parseInt(statusCode, 10);

	switch (statusCode) {
		case 200:
			return this.response200;
		case 404:
			return this.response404;
		case 500:
			return this.response500;
		default:
			return this.response500;
	}
};

module.exports = {
	contentType,
	headers,
	rss,
	response200,
	response404,
	response500,
	response
}