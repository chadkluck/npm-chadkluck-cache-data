# Cache Data

A package for node.js applications to access and cache data from remote API endpoints or other sources using AWS S3 and DynamoDb.

## Description

If you are writing AWS Lambda functions in Node.js and your application accesses endpoints, requires caching of data between runs, or if you want to have an internal cache of data your application processed for subsequent responses, Cache Data is for you. It is written specifically to be used in AWS Lambda functions using Node, but can be used in other node projects that have access to the S3 and DynamoDb API. While out of the box it can fetch data from remote endpoints, custom Data Access Objects can be utilized to provide caching of data from all sorts of sources.

It also has a few utility functions such as one that can load sensitive data from AWS SSM Parameter Store at load time.

## Getting Started

### Dependencies

* Node.js 12 or higher
* AWS (Lambda function, access to an AWS S3 bucket and DynamoDb table)

### Installing

1. Go to your application directory
2. Run the command `npm install cache-data`
3. Add `const cache = require("cache-data");` to your script
4. During initialization of your function (set globally during Cold Start so as to not run on every execution) add script to set the Cache properties. (For code snipits see below).

### Usage

Note: There is a sample CI/CD pipeline, with a sample app and tutorial available at the repository: 

The cache object acts as an intermediary between your application and your data (whether it be a remote enpoint or other storage/process mechanism).

First, during your application initialization (but not for each request) we need to initialize the Cache object.

```js
/* require */
const cache = require("cache-data");

/* Cache settings */
cache.Cache.init({
	dynamoDbTable: "yourDynamoDbTable",
	s3Bucket: "yourS3Bucket",
	secureDataAlgorithm: "aes-256-ofb", // example
	secureDataKey: Buffer.from("1234_EXAMPLE_KEY_IN_HEX_ABCDEF", "hex"),
	idHashAlgorithm: "RSA-SHA3-512", // example
	DynamoDbMaxCacheSize_kb: 20,
	purgeExpiredCacheEntriesAfterXHours: 24,
	defaultExpirationExtensionOnErrorInSeconds: 300,
	timeZoneForInterval: "America/Chicago" // if caching on interval, we need a timezone to account for calculating hours, days, and weeks. List: https://en.wikipedia.org/wiki/List_of_tz_database_time_zones
});
```

The code above does the following:

1. Sets the DynamoDb table and S3 bucket to store cached data
2. Sets the algorithm to securely encrypt data at rest in DynamoDb and S3
3. Sets the hash algorithm used to create a unique id for each unique request
4. How big of an object do we save in DynamoDb before storing it in S3? (20K objects are ideal, anything bigger is in S3)
5. How long to wait before purging expired entries (they aren't purged right away but kept in case of errors)
6. If there is an error getting fresh data, how long do we extend any existing cache (so we can back off while endpoint is in error)
7. Set the time zone for intervals. For example, we can expire on the hour (8am, 12pm, 8pm, etc) but if we expire at the end of the day, when is the "end of the day"? Midnight where? If empty it will be UTC.

Each of these are described in their own sections below.

Once the `cache` object is initialized, the following code can be used to access data through the cache.

```js

					name: "demo",
					host: "api.chadkluck.net",
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
							encrypt: false
						},
// we are going to modify the connection by adding a path
					let connection = obj.Config.getConnection("demo");
					let conn = connection.toObject();
					conn.path = "/games/";

					let cacheCfg = connection.getCacheProfile("games");

					const cacheObj = await cache.CacheableDataAccess.getData(
						cacheCfg, 
						api.getDataDirectFromURI,
						conn, 
						null
					);

					let games = cacheObj.getBody(true);
```

In order to do its job it needs to:

1. Know how to access the data. We use a Connection object to do this. You can think of a Connection object as all the pieces of an HTTP request. It identifies the protocol, domain, path, query string, headers, etc. (However, it doesn't have to be an HTTP request.)
2. Know the function to use to access fresh data from the remote endpoint. Using the Connection object, your can either use a built in HTTP request, or define your own method for processing an http request or other data source.
3. Know the cache policy for the data. We use a Cache object to do this. It is an object that has information on expiration, headers to save with the data, where cache data is stored, stored data encryption protocol, 

* How to run the program
* Step-by-step bullets
```
code blocks for commands
```

## Help

Any advise for common problems or issues.
```
command to run if program contains helper info
```

## Authors

Contributors names and contact info

ex. Dominique Pizzie  
ex. [@DomPizzie](https://twitter.com/dompizzie)

## Version History

* 0.2
    * Various bug fixes and optimizations
    * See [commit change]() or See [release history]()
* 0.1
    * Initial Release

## License

This project is licensed under the [NAME HERE] License - see the LICENSE.md file for details

## Acknowledgments

Inspiration, code snippets, etc.
* [awesome-readme](https://github.com/matiassingers/awesome-readme)
* [PurpleBooth](https://gist.github.com/PurpleBooth/109311bb0361f32d87a2)
* [dbader](https://github.com/dbader/readme-template)
* [zenorocha](https://gist.github.com/zenorocha/4526327)
* [fvcproductions](https://gist.github.com/fvcproductions/1bfc2d4aecb01a834b46)