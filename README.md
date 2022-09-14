# Cache Data

A package for node.js applications to access and cache data from remote API endpoints or other sources using AWS S3 and DynamoDb.

## Description

If you are writing AWS Lambda functions in Node.js and your application accesses endpoints, requires caching of data between runs, or if you want to have an internal cache of data your application processed for subsequent responses, Cache Data is for you. It is written specifically to be used in AWS Lambda functions using Node, but can be used in other node projects that have access to the S3 and DynamoDb API. While out of the box it can fetch data from remote endpoints, custom Data Access Objects can be utilized to provide caching of data from all sorts of sources.

It also has a few utility functions such as one that can load sensitive data from AWS SSM Parameter Store at load time.

## Getting Started

### Requirements

* Node.js 12 or higher
* AWS access to a Lambda function, S3 bucket, DynamoDb table, and SSM Parameter Store
* A basic understanding of CloudFormation, Lambda, S3, DynamoDb, and SSM Parameters
* A basic understanding of IAM policies that will allow Lambda to access S3, DynamoDb, and SSM Parameter Store

### Installing

1. Go to your application directory
2. Run the command `npm i @chadkluck/cache-data`
3. Add `const { tools, cache, endpoint } = require('@chadkluck/cache-data');` to your script
4. During initialization of your function (set globally during Cold Start so as to not run on every execution) add script to set the Cache properties. (For code snipits see below).
5. You may want to add the environment variable `deployEnvironment` = `DEV` to your Lambda function as it will allow you to use `DebugAndLog`. (You would set it equal to `PROD` to disable logging in a production environment.)
6. If you are not in the `us-east-1` region, you will also want to set a Lambda environment variable `AWS_REGION` to your region. If this environment variable does not exist, `us-east-1` is used.

Note: `deployEnvironment` is only one of the possible environment variables the script checks for. You may also use `env`, `deployEnvironment`, `environment`, or `stage`. Also note the confusion that may be had when we are talking about "environment" as it refers to both Lambda Environmet Variables as well as a Deployment Environment (Production, Development, Testing, etc.).

(Environment variables are accessed using `process.env.`_`variableName`_.)

### Usage

Note: There is a sample app and tutorial that works with a CI/CD pipeline available at the repository: [serverless-webservice-template-for-pipeline](https://github.com/UniversityOfSaintThomas/serverless-webservice-template-for-pipeline)

#### Config, Connections, and Cache

The cache object acts as an intermediary between your application and your data (whether it be a remote enpoint or other storage/process mechanism).

Before you can use Parameter Store, S3, and DynamoDb for the cache, they need to be set up with the proper access granted to your Lambda function.

1. Set up an S3 bucket (Your application wil store cache data in /cache)
2. Create a DynamoDb table
3. Create a Parameter in SSM Parameter store `/app/my_cool_app/crypt_secureDataKey` and set the secret text to a 64 character length hex value. (64 hex characters because we are using a 256 bit key and cipher (`aes-256-ofb`)in the example below)
4. Make sure you set up IAM policies to allow you Lambda function access to the S3 bucket, DynamoDb table, and SSM Parameter store.

Once the S3 bucket, DynamoDb table, and SSM Parameter are set up we can focus on your Lambda function.

During your application initialization (but not for each request) we need to initialize the Config object.

The class below will do the following three things:

1. Bring in the secret key (and other parameters) from SSM Parameter Store.
2. Create connections with cache settings for each connection
3. Initialize the Cache

This code can be put into a separate file and brought in using a `require` statement. It should be scoped to the highest level of your Lambda function and not in the request handler.

```js
// require cache-data
const { tools, cache, endpoint } = require('@chadkluck/cache-data');

/**
 * Extends tools._ConfigSuperClass
 * Used to create a custom Config interface
 * Usage: should be placed near the top of the script file outside 
 * of the event handler. It should be global and must be initialized.
 * @example
 * const obj = require("./classes.js");
 * obj.Config.init();
 */
class Config extends tools._ConfigSuperClass {
	
	/**
	 * This is custom inititialization code for the application. Depending 
	 * upon needs, the _init functions from the super class may be used
	 * as needed. Init is async, and a promise is stored, allowing the 
	 * lambda function to wait until the promise is finished.
	 */
	static async init() {
		
		tools._ConfigSuperClass._promise = new Promise(async (resolve, reject) => {
				
			try {

				let params = await this._initParameters(
					[
						{
							"group": "app", // so we can do params.app.weatherapikey later
							"path": "/apps/my_cool_app/" // process.env.paramStorePath // or store as a Lambda environment variable
						}
					]
				);

				// after we have the params, we can set the connections
				let connections = new tools.Connections();

				/* NOTE: instead of hard coding connections, you could import 
				from a connections file and then add in any additional values 
				such as keys from the Param store
				*/

				// for games demo from api.chadkluck.net
				connections.add( {
					name: "demo",
					host: "api.chadkluck.net",
					path: "/games",
					parameters: {},
					headers: {
						referer: "https://chadkluck.net"
					},
					cache: [
						{
							profile: "games",
							overrideOriginHeaderExpiration: true, // if the endpoint returns an expiration, do we ignore it for our own?
							defaultExpirationInSeconds: (10 * 60),// , // 10 minutes
							expirationIsOnInterval: true, // for example, a 10 min cache can expire on the hour, 10, 20, 30... after. 24 hour cache can expire at midnight. 6 hour cache can expire at 6am, noon, 6pm, and midnight
							headersToRetain: "", // what headers from the endpoint do we want to keep with the cache data?
							host: "demo", // log entry friendly (or not)
							path: "games",  // log entry friendly (or not)
							encrypt: false // you can set this to true and it will use the key from param store and encrypt data at rest in S3 and DynamoDb
						}
					]
				} );

				tools._ConfigSuperClass._connections = connections;

				// Cache settings
				cache.Cache.init({
					dynamoDbTable: "yourDynamoDbTable", // replace with the name of a DynamoDb table to store cached data
					s3Bucket: "yourS3Bucket", // replace with a bucket name to store cache data. Data will be stored in /cache in yourS3Bucket
					secureDataAlgorithm: "aes-256-ofb", // how do we encrypt data at rest
					secureDataKey: Buffer.from(params.app.crypt_secureDataKey, "hex"), // we'll get the encryption key from SSM Parameter store to encrypt data
					idHashAlgorithm: "RSA-SHA3-512", // the alg used to create a unique hash identifier for requests so we can tell them apart in the cache
					DynamoDbMaxCacheSize_kb: 20, // data larger than this (in KB) will be stored in S3 to keep DynamoDb running efficently
					purgeExpiredCacheEntriesAfterXHours: 24, // expired caches hang around for a while before we purge just in case there is cause to fall back on them
					defaultExpirationExtensionOnErrorInSeconds: 300, // so as to not overwhelm a down endpoint, or to not cache an error for too long, how often should we check back?
					timeZoneForInterval: "America/Chicago" // if caching on interval, we need a timezone to account for calculating hours, days, and weeks. List: https://en.wikipedia.org/wiki/List_of_tz_database_time_zones
				});
				
				resolve(true);
			} catch (error) {
				tools.DebugAndLog.error("Could not initialize Config", error);
				reject(false);
			};
			
		});

	};
};
```

The `params` code does the following:

1. Accesses the SSM Parameter Store and places any parameters found under `/apps/my_cool_app/` into a `params.app` variable. You'll see that the cache initialization uses `params.app.crypt_secureDataKey` which is the parameter we created under `/apps/my_cool_app/crypt_secureDataKey`.

The `connection` code above does the following:

1. Defines the host and path (and any parameters and headers to send to a remote endpoint)
2. Defines the cache settings for that remote endpoint (note, these are only cache settings for that remote endpoint and not the overall cache)

Additional connections may be added using additional `connections.add()` functions.

The `cache` code does the following:

1. Sets the DynamoDb table and S3 bucket to store cached data
2. Sets the algorithm to securely encrypt data at rest in DynamoDb and S3
3. Sets the hash algorithm used to create a unique id for each unique request
4. How big of an object do we save in DynamoDb before storing it in S3? (20K objects are ideal, anything bigger is in S3)
5. How long to wait before purging expired entries (they aren't purged right away but kept in case of errors)
6. If there is an error getting fresh data, how long do we extend any existing cache (so we can back off while endpoint is in error)
7. Set the time zone for intervals. For example, we can expire on the hour (8am, 12pm, 8pm, etc) but if we expire at the end of the day, when is the "end of the day"? Midnight where? If empty it will be UTC.

Each of these are described in their own sections below. 

Note that it is probably best to not hard code values but instead bring them in as environment variables from your Lambda function.

Next, we need to call the initialization in our application, and before the handler can be executed, make sure the promise has resolved.

```js
// note that the Config object is defined in the code above

/* initialize the Config */
Config.init(); // we need to await completion in the async call function - at least until node 14

/**
 * Lambda function handler
 */
exports.handler = async (event, context, callback) => {

	/* wait for CONFIG to be settled as we need it before continuing. */
	await Config.promise();

	/* Process the request and wait for result */
	const response = await someFunction(event, context); // some code or function that generates a response

	/* Send the result back to API Gateway */
	callback(null, response);

}
```

Note that you will replace `someFunction()` with your own function that will call and process the data from cache as in the example below.

Once the `Config` object is initialized, the following code can be used to access data through the cache.

```js
/*
Note that cache object was already set by the require statement
assuming: 
const { tools, cache, endpoint } = require('@chadkluck/cache-data');
*/

let connection = Config.getConnection("demo"); // corresponds with the name we gave it during connections.add()
let conn = connection.toObject(); // we'll "extract" the connection data. .toObject() will create a clone of the data so we can modify if need be

let cacheCfg = connection.getCacheProfile("games"); // corresponds with the cache profile we gave within demo for connections.add()

const cacheObj = await cache.CacheableDataAccess.getData(
	cacheCfg, // this is your cache info, included from connection object
	endpoint.getDataDirectFromURI, // this is the function you want to invoke to get fresh data if the cache is stale. (conn and null will be passed to it)
	conn, // connection information which will be passed to endpoint.getDataDirectFromURI() to get fresh data. Also used to identify the object in cache
	null // this parameter can be used to pass additional data to endpoint.getDataDirectFromURI (or any other DAO)
);

let games = cacheObj.getBody(true); // return the data as an object (true) instead of a string (false). You could use false if you want to keep the data as a string (as in xml or html or text)
```

In order to do its job it needs to:

1. Know how to access the data. We use a Connection object from Config to do this. You can think of a Connection object as all the pieces of an HTTP request. It identifies the protocol, domain, path, query string, headers, etc. (However, it doesn't have to be an HTTP request.)
2. Know the function to use to access fresh data from the remote endpoint. Using the Connection object, your can either use a built in HTTP request, or define your own method for processing an http request or other data source.
3. Know the cache policy for the data. We use a Cache object to do this. It is an object that has information on expiration, headers to save with the data, where cache data is stored, stored data encryption protocol, 

### cache.CacheableDataAccess.getData() without Connection

Note that you can use `cache.CacheableDataAccess.getData()` without a Connection object. You'll notice that we "extract" the connection data from `connection` using `.toObject()`. We do this not just because it creates an object that isn't a reference (thus allowing us to ad hoc modify things like path or parameters without changing the original) but also because any object with any structure may be passed (as long as your passed function is expecting it).

The `cacheCfg` variable is also just an object, but must adhere to the structure outlined in the cache declaration previously shown.

You can create the cache configuration and connection on the fly without the Connection object:

```js
const cacheCfg ={
	overrideOriginHeaderExpiration: true,
	defaultExpirationInSeconds: (10 * 60), // 10 minutes
	expirationIsOnInterval: true,
	headersToRetain: ['x-data-id', 'x-data-sha1'],
	host: "example",
	path: "person",
	encrypt: true
};

const conn = {
	host: "api.example.com",
	path: "/person",
	parameters: {id: id, event: event },
	headers: {}
};

const cacheObj = await cache.CacheableDataAccess.getData(
	cacheCfg,
	myCustomDAO_getData,
	conn, 
	null
);
```

### tools.Timer

In its simplist form we can do the following:

```js
/*
Assuming: 
const { tools, cache, endpoint } = require('@chadkluck/cache-data');
*/

const timerTaskGetGames = new tools.Timer("Getting games", true); // We give it a name for logging, and we set to true so the timer starts right away

/* A block of code we want to execute and get timing for */
// do something
// do something

timerTaskGetGames.stop(); // if debug level is >= 3 (DebugAndLog.DIAG) it will log the elapsed time in ms
```

The above code will create a timer which we can access by the variable name `timerTaskGetGames`. Since we set the second parameter to `true` it will start the timer upon creation.

Then a block of code will execute.

Then we stop the timer using `.stop()` and if the logging level is 3 or greater it will send a log entry with the elapsed time to the console.

You are able to get the current time elapsed in milliseconds from a running Timer by calling `const ms = timerVarName.elapsed()`

### tools.DebugAndLog

```js
/*
Assuming: 
const { tools, cache, endpoint } = require('@chadkluck/cache-data');
*/

/* increase the log level - comment out when not needed  */
tools.DebugAndLog.setLogLevel(5, "2022-02-28T04:59:59Z"); // we can increase the debug level with an expiration

tools.DebugAndLog.debug("Hello World");
tools.DebugAndLog.msg("The sky is set to be blue today");
tools.DebugAndLog.diag("Temperature log:", log);

try {
	// some code
} catch (error) {
	tools.DebugAndLog.error("We have an error in try/catch 1", error);
}

try {
	// some code
} catch (error) {
	tools.DebugAndLog.warn("We have an error but will log it as a warning in try/catch 2", error);
}
```

Before calling `Config.init()` you can set the log level using `DebugAndLog.setLogLevel()`. If you set the log level after calling `Config.init()` OR after calling any `DebugAndLog` function, you will get an error. That is because a default log level has already been set and we will not allow the changing of the log level after a script has begun.

There are six (6) logging functions.

```js
DebugAndLog.error(msgStr, obj); // logs at ALL logging levels
DebugAndLog.warn(msgStr, obj); // logs at ALL logging levels
DebugAndLog.log(msgStr, tagStr, obj); // logs at ALL logging levels
DebugAndLog.msg(msgStr, obj); // logs at level 1 and above
DebugAndLog.diag(msgStr, obj); // logs at level 3 and above
DebugAndLog.debug(msgStr, obj); // logs at level 5
```

In the above the `obj` parameter is optional and is an object you wish to log. Be careful of logging objects that may contain sensitive information.

Choose the method based on how verbose you want your logging to be at various script levels.

Note that `DebugAndLog.log(msgStr, tagStr)` allows you to add a tag. If a tag is not provided `LOG` will be used and your log entry will look like `[LOG] your message`.

If you provide `TEMP` as a tag ('temperature' for example) then the log entry will look something like this: `[TEMP] your message`.

## Advanced

The examples above should get you started.

However, there are advanced uses for the Cache object such as caching processed data not from an endpoint and creating your own Data Access Object (DAO) classes.

### Caching data not from a remote endpoint

Cache does not have to be from a remote endpoint.

Suppose you gather data from six endpoints and process the data in a resource and time intensive process and would like to cache the result for 6 or 24 hours. You can use the Cache object to store any data from any source, either externally or internally.

The function parameter passed to the Cache object is the method used to obtain data. Remember the `endpoint.getDataDirectFromURI` from the code sample above? That is just a function to return a bare bones response from an api endpoint. (You can actually extend the `endpoint.Endpoint` class and create your own DAOs that can pre and post process data before returning to your application's cache.)

Instead of passing in the function `endpoint.getDataDirectFromURI` you can create any function that will grab or process data and return an object.

Remember, when passing functions for another function to execute, do not include the `()` at the end.

### Creating your own Data Access Object (DAO)

You can either extend `endpoint.Endpoint` or create your own.

## Help

Make sure you have your S3 bucket, DynamoDb table, and SSM Parameter store set up. Also make sure that you have IAM policies to allow your Lambda function access to these.

## Authors

Contributors names and contact info

Chad Kluck 
[@ChadKluck](https://twitter.com/chadkluck)

## Version History

* 1.0.x
  * Initial Release
* 1.0.8
  * Updated timeout to [follow https specs](https://nodejs.org/api/http.html#httprequestoptions-callback) and implemented on("timeout")
* 1.0.9
  * Fixed issue where submitting null header or options to endpoint would fail
* 1.0.10
  * Added a log entry for a warning if timeout is reached in https get tool.
* 1.0.15
  * Updated dependencies moment-timezone and aws-sdk
* 1.0.16
  * Added extra logging information to API errors in tools. Added host and note to the log for better troubleshooting endpoints.
## License

This project is licensed under the MIT License - see the LICENSE.txt file for details

## Acknowledgments
