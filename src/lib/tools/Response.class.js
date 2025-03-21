
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
	 * @param {{response200: statusResponseObject, response404: statusResponseObject, response500: statusResponseObject}} options.jsonResponses
	 */
	static init = (options) => {
		if (!Response.#isInitialized) {

			Response.#isInitialized = true;

			if ( options?.settings ) {
				// merge settings using assign object
				//this.#settings = Object.assign({}, Response.#settings, options.settings);
				Response.#settings = { ...Response.#settings, ...options.settings };
			}
			if ( options?.jsonResponses ) {
				// merge settings using assign object
				//Response.#jsonResponses = Object.assign({}, Response.#jsonResponses, options.jsonResponses);
				Response.#jsonResponses = { ...Response.#jsonResponses, ...options.jsonResponses };
			}

			if ( options?.htmlResponses ) {
				// merge settings using assign object
				//Response.#htmlResponses = Object.assign({}, Response.#htmlResponses, options.htmlResponses);
				Response.#htmlResponses = { ...Response.#htmlResponses, ...options.htmlResponses };
			}
			
			if ( options?.xmlResponses ) {
				// merge settings using assign object
				//Response.#xmlResponses = Object.assign({}, Response.#xmlResponses, options.xmlResponses);
				Response.#htmlResponses = { ...Response.#xmlResponses, ...options.xmlResponses };
			}

			if ( options?.rssResponses ) {
				// merge settings using assign object
				//Response.#rssResponses = Object.assign({}, Response.#rssResponses, options.rssResponses);
				Response.#rssResponses = { ...Response.#rssResponses, ...options.rssResponses };
			}

			if ( options?.textResponses ) {
				// merge settings using assign object
				//Response.#textResponses = Object.assign({}, Response.#textResponses, options.textResponses);
				Response.#textResponses = { ...Response.#textResponses, ...options.textResponses };
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

		newObj.headers = obj?.headers ?? genericResponses.response(newObj.statusCode).headers;
		newObj.body = obj?.body ?? genericResponses.response(newObj.statusCode).body;

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

	/**
	 * 
	 * @returns {number} Current statusCode of the Response
	 */
	getStatusCode = () => {
		return this._statusCode;
	};

	/**
	 * 
	 * @returns {object} Current headers of the Response
	 */
	getHeaders = () => {
		return this._headers;
	};

	/**
	 * 
	 * @returns {object|array|string|number|null} Current body of the Response
	 */
	getBody = () => {
		return this._body;
	};

	/**
	 * 
	 * @returns {string} Current ContentType of the Response
	 */
	static getContentType() {
		return Response.#settings.contentType;
	};

	/**
	 *
	 * @returns {number} Current errorExpirationInSeconds of the Response
	 */
	static getErrorExpirationInSeconds() {
		return Response.#settings.errorExpirationInSeconds;
	};
	
	/**
	 *
	 * @returns {number} Current routeExpirationInSeconds of the Response
	 */
	static getRouteExpirationInSeconds() {
		return Response.#settings.routeExpirationInSeconds;
	};

	/**
	 * Static method to inspect the body and headers to determine the ContentType. Used by the internal methods.
	 * @param {{headers: object, body: object|array|string|number|null}} obj Object to inspect
	 * @returns {string|null} The ContentType as determined after inspecting the headers and body
	 */
	static inspectContentType = (obj) => {
		const headerResult = Response.inspectHeaderContentType(obj.headers);
		const bodyResult = Response.inspectBodyContentType(obj.body);
		return (headerResult !== null) ? headerResult : bodyResult;
	}

	/**
	 * Static method to inspect the body to determine the ContentType. Used by the internal methods.
	 * @param {object|array|string|number|null} body 
	 * @returns {string|null} The ContentType as determined after inspecting just the body
	 */
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

	/**
	 * Static method to inspect the headers to determine the ContentType. Used by the internal methods.
	 * @param {object} headers
	 * @returns {string|null} The ContentType as determined after inspecting just the headers
	 */
	static inspectHeaderContentType = (headers) => {
		return (headers && 'Content-Type' in headers ? headers['Content-Type'] : null);
	}

	/**
	 * Inspect the content type of this Response. Passes this headers and this body to the static method
	 * @returns {string|null} The ContentType as determined after inspecting the headers and body
	 */
	inspectContentType = () => {
		return Response.inspectContentType({headers: this._headers, body: this._body});
	}

	/**
	 * Inspect the body to determine the ContentType. Passes this body to the static method
	 * @returns {string} ContentType string value determined from the current body
	 */
	inspectBodyContentType = () => {
		return Response.inspectBodyContentType(this._body);
	}

	/**
	 * Inspect the headers to determine the ContentType. Passes this headers to the static method
	 * @returns {string} ContentType string value determined from the current headers
	 */
	inspectHeaderContentType = () => {
		return Response.inspectHeaderContentType(this._headers);
	}

	/**
	 * Get the current ContentType of the response. Inspects headers and body to determine ContentType. Returns the default from init if none is determined.
	 * @returns {string} ContentType string value determined from the header or current body
	 */
	getContentType = () => {
		// Default content type is JSON
		let defaultContentType = Response.#settings.contentType;
		let contentType = this.inspectContentType();
		if (contentType === null) {
			contentType = defaultContentType;
		}
		return contentType;
	};
	
	/**
	 * Get the content type code for the response. This is the key for the CONTENT_TYPE object.
	 * @returns {string}
	 */
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

	/**
	 * Set the status code of the response. This will overwrite the status code of the response.
	 * @param {number} statusCode
	 */
	setStatusCode = (statusCode) => {
		this.set({statusCode: statusCode});
	};

	/**
	 * Set the headers of the response. This will overwrite the headers of the response.
	 * @param {object} headers
	 */
	setHeaders = (headers) => {
		this.set({headers: headers});
	};

	/**
	 * Set the body of the response. This will overwrite the body of the response.
	 * @param {string|number|object|array} body
	 */
	setBody = (body) => {
		this.set({body: body});
	};

	/**
	 * Get the generic response for the content type. Generic responses are either provided by default from Cache-Data or loaded in during Response.init()
	 * @param {string} contentType
	 * @returns {statusResponseObject}
	 */
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

	/**
	 * 
	 * @param {object} obj 
	 */
	addToJsonBody = (obj) => {
		if (typeof this._body === 'object') {
			this._body = Object.assign({}, this._body, obj);
		}
	};

	/**
	 * 
	 * @returns {{statusCode: number, headers: object, body: null|string|Array|object}}
	 */
	toObject = () => {
		return {
			statusCode: this._statusCode,
			headers: this._headers,
			body: this._body
		};
	};

	/**
	 * 
	 * @returns {string} A string representation of the Response object
	 */
	toString = () => {
		return JSON.stringify(this.toObject());
	};

	/**
	 * Used by JSON.stringify to convert the response to a stringified object
	 * @returns {{statusCode: number, headers: object, body: null|string|Array|object}} this class in object form ready for use by JSON.stringify
	 */
	toJSON = () => {
		return this.toObject();
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

		try {
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

			this.addHeader('x-exec-ms', `${this._clientRequest.getFinalExecutionTime()}`);

			this._log(bodyAsString);
		} catch (error) {
			DebugAndLog.error(`Error Finalizing Response: Header and Logging Block: ${error.message}`, error.stack);
			this.reset({statusCode: 500});
			bodyAsString = JSON.stringify(this._body); // we reset to 500 so stringify it
		}

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

		try {

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
			const execms = this._clientRequest.getFinalExecutionTime();
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
			logFields.push( (( userAgent !== "" && userAgent !== null) ? userAgent : "-").replace(/|/g, "") ); // doubtful, but userAgent could have | which will mess with log fields
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

		} catch (error) {
			DebugAndLog.error(`Error Logging Response: ${error.message}`, error.stack);
		}

	};
};

module.exports = Response;