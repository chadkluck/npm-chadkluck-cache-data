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
3. Add `const { tools, cache, endpoint } = require('cache-data');` to your script
4. During initialization of your function (set globally during Cold Start so as to not run on every execution) add script to set the Cache properties. (For code snipits see below).
5. You may want to add the environment variable `deployEnvironment` = `DEV` to your Lambda function as it will allow you to use `DebugAndLog`. (You would set it equal to `PROD` to disable logging in a production environment.)
6. If you are not in the `us-east-1` region, you will also want to set a Lambda environment variable `AWS_REGION` to your region. If this environment variable does not exist, `us-east-1` is used.

Note: `deployEnvironment` is only one of the possible environment variables the script checks for. You may also use `env`, `deployEnvironment`, `environment`, or `stage`. Also note the confusion that may be had when we are talking about "environment" as it refers to both Lambda Environmet Variables as well as a Deployment Environment (Production, Development, Testing, etc.).

(Environment variables are accessed using `process.env.variableName`.)

### Usage

Note: There is a sample app and tutorial that works with a CI/CD pipeline available at the repository: [serverless-webservice-template-for-pipeline](https://github.com/UniversityOfSaintThomas/serverless-webservice-template-for-pipeline)

#### Config, Connections, and Cache

The cache object acts as an intermediary between your application and your data (whether it be a remote enpoint or other storage/process mechanism).

Before you can use Parameter Store, S3, and DynamoDb for the cache, they need to be set up with the proper access granted to your Lambda function.

1. Set up an S3 bucket (Your application wil store cache data in /cache)
2. Create a DynamoDb table
3. Create a Parameter in SSM Parameter store `/app/my_cool_app/crypt_secureDataKey` and set the secret text to a x character length hex value.
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
const { tools, cache, endpoint } = require('cache-data');

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
							overrideOriginHeaderExpiration: true, 
							defaultExpirationInSeconds: (10 * 60),// , // 10 minutes
							expirationIsOnInterval: true,
							headersToRetain: "",
							host: "demo", // log entry friendly (or not)
							path: "games",  // log entry friendly (or not)
							encrypt: false // you can set this to true and it will use the key from param store and encrypt data at rest in S3 and DynamoDb
						}
					]
				} );

				tools._ConfigSuperClass._connections = connections;

				// Cache settings
				cache.Cache.init({
					dynamoDbTable: "yourDynamoDbTable", // replace with the name of a DynamoDb table
					s3Bucket: "yourS3Bucket", // replace with a bucket name
					secureDataAlgorithm: "aes-256-ofb",
					secureDataKey: Buffer.from(params.app.crypt_secureDataKey, "hex")
					idHashAlgorithm: "RSA-SHA3-512",
					DynamoDbMaxCacheSize_kb: 20,
					purgeExpiredCacheEntriesAfterXHours: 24,
					defaultExpirationExtensionOnErrorInSeconds: 300,
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
// note that cache object was already set by the require statement

let connection = Config.getConnection("demo"); // corresponds with the name we gave it during connections.add()
let conn = connection.toObject();

let cacheCfg = connection.getCacheProfile("games"); // corresponds with the cache profile we gave within demo for connections.add()

const cacheObj = await cache.CacheableDataAccess.getData(
	cacheCfg, 
	api.getDataDirectFromURI,
	conn, 
	null
);

let games = cacheObj.getBody(true);
```

In order to do its job it needs to:

1. Know how to access the data. We use a Connection object from Config to do this. You can think of a Connection object as all the pieces of an HTTP request. It identifies the protocol, domain, path, query string, headers, etc. (However, it doesn't have to be an HTTP request.)
2. Know the function to use to access fresh data from the remote endpoint. Using the Connection object, your can either use a built in HTTP request, or define your own method for processing an http request or other data source.
3. Know the cache policy for the data. We use a Cache object to do this. It is an object that has information on expiration, headers to save with the data, where cache data is stored, stored data encryption protocol, 

### tools.Timer

In its simplist form we can do the following:

```js
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


## Help

Make sure you have your S3 bucket, DynamoDb table, and SSM Parameter store set up. Also make sure that you have IAM policies to allow your Lambda function access to these.

## Authors

Contributors names and contact info

Chad Kluck 
[@ChadKluck](https://twitter.com/chadkluck)

## Version History

* 1.0.x
    * Initial Release

## License

This project is licensed under the MIT License - see the LICENSE.md file for details

## Acknowledgments
