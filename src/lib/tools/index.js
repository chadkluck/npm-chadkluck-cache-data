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

const AWSXRay = (process.env?.CacheData_AWSXRayOn === "true") ? require("aws-xray-sdk-core") : null;

if (AWSXRay !== null) {
	AWSXRay.captureHTTPsGlobal(require('http'));
	AWSXRay.captureHTTPsGlobal(require("https"));	
}

const http = require('http'); // For AWS Parameters and Secrets Lambda Extension - accesses localhost via http
const https = require('https'); // For all other connections

const RequestInfo = require("./RequestInfo.class");
const ClientRequest = require("./ClientRequest.class");
const ResponseDataModel = require("./ResponseDataModel.class");
const Response = require("./Response.class");
const Timer = require("./Timer.class");
const DebugAndLog = require("./DebugAndLog.class");
const ImmutableObject = require('./ImmutableObject.class');
const jsonGenericStatus = require('./generic.status.json');
const htmlGenericStatus = require('./generic.status.html');
const { printMsg, sanitize, obfuscate, hashThisData} = require('./utils');
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

	static #XRayOn = (AWSXRay !== null);

	constructor() {}

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
			AWSXRayOn: this.#XRayOn
		});
	}

	static #SDK = (
		function(){
			if (AWS.SDK_V2) {
				const { DynamoDB, S3, SSM } = (this.#XRayOn) ? AWSXRay.captureAWS(require("aws-sdk")) : require("aws-sdk");
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
	 * @returns {number} ClientRequest timout in milliseconds
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
	 * Get information about the ClientRequest and the Response including
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

	toObject() {
		return this._connections;
	};

	toJSON() {
		// loop through the Connection objects in Connections by key and use each of their .toInfoObject() methods to generate an object
		var obj = {};
		for (var key in this._connections) {
			obj[key] = this._connections[key].toInfoObject();
		}
		return JSON.stringify(obj);
	}

};

/**
 * The Connection object provides the base for requests but does not carry
 * the request. myConnection.get() will return an object (associative array) 
 * that can then be used to generate and submit a request to a DAO class or 
 * APIRequest object.
 * You can store and manage multiple connections using the Connections object.
 */
class Connection {


	/**
	 * Given an object (associative array) create a Connection
	 *
	 * @param {{name: string, method: string, uri: string, protocol: string, host: string, path: string, parameters: Array, headers: Array, options: object, note: string, authentication: object|ConnectionAuthentication, cache: Array}} obj
	 */
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

	_cachedAuthObject = null;

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
		let params = (this._parameters !== null) ? JSON.parse(JSON.stringify(this._parameters)) : null;

		if ("parameters" in this._getAuthenticationObject()) {
			if (params === null) { params = {}; }
			// combine auth keys and values with parm keys and values
			params = Object.assign({}, params, this._getAuthenticationObject().parameters);
		}

		return params;
	};

	/**
	 * 
	 * @returns {Object}
	 */
	getHeaders() {
		let headers = (this._headers !== null) ? JSON.parse(JSON.stringify(this._headers)) : null;

		if ("headers" in this._getAuthenticationObject()) {
			if (headers === null) { headers = {}; }
			// combine auth keys and values with parm keys and values
			headers = Object.assign({}, headers, this._getAuthenticationObject().headers);
		}

		return headers;
	};

	/**
	 * @returns {string}
	 */
	getBody() {
		let body = ("body" in this._getAuthenticationObject()) ? this._getAuthenticationObject().body : this._body;

		if (body !== null && typeof body !== 'string') {
			body = JSON.stringify(body);
		}
		
		return body;
	};

	_getAuthenticationObject() {
		if (this._cachedAuthObject === null) {
			this._cachedAuthObject = (this._authentication === null) ? {} : this._authentication.toObject();
		}
		return this._cachedAuthObject;
	}

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

	_toObject() {
		const obj = {};
		if ( this._method !== null ) { obj.method = this._method; }
		if ( this._uri !== null ) { obj.uri = this._uri; }
		if ( this._protocol !== null ) { obj.protocol = this._protocol; }
		if ( this._host !== null ) { obj.host = this._host; }
		if ( this._path !== null ) { obj.path = this._path; }	

		if ( this._options !== null ) { obj.options = this._options; }
		if ( this._note !== null ) { obj.note = this._note; }
		return obj;
	}

	/**
	 * 
	 * @returns object (associative array) with connection details in key/pairs
	 */
	toObject() {
		const obj = this._toObject();

		const headers = this.getHeaders();
		const parameters = this.getParameters();
		const body = this.getBody();

		if ( headers !== null ) { obj.headers = headers; }
		if ( parameters !== null ) { obj.parameters = parameters; }
		if ( body !== null ) { obj.body = body; }

		if ( this._authentication !== null ) { obj.authentication = this._authentication.toObject(); }

		return obj;
	};

	toInfoObject() {
		const obj = this._toObject();

		if ( this._headers !== null ) { obj.headers = this._headers; }
		if ( this._parameters !== null ) { obj.parameters = this._parameters; }
		if ( this._body !== null ) { obj.body = this._body; }

		if ( this._authentication !== null && typeof this._authentication === "object" && this._authentication instanceof ConnectionAuthentication) {
			obj.auth = {};
			obj.auth.headers = this._authentication.hasHeader();
			obj.auth.parameters = this._authentication.hasParameter();
			obj.auth.body = this._authentication.hasBody();
			obj.auth.basic = this._authentication.hasBasic();
		}

		return obj;
	}

	toString() {
		return `${this._name} ${this._method} ${(this._uri) ? this._uri : this._protocol+"://"+this._host+this._path}${(this._note) ? " "+this._note : ""}`;
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

	hasHeader() {
		return (this.#headers !== null);
	};

	hasParameter() {
		return (this.#parameters !== null);
	};

	hasBody() {
		return (this.#body !== null);
	};

	hasBasic() {
		return (this.#basic !== null);
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
		if ( this.hasBasic() ) {
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
		if ( this.hasParameter() ) { obj = this.#parameters; }
		return obj;
	};

	/**
	 * Combines any auth header fields. If authorizations such as Basic is used the 
	 * appropriate header field is generated.
	 * @returns {object} Object containing key/value pairs for headers
	 */
	_getHeaders() {
		let obj = {};
		if ( this.hasHeader() ) { obj = this.#headers; };

		// auth methods here
		if ( this.hasBasic() ) { obj = Object.assign({}, obj.headers, this._getBasicAuthHeader()); } // merge basic auth into headers
		
		return obj;
	};

	/**
	 * Combines any auth fields sent via a body
	 * @returns {object} Object containing key/value pairs for body
	 */
	_getBody() {
		let obj = {};
		if ( this.hasBody() ) { obj = this.#body; };
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

		return JSON.parse(JSON.stringify(obj));
	};

	// Static methods that could perform authentication could go here
	// such as OAuth 2.0 or Bearer tokens.
	// that way an object containing the right info could be passed in and executed
	
};

/**
 * A Connection provides the base for a ClientRequest. A ClientRequest extends the 
 * Connection by adding request specific parameters. While a Connection 
 * cannot be modified after creation (it is a config), a ClientRequest can be 
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

class CachedParameterSecrets {
	/** 
	 * @typedef {Array<CachedParameterSecret>}
	 */
	static #cachedParameterSecrets = [];

	/**
	 * @param {CachedParameterSecret} The CachedParameterSecret object to add
	 */
	static add (cachedParameterSecretObject) {
		CachedParameterSecrets.#cachedParameterSecrets.push(cachedParameterSecretObject);
	}

	/**
	 * @param {string} The Parameter name or Secret Id to locate
	 * @returns {CachedParameterSecret}
	 */
	static get (name) {
		return CachedParameterSecrets.#cachedParameterSecrets.find(cachedParameterSecretObject => cachedParameterSecretObject.getName() === name);
	}

	/**
	 * 
	 * @returns {Array<object>} An array of objects representing the CachedParameterSecret.toObject()
	 * (see CachedParameterSecret.toObject() for details
	 */
	static toArray() {
		// return an array of cachedParameterSecret.toObject()
		const objects = [];
		CachedParameterSecrets.#cachedParameterSecrets.forEach(cachedParameterSecretObject => {
			objects.push(cachedParameterSecretObject.toObject());
		});
		return objects;
	};

	static toObject() {
		// return an object of cachedParameterSecret.toObject()
		return {objects: CachedParameterSecrets.toArray()};
	}

	/**
	 *
	 * @returns {string} JSON string of CachedParameterSecrets.toObject()
	 */
	static toJSON() {
		return JSON.stringify(CachedParameterSecrets.toObject());
	};

	/**
	 * 
	 * @returns {Array<string>}
	 */
	static getNameTags() {
		const nameTags = [];
		CachedParameterSecrets.#cachedParameterSecrets.forEach(cachedParameterSecretObject => {
			nameTags.push(cachedParameterSecretObject.getNameTag());
		});
		return nameTags;
	};

	/**
	 * 
	 * @returns {Array<string>}
	 */
	static getNames() {
		const names = [];
		CachedParameterSecrets.#cachedParameterSecrets.forEach(cachedParameterSecretObject => {
			names.push(cachedParameterSecretObject.getName());
		});
		return names;
	};

	/**
	 * Call .prime() of all CachedParameterSecrets and return all the promises
	 * @returns {Promise<Array>}
	 */
	static async prime() {

		return new Promise(async (resolve, reject) => {

			try {
				const promises = [];
				CachedParameterSecrets.#cachedParameterSecrets.forEach(cachedParameterSecretObject => {
					promises.push(cachedParameterSecretObject.prime());
				});

				await Promise.all(promises);

				resolve(true);

			} catch (error) {
				DebugAndLog.error(`CachedParameterSecrets.prime(): ${error.message}`, error.stack);
				reject(false);
			}

		});

	};
}

/**
 * Parent class to extend CachedSSMParameter and CachedSecret classes.
 * Accesses data through Systems Manager Parameter Store and Secrets Manager Lambda Extension
 * Since the Lambda Extension runs a localhost via http, it handles it's own http request. Also,
 * since the lambda extension needs time to boot during a cold start, it is not available during
 * the regular init phase outside of the handler. Therefore, we can pass the Object to be used as
 * the secret and then perform an async .get() or .getValue() at runtime. If we need to use a
 * synchronous function, then we must perform a .prime() and make sure it is complete before calling
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
		CachedParameterSecrets.add(this);
		DebugAndLog.debug(`CachedParameterSecret: ${this.getNameTag()}`);
	};

	/**
	 *
	 * @returns {string} The Parameter path and name or Id of Secret
	 */
	getName() {
		return this.name;
	};

	/**
	 * Returns a string with the name and instance of the class object
	 * @returns {string} 'name [instanceof]'
	 */
	getNameTag() {
		return `${this.name} [${this.instanceof()}]`
	}

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
	 * JSON.stringify() looks for .toJSON methods and uses it when stringify is called.
	 * This allows us to set an object property such as key with the Class object and 
	 * then, when the object is put to use through stringify, the object will be 
	 * converted to a string.
	 * @returns {string} value of secret or parameter
	 */
	toJSON() {
		return this.sync_getValue();
	};

	/**
	 * This allows us to set an object property such as key with the Class object and 
	 * then, when the object is put to use through stringify, the object will be 
	 * converted to a string.	
	 * @returns {string} value of secret or parameter
	 */
	toString() {
		return this.sync_getValue();
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
		DebugAndLog.debug(`CachedParameterSecret.prime() called for ${this.getNameTag()}`);
		const p = (this.needsRefresh()) ? this.refresh() : this.cache.promise; 
		DebugAndLog.debug(`CachedParameterSecret.prime() status of ${this.getNameTag()}`, this.toObject());
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
			DebugAndLog.debug(`CachedParameterSecret.sync_getValue() returning value for ${this.name}`, this.toObject());
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

module.exports = {
	nodeVer,
	nodeVerMajor,
	nodeVerMinor,
	nodeVerMajorMinor,
	AWS,
	AWSXRay,
	APIRequest,
	ImmutableObject,
	Timer,
	DebugAndLog,
	Connection,
	Connections,
	ConnectionRequest,
	ConnectionAuthentication,
	RequestInfo,
	ClientRequest,
	ResponseDataModel,
	Response,
	TestResponseDataModel,
	_ConfigSuperClass,
	CachedSSMParameter,
	CachedSecret,
	CachedParameterSecret,
	CachedParameterSecrets,
	jsonGenericStatus,
	htmlGenericStatus,
	printMsg,
	sanitize,
	obfuscate,
	hashThisData
};