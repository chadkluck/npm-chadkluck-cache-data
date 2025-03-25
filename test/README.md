# Tests

Tests are divided into functional categories by directory.

## Install

The dev dependencies for cache-data must be installed:

```bash
npm install
```

## Running Tests

You can run all tests:

```bash
npm run test
```

You can run tests for a single functional category:

```bash
npm run test:response
```

If a new functional area/directory is added, you can add it to the available tests package.json file:

```json
{
	"scripts": {
		"test": "mocha 'test/**/*-tests.mjs'",
		"test:cache": "mocha 'test/cache/**/*-tests.mjs'",
		"test:config": "mocha 'test/config/**/*-tests.mjs'",
		"test:endpoint": "mocha 'test/endpoint/**/*-tests.mjs'",
		"test:lambda": "mocha 'test/lambda/**/*-tests.mjs'",
		"test:logging": "mocha 'test/logging/**/*-tests.mjs'",
		"test:request": "mocha 'test/request/**/*-tests.mjs'",
		"test:response": "mocha 'test/response/**/*-tests.mjs'",
		"test:utils": "mocha 'test/utils/**/*-tests.mjs'"
	}
}
```

Tests are automatically run using a GitHub action before publishing a new version to NPM. If the tests fail, the package will not be published.

## Creating New Tests

The `chai` `chai-http` `mocha` `sinon` `lambda-tester` packages are used for testing.

Add new tests to their respective functional folder.

Since the test script will run all scripts matching the `*-test.mjs` format, any test scripts must have `-tests.mjs` added to the end of the file name.

## Capturing Console Logs

To capture console output you can use `sinon`.

Define the console variables to capture to and activate `beforeEach` and deactivate `afterEach`.

```js
import { expect } from 'chai';
import sinon from 'sinon';

describe("Inspect Console", () => {
	
	let logStub, warnStub, errorStub;

	beforeEach(() => {
		logStub = sinon.stub(console, 'log');
		warnStub = sinon.stub(console, 'warn');
		errorStub = sinon.stub(console, 'error');
	});

	afterEach(() => {
		logStub.restore();
		warnStub.restore();
		errorStub.restore();
	});

	it("Logs", async () => {
		// Call the log function
		console.log("My Object", "LOG", obj);

		// Verify that log was actually called
		expect(logStub.called).to.be.true;

		// Get all calls and their arguments
		const calls = logStub.getCalls();
		expect(calls.length).to.be.greaterThan(0, "Expected at least one log call");

		// Get the log output from the first call
		const logOutput = calls[0].args.join(' ')
			.replace(/\u001b\[\d+m/g, '') // remove colorization of console text
			.trim();

		// Your assertions
		expect(logOutput).to.include("My Object");
	});
});

```
