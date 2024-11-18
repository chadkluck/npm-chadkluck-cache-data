contentType = "application/json"

headers = {
	"Access-Control-Allow-Origin": "*",
	"Content-Type": contentType
};

json = function (data = null) {
	return data ? data : {};
};

status200 = {
	statusCode: 200,
	headers: headers,
	body: {
		message: "Success"
	}
};

status404 = {
	statusCode: 404,
	headers: headers,
	body: {
		message: "Not Found"
	}
};

status500 = {
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
	json,
	status200,
	status404,
	status500,
	status
}