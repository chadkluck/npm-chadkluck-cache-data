exports.contentType = "text/html; charset=utf-8";

exports.headers = {
	"Access-Control-Allow-Origin": "*",
	"Content-Type": exports.contentType
};

exports.html = (title, body) => {
	return `<html><head><title>${title}</title></head><body>${body}</body></html>`;
}

exports.status200 = {
	statusCode: 200,
	headers: exports.headers,
	body: exports.html("200 OK", "<p>Success</p>")
};

exports.status404 = {
	statusCode: 404,
	headers: exports.headers,
	body: exports.html("404 Not Found", "<p>Not Found</p>")
};

exports.status500 = {
	statusCode: 500,
	headers: exports.headers,
	body: exports.html("500 Error", "<p>Internal Server Error</p>")
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