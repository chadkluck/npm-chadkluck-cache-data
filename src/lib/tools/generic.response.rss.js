contentType = "application/rss+xml";

headers = {
	"Access-Control-Allow-Origin": "*",
	"Content-Type": contentType
};

rss = (body) => {
	return `<?xml version="1.0" encoding="UTF-8" ?><rss version="2.0">${body}</rss>`;
}

status200 = {
	statusCode: 200,
	headers: headers,
	body: rss("<hello>Success</hello>")
};

status404 = {
	statusCode: 404,
	headers: headers,
	body: rss("<error>Not Found</error>")
};

status500 = {
	statusCode: 500,
	headers: headers,
	body: rss("<error>Internal Server Error</error>")
};

/**
 * 
 * @param {number|string} statusCode 
 * @returns {{statusCode: number, headers: object, body: Array|Object|string}}
 */
status = function (statusCode) {
	// convert to int
	statusCode = parseInt(statusCode, 10);

	switch (statusCode) {
		case 200:
			return this.status200;
		case 404:
			return this.status404;
		case 500:
			return this.status500;
		default:
			return this.status500;
	}
};

module.exports = {
	contentType,
	headers,
	rss,
	status200,
	status404,
	status500,
	status
}