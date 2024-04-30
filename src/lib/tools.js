/*
 * =============================================================================
 * Tools
 * -----------------------------------------------------------------------------
 * 
 * Tools used for endpoint data access objects (DAOs) and cache-data. These 
 * tools are also available for other app functionality
 * 
 * Some classes are internal and not exposed via export. Check list of exports
 * for available classes and functions.
 * 
 * -----------------------------------------------------------------------------
 * Environment Variables used
 * -----------------------------------------------------------------------------
 * 
 * This script uses the Node.js environment variable process.env.AWS_REGION if
 * present.
 * 
 */

const AWSXRay = require("aws-xray-sdk-core");

AWSXRay.captureHTTPsGlobal(require('http'));
AWSXRay.captureHTTPsGlobal(require("https"));

const http = require('http'); // For AWS Parameters and Secrets Lambda Extension - accesses localhost via http
const https = require('https'); // For all other connections

/*
 * -----------------------------------------------------------------------------
 * Object definitions
 * -----------------------------------------------------------------------------
 */

/**
 * @typedef ConnectionObject
 * @property {object} connection A connection object
 * @property {string} connection.method GET or POST
 * @property {string} connection.uri the full uri (overrides protocol, host, path, and parameters) ex https://example.com/api/v1/1004/?key=asdf&y=4
 * @property {string} connection.protocol https
 * @property {string} connection.host host/domain: example.com
 * @property {string} connection.path path of the request: /api/v1/1004
 * @property {object} connection.parameters parameters for the query string as an object in key/value pairs
 * @property {object} connection.headers headers for the request as an object in key/value pairs
 * @property {string} connection.body for POST requests, the body
 * @property {string} connection.note a note for logging
 * @property {object} connection.options https_get options
 * @property {number} connection.options.timeout timeout in milliseconds
 */

/*
 * -----------------------------------------------------------------------------
 */

"use strict";

/**
 * AWS Helper Functions - Functions to perform common get and put operations for DynamoDB, S3, and SSM parameter store.
 * Uses AWS SDK v2 or v3 depending on the Node.js version. It will perform this check for you and utilize the proper SDK.
 * 
 * @example
 * console.log(AWS.REGION); // outputs the region set in Node environment: process.env.AWS_REGION
 * 
 * @example
 * const result = await AWS.dynamo.get(params);
 * const response = await AWS.dynamo.put(params);
 * AWS.dynamo.client; // access the DynamoDb Document client directly
 * AWS.dynamo.sdk; // access the DynamoDB SDK (V2: { DynamoDB }, V3: { DynamoDB, DynamoDBClient, GetItemCommand, PutItemCommand }
 * const dbDocClient = new AWS.dynamo.sdk.DynamoDB.DocumentClient( {region: AWS.REGION} );
 * 
 * @example
 * result = await AWS.s3.get(params);
 * response = await AWS.s3.put(params);
 * AWS.s3.client; // access the S3 client directly
 * 
 * @example
 * ssmParams1 = await AWS.ssm.getByName(query);
 * ssmParams2 = await AWS.ssm.getByPath(query);
 * AWS.ssm.client; // access the SSM Client
 * AWS.ssm.sdk; // access the SSM SDK (V3 contains { SSM, SSMClient, GetParameterCommand, PutParameterCommand })
 * 
 * @class AWS
 * @property {string} NODE_VER
 * @property {number} NODE_VER_MAJOR
 * @property {number} NODE_VER_MINOR
 * @property {number} NODE_VER_PATCH
 * @property {string} NODE_VER_MAJOR_MINOR
 * @property {string} SDK_VER 'V2' or 'V3'
 * @property {boolean} SDK_V2 true if using AWS SDK v2
 * @property {boolean} SDK_V3 true if using AWS SDK v3
 * @property {string} REGION AWS region grabbed from Node process.env.AWS_REGION. If not set uses 'us-east-1'
 * @property {object} dynamo
 * @property {object} dynamo.client DynamoDb Document client (either V2 or V3)
 * @property {object} dynamo.sdk V2: { DynamoDb }, V3: { DynamoDB, DynamoDBClient, DynamoDBDocumentClient, GetCommand, PutCommand }
 * @property {object} dynamo.put function(params) Given a DynamoDb param object, uses the correct SDK version to perform a DynamoDb put command
 * @property {object} dynamo.get function(params) Given a DynamoDb param object, uses the correct SDK version to perform a DynamoDb get command
 * @property {object} dynamo.scan function(params) Given a DynamoDb param object, uses the correct SDK version to perform a DynamoDb scan command
 * @property {object} dynamo.delete function(params) Given a DynamoDb param object, uses the correct SDK version to perform a DynamoDb delete command
 * @property {object} dynamo.update function(params) Given a DynamoDb param object, uses the correct SDK version to perform a DynamoDb update command
 * @property {object} s3
 * @property {object} s3.client S3 client (either V2 or V3)
 * @property {object} s3.sdk V2: { S3 }, V3: { S3Client, GetObjectCommand, PutObjectCommand }
 * @property {object} s3.put function(params) Given an S3 param object, uses the correct SDK version to perform a S3 put command
 * @property {object} s3.get function(params) Given an S3 param object, uses the correct SDK version to perform a S3 get command
 * @property {object} ssm
 * @property {object} ssm.client SSM client (either V2 or V3)
 * @property {object} ssm.sdk V2: { SSM }, V3: { SSMClient, GetParameterCommand, GetParametersByPathCommand }
 * @property {object} ssm.getByName function(query) Given SSM Parameter Store query, uses the correct SDK version to perform the getParameters command
 * @property {object} ssm.getByPath function(query) Given SSM Parameter Store query, uses the correct SDK version to perform the getParametersByPath command
 * @property {object} AWSXRay
 */
class AWS {

	static #nodeVer = [];
	static #aws_region = null;

	static #XRayOn = true;

	constructor(options = {AWSXRayOn: true}) {
		AWS.#XRayOn = (options?.AWSXRayOn) ? Boolean(options.AWSXRayOn) : false;
	}

	static get nodeVersionArray() {
		if (this.#nodeVer.length === 0) {
			// split this.NODE_VER into an array of integers
			this.#nodeVer = this.NODE_VER.split(".").map( (x) => parseInt(x, 10) );
		}
		return this.#nodeVer;
	};

	static get region() {
		if (this.#aws_region === null) {

			const hasRegion = (
				"AWS_REGION" in process.env 
				&& typeof process.env.AWS_REGION !== 'undefined' 
				&& process.env.AWS_REGION !== null 
				&& process.env.AWS_REGION !== ""
			);

			if (!hasRegion) {
				console.warn("AWS_REGION is NOT set in Lambda Node environment variables. Trying 'us-east-1'. To prevent unexpected results, please create and set the 'AWS_REGION' in your Lambda environment variables.");
			}

			this.#aws_region = ( hasRegion ? process.env.AWS_REGION : "us-east-1" );
		}

		return this.#aws_region;
	}

	static get NODE_VER() { return ( ("versions" in process && "node" in process.versions) ? process.versions.node : "0.0.0"); }
	static get NODE_VER_MAJOR() { return ( this.nodeVersionArray[0] ); }
	static get NODE_VER_MINOR() { return ( this.nodeVersionArray[1] ); }
	static get NODE_VER_PATCH() { return ( this.nodeVersionArray[2] ); }
	static get NODE_VER_MAJOR_MINOR() { return (this.nodeVersionArray[0] + "." + this.nodeVersionArray[1]); }
	static get NODE_VER_ARRAY() { return (this.nodeVersionArray); }
	static get SDK_VER() { return ((this.NODE_VER_MAJOR < 18) ? "V2" : "V3"); }
	static get REGION() { return ( this.region ); }
	static get SDK_V2() { return (this.SDK_VER === "V2"); }
	static get SDK_V3() { return (this.SDK_VER === "V3"); }

	static get INFO() { 
		return ( {
			NODE_VER: this.NODE_VER,
			NODE_VER_MAJOR: this.NODE_VER_MAJOR,
			NODE_VER_MINOR: this.NODE_VER_MINOR,
			NODE_VER_PATCH: this.NODE_VER_PATCH,
			NODE_VER_MAJOR_MINOR: this.NODE_VER_MAJOR_MINOR,
			NODE_VER_ARRAY: this.NODE_VER_ARRAY,
			SDK_VER: this.SDK_VER,
			REGION: this.REGION,
			SDK_V2: this.SDK_V2,
			SDK_V3: this.SDK_V3,
			OPTIONS: {
				AWSXRayOn: AWS.#XRayOn
			}
		});
	}

	static #SDK = (
		function(){
			if (AWS.SDK_V2) {
				const { DynamoDB, S3, SSM } = require("aws-sdk");
				return {
					dynamo: {
						client: (new DynamoDB.DocumentClient( {region: AWS.REGION} )), 
						put: (client, params) => client.put(params).promise(),
						get: (client, params) => client.get(params).promise(),
						scan: (client, params) => client.scan(params).promise(),
						delete: (client, params) => client.delete(params).promise(),
						update: (client, params) => client.update(params).promise(),
						sdk: { DynamoDB }
					},
					s3: {
						client: (new S3()),
						put: (client, params) => client.putObject(params).promise(),
						get: (client, params) => client.getObject(params).promise(),
						sdk: { S3 }
					},
					ssm: {
						client: (new SSM( {region: AWS.REGION} )),
						getByName: (client, params) => client.getParameters(params).promise(),
						getByPath: (client, params) => client.getParametersByPath(params).promise(),
						sdk: { SSM }
					}
				}
			} else {
				const { DynamoDBClient} = require("@aws-sdk/client-dynamodb");
				const { DynamoDBDocumentClient, GetCommand, PutCommand, ScanCommand, DeleteCommand, UpdateCommand } = require("@aws-sdk/lib-dynamodb");
				const { S3, GetObjectCommand, PutObjectCommand } = require("@aws-sdk/client-s3");
				const { SSMClient, GetParametersByPathCommand, GetParametersCommand } = require("@aws-sdk/client-ssm");

				return {
					dynamo: {
						client: (DynamoDBDocumentClient.from(
							(AWS.#XRayOn) ? AWSXRay.captureAWSv3Client(new DynamoDBClient({ region: AWS.REGION }))
							: new DynamoDBClient({ region: AWS.REGION })) ),
						put: (client, params) => client.send(new PutCommand(params)),
						get: (client, params) => client.send(new GetCommand(params)),
						scan: (client, params) => client.send(new ScanCommand(params)),
						delete: (client, params) => client.send(new DeleteCommand(params)),
						update: (client, params) => client.send(new UpdateCommand(params)),
						sdk: {
							DynamoDBClient,
							DynamoDBDocumentClient,
							GetCommand,
							PutCommand
						}	
					},
					s3: {
						client: (
							(AWS.#XRayOn) ? AWSXRay.captureAWSv3Client(new S3())
							: new S3()),
						put: (client, params) => client.send(new PutObjectCommand(params)),
						get: (client, params) => client.send(new GetObjectCommand(params)),
						sdk: {
							S3,
							GetObjectCommand,
							PutObjectCommand							
						}

					},
					ssm: {
						client: (
							(AWS.#XRayOn) ? AWSXRay.captureAWSv3Client(new SSMClient({ region: AWS.REGION }))
							: new SSMClient({ region: AWS.REGION })),
						getByName: (client, query) => client.send(new GetParametersCommand(query)),
						getByPath: (client, query) => client.send(new GetParametersByPathCommand(query)),
						sdk: {
							SSMClient,
							GetParametersByPathCommand,
							GetParametersCommand
						}
					}
				}			
			}
		}
	)();
	
	static get dynamo() {
		return {
			client: this.#SDK.dynamo.client,
			put: ( params ) => this.#SDK.dynamo.put(this.#SDK.dynamo.client, params),
			get: ( params ) => this.#SDK.dynamo.get(this.#SDK.dynamo.client, params),
			scan: ( params ) => this.#SDK.dynamo.scan(this.#SDK.dynamo.client, params),
			delete: ( params ) => this.#SDK.dynamo.delete(this.#SDK.dynamo.client, params),
			update: ( params ) => this.#SDK.dynamo.update(this.#SDK.dynamo.client, params),
			sdk: this.#SDK.dynamo.sdk
		};
	}

	static get s3() {
		return {
			client: this.#SDK.s3.client,
			put: ( params ) => this.#SDK.s3.put(this.#SDK.s3.client, params),
			get: ( params ) => this.#SDK.s3.get(this.#SDK.s3.client, params),
			sdk: this.#SDK.s3.sdk
		};
	}

	static get ssm() {
		return {
			client: this.#SDK.ssm.client,
			getByName: ( query ) => this.#SDK.ssm.getByName(this.#SDK.ssm.client, query),
			getByPath: ( query ) => this.#SDK.ssm.getByPath(this.#SDK.ssm.client, query),
			sdk: this.#SDK.ssm.sdk
		};
	}

	static get XRay() {
		return AWSXRay;
	}

};


/**
 * Node version in 0.0.0 format retrieved from process.versions.node if present. '0.0.0' if not present.
 * @type {string}
 */
const nodeVer = AWS.NODE_VER;

/**
 * Node Major version. This is the first number in the version string. '20.1.6' would return 20 as a number.
 * @type {number}
 */
const nodeVerMajor = AWS.NODE_VER_MAJOR;

/**
 * Node Minor version. This is the second number in the version string. '20.31.6' would return 31 as a number.
 * @type {number}
 */
const nodeVerMinor = AWS.NODE_VER_MINOR;

const nodeVerMajorMinor = AWS.NODE_VER_MAJOR_MINOR;

if (nodeVerMajor < 16) {
	console.error(`Node.js version 16 or higher is required for @chadkluck/cache-data. Version ${nodeVer} detected. Please install at least Node version 16 (>18 preferred) in your environment.`);
	process.exit(1);
}


/**
 * An internal tools function used by APIRequest. https.get does not work well
 * inside a class object (specifically doesn't like this.*), so we make it 
 * external to the class and pass the class as a reference to be updated either 
 * with a response or redirect uri.
 * @param {object} options The options object for https.get()
 * @param {APIRequest} requestObject The APIRequest object that contains internal functions, request info (including uri) and redirects. This object will be updated with any redirects and responses
 * @returns A promise that will resolve to a boolean denoting whether or not the response is considered complete (no unresolved redirects). The boolean does not mean "error free." Even if we receive errors it is considered complete.
 */ 
const _httpGetExecute = async function (options, requestObject) {

	/*
	Return a promise that will resolve to true or false based upon success
	*/
	return new Promise ((resolve, reject) => {
		/*
		Functions/variables we'll use within https.get()
		We need to declare functions that we will be using within https.get()
		"locally" and refer to the requestObject to perform updates
		setResponse() and addRedirect() also performs the resolve() and reject() for the promise
		*/
		const setResponse = function (response) { requestObject.setResponse(response); resolve(true)};
		const addRedirect = function (uri) { requestObject.addRedirect(uri); resolve(false)};
		const redirects = requestObject.getNumberOfRedirects();
		const uri = requestObject.getURI();

		let body = "";

		/*
		Perform the https.get()
		*/
		let req = https.request(uri, options, (res) => {
			
			DebugAndLog.debug(`Performing https.get callback on response with status code: ${res.statusCode} ${new URL(uri).host}`);

			try {

				/*
				- IF it is a redirect, then add the redirect to the request object
				and it will not be marked as complete.

				- ELSE we'll update the request object with the response which
				will mark it as complete.
				*/
				if (   res.statusCode === 301 
					|| res.statusCode === 302 
					|| res.statusCode === 303 
					|| res.statusCode === 307
				) 
				{

					DebugAndLog.debug(`Processing a redirect: ${res.statusCode}`);

					/*
					- IF We have not performed the max number of redirects then we
					will process the current redirect.

					- ELSE We will produce an error of too many redirects.
					*/
					if ( redirects < APIRequest.MAX_REDIRECTS ) {

						// we'll gather variables to use in logging
						let newLocation = res.headers.location;
						let nloc = new URL(newLocation);
						let rloc = new URL(uri);
						
						/* log essential as warning, others only when debugging
						Note that we only list the hostname and path because 
						sensitive info may be in the query string. Also,
						redirects typically don't involve query strings anyway */
						if (res.statusCode === 301) {
							// report as this as permanent, we'll want to report this in the log as a warning and fix
							DebugAndLog.warning("301 | Redirect (Moved Permanently) received", {requested: rloc.protocol +"//"+ rloc.hostname + rloc.pathname, redirect: nloc.protocol +"//"+ nloc.hostname + nloc.pathname });
						} else {
							// Temporary redirect, just follow it, don't if we are not in debug mode
							DebugAndLog.debug(res.statusCode+" Redirect received", {requested: rloc.protocol +"//"+ rloc.hostname + rloc.pathname, redirect: nloc.protocol +"//"+ nloc.hostname + nloc.pathname })
						}

						// don't let the redirect downgrade
						if ( rloc.protocol === "https:" && nloc.protocol !== "https:") { // URL() protocol has the colon 'https:'
							newLocation = newLocation.replace("http:","https:");
							DebugAndLog.debug("We requested https but are being redirected to http. Upgrading back to https - "+newLocation);
						};

						// update the request object with the redirect so it can be reprocessed
						DebugAndLog.debug("Setting uri to "+newLocation);
						addRedirect(newLocation);

					} else {
						DebugAndLog.warn(`Too many redirects. Limit of ${APIRequest.MAX_REDIRECTS}`);
						setResponse(APIRequest.responseFormat(false, 500, "Too many redirects"));
					}

				} else {

					/*
					- IF we receive a 304 (not modified) then send that back as 
					a response. (Protocol is to return a null body)

					- ELSE process as usual
					*/
					if (res.statusCode === 304) {
						// 304 not modified
						DebugAndLog.debug("304 Not Modified. Setting body to null");
						setResponse(APIRequest.responseFormat(
							true, 
							res.statusCode, 
							"SUCCESS", 
							res.headers, 
							null));
					} else {

						DebugAndLog.debug("No 'Redirect' or 'Not Modifed' received. Processing http get as usual");

						/*
						The 3 classic https.get() functions
						What to do on "data", "end" and "error"
						*/

						res.on('data', function (chunk) { body += chunk; });

						res.on('end', function () { 
							let success = (res.statusCode < 400);
							DebugAndLog.debug("Response status "+res.statusCode, {status: res.statusCode, headers: res.headers});
							setResponse(APIRequest.responseFormat(
								success, 
								res.statusCode, 
								(success ? "SUCCESS" : "FAIL"), 
								res.headers, 
								body));
						});

						res.on('error', error => {
							DebugAndLog.error(`API error during request/response for host ${requestObject.getHost()} ${requestObject.getNote()} ${error.message}`, error.stack);
							setResponse(APIRequest.responseFormat(false, 500, "https.get resulted in error"));
						});

					}                                          
				}

			} catch (error) {
				DebugAndLog.error(`Error during http get callback for host ${requestObject.getHost()} ${requestObject.getNote()} ${error.message}`, error.stack);
				setResponse(APIRequest.responseFormat(false, 500, "https.get resulted in error"));
			}

		});

		req.on('timeout', () => {
			DebugAndLog.warn(`Endpoint request timeout reached (${requestObject.getTimeOutInMilliseconds()}ms) for host: ${requestObject.getHost()}`, {host: requestObject.getHost(), note: requestObject.getNote()});
			setResponse(APIRequest.responseFormat(false, 504, "https.request resulted in timeout"));
			req.end();

		});

		req.on('error', error => {
			DebugAndLog.error(`API error during request for host ${requestObject.getHost()} ${requestObject.getNote()} ${error.message}`, error.stack);
			setResponse(APIRequest.responseFormat(false, 500, "https.request resulted in error"));
		});

		if ( requestObject.getMethod() === "POST" && requestObject.getBody() !== null ) {
			req.write(requestObject.getBody());
		}

		req.end();

	});
};

/**
 * Submit GET and POST requests and handle responses.
 * This class can be used in a DAO class object within its call() method.
 * @example
 * 
 *     async call() {
 * 
 *      var response = null;
 * 
 *         try {
 *             var apiRequest = new tools.APIRequest(this.request);
 *             response = await apiRequest.send();
 * 
 *         } catch (error) {
 *             tools.DebugAndLog.error(`Error in call: ${error.message}`, error.stack);
 *             response = tools.APIRequest.responseFormat(false, 500, "Error in call()");
 *         }
 * 
 *        return response;
 * 
 *     };
 */
class APIRequest {

	static MAX_REDIRECTS = 5;

	#redirects = [];
	#requestComplete = false;
	#response = null;
	#request = null;

	/**
	 * Function used to make an API request utilized directly or from within
	 * a data access object.
	 * 
	 * @param {ConnectionObject} request 
	 */
	constructor(request) {
		this.resetRequest();

		/* We need to have a method, protocol, uri (host/domain), and parameters set 
		Everything else is optional */

		let timeOutInMilliseconds = 8000;

		/* Default values */
		let req = {
			method: "GET",
			uri: "",
			protocol: "https",
			host: "",
			path: "",
			parameters: {},
			headers: {},
			body: null,
			note: "",
			options: { timeout: timeOutInMilliseconds}
		};

		/* if we have a method or protocol passed to us, set them */
		if ( "method" in request && request.method !== "" && request.method !== null) { req.method = request.method.toUpperCase(); }
		if ( "protocol" in request && request.protocol !== "" && request.protocol !== null) { req.protocol = request.protocol.toLowerCase(); }

		if ("body" in request) { req.body = request.body; }
		if ("headers" in request && request.headers !== null) { req.headers = request.headers; }
		if ("note" in request) { req.note = request.note; }
		if ("options" in request && request.options !== null) { req.options = request.options; }

		/* if there is no timeout set, or if it is less than 1, then set to default */
		if ( !("timeout" in req.options && req.options.timeout > 0) ) {
			req.options.timeout = timeOutInMilliseconds;
		}

		/* if we have a uri, set it, otherwise form one using host and path */
		if ( "uri" in request && request.uri !== null && request.uri !== "" ) {
			req.uri = request.uri;
		} else if ("host" in request && request.host !== "" && request.host !== null) {
			let path = ("path" in request && request.path !== null && request.path !== null) ? request.path : "";
			req.uri = `${req.protocol}://${request.host}${path}`; // we use req.protocol because it is already set
		}

		/* if we have parameters, create a query string and append to uri */
		if (
				"parameters" in request 
				&&  request.parameters !== null 
				&& (typeof request.parameters === 'object' && Object.keys(request.parameters).length !== 0)
			){
			let qString = [];

			for (const [key,value] of Object.entries(request.parameters) ) {
				qString.push(key+"="+encodeURIComponent(value));
			}

			if (qString.length > 0) {
				req.uri += "?"+qString.join("&");
			}
		}

		this.#request = req;
	};

	/**
	 * Clears out any redirects, completion flag, and response
	 */
	resetRequest() {
		this.#redirects = [];
		this.#requestComplete = false;
		this.#response = null;
	};

	/**
	 * Set the uri of the request
	 * @param {string} newURI 
	 */
	updateRequestURI(newURI) {
		this.#request.uri = newURI;
	};

	/**
	 * Add a redirect uri to the stack
	 * @param {string} uri 
	 */
	addRedirect(uri) {
		this.#redirects.push(uri);
		this.updateRequestURI(uri);
	};
	
	/**
	 * 
	 * @returns {number} Number of redirects currently experienced for this request
	 */
	getNumberOfRedirects() {
		return this.#redirects.length;
	};

	/**
	 * When the request is complete, set the response and mark as complete
	 * @param {object} response 
	 */
	setResponse(response) {
		this.#requestComplete = true;
		this.#response = response;
	};

	/**
	 * 
	 * @returns {string} The current URI of the request
	 */
	getURI() {
		return this.#request.uri;
	};

	/**
	 * 
	 * @returns {string|null} The body of a post request
	 */
	getBody() {
		return this.#request.body;
	};

	/**
	 * 
	 * @returns {string} The request method
	 */
	getMethod() {
		return this.#request.method;
	};

	/**
	 * 
	 * @returns {string} A note for troubleshooting and tracing the request
	 */
	getNote() {
		return this.#request.note;
	};

	/**
	 * 
	 * @returns {number} Request timout in milliseconds
	 */
	getTimeOutInMilliseconds() {
		return this.#request.options.timeout;
	};

	/**
	 * 
	 * @returns {string} The host domain submitted for the request
	 */
	getHost() {
		return (new URL(this.getURI())).host;
	};

	/**
	 * Send the request
	 * @returns {object}
	 */
	async send() {

		this.resetRequest();

		var response = null;

		switch (this.#request.method) {
			case "GET":
				response = await this.send_get();
				break;
			case "POST":
				response = await this.send_get(); // this.method should already be set and is all it needs
				break;
			default:
				break; // PUT, DELETE, etc not yet implemented
		}

		return response;
	}

	/**
	 * Process the request
	 * @returns {object} Response
	 */
	async send_get() {

		return new Promise (async (resolve, reject) => {
			// https://stackoverflow.com/questions/41470296/how-to-await-and-return-the-result-of-a-http-request-so-that-multiple-request

			// https://nodejs.org/api/https.html#https_https_request_url_options_callback
			// https://usefulangle.com/post/170/nodejs-synchronous-http-request
				
			try {
				
				if ( "note" in this.#request ) {
					DebugAndLog.msg("Sending request for: "+this.#request.note);
				}

				// create the options object, use either options passed in, or an empty one
				let options = ( this.#request.options !== null) ? this.#request.options : {};

				// add the request headers to options
				if ( this.#request.headers !== null ) {
					options.headers = this.#request.headers;
				}

				// add the request method to options (default is GET)
				if ( this.#request.method === null || this.#request.method === "") {
					this.#request.method = "GET";
				}
				options.method = this.#request.method;

				// we will want to follow redirects, so keep submitting until considered complete
				while ( !this.#requestComplete ) {
					await _httpGetExecute(options, this);
				};

				// we now have a completed response
				resolve( this.#response );
				
			} catch (error) {
				DebugAndLog.error(`API error while trying request for host ${this.getHost()} ${this.getNote()} ${error.message}`, { APIRequest: this.toObject(), trace: error.stack } );
				reject(APIRequest.responseFormat(false, 500, "Error during send request"));
			}
		});
	};

	/**
	 * Get information about the Request and the Response including
	 * any redirects encountered, the request and response objects,
	 * whether or not the request was sent, and the max number of
	 * redirects allowed.
	 * @returns { {MAX_REDIRECTS: number, request: object, requestComplete: boolean, redirects: Array<string>, response: object}} Information about the request
	 */
	toObject() {

		return {
			MAX_REDIRECTS: APIRequest.MAX_REDIRECTS,
			request: this.#request,
			requestComplete: this.#requestComplete,
			redirects: this.#redirects,
			response: this.#response
		};

	};

	/**
	 * Formats the response for returning to program logic
	 * @param {boolean} success 
	 * @param {number} statusCode 
	 * @param {string} message 
	 * @param {object} headers 
	 * @param {string} body 
	 * @returns { 
	 * 	 {
	 *  	success: boolean
	 *  	statusCode: number
	 *  	headers: object
	 *  	body: string
	 *  	message: string
	 *   }
	 * }
	 */
	static responseFormat(success = false, statusCode = 0, message = null, headers = null, body = null) {
		
		return {
			success: success,
			statusCode: statusCode,
			headers: headers,
			body: body,
			message: message
		};
	};
};

/**
 * Create an object that is able to return a copy and not
 * a reference to its properties.
 */
class ImmutableObject {

	/**
	 * 
	 * @param {object} obj The object you want to store as immutable. You can use keys for sub-objects to retreive those inner objects later
	 * @param {boolean} finalize Should we lock the object right away?
	 */
	constructor(obj = null, finalize = false) {
		this.obj = obj;
		this.locked = false;
		if ( finalize ) {
			this.finalize();
		}
	};

	/**
	 * Locks the object so it can't be changed.
	 */
	lock() {
		if ( !this.locked ) {
			/* We'll stringify the object to break all references,
			then change it back to an object */
			this.obj = JSON.parse(JSON.stringify(this.obj));
			this.locked = true;            
		}
	};

	/**
	 * Finalizes the object by immediately locking it
	 * @param {object|null} obj // The object you want to store as immutable. You can use keys for sub-objects to retreive those inner objects later 
	 */
	finalize(obj = null) {
		if ( !this.locked ) {
			if ( obj !== null ) { this.obj = obj; }
			this.lock();
		}
	};

	/**
	 * 
	 * @returns A copy of the object, not a reference
	 */
	toObject() {
		return this.get();
	}

	/**
	 * Get a copy of the value, not a reference, via an object's key
	 * @param {string} key Key of the value you wish to return
	 * @returns {*} The value of the supplied key
	 */
	get(key = "") {
		/* we need to break the reference to the orig obj.
		tried many methods but parse seems to be only one that works 
		https://itnext.io/can-json-parse-be-performance-improvement-ba1069951839
		https://medium.com/coding-at-dawn/how-to-use-the-spread-operator-in-javascript-b9e4a8b06fab
		*/
		//return {...this.connection[key]}; // doesn't make a deep copy
		//return Object.assign({}, this.connection[key]);

		return JSON.parse(JSON.stringify( (key === "" || !(key in this.obj)) ? this.obj : this.obj[key] ));

	};
};

/**
 * A simple Debug and Logging class.
 */
class DebugAndLog {

	static #logLevel = -1;
	static #expiration = -1;

	static PROD = "PROD";
	static TEST = "TEST";
	static DEV = "DEV";

	static ENVIRONMENTS = [DebugAndLog.PROD, DebugAndLog.TEST, DebugAndLog.DEV];

	static ERROR = "ERROR"; // 0
	static WARN = "WARN"; // 0
	static LOG = "LOG"; // 0
	static MSG = "MSG"; // 1
	static DIAG = "DIAG"; // 3
	static DEBUG = "DEBUG"; // 5

	constructor() {
	};

	/**
	 * Set the log level.
	 * @param {number} logLevel 0 - 5
	 * @param {*} expiration YYYY-MM-DD HH:MM:SS format. Only set to specified level until this date
	 */
	static setLogLevel(logLevel = -1, expiration = -1) {

		if ( this.#logLevel > -1 ) {
			DebugAndLog.warn("LogLevel already set, cannot reset. Ignoring call to DebugAndLog.setLogLevel("+logLevel+")");
		} else {
			if ( expiration !== -1 ) {
				let time = new Date( expiration );
				this.#expiration = time.toISOString();
			} else {
				this.#expiration = -1;
			}            
			
			if ( logLevel === -1 || this.nonDefaultLogLevelExpired()) {
				this.#logLevel = this.getDefaultLogLevel();
			} else {
				if ( logLevel > 0 && DebugAndLog.isProduction() ) {
					DebugAndLog.warn("DebugAndLog: Production environment. Cannot set logLevel higher than 0. Ignoring call to DebugAndLog.setLogLevel("+logLevel+"). Default LogLevel override code should be removed before production");
					this.#logLevel = this.getDefaultLogLevel();
				} else {
					this.#logLevel = logLevel;
					DebugAndLog.msg("DebugAndLog: Override of log level default set: "+logLevel+". Default LogLevel override code should be removed before production");
					if ( this.#expiration === -1 ) {
						DebugAndLog.warn("DebugAndLog: Override of log level default set WITHOUT EXPIRATION. An expiration is recommended.");
					}
				}
			} 
		}

	};

	static nonDefaultLogLevelExpired() {
		let r = false;

		if ( this.#expiration !== -1 ) {
			let now = new Date();
			if ( now.toISOString() > this.#expiration ) {
				DebugAndLog.warn("DebugAndLog: Override of log level default expired. Call to DebugAndLog.setLogLevel() should be commented out or removed");
				r = true;
			}
		}

		return r;
	}

	/**
	 * 
	 * @returns {string} The expiration date of the set log level
	 */
	static getExpiration() {
		return this.#expiration;
	}

	/**
	 * 
	 * @returns {number} The current log level
	 */
	static getLogLevel() {
		if ( this.#logLevel === -1 ) {
			this.setLogLevel();
		}

		return this.#logLevel;

	}

	/**
	 * Check process.env for an environment variable named
	 * env, deployEnvironment, environment, or stage. If they
	 * are not set it will return DebugAndLog.PROD which 
	 * is considered safe (most restrictive)
	 * @returns {string} The current environment.
	 */
	static getEnv() {
		var possibleVars = ["env", "deployEnvironment", "environment", "stage"];
		var env = DebugAndLog.PROD; // if env or deployEnvironment not set, fail to safe

		if ( "env" in process ) {
			for (let i in possibleVars) {
				let e = possibleVars[i];
				let uE = possibleVars[i].toUpperCase();
				if (e in process.env && process.env[e] !== "" && process.env[e] !== null) {
					env = process.env[e].toUpperCase();
					break; // break out of the for loop
				} else if (uE in process.env && process.env[uE] !== "" && process.env[uE] !== null) {
					env = process.env[uE].toUpperCase();
					break; // break out of the for loop
				}
			};
		}
		return (DebugAndLog.ENVIRONMENTS.includes(env) ? env : DebugAndLog.PROD);
	};

	/**
	 * 
	 * @returns {number} log level
	 */
	static getDefaultLogLevel() {
		var possibleVars = ["detailedLogs", "logLevel"];
		var logLevel = 0;

		if ( DebugAndLog.isNotProduction() ) { // PROD is always at logLevel 0. Always.

			if ( "env" in process ) {
				for (let i in possibleVars) {
					let lev = possibleVars[i];
					let uLEV = possibleVars[i].toUpperCase();
					if (lev in process.env  && !(Number.isNaN(process.env[lev])) && process.env[lev] !== "" && process.env[lev] !== null) {
						logLevel = Number(process.env[lev]);
						break; // break out of the for loop
					} else if (uLEV in process.env && !(Number.isNaN(process.env[uLEV])) && process.env[uLEV] !== "" && process.env[uLEV] !== null) {
						logLevel = Number(process.env[uLEV]);
						break; // break out of the for loop
					}
				};
			}

		}

		return logLevel;
	};

	/**
	 * 
	 * @returns {boolean}
	 */
	static isNotProduction() {
		return ( !DebugAndLog.isProduction() );
	};

	/**
	 * 
	 * @returns {boolean}
	 */
	static isProduction() {
		return ( DebugAndLog.getEnv() === DebugAndLog.PROD );
	};

	/**
	 * 
	 * @returns {boolean}
	 */
	static isDevelopment() {
		return ( DebugAndLog.getEnv() === DebugAndLog.DEV );
	};

	/**
	 * 
	 * @returns {boolean}
	 */
	static isTest() {
		return ( DebugAndLog.getEnv() === DebugAndLog.TEST );
	};

	/**
	 * Write a log entry.
	 * The format used will be "[TAG] message"
	 * @param {string} tag This will appear first in the log in all caps between square brackets ex: [TAG]
	 * @param {string} message The message to be displayed. May also be a delimited log string
	 * @param {object|null} obj An object to include in the log entry
	 */
	static async writeLog(tag, message, obj = null) {

		const error = function (tag, message, obj) {    
			const msgStr = `[${tag}] ${message}`;
			if (obj !== null) { console.error('%s |', msgStr, sanitize(obj)); }
			else { console.error(msgStr); }
		};

		const warn = function (tag, message, obj) {
			const msgStr = `[${tag}] ${message}`;
			if (obj !== null) { console.warn('%s |', msgStr, sanitize(obj)); }
			else { console.warn(msgStr); }
		};

		const log = function (tag, message, obj) {
			const msgStr = `[${tag}] ${message}`;
			if (obj !== null) { console.log('%s |', msgStr, sanitize(obj)); }
			else { console.log(msgStr); }
		};

		const info = function (tag, message, obj) {
			const msgStr = `[${tag}] ${message}`;
			if (obj !== null) { console.info('%s |', msgStr, sanitize(obj)); }
			else { console.info(msgStr); }
		};

		const debug = function (tag, message, obj) {
			const msgStr = `[${tag}] ${message}`;
			if (obj !== null) { console.debug('%s |', msgStr, sanitize(obj)); }
			else { console.debug(msgStr); }
		};

		let lvl = DebugAndLog.getLogLevel();
		tag = tag.toUpperCase();

		// if ( obj !== null ) {
		// 	let msgObj = obj;
		// 	if ( Array.isArray(msgObj)) { msgObj = { array: msgObj};}
		// 	if ( ""+msgObj === "[object Object]" || ""+msgObj === "[object Array]") {
		// 		msgObj = JSON.stringify(sanitize(msgObj));
		// 	}
		// 	message += " | "+msgObj;
		// }

		switch (tag) {
			case DebugAndLog.ERROR:
				error(tag, message, obj);
				break;
			case DebugAndLog.WARN:
				warn(tag, message, obj);
				break;
			case DebugAndLog.MSG:
				if (lvl >= 1) { info(tag, message, obj); } // 1
				break; 
			case DebugAndLog.DIAG:
				if (lvl >= 3) { debug(tag, message, obj); } //3
				break; 
			case DebugAndLog.DEBUG:
				if (lvl >= 5) { debug(tag, message, obj); } //5
				break; 
			default: // log
				log(tag, message, obj);
				break;
		}
	};

	/**
	 * Level 5 - Verbose Values and Calculations and Stack Traces
	 * @param {string} message 
	 * @param {object} obj 
	 */
	static async debug(message, obj = null) {
		DebugAndLog.writeLog(DebugAndLog.DEBUG, message, obj);
	};

	 /**
	 * Level 3 - Verbose timing and counts
	 * @param {string} message 
	 * @param {object} obj 
	 */
	static async diag(message, obj = null) {
		DebugAndLog.writeLog(DebugAndLog.DIAG, message, obj);      
	};

	/**
	 * Level 1 - Short messages and status
	 * @param {string} message 
	 * @param {object} obj 
	 */
	static async msg(message, obj = null) {
		DebugAndLog.writeLog(DebugAndLog.MSG, message, obj);
	};

	/**
	 * Level 1 - Short messages and status
	 * (same as DebugAndLog.msg() )
	 * @param {string} message 
	 * @param {object} obj 
	 */
	static async message(message, obj = null) {
		DebugAndLog.msg(message, obj);
	};

	/**
	 * Level 0 - Production worthy log entries that are not errors or warnings
	 * These should be formatted in a consistent manner and typically only
	 * one entry produced per invocation. (Usually produced at the end of a 
	 * script's execution)
	 * @param {string} message The message, either a text string or fields separated by | or another character you can use to parse your logs
	 * @param {string} tag Optional. The tag that appears at the start of the log. Default is LOG. In logs it will appear at the start within square brackets '[LOG] message' You can use this to filter when parsing log reports
	 * @param {object} obj 
	 */
	static async log(message, tag = DebugAndLog.LOG, obj = null) {
		DebugAndLog.writeLog(tag, message, obj);
	};

	/**
	 * Level 0 - Warnings
	 * Errors are handled and execution continues.
	 * Request validation should be done first, and if we received an invalid
	 * request, then a warning, not an error, should be logged even though an 
	 * error is returned to the client (error is on client side, not here, 
	 * but we want to keep track of client errors). 
	 * Requests should be validated first before all other processing.
	 * @param {string} message 
	 * @param {object} obj 
	 */
	static async warn(message, obj = null) {
		DebugAndLog.writeLog(DebugAndLog.WARN, message, obj);
	};

	/**
	 * Level 0 - Warnings
	 * (same as DebugAndLog.warn() )
	 * @param {string} message 
	 * @param {object} obj 
	 */
	static async warning(message, obj = null) {
		DebugAndLog.warn(message, obj);
	};

	/**
	 * Level 0 - Errors
	 * Errors cannot be handled in a way that will allow continued execution.
	 * An error will be passed back to the client. If a client sent a bad
	 * request, send a warning instead.
	 * @param {string} message 
	 * @param {object} obj 
	 */
	static async error(message, obj = null) {
		DebugAndLog.writeLog(DebugAndLog.ERROR, message, obj);
	};

};

class Timer {
	constructor(name, start = false) {
		this.name = name;
		this.startTime = -1;
		this.stopTime = -1;
		this.latestMessage = "";
		
		if (start) {
			this.start();
		} else {
			this.updateMessage("Timer '"+this.name+"' created at  "+this.now());
		}
	};

	async updateMessage(message) {
		this.latestMessage = message;
		DebugAndLog.diag(this.latestMessage);
	};

	/**
	 * Start the timer
	 */
	async start() {
		if ( this.startTime === -1 ) {
			this.startTime = this.now();
			this.updateMessage("Timer '"+this.name+"' started at "+this.startTime);
		}
	};

	/**
	 * Stop the timer
	 * 
	 * @returns {number} The time elapsed in milliseconds
	 */
	stop() {
		if ( this.stopTime === -1 ) {
			this.stopTime = this.now();
			this.updateMessage("Timer '"+this.name+"' stopped at "+this.stopTime+". Time elapsed: "+this.elapsed()+" ms");
		}
		return this.elapsed();
	};

	/**
	 * The amount of time elapsed between the start and stop of the timer.
	 * If the timer is still running it will be the amount of time between
	 * start and now(). If the timer is stopped it will be the amount of
	 * time between the start and stop.
	 * 
	 * @returns {number}
	 */
	elapsed() {
		return ((this.isRunning()) ? this.now() : this.stopTime ) - this.startTime;
	};

	/**
	 * The amount of time elapsed between the start of the timer and now()
	 * Even if the timer is stopped, it will use now() and this value will
	 * continue to increase during execution.
	 * 
	 * Use elapsed() to get the amount of time between start and stop.
	 * 
	 * @returns {number}
	 */
	elapsedSinceStart() {
		return (this.now() - this.startTime);
	};

	/**
	 * The amount of time elapsed since the timer was stopped and will increase
	 * during execution. If the timer has not been stopped, it will 
	 * return -1 (negative one)
	 * 
	 * @returns {number}
	 */
	elapsedSinceStop() {
		return (this.isRunning() ? -1 : this.now() - this.stopTime);
	};

	/**
	 * The time now. Same as Date.now()
	 * 
	 * @returns {number}
	 */
	now() {
		return Date.now();
	};

	/**
	 * Was the timer started
	 * @returns {boolean}
	 */
	wasStarted() {
		return (this.startTime > 0);
	};

	/**
	 * 
	 * @returns {boolean} Returns true if timer has not yet been started
	 */
	notStarted() {
		return !(this.wasStarted());
	};

	/**
	 * 
	 * @returns {boolean} True if the timer is currently running. False if not running
	 */
	isRunning() {
		return (this.wasStarted() && this.stopTime < 0);
	};

	/**
	 * 
	 * @returns {boolean} True if the timer was stopped. False if not stopped
	 */
	wasStopped() {
		return (this.wasStarted() && this.stopTime > 0);
	};

	/**
	 * 
	 * @returns {string} Text string denoting stating. 'NOT_STARTED', 'IS_RUNNING', 'IS_STOPPED'
	 */
	status() {
		var s = "NOT_STARTED";
		if ( this.wasStarted() ) {
			s = (this.isRunning() ? "IS_RUNNING" : "IS_STOPPED");
		}
		return s;
	};

	/**
	 * Messages are internal updates about the status
	 * @returns {string} The latest message from the timer
	 */
	message() {
		return (this.latestMessage);
	};

	/**
	 * For debugging and testing, an object of the timer may be generated
	 * to see the current values of each timer function.
	 * 
	 * @param {boolean} sendToLog Should the timer details object be sent to the console log
	 * @returns { 
	 *   {
	 * 		name: string,
	 * 		status: string,
	 * 		started: boolean,
	 * 		running: boolean,
	 * 		stopped: boolean,
	 * 		start: number,
	 * 		stop: number,
	 * 		elapsed: number,
	 * 		now: number,
	 * 		elapsedSinceStart: number,
	 * 		elapsedSinceStop: number,
	 * 		latestMessage: string
	 *   }
	 * } An object describing the state of the timer
	 */
	details(sendToLog = false) {
		var details = {
			name: this.name,
			status: this.status(),
			started: this.wasStarted(),
			running: this.isRunning(),
			stopped: this.wasStopped(),
			start: this.startTime,
			stop: this.stopTime,
			elapsed: this.elapsed(),
			now: this.now(),
			elapsedSinceStart: this.elapsedSinceStart(),
			elapsedSinceStop: this.elapsedSinceStop(),
			latestMessage: this.message()
		};

		if (sendToLog) {
			DebugAndLog.debug("Timer '"+this.name+"' details",details);
		}

		return details;
	};
};

/* !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
 >>>>>	Resume jsdoc review here - jsdoc only reviewed up to this point
*/

/* ****************************************************************************
 * Connection classes
 * ----------------------------------------------------------------------------
 * 
 * Classes that store connection and cache information for api requests.
 * 
 *************************************************************************** */

class Connections {

	constructor( obj = null ) {
		
	};

	_connections = {};

	/**
	 * Given an object (associative array) create a Connection object to add to
	 * our collection of Connections.
	 * 
	 * @param {object} obj 
	 */
	add( obj ) {
		if ( "name" in obj && obj.name !== null && !(obj.name in this._connections) ) {
			let connection = new Connection(obj);

			this._connections[obj.name] = connection;
		};
	};

	/**
	 * 
	 * @param {object} connectionName 
	 * @returns An object from the named Connection
	 */
	get(connectionName) {
		DebugAndLog.debug("Getting connection: "+connectionName,this._connections[connectionName]);
		return ( ( connectionName in this._connections ) ? this._connections[connectionName] : null );
	};

};

/**
 * The Connection object provides the base for requests but does not carry
 * the request. myConnection.get() will return an object (associative array) 
 * that can then be used to generate and submit a request to a DAO class or 
 * APIRequest object.
 * You can store and manage multiple connections using the Connections object.
 */
class Connection {

	constructor(obj = null) {
		this._init(obj);
	};

	_name = null;
	_method = null;
	_uri = null;
	_protocol = null;
	_host = null;
	_path = null;
	_body = null;
	_parameters = null; // {}
	_headers = null; // {}
	_options = null;
	_note = null;
	_authentication = null; // new ConnectionAuthentication();
	_cacheProfiles = null; // {}

	/**
	 * Given an object (associative array with key/value pairs) update the 
	 * connection information. Note that for parameters and headers this
	 * is a destructive operation if new values are passed in. Any keys
	 * not passed in will be wiped. It is better to use the .addParameters()
	 * and .addHeaders() function first, then pass in an object that does
	 * not have the headers and parameters key.
	 * @param {*} obj 
	 */
	_init(obj = null) {
		if (  obj !== null && typeof obj === 'object' ) {

			// if, and only if the object is not currently named, will we accept a name
			if ( "name" in obj && obj.name !== null && this._name === null ) { this._name = obj.name; }

			if ( "method" in obj && obj.method !== null ) { this._method = obj.method.toUpperCase(); }
			if ( "uri" in obj && obj.uri !== null ) { this._uri = obj.uri; }
			if ( "protocol" in obj && obj.protocol !== null ) { this._protocol = obj.protocol.replace(/\:$/, '').toLowerCase(); } // The URL().protocol keeps the : we don't need it if present
			if ( "host" in obj && obj.host !== null ) { this._host = obj.host.toLowerCase(); }
			if ( "path" in obj && obj.path !== null ) { this._path = obj.path; }
			if ( "body" in obj && obj.body !== null ) { this._body = obj.body; }
			if ( "parameters" in obj && obj.parameters !== null ) { this._parameters = obj.parameters; }
			if ( "headers" in obj && obj.headers !== null ) { this._headers = obj.headers; }
			if ( "options" in obj && obj.options !== null ) { this._options = obj.options; }
			if ( "note" in obj && obj.note !== null ) { this._note = obj.note; }
			if ( "authentication" in obj && obj.authentication !== null ) { this._setAuthentication(obj.authentication); }
			if ( "cache" in obj && obj.cache !== null) { this._setCacheProfiles(obj.cache); }

		}

	};

	/**
	 * 
	 * @returns {Object}
	 */
	getParameters() {
		return JSON.parse(JSON.stringify(this._parameters));
	};

	/**
	 * 
	 * @returns {Object}
	 */
	getHeaders() {
		return JSON.parse(JSON.stringify(this._headers));
	};

	/**
	 * 
	 * @param {string} profileName 
	 * @returns {Object}
	 */
	getCacheProfile( profileName ) {

		function isProfile(item) {
			return item.profile === profileName;
		};

		return JSON.parse(JSON.stringify(this._cacheProfiles.find(isProfile)));
	};

	_setAuthentication(authentication) {
		if (authentication instanceof ConnectionAuthentication ) { this._authentication = authentication }
		else if ( authentication !== null && typeof authentication === 'object' ) { this._authentication = new ConnectionAuthentication(authentication); }
	};

	_setCacheProfiles(cacheProfiles) {
		this._cacheProfiles = cacheProfiles;
	};

	/**
	 * 
	 * @returns object (associative array) with connection details in key/pairs
	 */
	toObject() {

		let obj = {};
		if ( this._method !== null ) { obj.method = this._method; }
		if ( this._uri !== null ) { obj.uri = this._uri; }
		if ( this._protocol !== null ) { obj.protocol = this._protocol; }
		if ( this._host !== null ) { obj.host = this._host; }
		if ( this._path !== null ) { obj.path = this._path; }
		if ( this._body !== null ) { obj.body = this._body; }
		if ( this._parameters !== null ) { obj.parameters = this.getParameters(); }
		if ( this._headers !== null ) { obj.headers = this.getHeaders(); }
		if ( this._options !== null ) { obj.options = this._options; }
		if ( this._note !== null ) { obj.note = this._note; }
		if ( this._authentication !== null ) { obj.authentication = this._authentication.toObject(); }

		return obj;

	};

	toString() {
		let obj = this.toObject();      

		return obj.toString();
	};

};

/**
 * ConnectionAuthentication allows auth tokens, parameters, etc to be stored
 * separately from regular connection request parameters so that they can be
 * protected from modification or accidental access.
 * Header, parameter, and/or Basic auth key/value pairs can be passed in. 
 * Additional methods could be added in the future.
 * 
 * new ConnectionAuthentication(
 * {
 *  headers: { x-key: "bsomeKeyForAHeaderField", x-user: "myUserID" },
 *  parameters: { apikey: "myExampleApiKeyForResource1234" },
 *  body: { key: "myExampleApiKeyForResource1283" },
 *  basic: { username: "myUsername", password: "myPassword" }
 * }
 * );
 */
class ConnectionAuthentication {


	// request parts that could contain auth
	#headers = null;
	#parameters = null;
	#body = null;

	// auth methods - we merge in later, keep separate for now
	#basic = null;

	constructor(obj = null) {


		if ( obj !== null && typeof obj === 'object' ) {

			// places auth could be placed
			if ( "parameters" in obj && obj.parameters !== null ) {  this.#parameters = obj.parameters; }
			if ( "headers" in obj && obj.headers !== null ) {  this.#headers = obj.headers; }
			if ( "body" in obj && obj.body !== null ) {  this.#body = obj.body; }

			// auth methods
			if ( "basic" in obj && obj.basic !== null ) { this.#basic = obj.basic; }

		}

	};


	/**
	 * Generates the basic auth Authorization header.
	 * Takes the basic object containing a username and password during object
	 * construction and concatenates them together in a base64 encoded string
	 * and places it in an Authorization header.
	 * @returns {object} Object containing the key/value pair of a Authorization header for basic auth
	 */
	_getBasicAuthHeader() {
		let obj = {};
		if ( this.#basic !== null ) {
			obj = { Authorization: "" };
			obj.Authorization = "Basic " + Buffer.from(this.#basic.username + ":" + this.#basic.password).toString("base64");
		}
		return obj;
	};

	/**
	 * Combines any auth parameters sent via a query string
	 * @returns {object} Object containing key/value pairs for parameters
	 */
	_getParameters() {
		let obj = {};
		if ( this.#parameters !== null ) { obj = this.#parameters; }

		// auth methods here
		// (none right now)

		return obj;
	};

	/**
	 * Combines any auth header fields. If authorizations such as Basic is used the 
	 * appropriate header field is generated.
	 * @returns {object} Object containing key/value pairs for headers
	 */
	_getHeaders() {
		let obj = {};
		if ( this.#headers !== null ) { obj = this.#headers; };

		// auth methodes here
		if ( this.#basic !== null ) { obj = Object.assign({}, obj.headers, this._getBasicAuthHeader()); } // merge basic auth into headers
		return obj;
	};

	/**
	 * Combines any auth fields sent via a body
	 * @returns {object} Object containing key/value pairs for body
	 */
	_getBody() {
		let obj = {};
		if ( this.#body !== null ) { obj = this.#body; };

		// auth methods here
		// (none right now)

		return obj;
	};


	/**
	 * 
	 * @returns {object} An object with any header, parameter, or body fields necessary
	 * to complete authentication
	 */
	toObject() {
		let obj = {};

		/*
		Object.keys(myObj).length
		Object.keys(myObj) will return the keys of the object (associative array) as an indexed array of keys. 
		.length will then return the number of keys in the indexed array. If there are more than 0 then there is content.
		*/

		let headers = this._getHeaders();
		if ( Object.keys(headers).length ) { obj.headers = headers; }

		let parameters = this._getParameters();
		if ( Object.keys(parameters).length ) { obj.parameters = parameters; }

		let body = this._getBody();
		if ( Object.keys(body).length ) { obj.body = body; }

		return obj;
	};

	// Static methods that could perform authentication could go here
	// such as OAuth 2.0 or Bearer tokens.
	// that way an object containing the right info could be passed in and executed
	
};

/**
 * A Connection provides the base for a Request. A Request extends the 
 * Connection by adding request specific parameters. While a Connection 
 * cannot be modified after creation (it is a config), a Request can be 
 * modified as the application or DAO assembles the request.
 */
class ConnectionRequest extends Connection {

	constructor(obj) {
		super(obj);
	};

	/**
	 * Add key/value pairs to headers. If the header key already exists,
	 * it will be updated with the new one.
	 * @param {*} headers 
	 */
	addHeaders(headers) {
		if (  headers !== null && typeof headers === 'object' ) {
			// if we have headers (not null) then merge new headers in, otherwise just set to passed headers
			this._headers = ( this._headers !== null ) ? Object.assign({}, this._headers, headers) : headers;
		}
	};

	/**
	 * Add a single header key/value pair to headers. If the header key
	 * already exists it will be updated with the new one.
	 * @param {*} key 
	 * @param {*} value 
	 */
	addHeader(key, value) {
		let obj = {};
		obj[key] = value;
		this.addHeaders( obj );
	};

	/**
	 * Add key/value pairs to parameters. If the parameter already exists,
	 * it will be updated with the new one.
	 * @param {*} parameters 
	 */
	addParameters(parameters) {
		if (  parameters !== null && typeof parameters === 'object' ) {
			// if we have parameters (not null) then merge new parameters in, otherwise just set to passed parameters
			this._parameters = ( this._parameters !== null ) ? Object.assign({}, this._parameters, parameters) : parameters; 
		}
	};

	/**
	 * Add a single parameter key/value pair to parameters. If the parameter key
	 * already exists it will be updated with the new one.
	 * @param {*} key 
	 * @param {*} value 
	 */
	addParameter(key, value) {
		let obj = {};
		obj[key] = value;
		this.addParameter( obj );
	};
};

/* ****************************************************************************
 * Configure classes
 * ----------------------------------------------------------------------------
 * 
 * Provides base functionality to be extended by a custom Config class in the 
 * application.
 * 
 *************************************************************************** */

/**
 * _ConfigSuperClass needs to be extended by your own Config class definition.
 * 
 * This super class holds common variables and methods that can be used by any 
 * application. However, each application requires it's own methods and logic 
 * to init.
 * 
 * Usage: The child class Config should be placed near the top of the script 
 * file outside of the event handler. It should be global and must be 
 * initialized.
 * 
 * @example
 * class Config extends tools._ConfigSuperClass {
 * 		// your custom class definition including your implementation of .init()
 * }
 * 
 * Config.init();
 */
class _ConfigSuperClass {

	static _promise = null;
	static _connections = null;
	static _settings = null;

	static settings() {
		return _ConfigSuperClass._settings;
	};

	/**
	 * 
	 * @returns {Connections}
	 */
	static connections() {
		return _ConfigSuperClass._connections;
	};

	/**
	 * 
	 * @param {string} name 
	 * @returns {Connection}
	 */
	static getConnection(name) {
		return _ConfigSuperClass._connections.get(name);
	}

	/**
	 * 
	 * @returns {Promise} A promise that resolves when the Config class has finished initializing
	 */
	static promise() {
		return _ConfigSuperClass._promise;
	};

	
	/**
	 * Retrieve all the parameters (listed in const params) from the
	 * parameter store and parse out the name. Then return the name
	 * along with their value.
	 * 
	 * This will automatically decrypt any encrypted values (it will
	 * leave any String and StringList parameters as their normal,
	 * unencrypted self (WithDecryption is ignored for them))
	 * 
	 * @returns {Promise<array>} parameters and their values
	 */
	static async _getParametersFromStore (parameters) {

		let paramstore = {};

		/* go through PARAMS and compile all parameters with 
		their paths pre-pended into a list of names */
		const paramNames = function () {
			let names = [];
			let paths = [];

			/* we have two levels to work through, the base path has param names 
			grouped under it. So get all the names within each base path grouping. */
			parameters.forEach(function(item) {
				if ("names" in item) {
					item.names.forEach(function(p) {
						names.push(item.path+p);
					});                    
				} else {
					paths.push(item.path);
				}
				
			});

			return { names: names, paths: paths};
		};

		let request = [];

		let pNames = paramNames();

		if (pNames.names.length > 0 || pNames.paths.length > 0 ) {

			let paramResultsArr = [];

			// process all params by name and place promise in results array
			if (pNames.names.length > 0) {

				// put the list of full path names into query.Names
				const query = {
					'Names': pNames.names,
					'WithDecryption': true
				};

				DebugAndLog.debug("Param by name query:",query);
				
				// get parameters from query - wait for the promise to resolve
				paramResultsArr.push(AWS.ssm.getByName(query));

			}

			// process all params by path and place each promise into results array
			if (pNames.paths.length > 0) {

				pNames.paths.forEach( function (path) {
					const query = {
						'Path': path,
						'WithDecryption': true
					};

					DebugAndLog.debug("Param by path query", query);

					paramResultsArr.push(AWS.ssm.getByPath(query));

				});

			}

			// wait for all parameter request promises to resolve then combine
			let promiseArray = await Promise.all(paramResultsArr); // wait
			let results = [];
			promiseArray.forEach( function (result) { // add parameter list in each result promise to an array
				results.push.apply(results, result.Parameters);
				//DebugAndLog.debug("added results", result.Parameters);
			}); 
			
			//DebugAndLog.debug("Parameters", results );

			/* now that the promise has resolved and we've combined them,
			crop off the path and store key and value within the group */
			results.forEach(param => {
				let nameSections = param.Name.split('/'); // get the last part of the name
				const name = nameSections.pop(); // return last section and return as variable name
				const groupPath = nameSections.join('/')+"/"; // since we removed the last section, join rest together for path

				// put the parameter into its group
				const obj = parameters.find(o => o.path === groupPath);
				const group = obj.group;
				if ( !(group in paramstore)) {
					paramstore[group] = {};
				}

				// store key and value
				paramstore[group][name] = param.Value;
			});
		
		}

		// return an array of keys and values
		return paramstore;
	};

	/**
	 * This is an intermediary wait
	 * @param {*} parameters 
	 * @returns {Promise<array>} parameters and their values
	 */
	static async _getParameters(parameters) {
		return await this._getParametersFromStore(parameters);
	};

	/**
	 * @example
	 *
	 * let params = await this._initParameters(
	 *  [
	 *      {
	 *          "group": "appone", // so we can do params.app.authOSTActionsUsername later
	 *          "path": process.env.paramStorePath, // Lambda environment variable
	 *          "names": [
	 *              "authOSTActionsUsername",
	 *              "authOSTActionsPassword",
	 *              "authExLibrisAPIkey",
	 *              "crypt_secureDataKey"
	 *          ]
	 *      }, // OR get all under a single path
	 *      {
	 *          "group": "app", // so we can do params.app.authOSTActionsUsername later
	 *          "path": process.env.paramStorePath // Lambda environment variable
	 *      }
	 *  ]
	 * );
	 * @param {array} parameters An array of parameter locations
	 * @returns {object} Parameters from the parameter store
	 */
	static async _initParameters(parameters) {
		// make the call to get the parameters and wait before proceeding to the return
		return await this._getParameters(parameters);        
	};

	static async _initS3File(paths) {
		return {};
	};

	static async _initDynamoDbRecord(query) {
		return {};
	};
	
};

/* ****************************************************************************
 * Systems Manager Parameter Store and Secrets Manager Lambda Extension
 * ----------------------------------------------------------------------------
 * 
 * AWS Parameters and Secrets Lambda Extension
 * To use, the Systems Manager Parameter Store and Secrets Manager Lambda
 * Extension layer must be installed for your Lambda function.
 * 
 * Added in Cache-Data v1.0.38
 * 
 * https://docs.aws.amazon.com/secretsmanager/latest/userguide/retrieving-secrets_lambda.html
 * https://aws.amazon.com/blogs/compute/using-the-aws-parameter-and-secrets-lambda-extension-to-cache-parameters-and-secrets/
 *************************************************************************** */

/* ****************************************************************************
	
	
 */

/**
 * Parent class to extend CachedSSMParameter and CachedSecret classes.
 * Acceseses data through Systems Manager Parameter Store and Secrets Manager Lambda Extension
 * Since the Lambda Extension runs a localhost via http, it handles it's own http request. Also,
 * since the lambda extension needs time to boot during a cold start, it is not available during
 * the regular init phase outside of the handler. Therefore, we can pass the Object to be used as
 * the secret and then perform an async .get() or .getValue() at runtime. If we need to use a
 * syncronous function, then we must perform a .prime() and make sure it is complete before calling
 * the sync function.
 * 
 * @example
 *  const write(data) {
 *  	const edata = encrypt(data, myParam.sync_getValue()); // some encrypt function
 *  	return edata;
 *  }
 * 
 * async main () => {
 *  	const myParam = new CachedSSMParameter('myParam');
 *  	myParam.prime(); // gets things started in the background
 * 
 *  	// ... some code that may take a few ms to run ...
 *  
 *  	// We are going to call a sync function that MUST 
 *  	// have the myParam value resolved so we 
 *  	// make sure we are good to go before proceeding
 *  	await myParam.prime(); 
 *  	console.log(write(data));
 * }
 */
class CachedParameterSecret {
	static hostname = "localhost";
	static port = "2773";

	name = "";
	value = null;
	cache = {
		lastRefresh: 0,
		status: -1,
		refreshAfter: (5 * 60),
		promise: null
	}

	/**
	 * 
	 * @param {string} name Path and Parameter Name from Parameter Store '/my/path/parametername' or id of secret from Secret Manager
	 * @param {{refreshAfter: number}} options Increase the number of seconds the value should be kept before refreshing. Note that this is in addition to the Lambda Layer cache of 5 minutes. Can shave off a few ms of time if you increase. However, if value or parameter values change frequently you should leave as default.
	 */
	constructor(name, options = {}) {
		this.name = name;
		this.cache.refreshAfter = parseInt((options?.refreshAfter ?? this.cache.refreshAfter), 10);
		DebugAndLog.debug(`CachedParameterSecret: ${this.toJson()}`);
	};

	/**
	 * Returns an object representation of the data (except the value)
	 * @returns {{name: string, instanceof: string, cache: {lastRefresh: number, status: number, refreshAfter: number, promise: Promise} isRefreshing: boolean, needsRefresh: boolean, isValid: boolean}} 
	 */
	toObject() {
		return {
			name: this.name,
			instanceof: this.instanceof(),
			cache: this.cache,
			isRefreshing: this.isRefreshing(),
			needsRefresh: this.needsRefresh(),
			isValid: this.isValid()
		};
	};

	/**
	 * 
	 * @returns {string} with name and instanceof properties
	 */
	toJson() {
		return JSON.stringify({
			name: this.name,
			instanceof: this.instanceof()
		});
	};

	/**
	 *
	 * @returns {string} with name and instanceof properties
	 */
	toString() {
		return `${this.name} [${this.toObject().instanceof}]`;
	};

	/**
	 * 
	 * @returns {string} The constructor name 
	 */
	instanceof() {
		return this.constructor.name; //((this instanceof CachedSSMParameter) ? 'CachedSSMParameter' : 'CachedSecret');
	};

	/**
	 *
	 * @returns {boolean} true if the value is currently being refreshed
	 */
	isRefreshing() {
		return ( this.cache.status === 0 );
	};

	/**
	 * 
	 * @returns {boolean} true if the value has expired and needs a refresh
	 */
	needsRefresh() {
		return ( !this.isRefreshing() && ( (Date.now() - (this.cache.refreshAfter * 1000)) > this.cache.lastRefresh || this.cache.status < 0 ));
	};

	/**
	 *
	 * @returns {boolean} true if the value is valid (has been set and is not null)
	 */
	isValid() {
		return (
			this.value !== null 
			&& typeof this.value === "object"
		);
	}

	/**
	 * Pre-emptively run a request for the secret or parameter. Call this function without
	 * await to start the request in the background.
	 *
	 * Call any of the async functions (.get(), .getValue()) with await just prior to needing the value.
	 * You must await prior to going into a syncronous function and using sync_getValue()
	 * 
	 * @example
	 *  myParam.prime();
	 * //... some code that may take a few ms to run ...
	 *  await myParam.get();
	 * 
	 * @returns {Promise<number>} -1 if error, 1 if success
	 */
	async prime() {
		DebugAndLog.debug(`CachedParameterSecret.prime() called for ${this.toJson()}`);
		const p = (this.needsRefresh()) ? this.refresh() : this.cache.promise; 
		return p;
	};

	/**
	 * Forces a refresh of the value from AWS Parameter Store or Secrets Manager whether or not it has expired
	 * @returns {Promise<number>} -1 if error, 1 if success
	 */
	async refresh() {

		// check to see if this.cache.status is an unresolved promise
		DebugAndLog.debug(`CachedParameterSecret.refresh() Checking refresh status of ${this.name}`);
		if ( !this.isRefreshing() ) {
			this.cache.status = 0;
			this.cache.promise = new Promise(async (resolve, reject) => {
				try {
					const timer = new Timer('CachedParameterSecret_refresh', true);
					let resp = null;
					let tryCount = 0;
					while (resp === null && tryCount < 3) {
						tryCount++;
						if (tryCount > 1) { DebugAndLog.warn(`CachedParameterSecret.refresh() failed. Retry #${tryCount} for ${this.name}`)}
						resp = await this._requestSecretsFromLambdaExtension();
						if (resp !== null) {
							this.value = resp;
							this.cache.lastRefresh = Date.now();
							this.cache.status = 1;						
						} else {
							this.cache.status = -1;
						}
					}
					timer.stop();
					resolve(this.cache.status);					
				} catch (error) {
					DebugAndLog.error(`Error Calling Secrets Manager and SSM Parameter Store Lambda Extension during refresh: ${error.message}`, error.stack);
					reject(-1);
				}
			});
		}
		return this.cache.promise;
	}

	/**
	 * Gets the current value object from AWS Parameter Store or Secrets Manager.
	 * It contains the meta-data and properties of the value as well as the value.
	 * The value comes back decrypted.
	 * If the value has expired, it will be refreshed and the refreshed value will be returned.
	 * @returns {Promise<object>} Secret or Parameter Object
	 */
	async get() {
		await this.prime();
		return this.value;
	}

	/**
	 * Returns just the current value string from AWS Parameter Store or Secrets Manager.
	 * The value comes back decrypted.
	 * If the value has expired, it will be refreshed and the refreshed value will be returned.
	 * @returns {Promise<string>} Secret or Parameter String
	 */
	async getValue() {
		await this.get();
		if (this.value === null) {
			return null;
		} else {
			return this.sync_getValue();
		}
	}

	/**
	 * This can be used in sync functions after .get(), .getValue(), or .refresh() completes
	 * The value comes back decrypted.
	 * It will return the current, cached copy which may have expired.
	 * @returns {string} The value of the Secret or Parameter
	 */
	sync_getValue() {
		if (this.isValid()) {
			DebugAndLog.debug(`CachedParameterSecret.sync_getValue() returning value of value ${this.name}`, this.toObject());
			return ("Parameter" in this.value) ? this.value?.Parameter?.Value : this.value?.SecretString ;
		} else {
			// Throw error
			throw new Error("CachedParameterSecret Error: Secret is null. Must call and await async function .get(), .getValue(), or .refresh() first");
		}
	}

	/**
	 * 
	 * @returns {string} The URL path passed to localhost for the AWS Parameters and Secrets Lambda Extension
	 */
	getPath() {
		return "";
	}

	async _requestSecretsFromLambdaExtension() {

		return new Promise(async (resolve, reject) => {

			let body = "";

			const options = {
				hostname: CachedParameterSecret.hostname,
				port: CachedParameterSecret.port,
				path: this.getPath(),
				headers: {
					'X-Aws-Parameters-Secrets-Token': process.env.AWS_SESSION_TOKEN
				},
				method: 'GET'
			};

			const responseBodyToObject = function (valueBody) { 
				try {
					let value = null;

					if (typeof valueBody === "string") {
						value = JSON.parse(valueBody);
					}
					
					resolve(value);

				} catch (error) {
					DebugAndLog.error(`CachedParameterSecret http: Error Calling Secrets Manager and SSM Parameter Store Lambda Extension: Error parsing response for ${options.path} ${error.message}`, error.stack);
					reject(null);
				}

			};

			let req = http.request(options, (res) => {

				DebugAndLog.debug('CachedParameterSecret http: Calling Secrets Manager and SSM Parameter Store Lambda Extension');

				try {
					/*
					The 3 classic https.get() functions
					What to do on "data", "end" and "error"
					*/

					res.on('data', function (chunk) { body += chunk; });

					res.on('end', function () { 
						DebugAndLog.debug(`CachedParameterSecret http: Received response for ${options.path}`);
						responseBodyToObject(body);
					});

					res.on('error', error => {
						DebugAndLog.error(`CachedParameterSecret http Error: E0 Error obtaining response for ${options.path} ${error.message}`, error.stack);
						reject(null);
					});

				}  catch (error) {
					DebugAndLog.error(`CachedParameterSecret http Error: E1 Error obtaining response for ${options.path} ${error.message}`, error.stack);
					reject(null);
				}

			});

			req.on('timeout', () => {
				DebugAndLog.error(`CachedParameterSecret http Error: Endpoint request timeout reached for ${options.path}`);
				req.end();
				reject(null);
			});

			req.on('error', error => {
				DebugAndLog.error(`CachedParameterSecret http Error: Error during request for ${options.path} ${error.message}`, error.stack);
				reject(null);
			});

			req.end();

		});

	};

}

class CachedSSMParameter extends CachedParameterSecret {
	getPath() {
		const uriEncodedSecret = encodeURIComponent(this.name);
		return `/systemsmanager/parameters/get/?name=${uriEncodedSecret}&withDecryption=true`;
	}

	isValid() {
		return (
			super.isValid()
			&& "Parameter" in this.value
		);
	}
}

class CachedSecret extends CachedParameterSecret {

	getPath() {
		const uriEncodedSecret = encodeURIComponent(this.name);
		return `/secretsmanager/get?secretId=${uriEncodedSecret}&withDecryption=true`;
	}

	isValid() {
		return (
			super.isValid()
			&& "SecretString" in this.value
		);
	}
}


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

/* ****************************************************************************
 * Response Data Model
 * ----------------------------------------------------------------------------
 * 
 * Provides a class that can be used to store and complie data to send back
 * as a response.
 * 
 *************************************************************************** */

/**
 * A response object that can be used to collect data to be sent back as a response.
 * A structured skeleton may be created during construction to create an order of
 * presenting various keys. As the program executes, additional data may be added.
 * Other response objects may be added with keys to fill out the object. If there are
 * key collisions then new items matching that key are added as an element in an array.
 * 
 * Extends ResponseDataModel, can be used to extend as an interface.
 * 
 * @example
 * let obj = new Response(); // you can pass a skeleton that you will add to, or the full object to the constructor
 * obj.addItem(newItem); // where newItem is another response object or regular structured object which will be added as a node
 * obj.addItemByKey(newItem2,"employees");// where newItem2 is another response object or regular structured object which will be added as a node. Note that you can override a label by passing a new one. For example pluralizing a label
 * obj.removeEmpty(); // optional, it will remove empty keys
 * 	response = {
 * 		statusCode: 200,
 * 		body: dataResponse.toString(),
 * 		headers: {'content-type': 'application/json'}
 * 	};
 *
 */
class ResponseDataModel {

	_responseData = null;
	_label = "";

	/**
	 * Used for collecting parts of a response. A data skeleton may be passed in as an object.
	 * 
	 * @param {*} data Can be a skeleton with various fields set to {}, [], "", null or defaults.
	 * @param {*} label 
	 */
	constructor(data = null, label = "") {
		if (data !== null) {
			this._responseData = data;
		}

		if (label !== "") {
			this._label = label;
		}
	};
	
	/**
	 * Get the label that will be used when this object is added to another 
	 * ResponseDataModel or returned as a response
	 * @returns {string} a label to use as a key for the object
	 */
	getLabel() {
		return this._label;
	};

	/**
	 * Get the data object
	 * @returns {*} A copy of the data object
	 */
	getResponseData() {
		return JSON.parse(JSON.stringify(this._responseData));
	};

	/**
	 * Add an item as part of an array.
	 * If the responseObject is null, it will be transformed into an array and the item will be added at index 0
	 * If the responseObject is an array, the item will be added as the next index
	 * If the responseObject is an object, the item will be added as an array element under the label (or 'items' if label is "")
	 * @param {ResponseDataModel|*} item 
	 */
	addItem(item) {

		let data = null;
		let label = "";

		if ( item instanceof ResponseDataModel ) {
			data = item.getResponseData();
			label = item.getLabel(); // see if there is an override key/label
		} else {
			data = item;
		}

		if ( label === "" ) {
			if ( this._responseData === null ) {
				this._responseData = [];
			}

			if ( Array.isArray(this._responseData)) {
				this._responseData.push(data);
			} else if ( this._responseData instanceof Object ) {
				if ( !("items" in this._responseData) || this._responseData.items === null) {
					this._responseData.items = [];
				}
				this._responseData.items.push(data);
			}
		} else {
			if ( this._responseData === null ) {
				this._responseData = {};
			}

			if ( !(label in this._responseData) || this._responseData[label] === null) {
				this._responseData[label] = [];
			}

			this._responseData[label].push(data);
		}
		
	};
	
	/**
	 * Add an item by key
	 * @param {ResponseDataModel|*} item 
	 * @param {string} key 
	 */
	addItemByKey(item, key = "") {

		if ( this._responseData === null ) {
			this._responseData = {};
		}

		let data = null;
		let label = "";

		if ( item instanceof ResponseDataModel ) {
			data = item.getResponseData();
			label = (key !== "" ? key : item.getLabel() ); // see if there is an override key/label
		} else {
			data = item;
			label = key;
		}

		// check if the key exists, if it does (and it is not an "empty" placeholder) then we will add this item to an array
		if ( label in this._responseData 
			&& this._responseData[label] !== null // any placeholder
			&& this._responseData[label] !== "" // string placeholder
			&& this._responseData[label] != 0 // number placeholder
			&& !( this._responseData[label] instanceof Object && Object.keys(this._responseData[label]).length === 0 && Object.getPrototypeOf(this._responseData[label]) === Object.prototype ) // object placeholder
			) {
			// if it is not yet an array, convert to array and move existing data to index 0
			if ( !Array.isArray(this._responseData[label]) ) {
				let temp = JSON.parse(JSON.stringify(this._responseData[label])); // no pointers, create copy
				this._responseData[label] = []; // reassign to array
				this._responseData[label].push(temp); // move original element to array
			}
			this._responseData[label].push(data); // push the new data onto array
		} else {
			this._responseData[label] = data; // replace
		}
		
	};
	
	/**
	 * 
	 * @returns {*} The data object. If there is a label then it is returned as a key value pair where the label is the key
	 */
	toObject() {
		let obj = {};
		if (this._label === "") {
			obj = this.getResponseData();
		} else {
			let key = this._label;
			obj[key] = this.getResponseData();
		}
		return obj;
	};

	/**
	 * 
	 * @returns {string} A stringified JSON object (using .toObject() ) for use as a response
	 */
	toString() {
		return JSON.stringify(this.toObject());
	};

};

class TestResponseDataModel {

	constructor() {};

	static run() {

		let obj1a = new ResponseDataModel({ name: "CHEVY", id: "F3C9-HY92", miles: null});
		let obj1b = new ResponseDataModel({ name: "TOYOTA", id: "F3C9-NP14" });
		let obj1c = new ResponseDataModel({ name: "FORD", id: "F3C9-BZ50" });

		let resp1 = new ResponseDataModel(null, "resp1");
		DebugAndLog.debug("Add unlabled items to empty object");

		resp1.addItem(obj1a);
		DebugAndLog.debug("After one", resp1);

		resp1.addItem(obj1b);
		DebugAndLog.debug("After two", resp1);

		resp1.addItem(obj1c);
		DebugAndLog.debug("After three", resp1);

		DebugAndLog.debug("Get Label: "+resp1.getLabel());
		DebugAndLog.debug("Get Response",resp1.getResponseData());
		DebugAndLog.debug("To Object",resp1.toObject());
		DebugAndLog.debug("To String: "+resp1.toString());

		let resp2 = new ResponseDataModel({ company: "ACME" }, "resp2");
		DebugAndLog.debug("Add unlabled items to labeled object");

		resp2.addItem(obj1a);
		DebugAndLog.debug("After one", resp2);

		resp2.addItem(obj1b);
		DebugAndLog.debug("After two", resp2);

		resp2.addItem(obj1c);
		DebugAndLog.debug("After three", resp2);

		DebugAndLog.debug("Get Label: "+resp2.getLabel());
		DebugAndLog.debug("Get Response",resp2.getResponseData());
		DebugAndLog.debug("To Object",resp2.toObject());
		DebugAndLog.debug("To String: "+resp2.toString());

		let obj2a = new ResponseDataModel({ name: "SMITH", id: "47GT-873D", office: null }, "employees");
		let obj2b = new ResponseDataModel({ name: "JOHNSON", id: "47GT-916T" }, "employees");
		let obj2c = new ResponseDataModel({ name: "ANDERSON", id: "47GT-J305" }, "employees");

		let resp3 = new ResponseDataModel(null, "resp3");
		DebugAndLog.debug("Add labeled items to main object");

		resp3.addItemByKey(obj2a);
		DebugAndLog.debug("After one", resp3);

		resp3.addItemByKey(obj2b);
		DebugAndLog.debug("After two", resp3);

		resp3.addItemByKey(obj2c);
		DebugAndLog.debug("After three", resp3);

		DebugAndLog.debug("Get Label: "+resp3.getLabel());
		DebugAndLog.debug("Get Response",resp3.getResponseData());
		DebugAndLog.debug("To Object",resp3.toObject());
		DebugAndLog.debug("To String: "+resp3.toString());

		let resp4 = new ResponseDataModel({ company: "ACME" }, "resp4");
		DebugAndLog.debug("Add unlabled items to labeled object");

		resp4.addItemByKey(obj2a);
		DebugAndLog.debug("After one", resp4);

		resp4.addItemByKey(obj2b);
		DebugAndLog.debug("After two", resp4);

		resp4.addItemByKey(obj2c);
		DebugAndLog.debug("After three", resp4);

		DebugAndLog.debug("Get Label: "+resp4.getLabel());
		DebugAndLog.debug("Get Response",resp4.getResponseData());
		DebugAndLog.debug("To Object",resp4.toObject());
		DebugAndLog.debug("To String: "+resp4.toString());
		
		let resp5 = new ResponseDataModel();
		DebugAndLog.debug("Merge all");

		resp5.addItemByKey(resp1);
		DebugAndLog.debug("After one", resp5);

		resp5.addItemByKey(resp2);
		DebugAndLog.debug("After two", resp5);

		resp5.addItemByKey(resp3);
		DebugAndLog.debug("After three", resp5);

		resp5.addItemByKey(resp4);
		DebugAndLog.debug("After four", resp5);

		DebugAndLog.debug("Get Label: "+resp5.getLabel());
		DebugAndLog.debug("Get Response",resp5.getResponseData());
		DebugAndLog.debug("To Object",resp5.toObject());
		DebugAndLog.debug("To String: "+resp5.toString());

		DebugAndLog.debug("Using a skeleton");
		let resp6 = new ResponseDataModel( { employees: [], items: null, locations: null});
		resp6.addItem(obj2a);
		resp6.addItem(obj2b);
		resp6.addItem(obj2c);
		resp6.addItem(obj1a);

		DebugAndLog.debug("To Object",resp6.toObject());

		DebugAndLog.debug("Using a skeleton 2");
		let resp7 = new ResponseDataModel( { employees: null, volunteers: null, locations: null});
		resp7.addItem(obj2a);
		resp7.addItem(obj1a);
		resp7.addItem(obj1b);
		resp7.addItem(obj1c);

		DebugAndLog.debug("To Object",resp7.toObject());

	};
};

/* *****************************************************************************
   -----------------------------------------------------------------------------
   HELPER FUNCTIONS
   -----------------------------------------------------------------------------
*/

const printMsg = function() {
	console.log("This is a message from the demo package");
};

/**
 * Given a secret string, returns a string padded out at the beginning
 * with * or passed character leaving only the specified number of characters unobfuscated.
 * 
 * For example, if 123456789123456 was passed with default keep, padding character, and length,
 * ******3456 would be returned.
 * 
 * No more than 25% of the string, or 6 characters may be kept, whichever is lesser.
 * @param {string} str The secret string to obfuscate
 * @param {Object} options
 * @param {number} options.keep The number of characters to keep unobfuscated on the end. 4 is default
 * @param {string} options.char The character to pad out with. '*' is default
 * @param {number} options.len Length of the result string
 * @returns Last few characters padded by * or (passed character) from start
 */
const obfuscate = function(str, options = {}) {
	if ( !( "keep" in options) ) { options.keep = 4; }
	if ( !( "char" in options) ) { options.char = '*'; }
	if ( !( "len" in options)  ) { options.len = 10; }

	// don't show more than 25% of the string, and show no more than a max of 6;
	if ((options.keep / str.length) > .25 || str.length <= 6) { options.keep = Math.min(Math.ceil(str.length * .25), 6); }

	// we allow any length greater than padding of 4
	if ( options.keep + 4 > options.len ) { options.len = options.keep + 4; }

	return str.slice(-options.keep).padStart(options.len, options.char);
};

/**
 * Given an object such as a Lambda event which may hold secret keys in the query string or 
 * Authorization headers, it will attempt to find and obfuscate them. It searches for any object keys,
 * string patterns that have 'key', 'secret', or 'token' in the label and obfuscates its value.
 * @param {Object} obj The object to sanitize
 * @returns A sanitized object
 */
const sanitize = function (obj) {

	let sanitizedObj = {};
	
	try {

		// convert object to a string which is much easier to perform a search/replace on
		let strObj = JSON.stringify(obj);
		
		/**
		 * Find and replace secret values for secrets, keys, tokens, and authorization headers
		 * @param {string} strObj 
		 * @returns stringified object with secret values replaced (except arrays)
		 */
		const sanitizeRoundOne = function (strObj) {

			/* 
			This regex will produce 2 groups for each match. 
			Group 1 will have object key/values and = param value pairs from strings such as query strings.
			Group 2 will have authorization header keys 
			View/Edit this regex: https://regex101.com/r/IJp35p/3
			*/
			const regex1 = new RegExp(/(?:"?[a-z0-9_\-]*(?:key|secret|token)[a-z0-9_\-]*"?\s*(?::|=)\s*\"?(?!null|true|false)([a-z0-9+_:\.\-\/]+)|"Authorization":"[a-z0-9+:_\-\/]+\s(.*?(?<!\\)(?=")))/, "gi");

			// find matches
			let matches = strObj.matchAll(regex1);

			/* 
			We will do a loop, sort, then another loop, 
			but we don't expect 100s of matches anyway.
			*/

			// simplify the array of matches
			let matchList = [];
			for (const match of matches) {
				let segment = match[0];
				let secret = (match[1] !== undefined) ? match[1] : match[2]; // we only expect a result in Group 1 or Group 2, not both
				matchList.push({ segment, secret});
			}
		
			// sort so we are replacing the largest strings first
			matchList.sort(function (a, b) {
				return b.segment.length - a.segment.length;
			});
		
			// Perform replacecements
			for (const match of matchList) {
		
				/* 
				Determine if we should obfuscate as string or number 
				If we have an object such as: { pin:37832481234 }
				We will get a JSON parse error if we replace a number as *****1234
				So we need to replace it as a number such as 99999991234 so that
				when it parses from a string back to an object it looks like: { pin:99999991234 }
				However, we want to treat strings as strings:
				{ pin:"3783281234" } => { pin:"**********1234" }
				*/

				// see if character right before secret is : (stringify will place a number right after : without quotes, and we'll ignore =)
				let obf = (match.segment.charAt(match.segment.length - match.secret.length-1) === ':') 
					? obfuscate(match.secret, {char: 9}) // pad with 9
					: obfuscate(match.secret); // pad normally
		
				/* 
				2 steps. Replace secret in match, then replace match in strObj
				This ensures we keep the stringified object true to form for 
				converting back to obj
				*/
				let str = match.segment.replace(match.secret, obf); // replace secret in match
				strObj = strObj.replace(match.segment, str); // find the old match and replace it with the new one

			}

			return strObj;
		};
		
		/**
		 * Find secret, key, and token arrays in stringified object
		 * @param {string} strObj 
		 * @returns stringified object with array of secrets replaced
		 */
		const sanitizeRoundTwo = function(strObj) {
			/*
			This regex will grab object keys matching the key|secret|token names which have arrays 
			https://regex101.com/r/dFNu4x/3
			*/
			const regex2 = new RegExp(/\"[a-z0-9_\-]*(?:key|secret|token)[a-z0-9_\-]*\":\[([a-z0-9+_:\.\-\/\",]+)\]/, "gi");
			const regex3 = new RegExp(/[^,\"]+/, "gi");

			// find matches
			let arrayMatches = strObj.matchAll(regex2);

			// simplify the array of matches
			let matchList2 = [];
			for (const match of arrayMatches) {
				let segment = match[0];
				let secrets = match[1];
				matchList2.push({ segment, secrets});
			}

			// sort so we are replacing the largest strings first
			matchList2.sort(function (a, b) {
				return b.segment.length - a.segment.length;
			});

			for (const match of matchList2) {
				let secrets = match.secrets.matchAll(regex3);
				let list = [];
				for (const secret of secrets) {
					list.push(obfuscate(secret[0]));
				}
				let csv = `"${list.join('","')}"`;
				let str = match.segment.replace(match.secrets, csv);
				strObj = strObj.replace(match.segment, str);
			};

			return strObj;
		};
		
		// convert back to object
		sanitizedObj = JSON.parse(sanitizeRoundTwo(sanitizeRoundOne(strObj)));

	} catch (error) {
		DebugAndLog.error(`Error sanitizing object. Skipping: ${error.message}`, error.stack);
		sanitizedObj = {"message": "Error sanitizing object"};
	}
		
	return sanitizedObj;
};


/**
 * Hash JSON objects and arrays to determine matches (contain 
 * the same keys, values, and nesting.
 * 
 * Works best with JSON data objects that survive JSON.stringify(). 
 * If the data object passed to it contains classes or specialized 
 * objects (like Date), JSON.stringify() will attempt to use a
 * .toJSON() method to convert the object. DataTypes of Symbols and
 * Functions will not survive this process.

 * @param {string} algorithm
 * @param {Object|Array|BigInt|Number|String|Boolean} data to hash
 * @param {{salt: string, iterations: number}} options
 * @returns {string} Reproducible hash in hex
 */
const hashThisData = function(algorithm, data, options = {}) {

	const crypto = require("crypto"); // included by aws so don't need to add to package.json

	// set default values for options
	if ( !( "salt" in options) ) { options.salt = ""; }
	if ( !( "iterations" in options) || options.iterations < 1 ) { options.iterations = 1; }
	if ( !( "skipParse" in options) ) { options.skipParse = false; } // used so we don't parse during recursion

	// if it is an object or array, then parse it to remove non-data elements (functions, etc)
	if ( !options.skipParse && (typeof data === "object" || Array.isArray(data))) {
		data = JSON.parse(JSON.stringify(data, (key, value) => {
			switch (typeof value) {
				case 'bigint':
					return value.toString();
				case 'undefined':
					return 'undefined';
				default:
					return value;
			}
		}));
		options.skipParse = true; // set to true so we don't parse during recursion
	}

	// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/typeof
	const dataType = (data !== null && !Array.isArray(data)) ? typeof data : (Array.isArray(data)) ? "array" : "null";
	
	if (data === null) { data = "null" }
	if (data === undefined) { data = "undefined" }

	let valueStr = "";

	if (dataType === "array" || dataType === "object") {

		/*
		We will iterate through the keys and values and generate a reproducible data string.
		(sorted by object key or array value)
		*/

		let arrayOfStuff = [];

		// copy the named keys and alphabetize (or generate index for array) .
		let keys = (dataType === "array") 
			? Array.from({ length: data.length }, (value, index) => index)
			: Object.keys(data).sort();
	
		// iterate through the keys alphabetically and add the key and value to the arrayOfStuff
		keys.forEach((key) => {
			// clone options
			const opts = JSON.parse(JSON.stringify(options));
			opts.iterations = 1; // don't iterate during recursion, only at end

			const value = hashThisData(algorithm, data[key], opts);
			arrayOfStuff.push( `${(dataType !== "array" ? key : "$array")}:::${dataType}:::${value}` );
		})
		
		valueStr = arrayOfStuff.sort().join("|||");

	} else {
		valueStr = `-:::${dataType}:::${data.toString()}`;
	}

	const hash = crypto.createHash(algorithm);
	let hashOfData = "";

	// hash for the number of iterations
	for (let i = 0; i < options.iterations; i++) {
		hash.update(valueStr + hashOfData + options.salt);
		hashOfData = hash.digest('hex');
	}

	return hashOfData;
};

module.exports = {
	nodeVer,
	nodeVerMajor,
	nodeVerMinor,
	nodeVerMajorMinor,
	AWS,
	APIRequest,
	ImmutableObject,
	Timer,
	DebugAndLog,
	Connection,
	Connections,
	ConnectionRequest,
	RequestInfo,
	ResponseDataModel,
	TestResponseDataModel,
	_ConfigSuperClass,
	CachedSSMParameter,
	CachedSecret,
	CachedParameterSecret,
	printMsg,
	sanitize,
	obfuscate,
	hashThisData
};