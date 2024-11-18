contentType = "text/html; charset=utf-8";

headers = {
	"Access-Control-Allow-Origin": "*",
	"Content-Type": contentType
};

html = (title, body) => {
	return `<html><head><title>${title}</title></head><body>${body}</body></html>`;
}

status200 = {
	statusCode: 200,
	headers: headers,
	body: html("200 OK", "<p>Success</p>")
};

status404 = {
	statusCode: 404,
	headers: headers,
	body: html("404 Not Found", "<p>Not Found</p>")
};

status500 = {
	statusCode: 500,
	headers: headers,
	body: html("500 Error", "<p>Internal Server Error</p>")
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
	html,
	status200,
	status404,
	status500,
	status
}