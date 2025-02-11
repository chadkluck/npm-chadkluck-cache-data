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

const https = require('https'); // For all other connections

const RequestInfo = require("./RequestInfo.class");
const ClientRequest = require("./ClientRequest.class");
const ResponseDataModel = require("./ResponseDataModel.class");
const Response = require("./Response.class");
const Timer = require("./Timer.class");
const DebugAndLog = require("./DebugAndLog.class");
const ImmutableObject = require('./ImmutableObject.class');
const jsonGenericResponse = require('./generic.response.json');
const htmlGenericResponse = require('./generic.response.html');
const xmlGenericResponse = require('./generic.response.xml');
const rssGenericResponse = require('./generic.response.rss');
const textGenericResponse = require('./generic.response.text');
const { printMsg, sanitize, obfuscate, hashThisData} = require('./utils');
const { CachedParameterSecrets, CachedParameterSecret, CachedSSMParameter, CachedSecret } = require('./CachedParametersSecrets.classes')
const { Connections, Connection, ConnectionRequest, ConnectionAuthentication } = require('./Connections.classes')

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
			options: { 
				timeout: timeOutInMilliseconds,
				separateDuplicateParameters: false,
				separateDuplicateParametersAppendToKey: "", // "" "[]", or "0++", "1++"
				combinedDuplicateParameterDelimiter: ',' // "," or "|" or " "
			}
		};

		/* if we have a method or protocol passed to us, set them */
		if ( "method" in request && request.method !== "" && request.method !== null) { req.method = request.method.toUpperCase(); }
		if ( "protocol" in request && request.protocol !== "" && request.protocol !== null) { req.protocol = request.protocol.toLowerCase(); }

		if ("body" in request) { req.body = request.body; }
		if ("headers" in request && request.headers !== null) { req.headers = request.headers; }
		if ("note" in request) { req.note = request.note; }

		// With options we want to keep our defaults so we'll use Object.assign
		if ("options" in request && request.options !== null) { req.options = Object.assign(req.options, request.options); }

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

			req.uri += this._queryStringFromObject(request.parameters, req.options);
		}

		this.#request = req;
	};

	_queryStringFromObject = function (parameters, options) {

		let qString = [];
		
		for (const [key,value] of Object.entries(parameters) ) {
	
			/* if the value is an array, then we have to join into one parameter or separate into multiple key/value pairs */
			if ( Array.isArray(value) ) {
				let values = [];
	
				/* apply encodeURIComponent() to each element in value array */
				for (const v of value) {
					values.push(encodeURIComponent(v));
				}
				
				if ( "separateDuplicateParameters" in options && options.separateDuplicateParameters === true) {
					let a = "";
					if ( "separateDuplicateParametersAppendToKey" in options ) {
						if ( options.separateDuplicateParametersAppendToKey === '1++' || options.separateDuplicateParametersAppendToKey === '0++') {
							a = (options.separateDuplicateParametersAppendToKey === "1++") ? 1 : 0;
						} else {
							a = options.separateDuplicateParametersAppendToKey;
						}
					}
					
					for (const v of values) {
						qString.push(`${key}${a}=${v}`); // we encoded above
						if(Number.isInteger(a)) { a++; }
					}
				} else {
					const delim = ("combinedDuplicateParameterDelimiter" in options && options.combinedDuplicateParameterDelimiter !== null && options.combinedDuplicateParameterDelimiter !== "") ? options.combinedDuplicateParameterDelimiter : ",";
					qString.push(`${key}=${values.join(delim)}`); // we encoded above
				}
	
			} else {
				qString.push(`${key}=${encodeURIComponent(value)}`);
			}
		}
	
		return (qString.length > 0) ? '?'+qString.join("&") : "";
	}

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
	_ConfigSuperClass,
	CachedSSMParameter,
	CachedSecret,
	CachedParameterSecret,
	CachedParameterSecrets,
	jsonGenericResponse,
	htmlGenericResponse,
	rssGenericResponse,
	xmlGenericResponse,
	textGenericResponse,
	printMsg,
	sanitize,
	obfuscate,
	hashThisData
};