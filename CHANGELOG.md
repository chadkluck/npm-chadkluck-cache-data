# Changelog

All notable changes to this project will be documented in this file.

## 2020-01-27

Initial commit

## 2020-05-26

- Converted to AWS SAM (Serverless Application Model)
- Fixed bug where http endpoints could not be requested (would happen in some redirects where the redirect was pointing to an http protocol).
- In addition to allowing http requests, a new attribute was added to the custom policies where http could be required to be upgraded to https
- During initialization, set the domain and protocol to lowercase (future enhancement would be a set vars.uri function to do all this)

## 2020-08-04

- Converted to AWS CodeStar project

## 2021-08-30

- Refactored to use a common tool, dao, and classes library (classes.js, dao-*.js, tools.js)
- Now uses an inhouse developed library that can be used for application data caching
- Cut core application code in half (2000 lines to 718 lines) because of these libraries we can use among our apps

## 2022-09-09 v3.1.0

### Updates

- Added flag to enpoint policy that allows data to not expire on intervals. This is useful for tokens that have an expiration based on when they are generated.

## 2022-09-14 v3.2.1

### Updates

- Bumped up to cache-data 1.0.16 which 'Added extra logging information to API errors in tools. Added host and note to the log for better troubleshooting endpoints.' as we were getting ECONNRESET 104 errors without any host information.

## 2022-09-28 v3.2.2

### Updates

- Added AWS X-Ray functionality
- Added Lambda Insights functionality
- Added a timeout warning to be logged

### Fix

- Updated dashboard Error log messages to include Timeout messages logged by Lambda but had not thrown an error to be caught internally.

## 2023-03-24 v3.2.3

### Updates

- Added additional timeout functionality. In addition to taking the Lambda timeout, it also takes into account the remaining execution time, and a specified time for an endpoint from custom/policies.json. It uses the minimum of the three when making the request.

## 2023-04-04 v3.2.4

### Updates

- Updated cache-data dependency to v1.0.18 so that logged objects would have obfucated secrets.

## 2023-04-17 v3.2.5

### Updates

- Updated cache-data dependency to v1.0.19 due to an underlying update to a vulnerable dependency.

## 2023-08-07 v3.2.6

### Updates

- Updated cache-data dependency to v1.0.21
- Refactored to not use deprecated property names when using cache-data

## 1.0.x

- Initial Release

## 1.0.8

- Updated timeout to [follow https specs](https://nodejs.org/api/http.html#httprequestoptions-callback) and implemented on("timeout")

## 1.0.9

- Fixed issue where submitting null header or options to endpoint would fail

## 1.0.10

- Added a log entry for a warning if timeout is reached in https get tool.

## 1.0.15
  
- Updated dependencies moment-timezone and aws-sdk

## 1.0.16

- Added extra logging information to API errors in tools. Added host and note to the log for better troubleshooting endpoints.

## 1.0.17

- Bumped package dependencies up for aws-sdk and cookiejar

## 1.0.18

- Added tools.obfuscate() and tools.sanitize() and now attempts to sanitize objects sent to DebugAndLog. Regular Expression used in the stringified object may be [inspected on RegEx101](https://regex101.com/library/IJp35p)

## 1.0.20 (2023-08-04)

### Updates

- Bumped package dependencies up for aws-sdk
- Updated tests to use `api.chadkluck.net/echo` endpoint instead of `labkit.api.63klabs.net` (both are maintained by the script's author). 
- `defaultExpirationInSeconds` and `expirationIsOnInterval` are now accepted aliases for `defaultExpiresInSeconds` and `expiresIsOnInterval` respectively for Connection Cache Profile configuration. [Resolves Issue #71](https://github.com/chadkluck/npm-chadkluck-cache-data/issues/71)

## 1.0.21 2023-08-06

### Fix

- Cleaned up an issue that came up when renaming cache policy profile properties to hostId and pathId.

## 1.0.22 2023-08-23

### Updates

- Cache data access object: Added additional debug messages for read/write functions in DynamoDb, S3, and General Cache
- Improved error message logging for read/write functions in DynamoDb, S3, and General Cache
