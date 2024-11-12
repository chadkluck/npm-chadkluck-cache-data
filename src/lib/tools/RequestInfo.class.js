
/* ****************************************************************************
 * Request Data Model
 * ----------------------------------------------------------------------------
 * 
 * Provides a class that stores information about the request
 * 
 *************************************************************************** */

/**
 * Processes the request from the event data. Parses out
 * client details such as ip and user agent. May be extended
 * to provide custom processing for the application.
 */
class RequestInfo {

	_requestInfo = null;
	_isValid = false;

	/**
	 * Process the event
	 * @param {object} event 
	 */
	constructor(event) {
		let req = this._gatherRequest(event);
		this._requestInfo = new ImmutableObject( req , true);
	};

	/**
	 * Is the request valid? Validity is set by a series of checks
	 * during child class construction.
	 * Validity needs to be set by a child class, not this (super)
	 * class. 
	 * @returns {boolean} Whether or not the request is valid.
	 */
	isValid() {
		return this._isValid;
	};

	/**
	 * Standard toObject() but by default sensitive information is stripped out.
	 * Additional sensitive information may be stripped out by overriding this
	 * method. To receive the full object pass true.
	 * 
	 * @param {boolean} full 
	 * @returns {object} By default sensitive information is stripped out
	 */
	toObject(full = false) {
		let obj = this._requestInfo.toObject();

		if ( !full ) {
			// strip out any fields we don't want in the logs
			if ("client" in obj) {
				if ("allHeaders" in obj.client) { delete obj.client.allHeaders; }
				if ("headers" in obj.client) 	{ delete obj.client.headers; }
			}			
		}
		
		return obj;
	};

	/**
	 * Gets an object with data. So far the only key available is "client"
	 * which contains request fields from the client such as ip, user agent,
	 * etc.
	 * @param {string} key 
	 * @returns {object} Data relating to the key
	 */
	get(key = "") {
		return this._requestInfo.get(key);
	};

	/**
	 * Get a data object associated with the client request.
	 * @param {*} key such as "userAgent", "ip", etc.
	 * @returns {*} Return a object ("headers", "userAgent", etc) from the client data
	 */
	getClient(key = "") {
		let value = null;
		let clientObj = this.get("client");

		if ( key !== "" ) {
			if (key in clientObj) { value = clientObj[key]; }
		} else {
			value = clientObj;
		}
		
		return value;
	};

	/**
	 * User Agent of client request
	 * @returns {string} The user agent string supplied by the client request
	 */
	getClientUserAgent() {
		return this.getClient("userAgent");
	};

	/**
	 * IP of client request
	 * @returns {string} The IP string from the client request
	 */
	getClientIP() {
		return this.getClient("ip");
	};

	/**
	 * Referer of client request
	 * @returns {string} The referer string supplied by the client request
	 */
	getClientReferer() {
		return this.getClient("referer");
	};

	/**
	 * Origin of client request
	 * @returns {string} The origin string supplied by the client request
	 */
	getClientOrigin() {
		return this.getClient("referer");
	};

	/**
	 * If client requested data using the if-modified-since header field,
	 * the date that was supplied.
	 * @returns {string} The if modified since date string supplied by the client request
	 */
	getClientIfModifiedSince() {
		return this.getClient("ifModifiedSince");
	};

	/**
	 * If client requested data using an eTag header field, the etag that
	 * was supplied.
	 * @returns {string} eTag supplied by the client for a match
	 */
	getClientIfNoneMatch() {
		return this.getClient("ifNoneMatch");
	};

	/**
	 * Response data format accepted by the client request
	 * @returns {string} Response data format accepted by the client request
	 */
	getClientAccept() {
		return this.getClient("accept");
	};

	/**
	 * 
	 * @returns {object} The headers supplied in the client request
	 */
	getClientHeaders() {
		return this.getClient("headers");
	};

	/**
	 * 
	 * @returns {object} The query string parameters supplied in the client request
	 */
	getClientParameters() {
		return this.getClient("parameters");
	};

	/**
	 * For POST requests, if a body was supplied in the request.
	 * @returns {string} The body supplied in the client request
	 */
	getClientBody() {
		return this.getClient("body");
	};

	/**
	 * There may be headers to pass along to an endpoint if our application
	 * is working as a proxy.
	 * @param {array} headerKeysToProxy An array of strings listing the header keys/fields to proxy
	 * @returns {array} Header keys to proxy
	 */
	getClientHeadersToProxy(headerKeysToProxy = []) {
		let headers = {};
		let clientHeaders = this.getClientHeaders();

		if ( headerKeysToProxy.length === 0) {
			headerKeysToProxy = ["accept", "if-modified-since", "if-none-match"];
		}

		headerKeysToProxy.forEach(function( h ) { headers[h] = clientHeaders[h]; });

		return headers;
	};


	/**
	 * Obtain lambda event request details for logging
	 * @param {*} event 
	 * @returns Information about the requesting client including IP and user agent
	 */
	_clientRequestInfo (event) {

		let client = { ip: null, userAgent: null, origin: null, referer: null, ifModifiedSince: null, ifNoneMatch: null, accept: null, headers: {}, parameters: {}, body: null };
		let identity = {};
		let headers = {};

		// identity data
		if ( "requestContext" in event && "identity" in event.requestContext && event.requestContext.identity !== null ) {
			identity = event.requestContext.identity;
		}
		
		// header data
		if ( "headers" in event && event.headers !== null) {
			// extract just the keys so we can iterate and lowercase
			let hkeys = Object.keys(event.headers); 

			// move each value from event.headers to headers but lowercase the key
			hkeys.forEach( function( k ) { headers[k.toLowerCase()] = event.headers[k]; });
		} else {
			headers = {};
		}

		client.headers = headers;

		// set the source IP immediately for logging
		if ( "sourceIp" in identity && identity.sourceIp !== null){
			client.ip = identity.sourceIp;
		}

		// if there is a user-agent header, set it
		if ( "userAgent" in identity && identity.userAgent !== null ) {
			client.userAgent = identity.userAgent;
		}

		// if there is an origin header, set it
		if ( "origin" in headers && headers.origin !== null) {
			client.origin = headers.origin;
		} // otherwise we'll just leave it as the default ""

		// if there is a referer header, set it
		if ( "referer" in headers && headers.referer !== null) {
			client.referer = headers.referer.split("?")[0]; // for privacy we don't want the query string
		} else {
			client.referer = client.origin;
		}

		// if there is a if-modified-since header, copy over
		if ( "if-modified-since" in headers && headers['if-modified-since'] !== "" && headers['if-modified-since'] !== null) {
			client.ifModifiedSince = headers['if-modified-since'];
		}

		// if there is a if-none-match header, set it
		if ( "if-none-match" in headers && headers['if-none-match'] !== "" && headers['if-none-match'] !== null ) {
			client.ifNoneMatch = headers['if-none-match'];
		}

		// if there is an accept header, set it
		if ( "accept" in headers && headers.accept !== "" && headers.accept !== null ) {
			client.accept = headers['accept'];
		}

		// if query string parameters were passed, set it
		if ( "queryStringParameters" in event && event.queryStringParameters !== null) {
			client.parameters = event.queryStringParameters
		} else {
			client.parameters = {};
		}

		// TODO:
		// if body was passed in a post request, set it
		if ( false ) {
			client.body = null;
		}

		return client;

	};

	/**
	 * 
	 * @param {*} event 
	 * @returns Token and client info of the request. This is the stored object.
	 */
	_gatherRequest (event) {

		let r = {
			client: this._clientRequestInfo(event)
		};

		return r;

	};

};

module.exports = {
	RequestInfo
};