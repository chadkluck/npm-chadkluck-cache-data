# Changelog

All notable changes to this project will be documented in this file.

## 1.0.2 (2022-02-12)

- Initial Release

## 1.0.8 (2022-04-12)

- Updated timeout to [follow https specs](https://nodejs.org/api/http.html#httprequestoptions-callback) and implemented on("timeout")

## 1.0.9 (2022-04-12)

- Fixed issue where submitting null header or options to endpoint would fail

## 1.0.10 (2022-04-13)

- Added a log entry for a warning if timeout is reached in https get tool.

## 1.0.15 (2022-09-08)
  
- Updated dependencies moment-timezone and aws-sdk

## 1.0.16 (2022-09-14)

- Added extra logging information to API errors in tools. Added host and note to the log for better troubleshooting endpoints.

## 1.0.17 (2023-02-04)

- Bumped package dependencies up for aws-sdk and cookiejar

## 1.0.18 (2023-04-03)

- Added tools.obfuscate() and tools.sanitize() and now attempts to sanitize objects sent to DebugAndLog. Regular Expression used in the stringified object may be [inspected on RegEx101](https://regex101.com/library/IJp35p)

## 1.0.20 (2023-08-04)

### Updates

- Bumped package dependencies up for aws-sdk
- Updated tests to use `api.chadkluck.net/echo` endpoint instead of `labkit.api.63klabs.net` (both are maintained by the script's author). 
- `defaultExpirationInSeconds` and `expirationIsOnInterval` are now accepted aliases for `defaultExpiresInSeconds` and `expiresIsOnInterval` respectively for Connection Cache Profile configuration. [Resolves Issue #71](https://github.com/chadkluck/npm-chadkluck-cache-data/issues/71)

## 1.0.21 (2023-08-06)

### Fix

- Cleaned up an issue that came up when renaming cache policy profile properties to hostId and pathId.

## 1.0.22 (2023-08-23)

### Updates

- Cache data access object: Added additional debug messages for read/write functions in DynamoDb, S3, and General Cache
- Improved error message logging for read/write functions in DynamoDb, S3, and General Cache

## 1.0.24 (2023-xx-xx) Unreleased

### Fix

- Fix for [Issue #80 Applications hang and time out when reading cached items from S3 (no errors reported)](https://github.com/chadkluck/npm-chadkluck-cache-data/issues/80)
### Chores

- Changelog file had info from a different project cluttering up the first half.
- Bump chai from 4.3.7 to 4.3.8 [Pull Request #76 Dependabot](https://github.com/chadkluck/npm-chadkluck-cache-data/pull/76)
- Bump aws-sdk from 2.1440.0 to 2.1445.0 [Pull Request #75 Dependabot](https://github.com/chadkluck/npm-chadkluck-cache-data/pull/75)
- Preparing for aws-sdk v3
- Added lambda-test, sinon, and proxyquire to dev dependencies for testing
- Bump @aws-sdk/client-s3 from 3.400.0 to 3.405.0 [Pull Request #77 Dependabot](https://github.com/chadkluck/npm-chadkluck-cache-data/pull/77)
- Bump @aws-sdk/client-dynamodb from 3.398.0 to 3.405.0 [Pull Request #79 Dependabot](https://github.com/chadkluck/npm-chadkluck-cache-data/pull/79)
- Bump aws-sdk from 2.1445.0 to 2.1453.0 [Pull Request #81 Dependabot](https://github.com/chadkluck/npm-chadkluck-cache-data/pull/81)
