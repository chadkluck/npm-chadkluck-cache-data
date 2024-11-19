contentType = "text/html; charset=utf-8";

headers = {
	"Content-Type": contentType
};

html = (title, body) => {
	return `<html><head><title>${title}</title></head><body>${body}</body></html>`;
}

response200 = {
	statusCode: 200,
	headers: headers,
	body: html("200 OK", "<p>Success</p>")
};

response404 = {
	statusCode: 404,
	headers: headers,
	body: html("404 Not Found", "<p>Not Found</p>")
};

response500 = {
	statusCode: 500,
	headers: headers,
	body: html("500 Error", "<p>Internal Server Error</p>")
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
	html,
	response200,
	response404,
	response500,
	response
}