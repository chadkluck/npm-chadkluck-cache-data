const RequestInfo = require('./RequestInfo.class');
const Timer = require('./Timer.class');
const DebugAndLog = require('./DebugAndLog.class');


/**
 * Extends RequestInfo
 * Can be used to create a custom Request object
 */
class Request extends RequestInfo { 

	static #validations = {
		referrers: ['*'],
		parameters: {}
	};

	static #authenticationIsRequired = false; // is it a public API (no authentication required) or authenticated API? (if both, set to false and use authorizations and roles)
	static #unauthenticatedAuthorizations = (Request.#authenticationIsRequired) ? ['none'] : ['all']; // change from 'all' if there is a mix of public and authenticated access
	
	/* we would need to add valid roles and authorizations as well as static */

	/* What and who of the request */
	#event = null;
	#context = null;
	#authorizations = JSON.parse(JSON.stringify(Request.#unauthenticatedAuthorizations));
	#roles = [];

	/* The request data */
	#props = {};

	/* Logging */
	#timer = null;
	#logs = {
		pathLog: [],
		queryLog: [],
		apiKey: null
	}


	/**
	 * Initializes the request data based on the event. Also sets the 
	 * validity of the request so it may be checked by .isValid()
	 * @param {object} event object from Lambda
	 */
	constructor(event, context) {
		super(event);
		
		this.#timer = new Timer("Request", true);

		this.#event = event;
		this.#context = context;

		this.#authenticate();

		const { resource, resourceArray, path, pathArray } = this.#extractResourceAndPath();

		this.#props = {
			method: this.#event.httpMethod,
			path,
			pathArray,
			resource,
			resourceArray,
			pathParameters: {},
			queryString: {},
			client: {
				isAuthenticated: this.isAuthenticated(),
				isGuest: this.isGuest(),
				authorizations: this.getAuthorizations(),
				roles: this.getRoles()
			},
			deadline: (this.deadline() - 500),
			calcMsToDeadline: this.calcMsToDeadline,
			data: {}
		};
		
		this.#validate();

	};

	/**
	 * This is used to initialize the Request class for all requests.
	 * Add Request.init(options) to the Config.init process or at the
	 * top of the main index.js file outside of the handler.
	 * @param {Array<string>} options.validations.referrers An array of accepted referrers. String matching goes from right to left, so ['example.com'] will allow example.com and subdomain.example.com
	 * @param {object} options.validations.parameters An object containing functions for validating request parameters (path, querystring, headers, cookies, etc).
	 */
	static init(options) {
		if (typeof options === 'object') {
			if ('validations' in options) {
				if ('referrers' in options.validations) {
					Request.#validations.referrers = options.validations.referrers;
				}
				if ('parameters' in options.validations) {
					Request.#validations.parameters = options.validations.parameters;
				}
			}
		} else {
			const errMsg = 'Application Configuration Error. Invalid options passed to Request.init(). Received:';
			DebugAndLog.error(errMsg, options);
			throw new Error(errMsg, options);
		}
	};

	static getReferrerWhiteList() {
		return Request.#validations.referrers;
	};

	static getParameterValidations() {
		return Request.#validations.parameters;
	};

	/**
	 * Used in the constructor to set validity of the request
	 * This method may be customized to meet your validation needs
	 */
	#validate() {
	
		let valid = false;

		// add your additional validations here
		valid = this.isAuthorizedReferrer() && this.#hasValidPathParameters();

		// set the variable
		super._isValid = valid;

	};

	#hasValidPathParameters() {
		let valid = true;

		const Validate = Request.#validations.parameters;

		if ('pathParameters' in this.#event && this.#event.pathParameters !== null) {
			
			// iterate through the pathParameters object and copy the keys and values to this.#props.pathParameters after validating
			Object.entries(this.#event.pathParameters).forEach(([key, value]) => {
				let paramKey = key.replace(/^\/|\/$/g, '');
				let paramValue = value.replace(/^\/|\/$/g);
				if (paramKey in Validate.pathParameter) {
					const validate = Validate.pathParameter[paramKey];
					if (typeof validate === 'function' && validate(paramValue)) {
						this.#props.pathParameters[paramKey] = paramValue;
					} else {
						DebugAndLog.warn(`Invalid path parameter: ${paramKey} = ${paramValue}`);
						valid = false;
					}
				}
			});
		}

		return valid;
	}

	/**
	 * Returns the path parameters received in the request.
	 * @returns {object} path parameters
	 */
	getPathParameters() {
		return this.#props.pathParameters;
	};

	#authenticate() {
		// add your authentication logic here
		this.authenticated = false; // anonymous
	};

	isAuthenticated() {
		return (Request.#authenticationIsRequired && this.authenticated);
	};

	isGuest() {
		return (!Request.#authenticationIsRequired && !this.authenticated);
	};

	isAuthorizedToPerform(action="all") {
		return ( this.getAuthorizations().includes(action) || this.getAuthorizations().includes('all'));
	};

	getRoles() {
		if (this.isAuthenticated()) {
			return this.#roles;
		} else {
			return ['guest'];
		}
	};

	getAuthorizations() {
		if (this.isAuthenticated()) {
			return this.#authorizations;
		} else {
			return JSON.parse(JSON.stringify(Request.#unauthenticatedAuthorizations));
		}
	};

	isAuthorizedReferrer() {
		/* Check the array of valid referrers */
		/* Check if the array includes a wildcard (*) OR if one of the whitelisted referrers matches the end of the referrer */
		if (Request.#validations.referrers.includes('*')) {
			return true;
		} else {
			for (let i = 0; i < Request.#validations.referrers.length; i++) {
				if (this.getClientReferer().endsWith(Request.#validations.referrers[i])) {
					return true;
				}
			}
		}
	};

	hasNoAuthorization() {
		return (this.getAuthorizations().includes('none') || !this.isAuthorizedReferrer() );
	};


	getExecutionTime() {
		return this.#timer.elapsed();
	};

	/**
	 * Get the _processed_ request properties. These are the properties that
	 * the Request object took from the event sent to Lambda, validated,
	 * supplemented, and makes available to controllers. 
	 * @returns {{method: string, path: string, pathArray: string[], pathParameters: {}, queryString: {}}
	 */
	getProps() {
		return this.#props;
	};
	
	/**
	 * Add one or more path notations to the log.
	 * These are used for logging and monitoring. When a response is finalized the route
	 * is recorded in CloudWatch logs along with the status and other information.
	 * Do not send sensitive information in the path notation, use placeholders instead. 
	 * For example, /user/{id}/profile instead of /user/123/profile
	 * However, /city/Chicago is acceptable because it is not a sensitive identifier.
	 * Only add meaningful parameters. You can abbreviate and rewrite long parameters.
	 * For example, /format/jpg can be coded as /f:jpg or /user/123/profile/privacy as /userProfile/privacy
	 * @param {string|Array<string>} path
	 */
	addPathLog(path = null) {
		if (path === null) {
			path = `${this.#props.method}:${this.#props.pathArray.join("/")}`;
		}
		if (typeof path === 'string') {
			this.#logs.pathLog.push(path);
		} else if (Array.isArray(path)) {
			this.#logs.pathLog = this.#logs.pathLog.concat(path);
		}
	};

	/**
	 * Add one or more query notations to the query log.
	 * These are used for logging and monitoring. When a response is finalized the 
	 * parameters are recorded in CloudWatch logs along with the status and other 
	 * information.
	 * Do not send sensitive information in the query notation, use placeholders instead. 
	 * For example, user instead of user=123
	 * However, city=Chicago is acceptable because it is not a sensitive query.
	 * Only add meaningful parameters. You can abbreviate long parameters.
	 * For example, format=jpg can be coded as f:jpg
	 * @param {string|Array<string>} query
	 */
	addQueryLog(query) {
		if (typeof query === 'string') {
			this.#logs.queryLog.push(query);
		} else if (Array.isArray(query)) {
			this.#logs.queryLog = this.#logs.queryLog.concat(query);
		}
	};

	/**
	 * Get the request log entries
	 * resource: http method and resource path with path parameter keys (no values)
	 * queryKeys: query string keys (no values)
	 * pathLog: custom route path with values (set by application using addPathLog())
	 * queryLog: custom query with or without values (set by addQueryLog())
	 * apiKey: last 6 characters of api key if present
	 * @returns {resource: string, queryKeys: string, routeLog: string, queryLog: string, apiKey: string}
	 */
	getRequestLog() {
		return {
			resource: `${this.#props.method}:${this.#props.resourceArray.join('/')}`,
			// put queryString keys in alpha order and join with &
			queryKeys: Object.keys(this.#props.queryString).sort().map(key => `${key}=${this.#props.queryString[key]}`).join('&'),
			routeLog: this.#logs.pathLog.join('/'),
			// put logs.params in alpha order and join with &
			queryLog: this.#logs.queryLog.sort().join('&'),
			// only show last 6 characters of this.apiKey
			apiKey: (this.#logs.apiKey !== null) ? this.#logs.apiKey.substring(this.#logs.apiKey.length - 6) : null
		};
	};

	timerStop() {
		return this.#timer?.stop() || 0;
	};

	/**
	 * 
	 * @returns {number} The remaining time before Lambda times out. 1000 if context is not set in Request object.
	 */
	getRemainingTimeInMillis() {
		return this.getContext().getRemainingTimeInMillis() || 1000;
	};

	/**
	 * Get the number of milliseconds remaining and deduct the headroom given.
	 * Useful when you want to set a timeout on a function (such as an http request)
	 * that may take longer than our function has time for.
	 * @param {number} headroomInMillis number in milliseconds to deduct from Remaining Time
	 * @returns {number} greater than or equal to 0
	 */
	calcRemainingTimeInMillis(headroomInMillis = 0) {
		let rt = this.getRemainingTimeInMillis() - headroomInMillis;
		return (rt > 0 ? rt : 0);
	};

	/**
	 * 
	 * @returns timestamp for when the remaining time is up
	 */
	deadline() {
		return Date.now() + this.getRemainingTimeInMillis();
	};

	/**
	 * 
	 * @returns Milliseconds to Deadline
	 */
	calcMsToDeadline(deadline) {
		if (!deadline) {
			deadline = Date.now() - 500;
		}
		return deadline - Date.now();
	};

	getContext() {
		if (this.#context === null) {
			DebugAndLog.warn("Context for request is null but was requested. Set context along with event when constructing Request object");
		}
		return this.#context;
	};

	getEvent() {
		return this.#event;
	};

	#extractResourceAndPath() {
		const {resource, path} = this.getEvent();

		let resourceIndex = [];

		const resourcesAndPaths = {
			resource: '',
			resourceArray: [],
			path: '',
			pathArray: []
		};

		/* We want to use reqContext.resourcePath to create a resourcePath and resourceArray, and we want to use path to create a path and pathArray
		For resourcePathArray, we want to split resourcePath on / and remove any empty strings. We also want to lowercase any element that is not surrounded with {}
		We want to add the index of any resource element that is surrounded with {} to the resourceIndex array.
		For pathArray we want to split on / and remove any empty strings. We also want to lowercase any element that is not at an index listed in the resourceIndex array
		*/
		if (resource) {
			const resourceArray = resource.split('/').filter((element) => element !== '');
			resourceArray.forEach((element, index) => {
				if (element.startsWith('{') && element.endsWith('}')) {
					resourceIndex.push(index);
					resourcesAndPaths.resourceArray.push(element);
				} else {
					resourcesAndPaths.resourceArray.push(element.toLowerCase());
				}
			});
			resourcesAndPaths.resource = resourcesAndPaths.resourceArray.join('/');
		}

		if (path) {
			const pathArray = path.split('/').filter((element) => element !== '');
			pathArray.forEach((element, index) => {
				if (!resourceIndex.includes(index)) {
					resourcesAndPaths.pathArray.push(element.toLowerCase());
				} else {
					resourcesAndPaths.pathArray.push(element);
				}
			});
			resourcesAndPaths.path = resourcesAndPaths.pathArray.join('/');
		}

		return resourcesAndPaths;

	}

};

module.exports = Request;