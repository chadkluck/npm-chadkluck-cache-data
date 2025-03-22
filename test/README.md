# Tests

Tests are divided into functional categories by directory.

## Running Tests

You can run all tests:

```bash
npm run test
```

You can run tests for a single functional category:

```bash
npm run test:response
```

If a new functional area/directory is added, you can add it to the package.json file:

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

To install in a dev environment:

```bash
npm install
```
