
const jsonGenericStatus = require('./json.status.generic');
const Request = require('./Request.class');
const DebugAndLog = require('./DebugAndLog.class');

/* 
Example Response
	statusCode: 404,
	headers: {
		"Access-Control-Allow-Origin": "*",
		"Content-Type": "application/json"
	},
	body: {
		message: "Not Found"
	}
*/
/**
 * Can be used to create a custom Response interface
 */
class Response {

	static #settings = {
		errorExpirationInSeconds: (60 * 3),
		routeExpirationInSeconds: 0,
	};

	static #genericJson = jsonGenericStatus;

	request = null;
	statusCode = 200;
	headers = {};
	body = null;

	/**
	 * @param {Request} request
	 * @param {{statusCode: number, headers: object, body: string|number|object|array }} obj Default structure.
	 */
	constructor(request, obj={}) {
		this.request = request;
		this.reset(obj);
	};

	static init = (options) => {
		if ( options?.settings ) {
			// merge settings using assign object
			this.#settings = Object.assign(this.#settings, options.settings);
		}
		if ( options?.genericJson ) {
			// merge settings using assign object
			this.#genericJson = Object.assign(this.#genericJson, options.genericJson);
		}
	};

	/**
	 * Reset all properties of the response back to default values except for 
	 * those properties specified in the object. Note that Request 
	 * cannot be reset.
	 * @param {{statusCode: number|string, headers: object, body: string|number|object|array}} obj
	 */
	reset = (obj) => {
		const { status200 } = Response.#genericJson;
		let newObj = {};
		newObj.statusCode = obj?.statusCode ?? status200.statusCode;
		newObj.headers = obj?.headers ?? status200.headers;
		newObj.body = obj?.body ?? status200.body;

		DebugAndLog.debug("Response Reset: ", newObj);

		this.set(newObj);
	};

	/**
	 * Set the properties of the response. This will override all properties
	 * except for Request which cannot be set.
	 * @param {{statusCode: number|string, headers: object, body: string|number|object|array}} obj 
	 */
	set = (obj) => {
		if (obj?.statusCode) this.statusCode = parseInt(obj.statusCode);
		if (obj?.headers) this.headers = obj.headers;
		if (obj?.body) this.body = obj.body;

		DebugAndLog.debug("Response Set: ", {s: this.statusCode, h: this.headers, b: this.body});
	}

	/**
	 * Add a header if it does not exist, if it exists then update the value
	 * @param {string} key 
	 * @param {string} value 
	 */
	addHeader = (key, value) => {
		this.headers[key] = value;
	}

	/**
	 * Send the response back to the client. If the body is an object or array, it will be stringified.
	 * If the body is a string or number and the Content-Type header is json, it will be placed as a single element in an array then stringified.
	 * If the body of the response is null it returns null
	 * A response log entry is also created and sent to CloudWatch.
	 * @returns {{statusCode: number, headers: object, body: string}} An object containing response data formatted to return from Lambda
	 */
	finalize = () => {

		let bodyAsString = null;

		DebugAndLog.debug("Body 0 ", this.body);
		DebugAndLog.debug("Stringified Body 0", bodyAsString);

		try {
			// if the header response type is not set, default to json
			if (!('Content-Type' in this.headers)) {
				this.headers['Content-Type'] = 'application/json';
			}

			// TODO If body is of type error then produce an internal error message and set status to 500

			if (this.body !== null) { // we'll keep null as null

				// if response type is JSON we need to make sure we respond with stringified json
				if (this.headers['Content-Type'] === 'application/json') {

					// body is a string or number, place in array
					if (typeof this.body === 'string' || typeof this.body === 'number') {
						this.body = `[${this.body}]`;
					}

					// body is presumably an object or array, so stringify
					bodyAsString = JSON.stringify(this.body);

				} else { // if response type is not json we need to respond with a string (or null but we already did a null check)
					bodyAsString = `${this.body}`;
				}
			}
		
		} catch (error) {
			/* Log the error */
			DebugAndLog.error(`500 | Error Creating Final Response: ${error.message}`, error.stack);
			this.reset(Response.#genericJson.status500);
			bodyAsString = JSON.stringify(this.body); // we reset to 500 so stringify it
		}

		this.addHeader('x-exec-ms', `${this.request.getExecutionTime()}`);

		DebugAndLog.debug("Body 1 ", this.body);
		DebugAndLog.debug("Stringified Body 1", bodyAsString);

		this.body = bodyAsString;

		if (this.statusCode >= 400) {
			this.addHeader("Expires", (new Date(Date.now() + ( Response.#settings.errorExpirationInSeconds * 1000))).toUTCString());
			this.addHeader("Cache-Control", "max-age="+Response.#settings.errorExpirationInSeconds);	
		} else if (Response.#settings.routeExpirationInSeconds > 0 ) {
			this.addHeader("Expires", (new Date(Date.now() + ( Response.#settings.routeExpirationInSeconds * 1000))).toUTCString());
			this.addHeader("Cache-Control", "max-age="+Response.#settings.routeExpirationInSeconds);
		}

		this._log();

		DebugAndLog.debug("Body 2", this.body);
		DebugAndLog.debug("Stringified Body 2", bodyAsString);

		return {
			statusCode: this.statusCode,
			headers: this.headers,
			body: this.body
		};
		
	};
	
	/** 
	 * Log the request to CloudWatch
	 * Formats a log entry parsing in CloudWatch Dashboard. 
	 */
	_log() {

		/* These are pushed onto the array in the same order that the CloudWatch
		query is expecting to parse out. 
		-- NOTE: If you add any here, be sure to update the Dashboard template --
		-- that parses response logs in template.yml !!                        --
		-- loggingType, statusCode, bodySize, execTime, clientIP, userAgent, origin, referrer, route, params, key
		*/

		const loggingType = "RESPONSE";
		const statusCode = this.statusCode;
		const bytes = this.body !== null ? Buffer.byteLength(this.body, 'utf8') : 0; // calculate byte size of response.body
		const execms = this.request.getExecutionTime();
		const clientIP = this.request.getClientIP();
		const userAgent = this.request.getClientUserAgent();
		const origin = this.request.getClientOrigin();
		const referrer = this.request.getClientReferer();
		const {resource, queryKeys, routeLog, queryLog, apiKey } = this.request.getRequestLog();

		let logFields = [];
		logFields.push(statusCode);
		logFields.push(bytes);
		logFields.push(execms);
		logFields.push(clientIP);
		logFields.push( (( userAgent !== "" && userAgent !== null) ? userAgent : "-").replace("|", "") ); // doubtful, but userAgent could have | which will mess with log fields
		logFields.push( (( origin !== "" && origin !== null) ? origin : "-") );
		logFields.push( (( referrer !== ""  && referrer !== null) ? referrer : "-") );
		logFields.push(resource); // path includes any path parameter keys (not values)
		logFields.push(queryKeys ? queryKeys : "-"); // just the keys used in query string (no values)
		logFields.push(routeLog ? routeLog : "-"); // custom set routePath with values
		logFields.push(queryLog ? queryLog : "-"); // custom set keys with values
		logFields.push(apiKey ? apiKey : "-");

		/* Join array together into single text string delimited by ' | ' */
		const msg = logFields.join(" | ");

		/* send it to CloudWatch via DebugAndLog.log() */
		DebugAndLog.log(msg, loggingType);
		console.log(msg);

	};
};

module.exports = Response;