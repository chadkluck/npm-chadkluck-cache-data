exports.contentType = "application/json"
exports.headers = {
	"Access-Control-Allow-Origin": "*",
	"Content-Type": contentType
};

exports.status200 = {
	statusCode: 200,
	headers: headers,
	body: {
		message: "Success"
	}
};

exports.status404 = {
	statusCode: 404,
	headers: headers,
	body: {
		message: "Not Found"
	}
};

exports.status500 = {
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