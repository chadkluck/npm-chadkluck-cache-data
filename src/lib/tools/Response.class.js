
const jsonGenericResponse = require('./generic.response.json');
const htmlGenericResponse = require('./generic.response.html');
const rssGenericResponse = require('./generic.response.rss');
const xmlGenericResponse = require('./generic.response.xml');
const textGenericResponse = require('./generic.response.text');
const ClientRequest = require('./ClientRequest.class');
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

	static #isInitialized = false;

	static #jsonResponses = jsonGenericResponse;
	static #htmlResponses = htmlGenericResponse;
	static #rssResponses = rssGenericResponse;
	static #xmlResponses = xmlGenericResponse;
	static #textResponses = textGenericResponse;

	static CONTENT_TYPE = {
		JSON: Response.#jsonResponses.contentType,
		HTML: Response.#htmlResponses.contentType,
		XML: Response.#xmlResponses.contentType,
		RSS: Response.#rssResponses.contentType,
		TEXT: Response.#textResponses.contentType,
		JAVASCRIPT: 'application/javascript',
		CSS: 'text/css',
		CSV: 'text/csv'
	};

	static #settings = {
		errorExpirationInSeconds: (60 * 3),
		routeExpirationInSeconds: 0,
		contentType: Response.CONTENT_TYPE.JSON
	};

	_clientRequest = null;
	_statusCode = 200;
	_headers = {};
	_body = null;

	/**
	 * @param {ClientRequest} clientRequest
	 * @param {{statusCode: number, headers: object, body: string|number|object|array }} obj Default structure.
	 */
	constructor(clientRequest, obj = {}, contentType = null) {
		this._clientRequest = clientRequest;
		this.reset(obj, contentType);
	};

	/**
	 * @typedef statusResponseObject
	 * @property {number} statusCode
	 * @property {object} headers
	 * @property {object|array} body
	 */

	/**
	 * Initialize the Response class for all responses.
	 * Add Response.init(options) to the Config.init process or at the
	 * top of the main index.js file outside of the handler.
	 * @param {number} options.settings.errorExpirationInSeconds
	 * @param {number} options.settings.routeExpirationInSeconds
	 * @param {string} options.settings.contentType Any one of available Response.CONTENT_TYPE values
	 * @param {{status200: statusResponseObject, status404: statusResponseObject, status500: statusResponseObject}} options.jsonResponses
	 */
	static init = (options) => {
		if (!Response.#isInitialized) {

			Response.#isInitialized = true;

			if ( options?.settings ) {
				// merge settings using assign object
				this.#settings = Object.assign(Response.#settings, options.settings);
			}
			if ( options?.jsonResponses ) {
				// merge settings using assign object
				Response.#jsonResponses = Object.assign(Response.#jsonResponses, options.jsonResponses);
			}

			if ( options?.htmlResponses ) {
				// merge settings using assign object
				Response.#htmlResponses = Object.assign(Response.#htmlResponses, options.htmlResponses);
			}
			
			if ( options?.xmlResponses ) {
				// merge settings using assign object
				Response.#xmlResponses = Object.assign(Response.#xmlResponses, options.xmlResponses);
			}

			if ( options?.rssResponses ) {
				// merge settings using assign object
				Response.#rssResponses = Object.assign(Response.#rssResponses, options.rssResponses);
			}

			if ( options?.textResponses ) {
				// merge settings using assign object
				Response.#textResponses = Object.assign(Response.#textResponses, options.textResponses);
			}
		}

	};

	/**
	 * Reset all properties of the response back to default values except for 
	 * those properties specified in the object. Note that ClientRequest 
	 * cannot be reset.
	 * @param {{statusCode: number|string, headers: object, body: string|number|object|array}} obj
	 * @param {string} contentType Accepted values may be obtained from Response.CONTENT_TYPES[JSON|HTML|XML|RSS|TEXT]
	 */
	reset = (obj, contentType = null) => {

		let newObj = {};

		newObj.statusCode = obj?.statusCode ?? 200;

		if (contentType === null) {
			const result = Response.inspectContentType(obj);
			contentType = (result !== null) ? result : Response.#settings.contentType;
		}

		const genericResponses = Response.getGenericResponses(contentType);

		newObj.headers = obj?.headers ?? genericResponses.status(newObj.statusCode).headers;
		newObj.body = obj?.body ?? genericResponses.status(newObj.statusCode).body;

		this.set(newObj, contentType);
	};

	/**
	 * Set the properties of the response. This will overwrite only properties
	 * supplied in the new object. Use .reset if you wish to clear out all properties even
	 * if not explicitly set in the object. ClientRequest cannot be set.
	 * @param {{statusCode: number|string, headers: object, body: string|number|object|array}} obj 
	 */
	set = (obj, contentType = null) => {

		if (contentType === null) {
			const result = Response.inspectContentType(obj);
			const thisResult = this.inspectContentType();
			contentType = result || thisResult || Response.#settings.contentType;
		}

		if (obj?.statusCode) this._statusCode = parseInt(obj.statusCode);
		if (obj?.headers) this._headers = obj.headers;
		if (obj?.body) this._body = obj.body;

		this.addHeader('Content-Type', contentType);
	}

	getStatusCode = () => {
		return this._statusCode;
	};

	getHeaders = () => {
		return this._headers;
	};

	getBody = () => {
		return this._body;
	};

	static getContentType() {
		return Response.#settings.contentType;
	};

	static getErrorExpirationInSeconds() {
		return Response.#settings.errorExpirationInSeconds;
	};
	
	static getRouteExpirationInSeconds() {
		return Response.#settings.routeExpirationInSeconds;
	};

	static inspectContentType = (obj) => {
		const headerResult = Response.inspectHeaderContentType(obj.headers);
		const bodyResult = Response.inspectBodyContentType(obj.body);
		return (headerResult !== null) ? headerResult : bodyResult;
	}

	static inspectBodyContentType = (body) => {
		if (body !== null) {
			if (typeof body === 'string') {
				if (body.includes('</html>')) {
					return Response.CONTENT_TYPE.HTML;
				} else if (body.includes('</rss>')) {
					return Response.CONTENT_TYPE.RSS;
				} else if (body.includes('<?xml')) {
					return Response.CONTENT_TYPE.XML;
				} else {
					return Response.CONTENT_TYPE.TEXT;
				}
			} else {
				return Response.CONTENT_TYPE.JSON;
			}
		}
		return null;
	}

	static inspectHeaderContentType = (headers) => {
		return (headers && 'Content-Type' in headers ? headers['Content-Type'] : null);
	}

	inspectContentType = () => {
		return Response.inspectContentType({headers: this._headers, body: this._body});
	}

	inspectBodyContentType = () => {
		return Response.inspectBodyContentType(this._body);
	}

	inspectHeaderContentType = () => {
		return Response.inspectHeaderContentType(this._headers);
	}

	getContentType = () => {
		// Default content type is JSON
		let contentType = Response.#settings.contentType;
		
		// Check if Content-Type header exists
		if ('Content-Type' in this._headers) {
			// If header exists but doesn't include 'application/json', return HTML, otherwise return JSON
			if (!this._headers['Content-Type'].includes(Response.CONTENT_TYPE.JSON)) {
				contentType = Response.CONTENT_TYPE.HTML;
			}
		} else if (this._body !== null && typeof this._body === 'string') {
			// If body is a string and includes '<html>', return HTML
			if (this._body.includes('<html>')) {
				contentType = Response.CONTENT_TYPE.HTML;
			} else {
				// TODO FUTURE: we could go through TEXT, CSS, JAVASCRIPT, etc
				contentType = Response.CONTENT_TYPE.HTML;
			}
		}
		
		return contentType;
	};
	
	getContentTypeCode = () => {
		const contentTypeStr = this.getContentType();
		const contentTypeCodes = Object.keys(Response.CONTENT_TYPE);
		// loop through CONTENT_TYPE and find the index of the contentTypeStr
		for (let i = 0; i < contentTypeCodes.length; i++) {
			if (Response.CONTENT_TYPE[contentTypeCodes[i]] === contentTypeStr) {
				return contentTypeCodes[i];
			}
		}
	}

	setStatusCode = (statusCode) => {
		this.set({statusCode: statusCode});
	};

	setHeaders = (headers) => {
		this.set({headers: headers});
	};

	setBody = (body) => {
		this.set({body: body});
	};

	static getGenericResponses = (contentType) => {
		if (contentType === Response.CONTENT_TYPE.JSON || contentType === 'JSON') {
			return Response.#jsonResponses;
		} else if (contentType === Response.CONTENT_TYPE.HTML || contentType === 'HTML') {
			return Response.#htmlResponses;
		} else if (contentType === Response.CONTENT_TYPE.RSS || contentType === 'RSS') {
			return Response.#rssResponses;
		} else if (contentType === Response.CONTENT_TYPE.XML || contentType === 'XML') {
			return Response.#xmlResponses;
		} else if (contentType === Response.CONTENT_TYPE.TEXT || contentType === 'TEXT') {
			return Response.#textResponses;
		} else {
			throw new Error(`Content Type: ${contentType} is not implemented for getResponses. Response.CONTENT_TYPES[JSON|HTML|XML|RSS|TEXT] must be used. Perform a custom implementation by extending the Response class.`);
		}
	}

	/**
	 * Add a header if it does not exist, if it exists then update the value
	 * @param {string} key 
	 * @param {string} value 
	 */
	addHeader = (key, value) => {
		this._headers[key] = value;
	};

	addToJsonBody = (obj) => {
		if (typeof this._body === 'object') {
			this._body = Object.assign(this._body, obj);
		}
	};

	/**
	 * Send the response back to the client. If the body is an object or array, it will be stringified.
	 * If the body is a string or number and the Content-Type header is json, it will be placed as a single element in an array then stringified.
	 * If the body of the response is null it returns null
	 * A response log entry is also created and sent to CloudWatch.
	 * @returns {{statusCode: number, headers: object, body: string}} An object containing response data formatted to return from Lambda
	 */
	finalize = () => {

		let bodyAsString = null;

		try {
			// if the header response type is not set, determine from contents of body. default to json
			if (!('Content-Type' in this._headers)) {
				this._headers['Content-Type'] = this.getContentType();
			}

			// If body is of type error then set status to 500
			if (this._body instanceof Error) {
				this.reset({statusCode: 500});
			}

			if (this._body !== null) { // we'll keep null as null

				// if response type is JSON we need to make sure we respond with stringified json
				if (this._headers['Content-Type'] === Response.CONTENT_TYPE.JSON) {

					// body is a string or number, place in array (unless the number is 404, then that signifies not found)
					if (typeof this._body === 'string' || typeof this._body === 'number') {
						if (this._body === 404) {
							this.reset({statusCode: 404});
						} else {
							this._body = [this._body];
						}
					}

					// body is presumably an object or array, so stringify
					bodyAsString = JSON.stringify(this._body);

				} else { // if response type is not json we need to respond with a string (or null but we already did a null check)
					bodyAsString = `${this._body}`;
				}
			}
		
		} catch (error) {
			/* Log the error */
			DebugAndLog.error(`Error Finalizing Response: ${error.message}`, error.stack);
			this.reset({statusCode: 500});
			bodyAsString = JSON.stringify(this._body); // we reset to 500 so stringify it
		}

		if (ClientRequest.requiresValidReferrer()) {
			this.addHeader("Referrer-Policy", "strict-origin-when-cross-origin");
			this.addHeader("Vary", "Origin");
			this.addHeader("Access-Control-Allow-Origin", `https://${this._clientRequest.getClientReferrer()}`);
		} else {
			this.addHeader("Access-Control-Allow-Origin", "*");
		}

		if (this._statusCode >= 400) {
			this.addHeader("Expires", (new Date(Date.now() + ( Response.#settings.errorExpirationInSeconds * 1000))).toUTCString());
			this.addHeader("Cache-Control", "max-age="+Response.#settings.errorExpirationInSeconds);	
		} else if (Response.#settings.routeExpirationInSeconds > 0 ) {
			this.addHeader("Expires", (new Date(Date.now() + ( Response.#settings.routeExpirationInSeconds * 1000))).toUTCString());
			this.addHeader("Cache-Control", "max-age="+Response.#settings.routeExpirationInSeconds);
		}

		this.addHeader('x-exec-ms', `${this._clientRequest.getExecutionTime()}`);

		this._log(bodyAsString);

		return {
			statusCode: this._statusCode,
			headers: this._headers,
			body: bodyAsString
		};
		
	};
	
	/** 
	 * Log the ClientRequest and Response to CloudWatch
	 * Formats a log entry parsing in CloudWatch Dashboard. 
	 */
	_log(bodyAsString) {

		/* These are pushed onto the array in the same order that the CloudWatch
		query is expecting to parse out. 
		-- NOTE: If you add any here, be sure to update the Dashboard template --
		-- that parses response logs in template.yml !!                        --
		-- loggingType, statusCode, bodySize, execTime, clientIP, userAgent, origin, referrer, route, params, key
		*/

		const loggingType = "RESPONSE";
		const statusCode = this._statusCode;
		const bytes = this._body !== null ? Buffer.byteLength(bodyAsString, 'utf8') : 0; // calculate byte size of response.body
		const contentType = this.getContentTypeCode();
		const execms = this._clientRequest.getExecutionTime();
		const clientIp = this._clientRequest.getClientIp();
		const userAgent = this._clientRequest.getClientUserAgent();
		const origin = this._clientRequest.getClientOrigin();
		const referrer = this._clientRequest.getClientReferrer(true);
		const {resource, queryKeys, routeLog, queryLog, apiKey } = this._clientRequest.getRequestLog();

		let logFields = [];
		logFields.push(statusCode);
		logFields.push(bytes);
		logFields.push(contentType);
		logFields.push(execms);
		logFields.push(clientIp);
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

	};
};

module.exports = Response;