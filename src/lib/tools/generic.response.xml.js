exports.contentType = "application/xml";

exports.headers = {
	"Content-Type": exports.contentType
};

exports.xml = (body) => {
	return `<?xml version="1.0" encoding="UTF-8" ?>${body}`;
}

exports.status200 = {
	statusCode: 200,
	headers: exports.headers,
	body: exports.xml("<hello>Success</hello>")
};

exports.status404 = {
	statusCode: 404,
	headers: exports.headers,
	body: exports.xml("<error>Not Found</error>")
};

exports.status500 = {
	statusCode: 500,
	headers: exports.headers,
	body: exports.xml("<error>Internal Server Error</error>")
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