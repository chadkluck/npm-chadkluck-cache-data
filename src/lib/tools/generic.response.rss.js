contentType = "application/rss+xml";

headers = {
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

response400 = {
	statusCode: 400,
	headers: headers,
	body: rss("<error>Bad Request</error>")
};

response401 = {
	statusCode: 401,
	headers: headers,
	body: rss("<error>Unauthorized</error>")
};

response403 = {
	statusCode: 403,
	headers: headers,
	body: rss("<error>Forbidden</error>")
};

response404 = {
	statusCode: 404,
	headers: headers,
	body: rss("<error>Not Found</error>")
};

response405 = {
	statusCode: 405,
	headers: headers,
	body: rss("<error>Method Not Allowed</error>")
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
		case 400:
			return this.response400;
		case 401:
			return this.response401;
		case: 403:
			return this.response403;
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