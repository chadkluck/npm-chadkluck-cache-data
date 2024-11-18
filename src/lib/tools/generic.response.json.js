contentType = "application/json"

headers = {
	"Access-Control-Allow-Origin": "*",
	"Content-Type": contentType
};

json = function (data = null) {
	return data ? data : {};
};

response200 = {
	statusCode: 200,
	headers: headers,
	body: {
		message: "Success"
	}
};

response404 = {
	statusCode: 404,
	headers: headers,
	body: {
		message: "Not Found"
	}
};

response500 = {
	statusCode: 500,
	headers: headers,
	body: {
		message: "Internal Server Error"
	}
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
	json,
	response200,
	response404,
	response500,
	response
}