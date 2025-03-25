import { expect } from 'chai';

import LambdaTester from 'lambda-tester';
import {handler} from '../helpers/test-handler.js';

import { testEventA } from '../helpers/test-event.js';

/* ****************************************************************************
 * Lambda Tester
 *
 * https://www.npmjs.com/package/lambda-tester
 * https://www.npmjs.com/package/proxyquire
 * https://plainenglish.io/blog/unit-testing-of-aws-lambda-functions-node-js-using-mocha-and-chai-317353f8d60
 */


describe('Lambda Function Tests', function() {

	let logs = [];
	
	// Setup console.log mock before each test
	beforeEach(() => {
		logs = [];
		const originalConsoleLog = console.log;
		console.log = (...args) => {
		logs.push(args.join(' '));
		};
	});

	// Restore original console.log after each test
	afterEach(() => {
		console.log = console.log;
	});

	it('Should return success message', function() {
		return LambdaTester(handler)
		.event(testEventA)  // your test event object
		.expectResult((result) => {
			// Check that result matches expected output
			expect(result.body).to.equal('hello!');
		});
	});

});
