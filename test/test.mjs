
// const { tools, cache, endpoint } = require('../src/index.js');
// const crypto = require("crypto"); // included by aws so don't need to add to package

// const chai = require("chai"); // 4.x pinned in package.json because 5.x doesn't work for node require
// const chaiHttp = require("chai-http");
// const expect = chai.expect
// chai.use(chaiHttp)

// const LambdaTester = require('lambda-tester');
// const myHandler = require( './test-handler.js').handler;

/* Convert the requires to imports */

import { tools, cache, endpoint } from '../src/index.js';
import { randomBytes } from "crypto"; // included by aws so don't need to add to package

import sinon from 'sinon';

import testEventA from './sample-data/test-event-a.json' with { type: 'json' };
import {testContextA} from './sample-data/test-context.js';


import * as chai from 'chai';
import {default as chaiHttp, request} from 'chai-http';

chai.use(chaiHttp);
const expect = chai.expect;

// import LambdaTester from 'lambda-tester';
// import { handler as myHandler } from './test-handler.js';

// import {event} from './test-event.js';


// https://www.sitepoint.com/delay-sleep-pause-wait/
function sleep(ms) {
	return new Promise(resolve => setTimeout(resolve, ms));
};

console.log(`Testing Against Node version ${tools.nodeVerMajor} (${tools.nodeVer})`);
if (tools.nodeVerMajor < 16) {
	console.log("Node version is too low, skipping tests");
	process.exit(0);
}
if (tools.nodeVerMajor < 18) {
	console.warn("Lambda running Node v16 or less will use AWS-SDK v2. Upgrade your Lambda function to use Node v18 or higher so that AWS-SDK v3 may be used. @chadkluck/cache-data will still work under Node 16/AWS-SDK v2, but you will receive warnings about upgrading AWS-SDK to v3");
}

console.log(`Node ${tools.AWS.NODE_VER} MAJOR ${tools.AWS.NODE_VER_MAJOR} MINOR ${tools.AWS.NODE_VER_MINOR} PATCH ${tools.AWS.NODE_VER_PATCH} MAJOR MINOR ${tools.AWS.NODE_VER_MAJOR_MINOR} SDK ${tools.AWS.SDK_VER} REGION ${tools.AWS.REGION} V2 ${tools.AWS.SDK_V2} V3 ${tools.AWS.SDK_V3}`, tools.AWS.nodeVersionArray);
console.log(`tools.AWS.INFO`, tools.AWS.INFO);

/* ****************************************************************************
 *	Connection, Connections and ConnectionAuthentication Classes
 */

 describe("Test Connection, Connections, and ConnectionAuthentication Classes", () => {
	describe("Test Connection Class", () => {
		it('toString with defaults', () => {
			let conn = new tools.Connection({
				host: 'api.chadkluck.net',
				path: '/games/'
			})

			expect(conn.toString()).to.equal("null null null://api.chadkluck.net/games/")
	
		})
	})
 })


/* ****************************************************************************
 *	APIRequest Class
 */


describe("Call test endpoint", () => {

	describe('Call test endpoint using tools APIRequest class', () => {
		
		it('Passing uri results in success with a hidden game listed', async () => {
			let req = new tools.APIRequest({uri: 'https://api.chadkluck.net/games/'})
			const result = await req.send()
			const obj = JSON.parse(result.body);
			
			expect(result.statusCode).to.equal(200);
			expect(result.success).to.equal(true);
			expect((typeof result.headers)).to.equal('object');
			expect(result.message).to.equal("SUCCESS");
			expect(obj.hiddengames.length).to.equal(1);
			expect(obj.hiddengames[0]).to.equal("Tic-Tac-Toe")
		});		

		it('Passing host and path results in success with a hidden game listed', async () => {
			let req = new tools.APIRequest({host: 'api.chadkluck.net', path: '/games/'})
			const result = await req.send()
			const obj = JSON.parse(result.body);
			expect(result.statusCode).to.equal(200);
			expect(result.success).to.equal(true);
			expect((typeof result.headers)).to.equal('object');
			expect(result.message).to.equal("SUCCESS");
			expect(obj.hiddengames.length).to.equal(1);
			expect(obj.hiddengames[0]).to.equal("Tic-Tac-Toe")
		})

		it('Headers were passed along', async () => {

			let headers = {
				Authorization: "Basic somerandomExampleKey",
				//'if-none-match': "528cd81ca4",
				//'if-modified-since': "Mon, 14 Feb 2022 03:44:00 GMT",
				'x-my-custom-header': "hello world",
				'User-Agent': "My User Agent"
			};
			let req = new tools.APIRequest({
				method: "POST",
				host: "api.chadkluck.net",
				path: "/echo/",
				headers: headers,
				uri: "",
				protocol: "https",
				body: null,
				parameters: {}
			})
			const result = await req.send()
			const obj = JSON.parse(result.body);

			expect(result.statusCode).to.equal(200);
			expect(result.success).to.equal(true);
			expect((typeof result.headers)).to.equal('object');
			expect(result.message).to.equal("SUCCESS");
			expect(obj.requestInfo.headers.Authorization).to.equal(headers.Authorization)
			//&& expect(obj.requestInfo.headers['if-none-match']).to.equal(headers['if-none-match'])
			//&& expect(obj.requestInfo.headers['if-modified-since']).to.equal(headers['if-modified-since']);
			expect(obj.requestInfo.headers['x-my-custom-header']).to.equal(headers['x-my-custom-header']);
			expect(obj.requestInfo.userAgent).to.equal(headers['User-Agent'])
		});


		it('Parameters were passed along and duplicates were combined into CSV', async () => {

			let headers = {
				'x-my-custom-header': "hello world"
			};

			let parameters = {
				param1: "hello",
				param2: "world",
				param3: ["hi","earth"],
				searchParam: "everything",
				keywords: "international+greetings"
			}

			let req = new tools.APIRequest({
				method: "POST",
				host: "api.chadkluck.net",
				path: "/echo/",
				headers: headers,
				uri: "",
				protocol: "https",
				body: null,
				parameters: parameters
			})
			const result = await req.send()
			const obj = JSON.parse(result.body);

			expect(result.statusCode).to.equal(200);
			expect(result.success).to.equal(true);
			expect((typeof result.headers)).to.equal('object');
			expect(result.message).to.equal("SUCCESS");
			expect(obj.requestInfo.parameters.param1).to.equal(parameters.param1);
			expect(obj.requestInfo.parameters.param2).to.equal(parameters.param2);
			expect(obj.requestInfo.parameters.param3).to.equal(parameters.param3.join(','))
		});

		
		it('Parameters were passed along and duplicates were separate', async () => {

			let headers = {
				'x-my-custom-header': "hello world"
			};

			let parameters = {
				param1: "hello",
				param2: "world",
				param3: ["hi","earth"],
				searchParam: "everything",
				keywords: "international+greetings"
			}

			let req = new tools.APIRequest({
				method: "POST",
				host: "api.chadkluck.net",
				path: "/echo/",
				headers: headers,
				uri: "",
				protocol: "https",
				body: null,
				parameters: parameters,
				options: {separateDuplicateParameters: true, separateDuplicateParametersAppendToKey: "0++"}
			})
			const result = await req.send()
			const obj = JSON.parse(result.body);

			expect(result.statusCode).to.equal(200);
			expect(result.success).to.equal(true);
			expect((typeof result.headers)).to.equal('object');
			expect(result.message).to.equal("SUCCESS");
			expect(obj.requestInfo.parameters.param1).to.equal(parameters.param1);
			expect(obj.requestInfo.parameters.param2).to.equal(parameters.param2);
			expect(obj.requestInfo.parameters.param30).to.equal(parameters.param3[0]);
			expect(obj.requestInfo.parameters.param31).to.equal(parameters.param3[1]);
		});
		
		it('Body was passed along in a POST request', async () => {

			let headers = {
				'x-my-custom-header': "hello world",
				'Content-Type': "text/plain",
				'User-Agent': "My User Agent"
			};

			let parameters = {
				param1: "hello"
			};

			let body = "Hello, Earth!";

			let req = new tools.APIRequest({
				method: "POST",
				host: "api.chadkluck.net",
				path: "/echo/",
				headers: headers,
				uri: "",
				protocol: "https",
				body: body,
				parameters: parameters
			})
			const result = await req.send()

			expect(result.statusCode).to.equal(200);
			expect(result.success).to.equal(true);
			expect((typeof result.headers)).to.equal('object');
			expect(result.message).to.equal("SUCCESS");
			expect(result.body).to.equal('"'+body+'"')
		});

		it('GET request', async () => {

			let headers = {
				'x-my-custom-header': "hello world"
			};

			let parameters = {
				param1: "hello"
			}

			let req = new tools.APIRequest({
				method: "GET",
				host: "api.chadkluck.net",
				path: "/echo/",
				headers: headers,
				uri: "",
				protocol: "https",
				body: null,
				parameters: parameters
			})
			const result = await req.send()
			const obj = JSON.parse(result.body);

			expect(result.statusCode).to.equal(200);
			expect(result.success).to.equal(true);
			expect((typeof result.headers)).to.equal('object');
			expect(result.message).to.equal("SUCCESS");
			expect(obj.requestInfo.method).to.equal("GET")
		});

		it('Passing host and path and an empty uri results in success with a hidden game listed', async () => {
			let req = new tools.APIRequest({host: 'api.chadkluck.net', path: '/games/', uri: ''})
			const result = await req.send()
			const obj = JSON.parse(result.body);
			expect(result.statusCode).to.equal(200);
			expect(result.success).to.equal(true);
			expect((typeof result.headers)).to.equal('object');
			expect(result.message).to.equal("SUCCESS");
			expect(obj.hiddengames.length).to.equal(1);
			expect(obj.hiddengames[0]).to.equal("Tic-Tac-Toe")
		})

		it('Passing uri results in 404', async () => {
			let req = new tools.APIRequest({uri: 'https://api.chadkluck.net/echo/?status=404'})
			const result = await req.send()
			expect(result.statusCode).to.equal(404);
			expect(result.success).to.equal(false);
			expect((typeof result.headers)).to.equal('object');
			expect(result.message).to.equal("FAIL")
		})

		it('Passing uri results in no redirect', async () => {
			let req = new tools.APIRequest({uri: 'https://api.chadkluck.net/games/'})
			const result = await req.send()
			expect(result.statusCode).to.equal(200);
			expect(req.toObject().redirects.length).to.equal(0)
		})

	})

	describe ('Test ConnectionAuthentication class', () => {

		it('ConnectionAuthentication Basic' , async () => {
			let conn = new tools.Connection({
				method: "POST",
				host: "api.chadkluck.net",
				path: "/echo/",
				protocol: "https",
				authentication: new tools.ConnectionAuthentication({basic: {username: "snoopy", password: "W00dstock1966"}}),
				body: null,
				})
			
			const obj = JSON.parse(JSON.stringify(conn.toObject()));

			expect(obj.authentication.headers.Authorization).to.equal("Basic c25vb3B5OlcwMGRzdG9jazE5NjY=");
			expect(obj.headers.Authorization).to.equal("Basic c25vb3B5OlcwMGRzdG9jazE5NjY=");
		})

		it('ConnectionAuthentication Parameters' , async () => {
			let conn = new tools.Connection({
				method: "POST",
				host: "api.chadkluck.net",
				path: "/echo/",
				protocol: "https",
				authentication: new tools.ConnectionAuthentication({parameters: {apikey: "myExampleApiKeyForResource1234"}}),
				body: null,
			})
			
			const obj = JSON.parse(JSON.stringify(conn.toObject()));

			expect(obj.authentication.parameters.apikey).to.equal("myExampleApiKeyForResource1234");
			expect(obj.parameters.apikey).to.equal("myExampleApiKeyForResource1234");
		})

		it('ConnectionAuthentication Parameters with Existing Parameters', async () => {
			let conn = new tools.Connection({
				method: "POST",
				host: "api.chadkluck.net",
				path: "/echo/",
				protocol: "https",
				parameters: {empId: "B8472881993", format: "full"},
				authentication: new tools.ConnectionAuthentication({parameters: {apikey: "myExampleApiKeyForResource5678"}}),
				body: null,
			})

			const obj = JSON.parse(JSON.stringify(conn.toObject()));

			expect(obj.authentication.parameters.apikey).to.equal("myExampleApiKeyForResource5678");
			expect(obj.parameters.apikey).to.equal("myExampleApiKeyForResource5678");
			expect(obj.parameters.empId).to.equal("B8472881993");
			expect(obj.parameters.format).to.equal("full");
		})

		it('ConnectionAuthentication Headers' , async () => {
			let conn = new tools.Connection({
				method: "POST",
				host: "api.chadkluck.net",
				path: "/echo/",
				protocol: "https",
				authentication: new tools.ConnectionAuthentication({headers: {'x-apikey': "myExampleApiKeyForResource1234"}}),
				body: null,
			});
			
			const obj = JSON.parse(JSON.stringify(conn.toObject()));

			expect(obj.authentication.headers['x-apikey']).to.equal("myExampleApiKeyForResource1234");
			expect(obj.headers['x-apikey']).to.equal("myExampleApiKeyForResource1234");
		});

		it('ConnectionAuthentication Headers with Existing Headers', async () => {
			let conn = new tools.Connection({
				method: "POST",
				host: "api.chadkluck.net",
				path: "/echo/",
				protocol: "https",
				headers: {'x-empid': "B8472881993", 'x-format': "full"},
				authentication: new tools.ConnectionAuthentication({headers: {'x-apikey': "myExampleApiKeyForResource5678"}}),
				body: null,
			});

			const obj = JSON.parse(JSON.stringify(conn.toObject()));

			expect(obj.authentication.headers['x-apikey']).to.equal("myExampleApiKeyForResource5678");
			expect(obj.headers['x-apikey']).to.equal("myExampleApiKeyForResource5678");
			expect(obj.headers['x-empid']).to.equal("B8472881993");
			expect(obj.headers['x-format']).to.equal("full");
		});

		it('ConnectionAuthentication Body', async () => {
			let bodyValue = {apikey: "myExampleApiKeyForResource1234"};
			let conn = new tools.Connection({
				method: "POST",
				host: "api.chadkluck.net",
				path: "/echo/",
				protocol: "https",
				authentication: new tools.ConnectionAuthentication({body: bodyValue}),
				body: null,
			});

			const obj = JSON.parse(JSON.stringify(conn.toObject()));
			let body = obj.body;
			try {
				body = JSON.parse(obj.body);
			} catch (error) {
				// nothing
			}

			expect(obj.authentication.body.apikey).to.equal("myExampleApiKeyForResource1234");
			expect(obj.body).to.equal(JSON.stringify(bodyValue));
			expect(body.apikey).to.equal("myExampleApiKeyForResource1234");
		})

		it('ConnectionAuthentication Body with Existing Body', async () => {
			let bodyValue = {empId: "B8472881993", format: "full"};
			let conn = new tools.Connection({
				method: "POST",
				host: "api.chadkluck.net",
				path: "/echo/",
				protocol: "https",
				body: bodyValue,
				authentication: new tools.ConnectionAuthentication({body: {apikey: "myExampleApiKeyForResource5678"}}),
			});

			const obj = JSON.parse(JSON.stringify(conn.toObject()));
			let body = obj.body;
			try {
				body = JSON.parse(obj.body);
			} catch (error) {
				// nothing
			}

			expect(obj.authentication.body.apikey).to.equal("myExampleApiKeyForResource5678");
			expect(obj.body).to.equal(JSON.stringify({apikey: "myExampleApiKeyForResource5678"}));
			expect(body.apikey).to.equal("myExampleApiKeyForResource5678");
		})

	})


	describe('Test APIRequest class', () => {

		it('Testing setter and getter functions of APIRequest without sending', async () => {
			let obj = {
				method: "GET",
				host: "api.chadkluck.net",
				path: "/echo/",
				headers: { "My-Custom-Header": "my custom header value"},
				uri: "",
				protocol: "https",
				body: null,
				parameters: {q: "prime+numbers", limit: "5"},
				options: { timeout: 2000}
			};

			let req = new tools.APIRequest(obj);

			expect(req.getMethod()).to.equal(obj.method);
			expect(req.getBody()).to.equal(obj.body);
			expect(req.getTimeOutInMilliseconds()).to.equal(obj.options.timeout)
		});


		it('Testing min value of timeOutInMilliseconds', () => {

			let obj = {
				method: "GET",
				host: "api.chadkluck.net",
				path: "/echo/",
				headers: { "My-Custom-Header": "my custom header value"},
				uri: "",
				protocol: "https",
				body: null,
				parameters: {q: "prime+numbers", limit: "5"},
				options: { timeout: 0}
			};

			let req = new tools.APIRequest(obj);

			expect(req.getMethod()).to.equal(obj.method);
			expect(req.getBody()).to.equal(obj.body);
			expect(req.getTimeOutInMilliseconds()).to.equal(8000);				


		});
		it('Test timeout', async () => {

			let errorStub, warnStub;

			errorStub = sinon.stub(console, 'error').callsFake(() => {}); // Add callsFake
			warnStub = sinon.stub(console, 'warn').callsFake(() => {});   // Add callsFake

			try {
				
				let obj = {
					method: "GET",
					host: "api.chadkluck.net",
					path: "/echo/",
					headers: { "My-Custom-Header": "my custom header value"},
					uri: "",
					protocol: "https",
					body: null,
					parameters: {q: "prime+numbers", limit: "5"},
					options: { timeout: 2}
				};
			
				let req = new tools.APIRequest(obj);
				const result = await req.send();
		
				// Separate the assertions
				expect(result.statusCode).to.equal(504);
				expect(result.success).to.equal(false);
				expect(result.message).to.equal("https.request resulted in timeout");
				
				// Give some time for stderr to be captured
				await new Promise(resolve => setTimeout(resolve, 100));

				// Verify log was called
				expect(warnStub.called).to.be.true;

				// If you need to verify specific log content
				expect(warnStub.getCall(0).args[0]).to.include(`[WARN] Endpoint request timeout reached (${obj.options.timeout}ms) for host: ${obj.host}`);
			
				// Give some time for stderr to be captured
				await new Promise(resolve => setTimeout(resolve, 100));
		
				// Verify error was properly stubbed
				expect(errorStub.called).to.be.true;	
			} finally {
				// Restore ALL stubs
				errorStub.restore();
				warnStub.restore();	
			}
			
		});
		
	});
	
});
/* ****************************************************************************
 *	DebugAndLog Class
 */


describe("DebugAndLog tests", () => {

	describe('Check the defaults', () => {
		it('Check the default log level', async () => {
			expect(tools.DebugAndLog.getLogLevel()).to.equal(0)
		})

		it('Get the default environment', async () => {
			expect(tools.DebugAndLog.getEnv()).to.equal("PROD")
		})
	});

	describe('Check environment booleans', () => {
		it('Check isNotProduction', async () => {
			expect(tools.DebugAndLog.isNotProduction()).to.equal(false)
		})

		it('Check isProduction', async () => {
			expect(tools.DebugAndLog.isProduction()).to.equal(true)
		})

		it('Check isDevelopment', async () => {
			expect(tools.DebugAndLog.isDevelopment()).to.equal(false)
		})

		it('Check isTest', async () => {
			expect(tools.DebugAndLog.isTest()).to.equal(false)
		})
	});

	describe("Check logging", () => {
		let logStub, warnStub, errorStub;

		// Setup spies before each test
		beforeEach(() => {
			logStub = sinon.stub(console, 'log');
			warnStub = sinon.stub(console, 'warn');
			errorStub = sinon.stub(console, 'error');
		});

		// Clean up spies after each test
		afterEach(() => {
			logStub.restore();
			warnStub.restore();
			errorStub.restore();
		});

		it('Check Errors and Warnings', () => {
			// Run your code that generates logs
			tools.DebugAndLog.log("1. Test Foo");
			tools.DebugAndLog.log("2. Test Bar");
			tools.DebugAndLog.warn("3. Test warn");
			tools.DebugAndLog.error("4. Test error");
			tools.DebugAndLog.debug("5. Test Debug");
			tools.DebugAndLog.message("6. Test Info");
			tools.DebugAndLog.diag("7. Test diagnostics");

			// Get logs without ANSI color codes
			const logs = logStub.getCalls()
				.map(call => call.args.join(' ').replace(/\u001b\[\d+m/g, '').trim());
			
			const warnings = warnStub.getCalls()
				.map(call => call.args.join(' ').replace(/\u001b\[\d+m/g, '').trim());
			
			const errors = errorStub.getCalls()
				.map(call => call.args.join(' ').replace(/\u001b\[\d+m/g, '').trim());

			// Assertions
			expect(logs[0]).to.equal("[LOG] 1. Test Foo");
			expect(logs[1]).to.equal("[LOG] 2. Test Bar");
			expect(warnings[0]).to.equal("[WARN] 3. Test warn");
			expect(errors[0]).to.equal("[ERROR] 4. Test error");

			// You can also check how many times each method was called
			expect(logStub.callCount).to.equal(2);
			expect(warnStub.callCount).to.equal(1);
			expect(errorStub.callCount).to.equal(1);
		});
	});

});

/* ****************************************************************************
 *	DebugAndLog Class
 */

describe("Timer tests", () => {

	const t1 = new tools.Timer("Timer 1 start", true);
	const t2 = new tools.Timer("Timer 2 no start", false);
	const t3 = new tools.Timer("Timer 3 default start");

	describe('Check Starts: construct, isRunning(), wasStarted(), notStarted() wasStopped()', () => {
		it('Check if timer 1 started', async () => {
			expect(t1.isRunning()).to.equal(true);
			expect(t1.wasStarted()).to.equal(true);
			expect(t1.notStarted()).to.equal(false);
			expect(t1.wasStopped()).to.equal(false);
			expect(t1.status()).to.equal("IS_RUNNING")
		})

		it('Check if timer 2 not started', async () => {
			expect(t2.isRunning()).to.equal(false);
			expect(t2.wasStarted()).to.equal(false);
			expect(t2.notStarted()).to.equal(true);
			expect(t2.wasStopped()).to.equal(false);
			expect(t2.status()).to.equal("NOT_STARTED")
		})

		it('Check if timer 3 not started', async () => {
			expect(t3.isRunning()).to.equal(false);
			expect(t3.wasStarted()).to.equal(false);
			expect(t3.notStarted()).to.equal(true);
			expect(t3.wasStopped()).to.equal(false);
			expect(t3.status()).to.equal("NOT_STARTED")
		})

		const t4 = new tools.Timer("Timer 1 start", true);
		const t5 = new tools.Timer("Timer 2 no start", false);
		const t6 = new tools.Timer("Timer 3 default start");
		t4.start();
		t4.stop();
		t5.start();
		t6.start();

		it('Check if timer 4 stopped', async () => {
			expect(t4.isRunning()).to.equal(false);
			expect(t4.wasStarted()).to.equal(true);
			expect(t4.notStarted()).to.equal(false);
			expect(t4.wasStopped()).to.equal(true);
			expect(t4.status()).to.equal("IS_STOPPED")
		})

		it('Check if timer 5 started', async () => {
			expect(t5.isRunning()).to.equal(true);
			expect(t5.wasStarted()).to.equal(true);
			expect(t5.notStarted()).to.equal(false);
			expect(t5.wasStopped()).to.equal(false);
			expect(t5.status()).to.equal("IS_RUNNING")
		})

		it('Check if timer 6 started', async () => {
			expect(t6.isRunning()).to.equal(true);
			expect(t6.wasStarted()).to.equal(true);
			expect(t6.notStarted()).to.equal(false);
			expect(t6.wasStopped()).to.equal(false);
			expect(t6.status()).to.equal("IS_RUNNING")
		})

	})

	describe('Check Timer calc functions', () => {

		it('Check elapsed() no stop - should continue to increase', async () => {
			const t = new tools.Timer("Timer", true);
			await sleep(340);
			let a = t.elapsed();
			await sleep(100);
			expect(t.elapsed()).to.greaterThan(a)
		})

		it('Check elapsedSinceStart() no stop - should continue to increase', async () => {
			const t = new tools.Timer("Timer", true);
			await sleep(340);
			let a = t.elapsedSinceStart();
			await sleep(100);
			expect(t.elapsedSinceStart()).to.greaterThan(a);
		})

		it('Check elapsedSinceStop() no stop - should be -1', async () => {
			const t = new tools.Timer("Timer", true);
			await sleep(340);
			expect(t.elapsedSinceStop()).to.equal(-1);
		})

		it('Check elapsed() after stop - should remain same', async () => {
			const t = new tools.Timer("Timer", true);
			await sleep(340);
			t.stop();
			let a = t.elapsed();
			await sleep(100);
			expect(t.elapsed()).to.equal(a)
		})

		it('Check elapsedSinceStart() after stop - should continue to increase', async () => {
			const t = new tools.Timer("Timer", true);
			await sleep(340);
			t.stop();
			let a = t.elapsedSinceStart();
			await sleep(100);
			expect(t.elapsedSinceStart()).to.greaterThan(a);
		})

		it('Check elapsedSinceStop() after stop - should continue to increase', async () => {
			const t = new tools.Timer("Timer", true);
			await sleep(340);
			t.stop();
			let a = t.elapsedSinceStop();
			await sleep(100);
			expect(t.elapsedSinceStop()).to.greaterThan(a);
		})


	})
});


/* ****************************************************************************
 *	Endpoint Class
 */


describe("Test Endpoint DAO", () => {

	it("Test endpoint directly", async () => {
		let res = await request.execute('https://api.chadkluck.net')
			.get('/games/')

		expect(res.status).to.equal(200)

	});

	describe('Call test endpoint using Endpoint DAO class', () => {

		it('Passing uri results in success with a hidden game listed', async () => {
			const result = await endpoint.getDataDirectFromURI({uri: 'https://api.chadkluck.net/games/'})
			const obj = result.body;
			expect(result.statusCode).to.equal(200);
			expect(result.success).to.equal(true);
			expect((typeof result.headers)).to.equal('object');
			expect(result.message).to.equal("SUCCESS");
			expect(obj.hiddengames.length).to.equal(1);
			expect(obj.hiddengames[0]).to.equal("Tic-Tac-Toe")
		})

		it('Passing host and path results in success with a hidden game listed', async () => {
			const result = await endpoint.getDataDirectFromURI({host: 'api.chadkluck.net', path: '/games/'});
			const obj = result.body;
			expect(result.statusCode).to.equal(200);
			expect(result.success).to.equal(true);
			expect((typeof result.headers)).to.equal('object');
			expect(result.message).to.equal("SUCCESS");
			expect(obj.hiddengames.length).to.equal(1);
			expect(obj.hiddengames[0]).to.equal("Tic-Tac-Toe")
		})

		it('Headers were passed along', async () => {

			let headers = {
				Authorization: "Basic somerandomExampleKey",
				//'if-none-match': "528cd81ca4",
				//'if-modified-since': "Mon, 14 Feb 2022 03:44:00 GMT",
				'x-my-custom-header': "hello world",
				'User-Agent': "My User Agent"
			};
			let conn = {
				method: "POST",
				host: "api.chadkluck.net",
				path: "/echo/",
				headers: headers,
				uri: "",
				protocol: "https",
				body: null,
				parameters: {}
			}
			const result = await endpoint.getDataDirectFromURI(conn);
			const obj = result.body;

			expect(result.statusCode).to.equal(200);
			expect(result.success).to.equal(true);
			expect((typeof result.headers)).to.equal('object');
			expect(result.message).to.equal("SUCCESS");
			expect(obj.requestInfo.headers.Authorization).to.equal(headers.Authorization)
			//&& expect(obj.headers['if-none-match']).to.equal(headers['if-none-match'])
			//&& expect(obj.headers['if-modified-since']).to.equal(headers['if-modified-since']);
			expect(obj.requestInfo.headers['x-my-custom-header']).to.equal(headers['x-my-custom-header']);
			expect(obj.requestInfo.userAgent).to.equal(headers['User-Agent'])
		});


		it('Parameters were passed along', async () => {

			let headers = {
				'x-my-custom-header': "hello world"
			};

			let parameters = {
				param1: "hello",
				param2: "world",
				param3: ["hi","earth"],
				searchParam: "everything",
				keywords: "international+greetings"
			}

			let conn = {
				method: "POST",
				host: "api.chadkluck.net",
				path: "/echo/",
				headers: headers,
				uri: "",
				protocol: "https",
				body: null,
				parameters: parameters
			}
			const result = await endpoint.getDataDirectFromURI(conn);
			const obj = result.body;

			expect(result.statusCode).to.equal(200);
			expect(result.success).to.equal(true);
			expect((typeof result.headers)).to.equal('object');
			expect(result.message).to.equal("SUCCESS");
			expect(obj.requestInfo.parameters.param1).to.equal(parameters.param1);
			expect(obj.requestInfo.parameters.param2).to.equal(parameters.param2);
			expect(obj.requestInfo.parameters.param3).to.equal(parameters.param3.join(','))
		});

		it('GET request', async () => {

			let headers = {
				'x-my-custom-header': "hello world"
			};

			let parameters = {
				param1: "hello"
			}

			let conn = {
				method: "GET",
				host: "api.chadkluck.net",
				path: "/echo/",
				headers: headers,
				uri: "",
				protocol: "https",
				body: null,
				parameters: parameters
			}
			const result = await endpoint.getDataDirectFromURI(conn);
			const obj = result.body;

			expect(result.statusCode).to.equal(200);
			expect(result.success).to.equal(true);
			expect((typeof result.headers)).to.equal('object');
			expect(result.message).to.equal("SUCCESS");
			expect(obj.requestInfo.method).to.equal("GET")
		});

		it('Passing host and path and an empty uri results in success with a hidden game listed', async () => {
			const conn = {host: 'api.chadkluck.net', path: '/games/', uri: ''}
			const result = await endpoint.getDataDirectFromURI(conn);
			const obj = result.body;
			expect(result.statusCode).to.equal(200);
			expect(result.success).to.be.true;
			expect((typeof result.headers)).to.equal('object');
			expect(result.message).to.equal("SUCCESS");
			expect(obj.hiddengames.length).to.equal(1);
			expect(obj.hiddengames[0]).to.equal("Tic-Tac-Toe")
		})

		it('Test timeout', async () => {

			let errorStub, warnStub;

			errorStub = sinon.stub(console, 'error').callsFake(() => {}); // Add callsFake
			warnStub = sinon.stub(console, 'warn').callsFake(() => {});   // Add callsFake

			try {

				let conn = {
					method: "GET",
					host: "api.chadkluck.net",
					path: "/echo/",
					headers: { "My-Custom-Header": "my custom header value"},
					uri: "",
					protocol: "https",
					body: null,
					parameters: {q: "prime+numbers", limit: "5"},
					options: { timeout: 2}
				};

				const result = await endpoint.getDataDirectFromURI(conn);

				// Your assertions
				expect(result.statusCode).to.equal(504);
				expect(result.success).to.be.false;
				expect(result.message).to.equal("https.request resulted in timeout");
		
				// Verify warn was called
				expect(warnStub.called).to.be.true;
				expect(warnStub.getCall(0).args[0]).to.include(
					`[WARN] Endpoint request timeout reached (${conn.options.timeout}ms) for host: ${conn.host}`
				);
		
				// Give some time for stderr to be captured
				await new Promise(resolve => setTimeout(resolve, 100));
		
				// Verify error was properly stubbed
				expect(errorStub.called).to.be.true;	
			} finally {
				// Restore ALL stubs
				errorStub.restore();
				warnStub.restore();	
			}

		});
	})
});


/* ****************************************************************************
 *	Sanitize and Obfuscate
 */

describe("Sanitize and Obfuscate", () => {

	describe("Obfuscate", () => {
		it("Obfuscate Default", async () => {
			let str = "ThisIsMyExample12345678";
		
			expect(tools.obfuscate(str)).to.equal('******5678')
		});

		it("Obfuscate Pad Character", async () => {
			let str = "ThisIsMyExample12345678";
			let opt = {char: 'X' };
		
			expect(tools.obfuscate(str, opt)).to.equal('XXXXXX5678')
		});

		it("Obfuscate Keep", async () => {
			let str = "ThisIsMyExample12345679";
			let opt = {keep: 6 };
		
			expect(tools.obfuscate(str, opt)).to.equal('****345679')
		});

		it("Obfuscate Keep Upper Limit", async () => {
			let str = "ThisIsMyExample12345678";
			let opt = {keep: 8 };
		
			expect(tools.obfuscate(str, opt)).to.equal('****345678')
		});

		it("Obfuscate Keep Lower Limit", async () => {
			let str = "1234";
			let opt = {keep: 8 };
		
			expect(tools.obfuscate(str, opt)).to.equal('*********4')
		});

		it("Obfuscate Set Size", async () => {
			let str = "1234567890123456789";
			let opt = {keep: 4, len: 16 };
		
			expect(tools.obfuscate(str, opt)).to.equal('************6789')
		});

	});

	describe("Sanitize", () => {
		it("Sanitize Object", async () => {
			const obj = {
				secret: "123456",
				secret1: "hdEXAMPLEsuaskleasdkfjs8e229das-43332",
				apiId: null,
				apiKey1: 10009372811,
				apiKey2: null,
				apiKey3: true,
				apiKey4: false,
				apiKey5: 'null',
				apiKey6: "5773ec73EXAMPLE123456",
				apiKey7: "82777111004727281981",
				apiKey8: "true",
				apiKey9: "false",
				"secret-pin": 457829110,
				"pin-token": "5843920573822",
				urls: {
					uri_1: "https://www.api.example.com/api/?count=433&apiKey=DD2EXAMPLE38B9E4369248330EFBB58D6B1431AFB03C8E1D&debug=true",
					uri_2: "https://www.api.example.com/api/?secret=5ZQDEXAMPLE9jhp51qVE5199xU4zj2X2wSPGwNpDub2CiSJO3i",
					uri_3: "https://www.api.example.com/api/?token=CE3EXAMPLE62359AAFCB1F8C5BAF4692FD67C18&debug=true",
					uri_4: "https://www.api.example.com/api/?secret_token=4DAEXAMPLE9155E26A75C6D83E208FF518EAFE4&debug=true",
					uri_5: "https://www.api.example.com/api/?count=433&key=NeREXAMPLEPfka6TETPfHvNoLP4WPBxhhsrOzOh9HyC&debug=true",
					uri_6: "https://www.api.example.com/api/?apitoken=jq3PEXAMPLEGKQDhKjJVo33hRVPK36q0r9-asdf_asdf",
					uri_7: "https://www.api.example.com/api/?api_key=711EXAMPLE9971F47DE25C366F9AB506A1BFD&debug=true",
					uri_8: "https://www.api.example.com/api/?secret-key=93EXAMPLE326A9B41C3DF94BED6E4C9DC524A4F6",
					uri_9: "https://www.api.example.com/api/?client_secret=6C844EXAMPLEDE60C4104936541D4EAB32404DA&debug=true",
					uri_10: "https://www.api.example.com/api/?count=433&list=daisy&test=true&api_secret=lYbEXAMPLE6y4GYvFjmW0F8bGAXtcogmkRGa3hkgph530&debug=true",
					uri_11: "https://www.api.example.com/api/?count=433&api_token=lYb6y4GEXAMPLEYvFjmW0F8bGAXtcogmkRGa3hkgph530&debug=true",
					uri_12: "https://www.api.example.com/api/?count=433",
					uri_13: "https://www.api.example.com/api/?pin-token=899EXAMPLE201948271848271",
					uri_14: "https://www.api.example.com/api/?secret-pin=43123456789",
				},
				headers: {
					auth_1: {Authorization: "Digest username=username, asfsfsf=\"dsffadf\",\nasfsfsf=\"dsffadf\",\nasfsfsf=\"dsffadf\",\nasdfsf=asdfsdf"},
					auth_2: {Authorization: "Bearer dasd/4rVEXAMPLE4MjOdjA3pu9rJ5qc9RKuCoAO8UaxuWUGXUtuzRJKdRTvKMVe3dJ9FN1SyF9n=="},
					auth_3: {Authorization: "App D4D0BEXAMPLEB1B2F12B5E97405C764CA45F"},
					auth_4: {Authorization: "IPSO dasd+F51B6EXAMPLE3334AD3520894712D15D8F1105ED3DD"},
					auth_5: {Authorization: "Key hJdiEXAMPLElwrzM9616MJsDGBiK4qjeJFYB0zmHPxYNUrn8D54ycAN7gwedqHt0UiCWTb"},
					auth_6: {Authorization: "Digest username=EXAMPLE, oauth=\"hhasjjjd+ddad\",\nnonce=\"dsffadf\",\nhash=\"ef05bc-89c2\",\nclient=myapp"},
					auth_7: {Authorization: "Digest username=\"6551156d-EXAMPLE-4b7d-945f-310ff10943c5\", realm=\"bob@contoso.com\", qop=auth, algorithm=MD5-sess, uri=\"sip:bob@contoso.com;gruu;opaque=app:conf:focus:id:854T0R7G\", nonce=\"h8A4ZW22ygGZozIIGZcb43waVMEM6Gq\", nc=1, cnonce=\"\", opaque=\"0C1D4536\", response=\"b4543cd4d6a923b4ab4fd4583af48f0e\""},
					auth_8: {Authorization: `Digest username=\"6551156d-EXAMPLE-4b7d-945f-310ff10943c5\",
					realm=\"bob@contoso.com\",
					qop=auth,
					algorithm=MD5-sess,
					uri=\"sip:bob@contoso.com;gruu;opaque=app:conf:focus:id:854T0R7G\",
					nonce=\"h8A4ZEXAMPLEW22ygGZozIIGZcb43waVMEM6Gq\",
					nc=1, cnonce=\"\",
					opaque=\"0C1D4536\",
					response=\"b4543EXAMPLEcd4d6a923b4ab4fd4583af48f0e\"`},
				},
				multiValueHeaders: {
					Accept: [
						"*/*"
					],
					"Accept-Encoding": [
						"gzip, deflate, br"
					],
					"Cache-Control": [
						"no-cache"
					],
					Host: [
						"myapi.api.example.com"
					],
					"Postman-Token": [
						"86071fc6-EXAMPLE-4ff5-8eb5-d44ce06e3eed"
					],
					"User-Agent": [
						"PostmanRuntime/7.31.1"
					],
					"X-Amzn-Trace-Id": [
						"Root=1-EXAMPLE-15fa842f16c1eeaf5d812345"
					],
					"X-Forwarded-For": [
						"10.61.41.39"
					],
					"X-Forwarded-Port": [
						"443"
					],
					"X-Forwarded-Proto": [
						"https"
					]
				}
			};
			
			let o = tools.sanitize(obj);
			let test_o = ("message" in o && o.message === "Error sanitizing object");

			expect(test_o).to.equal(false)
		});

		it("Sanitize Simple Object Values", async () => {
			const obj = {
				secret: "123456",
				secret1: "hdEXAMPLEsuaskleasdkfjs8e229das-43332",
				apiId: null,
				apiKey1: 123456789012345,
				apiKey2: null,
				apiKey3: true,
				apiKey4: false,
				apiKey5: 'null',
				apiKey6: "5773ec73EXAMPLE123456",
				apiKey7: "82777111004727281981",
				apiKey8: "true",
				apiKey9: "false",
				"secret-pin": 457829110,
				"pin-token": "5843920573822"
			};

			let o = tools.sanitize(obj);

			expect(o.secret).to.equal("********56");
			expect(o.secret1).to.equal("******3332");
			expect(o.apiId).to.equal(null);
			expect(o.apiKey1).to.equal(9999992345);
			expect(o.apiKey2).to.equal(null);
			expect(o.apiKey3).to.equal(true);
			expect(o.apiKey4).to.equal(false);
			expect(o.apiKey5).to.equal("null");
			expect(o.apiKey6).to.equal("******3456");
			expect(o.apiKey7).to.equal("******1981");
			expect(o.apiKey8).to.equal("true");
			expect(o.apiKey9).to.equal("false");
			expect(o['secret-pin']).to.equal(9999999110);
			expect(o['pin-token']).to.equal("******3822")
		});

		it("Sanitize Strings with Query Parameters", async () => {
			const obj = {
				urls: {
					uri_1: "https://www.api.example.com/api/?count=433&apiKey=DD2EXAMPLE38B9E4369248330EFBB58D6B1431AFB03C8E1D&debug=true",
					uri_2: "https://www.api.example.com/api/?secret=5ZQDEXAMPLE9jhp51qVE5199xU4zj2X2wSPGwNpDub2CiSJO3i",
					uri_3: "https://www.api.example.com/api/?token=CE3EXAMPLE62359AAFCB1F8C5BAF4692FD67C18&debug=true",
					uri_4: "https://www.api.example.com/api/?secret_token=4DAEXAMPLE9155E26A75C6D83E208FF518EAFE4&debug=true",
					uri_5: "https://www.api.example.com/api/?count=433&key=NeREXAMPLEPfka6TETPfHvNoLP4WPBxhhsrOzOh9HyC&debug=true",
					uri_6: "https://www.api.example.com/api/?apitoken=jq3PEXAMPLEGKQDhKjJVo33hRVPK36q0r9-asdf_asdf",
					uri_7: "https://www.api.example.com/api/?api_key=711EXAMPLE9971F47DE25C366F9AB506A1BFD&debug=true",
					uri_8: "https://www.api.example.com/api/?secret-key=93EXAMPLE326A9B41C3DF94BED6E4C9DC524A4F6",
					uri_9: "https://www.api.example.com/api/?client_secret=6C844EXAMPLEDE60C4104936541D4EAB32404DA&debug=true",
					uri_10: "https://www.api.example.com/api/?count=433&list=daisy&test=true&api_secret=lYbEXAMPLE6y4GYvFjmW0F8bGAXtcogmkRGa3hkgph530&debug=true",
					uri_11: "https://www.api.example.com/api/?count=433&api_token=lYb6y4GEXAMPLEYvFjmW0F8bGAXtcogmkRGa3hkgph530&debug=true",
					uri_12: "https://www.api.example.com/api/?count=433",
					uri_13: "https://www.api.example.com/api/?pin-token=899EXAMPLE201948271848271",
					uri_14: "https://www.api.example.com/api/?secret-pin=43123456789",
				}
			};

			let o = tools.sanitize(obj).urls;

			expect(o.uri_1).to.equal("https://www.api.example.com/api/?count=433&apiKey=******8E1D&debug=true");
			expect(o.uri_2).to.equal("https://www.api.example.com/api/?secret=******JO3i");
			expect(o.uri_3).to.equal("https://www.api.example.com/api/?token=******7C18&debug=true");
			expect(o.uri_4).to.equal("https://www.api.example.com/api/?secret_token=******AFE4&debug=true");
			expect(o.uri_5).to.equal("https://www.api.example.com/api/?count=433&key=******9HyC&debug=true");
			expect(o.uri_6).to.equal("https://www.api.example.com/api/?apitoken=******asdf");
			expect(o.uri_7).to.equal("https://www.api.example.com/api/?api_key=******1BFD&debug=true");
			expect(o.uri_8).to.equal("https://www.api.example.com/api/?secret-key=******A4F6");
			expect(o.uri_9).to.equal("https://www.api.example.com/api/?client_secret=******04DA&debug=true");
			expect(o.uri_10).to.equal("https://www.api.example.com/api/?count=433&list=daisy&test=true&api_secret=******h530&debug=true");
			expect(o.uri_11).to.equal("https://www.api.example.com/api/?count=433&api_token=******h530&debug=true");
			expect(o.uri_12).to.equal("https://www.api.example.com/api/?count=433");
			expect(o.uri_13).to.equal("https://www.api.example.com/api/?pin-token=******8271");
			expect(o.uri_14).to.equal("https://www.api.example.com/api/?secret-pin=*******789")
		});

		it("Sanitize Authorization headers", async () => {
			const obj = {
				headers: {
					auth_1: {Authorization: "Digest username=username, asfsfsf=\"dsffadf\",\nasfsfsf=\"dsffadf\",\nasfsfsf=\"dsffadf\",\nasdfsf=asdfsdf"},
					auth_2: {Authorization: "Bearer dasd/4rVEXAMPLE4MjOdjA3pu9rJ5qc9RKuCoAO8UaxuWUGXUtuzRJKdRTvKMVe3dJ9FN1SyF9n=="},
					auth_3: {Authorization: "App D4D0BEXAMPLEB1B2F12B5E97405C764CA45F"},
					auth_4: {Authorization: "IPSO dasd+F51B6EXAMPLE3334AD3520894712D15D8F1105ED3DD"},
					auth_5: {Authorization: "Key hJdiEXAMPLElwrzM9616MJsDGBiK4qjeJFYB0zmHPxYNUrn8D54ycAN7gwedqHt0UiCWTb"},
					auth_6: {Authorization: "Digest username=EXAMPLE, oauth=\"hhasjjjd+ddad\",\nnonce=\"dsffadf\",\nhash=\"ef05bc-89c2\",\nclient=myapp"},
					auth_7: {Authorization: "Digest username=\"6551156d-EXAMPLE-4b7d-945f-310ff10943c5\", realm=\"bob@contoso.com\", qop=auth, algorithm=MD5-sess, uri=\"sip:bob@contoso.com;gruu;opaque=app:conf:focus:id:854T0R7G\", nonce=\"h8A4ZW22ygGZozIIGZcb43waVMEM6Gq\", nc=1, cnonce=\"\", opaque=\"0C1D4536\", response=\"b4543cd4d6a923b4ab4fd4583af48f0e\""},
					auth_8: {Authorization: `Digest username=\"6551156d-EXAMPLE-4b7d-945f-310ff10943c5\",
						realm=\"bob@contoso.com\",
						qop=auth,
						algorithm=MD5-sess,
						uri=\"sip:bob@contoso.com;gruu;opaque=app:conf:focus:id:854T0R7G\",
						nonce=\"h8A4ZEXAMPLEW22ygGZozIIGZcb43waVMEM6Gq\",
						nc=1, cnonce=\"\",
						opaque=\"0C1D4536\",
						response=\"b4543EXAMPLEcd4d6a923b4ab4fd4583af48f0e\"`},
				}
			};

			let o = tools.sanitize(obj).headers;

			expect(o.auth_1.Authorization).to.equal("Digest ******fsdf");
			expect(o.auth_2.Authorization).to.equal("Bearer ******9n==");
			expect(o.auth_3.Authorization).to.equal("App ******A45F");
			expect(o.auth_4.Authorization).to.equal("IPSO ******D3DD");
			expect(o.auth_5.Authorization).to.equal("Key ******CWTb");
			expect(o.auth_6.Authorization).to.equal("Digest ******yapp");
			expect(o.auth_7.Authorization).to.equal("Digest ******0e\"");
			expect(o.auth_8.Authorization).to.equal("Digest ******0e\"")
		});

		it("Sanitize Array of Secrets", async () => {
			const obj = {
				multiValueHeaders: {
					Host: [
						"myapi.api.example.com"
					],
					"Postman-Token": [
						"86071fc6-EXAMPLE-4ff5-8eb5-d44ce06e3eed"
					],
					"User-Agent": [
						"PostmanRuntime/7.31.1"
					],
					"X-Forwarded-For": [
						"10.61.41.39"
					],
					"Client-Keys": [
						"e0c4EXAMPLE1234567890ABCDEF",
						"78a5EXAMPLE1234567890abcdef"
					],
					"Client-Secrets": [
						"e0c4EXAMPLE1234567890QRSTUVWXYZ",
						"78a5EXAMPLE1234567890qrstuvwxyz",
						"40b4EXAMPLE1234567890qRsTuVwXyZ"
					],
					"Client-Tokens": [
						"e0c4EXAMPLE1234567890LMNOP",
						"78a5EXAMPLE1234567890lmnop",
						"40b4EXAMPLE1234567890lMnOp",
						"9ce7EXAMPLE1234567890lMNop"
					]
				}
			};

			let o = tools.sanitize(obj).multiValueHeaders;
			
			expect(o['Postman-Token'][0]).to.equal("******3eed");
			expect(o['Client-Keys'][0]).to.equal("******CDEF");
			expect(o['Client-Keys'][1]).to.equal("******cdef");
			expect(o['Client-Secrets'][0]).to.equal("******WXYZ");
			expect(o['Client-Secrets'][1]).to.equal("******wxyz");
			expect(o['Client-Secrets'][2]).to.equal("******wXyZ");
			expect(o['Client-Tokens'][0]).to.equal("******MNOP");
			expect(o['Client-Tokens'][1]).to.equal("******mnop");
			expect(o['Client-Tokens'][2]).to.equal("******MnOp");
			expect(o['Client-Tokens'][3]).to.equal("******MNop")
		});

	});
	
	describe("Sanitize Debug and Log", () => {
		let logStub;

		beforeEach(() => {
			logStub = sinon.stub(console, 'log');
		});

		afterEach(() => {
			logStub.restore();
		});

		it("Log Sanitization", async () => {
			const obj = {
				secret: "123456",
				secret1: "hdEXAMPLEsuaskleasdkfjs8e229das-43332",
				apiKey1: 123456789012345,
				apiKey6: "5773ec73EXAMPLE123456",
				apiKey7: "82777111004727281981",
				"secret-pin": 457829110,
				"pin-token": "5843920573822"
			};

			// Call the log function
			await tools.DebugAndLog.log("My Object", "LOG", obj);

			// Verify that log was actually called
			expect(logStub.called).to.be.true;

			// Get all calls and their arguments
			const calls = logStub.getCalls();
			expect(calls.length).to.be.greaterThan(0, "Expected at least one log call");

			// Get the log output from the first call
			const logOutput = calls[0].args.join(' ')
				.replace(/\u001b\[\d+m/g, '')
				.trim();

			// Debug output if needed
			// console.log('Actual log output:', logOutput);

			// Your assertions
			expect(logOutput).to.include("[LOG] My Object");
			expect(logOutput).to.include("********56");
			expect(logOutput).to.include("******3332");
			expect(logOutput).to.include("9999992345");
			expect(logOutput).to.include("******3456");
			expect(logOutput).to.include("******1981");
			expect(logOutput).to.include("9999999110");
			expect(logOutput).to.include("******3822");
 		});
	});

	describe("Sanitize Debug and Log", () => {
		
		describe("Warning Sanitization", () => {
			let warnStub;
		
			beforeEach(() => {
				warnStub = sinon.stub(console, 'warn');
			});
		
			afterEach(() => {
				warnStub.restore();
			});
		
			it("Warning Sanitization", async () => {
				const obj = {
					secret: "123456",
					secret1: "hdEXAMPLEsuaskleasdkfjs8e229das-43332",
					apiKey1: 123456789012345,
					apiKey6: "5773ec73EXAMPLE123456",
					apiKey7: "82777111004727281981",
					"secret-pin": 457829110,
					"pin-token": "5843920573822"
				};
		
				tools.DebugAndLog.warn("My Object", obj);
		
				expect(warnStub.called).to.be.true;
				
				// Get the warning output and remove ANSI color codes
				const warnOutput = warnStub.firstCall.args
					.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : arg)
					.join(' ')
					.replace(/\u001b\[\d+m/g, '')
					.trim();
		
				expect(warnOutput).to.include("[WARN] My Object");
				expect(warnOutput).to.include("********56");
				expect(warnOutput).to.include("******3332");
				expect(warnOutput).to.include("9999992345");
				expect(warnOutput).to.include("******3456");
				expect(warnOutput).to.include("******1981");
				expect(warnOutput).to.include("9999999110");
				expect(warnOutput).to.include("******3822");
			});
		});
		

		describe("Error Sanitization", () => {
			let errorStub;
		
			beforeEach(() => {
				errorStub = sinon.stub(console, 'error');
			});
		
			afterEach(() => {
				errorStub.restore();
			});
		
			it("Error Sanitization", async () => {
				const obj = {
					secret: "123456",
					secret1: "hdEXAMPLEsuaskleasdkfjs8e229das-43332",
					apiKey1: 123456789012345,
					apiKey6: "5773ec73EXAMPLE123456",
					apiKey7: "82777111004727281981",
					"secret-pin": 457829110,
					"pin-token": "5843920573822"
				};
		
				tools.DebugAndLog.error("My Object", obj);
		
				expect(errorStub.called).to.be.true;
				
				// Get the error output and remove ANSI color codes
				const errorOutput = errorStub.firstCall.args
					.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : arg)
					.join(' ')
					.replace(/\u001b\[\d+m/g, '')
					.trim();
		
				expect(errorOutput).to.include("[ERROR] My Object");
				expect(errorOutput).to.include("********56");
				expect(errorOutput).to.include("******3332");
				expect(errorOutput).to.include("9999992345");
				expect(errorOutput).to.include("******3456");
				expect(errorOutput).to.include("******1981");
				expect(errorOutput).to.include("9999999110");
				expect(errorOutput).to.include("******3822");
			});
		});
		
	});
});

/* ****************************************************************************
 *	Cache Object
 */

describe("Cache Object", () => {


	describe("Test Cache Settings", () => {

		// CodeWhisperer prompt:
		// generate a 256-bit key for encryption in hex format
		const testKey = randomBytes(32).toString('hex');
		const dataKey = Buffer.from(testKey, cache.Cache.CRYPT_ENCODING);

		const cacheInit = {
			dynamoDbTable: "myDynamoDbTable",
			s3Bucket: "myS3Bucket",
			secureDataAlgorithm: "aes-256-cbc",
			secureDataKey: dataKey, // this is not a real key - NEVER STORE KEYS IN REAL CODE!
			idHashAlgorithm: "RSA-SHA256",
			DynamoDbMaxCacheSize_kb: 10,
			purgeExpiredCacheEntriesAfterXHours: 24,
			defaultExpirationExtensionOnErrorInSeconds: 300,
			timeZoneForInterval: "America/Chicago" // if caching on interval, we need a timezone to account for calculating hours, days, and weeks. List: https://en.wikipedia.org/wiki/List_of_tz_database_time_zones
		};

		const connection = {
			name: 'gamesapi',
			host: 'api.chadkluck.net',
			path: '/games/',
			parameters: { code: "random" },
			headers: { referer: "https://chadkluck.net" },
			options: { timeout: 8000 }
		};

		const cacheProfile = {
			profile: "games",
			overrideOriginHeaderExpiration: true, 
			defaultExpirationInSeconds: (24 * 60 * 60), // 24 hours
			expirationIsOnInterval: true,
			headersToRetain: [
				"x-key",
				"x-track",],
			hostId: "api.chadkluck.net",
			pathId: "games",
			encrypt: false,
			defaultExpirationExtensionOnErrorInSeconds: 300	
		};

		const cacheProfileBackwardCompatibility = {
			profile: "games",
			ignoreOriginHeaderExpires: true, 
			defaultExpiresInSeconds: (24 * 60 * 60), // 24 hours
			expiresIsOnInterval: true,
			headersToRetain: [
				"x-key",
				"x-track",],
			host: "api.chadkluck.net",
			path: "games",
			encrypt: true,
			defaultExpiresExtensionOnErrorInSeconds: 800	
		};

		// init cache
		cache.Cache.init(cacheInit);

		it("Test Cache Init", async () => {

			// set timezone to America/Chicago
			process.env.TZ = cacheInit.timeZoneForInterval;

			// calculate timezone offset from UTC in minutes)
			const timezoneOffset = (new Date().getTimezoneOffset()) * -1;// we do opposite

			const info = cache.Cache.info();

			// test cache object
			expect(info.dynamoDbTable).to.equal(cacheInit.dynamoDbTable);
			expect(info.s3Bucket.bucket).to.equal(cacheInit.s3Bucket);
			expect(info.s3Bucket.path).to.equal("cache/");
			expect(info.secureDataKey).to.equal("************** [buffer]");
			expect(info.timeZoneForInterval).to.equal(cacheInit.timeZoneForInterval);
			expect(info.offsetInMinutes).to.equal(timezoneOffset);
			expect(info.idHashAlgorithm).to.equal(cacheInit.idHashAlgorithm);
			expect(info.DynamoDbMaxCacheSize_kb).to.equal(cacheInit.DynamoDbMaxCacheSize_kb);
			expect(info.purgeExpiredCacheEntriesAfterXHours).to.equal(cacheInit.purgeExpiredCacheEntriesAfterXHours)
				
		});

		it("Test Cache Profile", async () => {
			const cacheObject = new cache.Cache(connection, cacheProfile);
			const profile = cacheObject.profile();

			expect(profile.overrideOriginHeaderExpiration).to.equal(cacheProfile.overrideOriginHeaderExpiration);
			expect(profile.defaultExpirationInSeconds).to.equal(cacheProfile.defaultExpirationInSeconds);
			expect(profile.expirationIsOnInterval).to.equal(cacheProfile.expirationIsOnInterval);
			expect(profile.headersToRetain.length).to.equal(cacheProfile.headersToRetain.length);
			expect(profile.headersToRetain[0]).to.equal(cacheProfile.headersToRetain[0]);
			expect(profile.headersToRetain[1]).to.equal(cacheProfile.headersToRetain[1]);
			expect(profile.hostId).to.equal(cacheProfile.hostId);
			expect(profile.pathId).to.equal(cacheProfile.pathId);
			expect(profile.encrypt).to.equal(cacheProfile.encrypt);
			expect(profile.defaultExpirationExtensionOnErrorInSeconds).to.equal(cacheProfile.defaultExpirationExtensionOnErrorInSeconds)
		
		});

		it("Test Cache Profile Backward Compatibility", async () => {
			const cacheObject = new cache.Cache(connection, cacheProfileBackwardCompatibility);
			const profile = cacheObject.profile();

			expect(profile.overrideOriginHeaderExpiration).to.equal(cacheProfileBackwardCompatibility.ignoreOriginHeaderExpires);
			expect(profile.defaultExpirationInSeconds).to.equal(cacheProfileBackwardCompatibility.defaultExpiresInSeconds);
			expect(profile.expirationIsOnInterval).to.equal(cacheProfileBackwardCompatibility.expiresIsOnInterval);
			expect(profile.hostId).to.equal(cacheProfileBackwardCompatibility.host);
			expect(profile.pathId).to.equal(cacheProfileBackwardCompatibility.path);
			expect(profile.defaultExpirationExtensionOnErrorInSeconds).to.equal(cacheProfileBackwardCompatibility.defaultExpiresExtensionOnErrorInSeconds)
		
		});

	});

});

/* ****************************************************************************
 * Hash Data
 */
describe("Hash Data", () => {

	describe("General", () => {

		it("Returns string", async () => {

			const data = {
				key: "value"
			}

			const hash = tools.hashThisData("SHA256", data);

			// console.log(hash);

			// test cache object
			expect(typeof hash).to.equal("string")
		});

		it("Simple objects re-arranged return same hash", async () => {
			const data1 = {
				key: "value",
				key2: "value2"
			}

			const data2 = {
				key2: "value2",
				key: "value"
			}

			const hash1 = tools.hashThisData("SHA256", data1);
			const hash2 = tools.hashThisData("SHA256", data2);

			// console.log(hash1);
			// console.log(hash2);

			// test cache object
			expect(hash1).to.equal(hash2)
		})

		it("Hash a String", async () => {
			const hash = tools.hashThisData("SHA256", "Hello World");
			// console.log(hash);
			expect(hash).to.equal("f6ab55d92d5fb24661a5cfa693907e41f3bb0b7e657394479d9968466706b166")
		})

		it("Hash a Number", async () => {
			const hash = tools.hashThisData("SHA256", 1234);
			// console.log(hash);
			expect(hash).to.equal("acfe2f30062203e6ee2c260cce422e36ed819662af9d06f32519310c5617c0c3")
		})

		it("Hash a Boolean", async () => {
			const hash = tools.hashThisData("SHA256", true);
			// console.log(hash);
			expect(hash).to.equal("74e32b84ec102b47c71797fd974fd87c9eee80bcca986bd766b1567da77b99d5")
		})

		it("Hash an Undefined", async () => {
			const hash = tools.hashThisData("SHA256", undefined);
			// console.log(hash);
			expect(hash).to.equal("3b8c1b768a759eed9623446a15cf4ce2a7e70082aa87f3ab933c8f6f2f5aee0b")
		})

		it("Hash a Null", async () => {
			const hash = tools.hashThisData("SHA256", null);
			// console.log(hash);
			expect(hash).to.equal("da92ecddbdeff7d55f7958f938ecdf7ca7c86afcabcb1f695cd7488560cb37df")
		})

		it("Hash a Function", async () => {
			const hash = tools.hashThisData("SHA256", function () { console.log("Hello World")});
			// console.log(hash);
			expect(hash).to.equal("088e8da2fef00d8e251c4307fe45fd9b8dfbc1a769bb9a0567b4c57d427791ef")
		})

		it("Hash a BigInt", async () => {
			const hash = tools.hashThisData("SHA256", 1234n);
			// console.log(hash);
			expect(hash).to.equal("1593e6a47279766ad87c57f9bdaf930c8d9d4bbf942cdae2566b2282208d1268")
		})

		it("Hash a Symbol", async () => {
			const hash = tools.hashThisData("SHA256", Symbol("foo"));
			// console.log(hash);
			expect(hash).to.equal("7773248fce063d7a6d99620c93542e76647be06895a79b2ca9408490f044a376")
		})

		it("Hash a Date", async () => {
			const hash = tools.hashThisData("SHA256", new Date("2024-04-12T01:54:45.873Z"));
			// console.log(hash);
			expect(hash).to.equal("9eed3c651638b063bb7b74cc92f445cbfe2f972245ce142eb2f6568157592544")
		})

		it("Hash an Object", async () => {
			const hash = tools.hashThisData("SHA256", { statement: "Hello, World", id: "58768G", amount: 58.09 });
			// console.log(hash);
			expect(hash).to.equal("00eaa3263b59036da553c0808c5baad8c2ab2ea9fa9992da8eb4b5c5ba60af09")
		})

		it("Hash an Array", async () => {
			const hash = tools.hashThisData("SHA256", [1,2,3,4]);
			// console.log(hash);
			expect(hash).to.equal("056da7b24110d30c74b5c91e3c5007abd0bc6ce726fdc3f1e4447af946255910")
		})
	});

	describe("Simple Object", () => {
		const data1a = {
			greeting: "Hello",
			audience: "World"
		}

		const data1b = {
			audience: "World",
			greeting: "Hello"
		}

		const data2a = {
			greeting: "Goodbye",
			audience: "World"
		}

		const data2b = {
			greeting: "Hello",
			audience: "Pluto"
		}

		const hash1a = tools.hashThisData("SHA256", data1a);
		const hash1b = tools.hashThisData("SHA256", data1b);
		const hash2a = tools.hashThisData("SHA256", data2a);
		const hash2b = tools.hashThisData("SHA256", data2b);
		
		it("Equal Objects", async () => {
			expect(hash1a).to.equal(hash1a)
		})

		it("Different Objects Round 1", async () => {
			expect(hash1a).to.not.equal(hash2a)
		})

		it("Different Objects Round 2", async () => {
			expect(hash1a).to.not.equal(hash2b)
		})

		it("Different Objects Round 3", async () => {
			expect(hash2a).to.not.equal(hash2b)
		})
	})

	describe("Simple Array", () => {
		const data1a = [
			"Hello",
			"World",
			"Apples",
			"Bananas",
			"Oranges"
		]

		const data1b = [
			"World",
			"Hello",
			"Oranges",
			"Bananas",
			"Apples"
		]

		const data2a = [
			"Goodbye",
			"World",
			"Tangerines",
			"Apples"
		]

		const data2b = [
			"Hello",
			"Pluto",
			"Tangerines",
			"Bananas"
		]

		const hash1a = tools.hashThisData("SHA256", data1a);
		const hash1b = tools.hashThisData("SHA256", data1b);
		const hash2a = tools.hashThisData("SHA256", data2a);
		const hash2b = tools.hashThisData("SHA256", data2b);

		it("Equal Arrays", async () => {
			expect(hash1a).to.equal(hash1b)
		})

		it("Different Arrays Round 1", async () => {
			expect(hash1a).to.not.equal(hash2a)
		})

		it("Different Arrays Round 2", async () => {
			expect(hash1a).to.not.equal(hash2b)
		})

		it("Different Arrays Round 3", async () => {
			expect(hash2a).to.not.equal(hash2b)
		})
	})

	describe("Simple Nested Object", () => {
		const data1a = {
			greeting: "Hello",
			audience: {
				name: "World",
				food: "Apples"
			}
		};

		const data1b = {
			audience: {
				food: "Apples",
				name: "World"
			},
			greeting: "Hello"
		};

		const data2a = {
			greeting: "Goodbye",
			audience: {
				name: "World",
				food: "Apples"
			}
		};

		const data2b = {
			greeting: "Hello",
			audience: {
				name: "Pluto",
				food: "Bananas"
			}
		};

		const hash1a = tools.hashThisData("SHA256", data1a);
		const hash1b = tools.hashThisData("SHA256", data1b);
		const hash2a = tools.hashThisData("SHA256", data2a);
		const hash2b = tools.hashThisData("SHA256", data2b);

		it("Equal Objects", async () => {
			expect(hash1a).to.equal(hash1b)
		})

		it("Different Objects Round 1", async () => {
			expect(hash1a).to.not.equal(hash2a)
		})

		it("Different Objects Round 2", async () => {
			expect(hash1a).to.not.equal(hash2b)
		})

		it("Different Objects Round 3", async () => {
			expect(hash2a).to.not.equal(hash2b)
		})
	})

	describe("Simple Nested Array", () => {
		const data1a = {
			greeting: "Hello",
			audience: [
				"World",
				"Apples",
				"Bananas"
			]
		};

		const data1b = {
			audience: [
				"Apples",
				"World",
				"Bananas"
			],
			greeting: "Hello"
		};

		const data2a = {
			greeting: "Goodbye",
			audience: [
				"World",
				"Apples",
				"Bananas"
			]
		};

		const data2b = {
			greeting: "Hello",
			audience: [
				"Pluto",
				"Bananas",
				"Apples"
			]
		};

		const hash1a = tools.hashThisData("SHA256", data1a);
		const hash1b = tools.hashThisData("SHA256", data1b);
		const hash2a = tools.hashThisData("SHA256", data2a);
		const hash2b = tools.hashThisData("SHA256", data2b);

		it("Equal Objects", async () => {
			expect(hash1a).to.equal(hash1b)
		})

		it("Different Objects Round 1", async () => {
			expect(hash1a).to.not.equal(hash2a)
		})

		it("Different Objects Round 2", async () => {
			expect(hash1a).to.not.equal(hash2b)
		})

		it("Different Objects Round 3", async () => {
			expect(hash2a).to.not.equal(hash2b)
		})

	});

	describe("Nested Data", () => {
		const data1a = {
			phoneNumbers: [
				{ type: "home", number: "8375559876" },
				{ type: "fax", number: "5475551234"  }
			],
			age: 50,
			address: {
				streetAddress: "21 2nd Street",
				city: "New York",
				state: "NY",
				postalCode: "10021"
			},
			firstName: "John",
			email: "john.doe@geocities.com",
			lastName: "Doe"
		}

		// data1a but properties are in random order
		const data1b = {
			lastName: "Doe",
			firstName: "John",
			age: 50,
			address: {
				streetAddress: "21 2nd Street",
				city: "New York",
				state: "NY",
				postalCode: "10021"
			},
			phoneNumbers: [
				{ number: "5475551234", type: "fax"  },
				{ type: "home", number: "8375559876" }
			],
			email: "john.doe@geocities.com"
		};

		// data1a but properties are in random order and missing 1 property
		const data1c = {
			phoneNumbers: [
				{ type: "fax", number: "5475551234" },
				{ number: "8375559876", type: "home" }
			],
			email: "john.doe@geocities.com",
			lastName: "Doe",
			firstName: "John",
			address: {
				state: "NY",
				city: "New York",
				postalCode: "10021",
				streetAddress: "21 2nd Street"
			}
		};

		// data1a but properties are in random order and 1 property changed
		const data1d = {
			phoneNumbers: [
				{ type: "fax", number: "5475551234" },
				{ number: "8375559876", type: "home" }
			],
			email: "john.doe@geocities.com",
			lastName: "Doe",
			age: 50,
			firstName: "John",
			address: {
				state: "NY",
				city: "Albany",
				postalCode: "10021",
				streetAddress: "21 2nd Street"
			}
		};	

		const data2 = {
			lastName: "Hanky",
			firstName: "Hank",
			age: 38,
			address: {
				streetAddress: "810 Hank Way",
				city: "Hanktown",
				state: "NH",
				postalCode: "99999"
			}
		}

		const hash1a = tools.hashThisData("SHA256", data1a);
		const hash1b = tools.hashThisData("SHA256", data1b);
		const hash1c = tools.hashThisData("SHA256", data1c);
		const hash1d = tools.hashThisData("SHA256", data1d);
		const hash2 = tools.hashThisData("SHA256", data2);
		
		it("2 objects, same hash", async () => {
			expect(hash1a).to.equal(hash1b)
		})

		it("2 objects, 1 property difference", async () => {
			expect(hash1a).to.not.equal(hash1c)
		})

		it("2 objects, 1 data difference", async () => {
			expect(hash1a).to.not.equal(hash1d)
		})

		it("2 really different objects", async () => {
			expect(hash1a).to.not.equal(hash2)
		})
	})

	describe("Deeply Nested Data", () => {
		const data1a = {
			firstName: "John",
			lastName: "Doe",
			phoneNumbers: [
				{ type: "home", number: "8375559876" },
				{ type: "fax", number: "5475551234"  }
			],
			age: 50,
			address: {
				streetAddress: "21 2nd Street",
				city: "New York",
				state: "NY",
				postalCode: "10021"
			},
			email: "XXXXXXXXXXXXXXXXXXXXXX",
			hobbies: [
				"Skiing",
				"Golf",
				"Woodworking"
			],
			matrix: [
				[ 1, 2, 3, 4 ],
				[ 5, 6, 7, 8 ],
				[ 9, 10, 11, 12 ],
				[ 13, 14, 15, 16 ]
			],
			foods: [
				[ "Apples", "Oranges", "Bananas"],
				[ "Pizza", "Tacos", "Burgers"],
				[ "Cookies", "Ice Cream", "Cake"]
			],
			children: [
				{
					firstName: "Jane",
					lastName: "Doe",
					age: 20,
					address: {
						streetAddress: "21 2nd Street",
						city: "New York",
						state: "NY",
						postalCode: "10021"
					},
					phoneNumbers: [
						{ type: "home", number: "8375559876" },
						{ type: "fax", number: "5475551234"  }
					],
					email: "XXXXXXXXXXXXXXXXXXXXXX"
				},
				{
					firstName: "Joe",
					lastName: "Doe",
					age: 15,
					address: {
						streetAddress: "21 2nd Street",
						city: "New York",
						state: "NY",
						postalCode: "10021"
					},
					phoneNumbers: [
						{ type: "home", number: "8375559876" },
						{ type: "fax", number: "5475551234"  }
					],
					email: "XXXXXXXXXXXXXXXXXXXXXX"
				}
			]
		}

		const data1b = {
			firstName: "John",
			age: 50,
			lastName: "Doe",
			address: {
				streetAddress: "21 2nd Street",
				city: "New York",
				state: "NY",
				postalCode: "10021"
			},
			email: "XXXXXXXXXXXXXXXXXXXXXX",
			hobbies: [
				"Woodworking",
				"Golf",
				"Skiing"
			],
			phoneNumbers: [
				{ type: "fax", number: "5475551234"  },
				{ type: "home", number: "8375559876" }
			],
			foods: [
				[ "Burgers", "Pizza", "Tacos" ],
				[ "Apples", "Oranges", "Bananas" ],
				[ "Cookies", "Ice Cream", "Cake" ]
			],
			matrix: [
				[ 9, 10, 11, 12 ],
				[ 1, 2, 3, 4 ],
				[ 16, 15, 13, 14 ],
				[ 5, 6, 7, 8 ]
			],
			children: [
				{
					firstName: "Jane",
					lastName: "Doe",
					age: 20,
					address: {
						streetAddress: "21 2nd Street",
						city: "New York",
						state: "NY",
						postalCode: "10021"
					},
					phoneNumbers: [
						{ number: "8375559876", type: "home" },
						{ type: "fax", number: "5475551234"  }
					],
					email: "XXXXXXXXXXXXXXXXXXXXXX"
				},
				{
					firstName: "Joe",
					lastName: "Doe",
					age: 15,
					address: {
						state: "NY",
						streetAddress: "21 2nd Street",
						city: "New York",
						postalCode: "10021"
					},
					phoneNumbers: [
						{ type: "home", number: "8375559876" },
						{ type: "fax", number: "5475551234"  }
					],
					email: "XXXXXXXXXXXXXXXXXXXXXX"
				}
			]
		}

		// make a copy of data1a
		const data1c = JSON.parse(JSON.stringify(data1a));
		// change Oranges to Tangerines in data1a.foods
		data1c.foods[0][1] = "Tangerines";

		// make a copy of data1a
		const data1d = JSON.parse(JSON.stringify(data1a));
		// change city to Albany in data1a.address
		data1d.address.city = "Albany";

		// make a copy of data1a
		const data1e = JSON.parse(JSON.stringify(data1a));
		// add a new child to data1a
		data1e.children.push({
			firstName: "Sarah",
			lastName: "Doe",
			age: 10,
			address: {
				streetAddress: "21 2nd Street",
				city: "New York",
				state: "NY",
				postalCode: "10021"
			}
		});

		// console.log("data1a", data1a);
		// console.log("data1b", data1b);
		// console.log("data1c", data1c);
		// console.log("data1d", data1d);
		// console.log("data1e", data1e);

		const hash1a = tools.hashThisData("SHA256", data1a);
		const hash1b = tools.hashThisData("SHA256", data1b);
		const hash1c = tools.hashThisData("SHA256", data1c);
		const hash1d = tools.hashThisData("SHA256", data1d);
		const hash1e = tools.hashThisData("SHA256", data1e);

		it("Equal complex objects", async () => {
			expect(hash1a).to.equal(hash1b)
		})

		it("Similar complex objects Round 1", async () => {
			expect(hash1a).to.not.equal(hash1c)
		})

		it("Similar complex objects Round 2", async () => {
			expect(hash1a).to.not.equal(hash1d)
		})

		it("Similar complex objects Round 3", async () => {
			expect(hash1a).to.not.equal(hash1e)
		})

		it("Similar complex objects Round 4", async () => {
			expect(hash1b).to.not.equal(hash1c)
		})

		it("Similar complex objects Round 5", async () => {
			expect(hash1b).to.not.equal(hash1d)
		})
	})

	describe("Data Types", () => {

		const timeNow = new Date();
		const timeThen = new Date("December 17, 1995 03:24:00");

		const data1 = {
			symbol: Symbol("APPL"),
			symbol2: Symbol("APPL"),
			bigInt: BigInt(9007199254740991),
			bigInt2: BigInt(8473626171883920),
			Boolean: true,
			Boolean2: false,
			Number: 90.7748,
			Number2: 97732,
			String: "Hello World",
			String2: "Hello Pluto",
			Date: timeNow,
			Date2: timeThen,
			func: function() {
				return "Hello World";
			},
			func2: function() {
				return "Hello Pluto";
			},
			myNull: null,
			myUndefined: undefined
		}

		const data2 = {
			bigInt2: BigInt(8473626171883920),
			symbol: Symbol("APPL"),
			symbol2: Symbol("APPL"),
			myNull: null,
			myUndefined: undefined,
			bigInt: BigInt(9007199254740991),
			Boolean: true,
			String2: "Hello Pluto",
			Boolean2: false,
			Number: 90.7748,
			Number2: 97732,
			String: "Hello World",
			Date: timeNow,
			Date2: timeThen,
			func: function() {
				return "Hello World";
			},
			func2: function() {
				return "Hello Pluto";
			},
		}

		const data3 = {
			bigInt2: BigInt(8473626171883920),
			symbol: Symbol("APPL"),
			symbol2: Symbol("IBM"),
			myNull: null,
			myUndefined: undefined,
			bigInt: BigInt(9007199254740991),
			Boolean: true,
			String2: "Hello Pluto",
			Boolean2: false,
			Number: 90.7748,
			Number2: 97732,
			String: "Hello World",
			Date2: timeNow,
			Date: timeThen,
			func: function() {
				return "Hello World";
			},
			func2: function() {
				return "Hello Pluto";
			},
		}

		const dataDates1 = {
			greeting: "Hello World",
			start: timeNow
		}

		const dataDates2 = {
			start: timeNow,
			greeting: "Hello World",
		}

		const dataDates3 = {
			greeting: "Hello World",
			start: timeThen
		}

		const dataBigInt1 = {
			greeting: "Hello World",
			distance: BigInt(9007199254740991)
		}

		const dataBigInt2 = {
			distance: BigInt(9007199254740991),
			greeting: "Hello World",
		}

		const dataBigInt3 = {
			distance: BigInt(8473626171883920),
			greeting: "Hello World",
		}

		const dataFunc1 = {
			greeting: "Hello World",
			func: function() {
				return "Hello World";
			}
		}

		const dataFunc2 = {
			func: function() {
				return "Hello World";
			},
			greeting: "Hello World",

		}

		const dataFunc3 = {
			greeting: "Hello World",
			func: function() {
				return "Hello Pluto";
			}
		}

		const hash1 = tools.hashThisData("SHA256", data1);
		const hash2 = tools.hashThisData("SHA256", data2);
		const hash3 = tools.hashThisData("SHA256", data3);
		const hashDates1 = tools.hashThisData("SHA256", dataDates1);
		const hashDates2 = tools.hashThisData("SHA256", dataDates2);
		const hashDates3 = tools.hashThisData("SHA256", dataDates3);
		const hashBigInt1 = tools.hashThisData("SHA256", dataBigInt1);
		const hashBigInt2 = tools.hashThisData("SHA256", dataBigInt2);
		const hashBigInt3 = tools.hashThisData("SHA256", dataBigInt3);
		const hashFunc1 = tools.hashThisData("SHA256", dataFunc1);
		const hashFunc2 = tools.hashThisData("SHA256", dataFunc2);
		const hashFunc3 = tools.hashThisData("SHA256", dataFunc3);

		it("Equal data type objects", async () => {
			expect(hash1).to.equal(hash2)
		})

		it("Different data type objects", async () => {
			expect(hash1).to.not.equal(hash3)
		})

		it("Dates: Equal", async () => {
			expect(hashDates1).to.equal(hashDates2)
		})

		it("Dates: Different", async () => {
			expect(hashDates1).to.not.equal(hashDates3)
		})

		it("BigInt: Equal", async () => {
			expect(hashBigInt1).to.equal(hashBigInt2)
		})

		it("BigInt: Different", async () => {
			expect(hashBigInt1).to.not.equal(hashBigInt3)
		})

		it("Function: Equal", async () => {
			expect(hashFunc1).to.equal(hashFunc2)
		})

	});
});

/* 
Create a test that creates 3 tools.CachedSecret and 3 tools.CachedSSMParameter
Then check the name and instance of the cached secret and cached SSM parameter
*/

describe("CachedParameterSecret, CachedSSMParameter, CachedSecret", () => {

	const cachedSecret1 = new tools.CachedSecret("test-secret-1", {refreshAfter: 500});
	const cachedSecret2 = new tools.CachedSecret("test-secret-2", {refreshAfter: 800});
	const cachedSecret3 = new tools.CachedSecret("test-secret-3", {refreshAfter: 1200});
	const cachedSSMParameter1 = new tools.CachedSSMParameter("test-ssm-parameter-1", {refreshAfter: 500});
	const cachedSSMParameter2 = new tools.CachedSSMParameter("test-ssm-parameter-2", {refreshAfter: 800});
	const cachedSSMParameter3 = new tools.CachedSSMParameter("test-ssm-parameter-3", {refreshAfter: 1200});

	describe("CachedParameterSecrets class", () => {
		it("toObject()", async () => {
			expect(tools.CachedParameterSecrets.toObject().objects.length).to.equal(6);
			expect(tools.CachedParameterSecrets.toObject().objects[4].name).to.equal("test-ssm-parameter-2");
		});

		it("getNameTags()", () => {
			expect(tools.CachedParameterSecrets.getNameTags().length).to.equal(6);
			expect(tools.CachedParameterSecrets.getNameTags()[0]).to.equal("test-secret-1 [CachedSecret]");
			expect(tools.CachedParameterSecrets.getNameTags()[1]).to.equal("test-secret-2 [CachedSecret]");
			expect(tools.CachedParameterSecrets.getNameTags()[2]).to.equal("test-secret-3 [CachedSecret]");
			expect(tools.CachedParameterSecrets.getNameTags()[3]).to.equal("test-ssm-parameter-1 [CachedSSMParameter]");
			expect(tools.CachedParameterSecrets.getNameTags()[4]).to.equal("test-ssm-parameter-2 [CachedSSMParameter]");
			expect(tools.CachedParameterSecrets.getNameTags()[5]).to.equal("test-ssm-parameter-3 [CachedSSMParameter]");
		});

		it("getNames()", () => {
			expect(tools.CachedParameterSecrets.getNames().length).to.equal(6);
			expect(tools.CachedParameterSecrets.getNames()[0]).to.equal("test-secret-1");
			expect(tools.CachedParameterSecrets.getNames()[1]).to.equal("test-secret-2");
			expect(tools.CachedParameterSecrets.getNames()[2]).to.equal("test-secret-3");			
			expect(tools.CachedParameterSecrets.getNames()[3]).to.equal("test-ssm-parameter-1");
			expect(tools.CachedParameterSecrets.getNames()[4]).to.equal("test-ssm-parameter-2");
			expect(tools.CachedParameterSecrets.getNames()[5]).to.equal("test-ssm-parameter-3");
		});

	});

	describe("CachedSecret class through CachedParameterSecrets.get()", () => {

		it("Check name and instance of CachedSecret", async () => {
			expect(tools.CachedParameterSecrets.get("test-secret-1").getName()).to.equal("test-secret-1");
			expect(tools.CachedParameterSecrets.get("test-secret-2").getName()).to.equal("test-secret-2");
			expect(tools.CachedParameterSecrets.get("test-secret-3").getName()).to.equal("test-secret-3");
			expect(tools.CachedParameterSecrets.get("test-secret-1").getNameTag()).to.equal("test-secret-1 [CachedSecret]");
			expect(tools.CachedParameterSecrets.get("test-secret-2").getNameTag()).to.equal("test-secret-2 [CachedSecret]");
			expect(tools.CachedParameterSecrets.get("test-secret-3").getNameTag()).to.equal("test-secret-3 [CachedSecret]");
		});

		it("Check object cache properties of CachedSecret", () => {
			expect(tools.CachedParameterSecrets.get("test-secret-1").toObject().cache.refreshAfter).to.equal(500);
			expect(tools.CachedParameterSecrets.get("test-secret-2").toObject().cache.refreshAfter).to.equal(800);
			expect(tools.CachedParameterSecrets.get("test-secret-3").toObject().cache.refreshAfter).to.equal(1200);
		});

	})

	describe("CachedSSMParameter class", () => {

		it("Check name and instance of CachedSSMParameter", async () => {
			expect(tools.CachedParameterSecrets.get("test-ssm-parameter-1").getName()).to.equal("test-ssm-parameter-1");
			expect(tools.CachedParameterSecrets.get("test-ssm-parameter-2").getName()).to.equal("test-ssm-parameter-2");
			expect(tools.CachedParameterSecrets.get("test-ssm-parameter-3").getName()).to.equal("test-ssm-parameter-3");
			expect(tools.CachedParameterSecrets.get("test-ssm-parameter-1").getNameTag()).to.equal("test-ssm-parameter-1 [CachedSSMParameter]");
			expect(tools.CachedParameterSecrets.get("test-ssm-parameter-2").getNameTag()).to.equal("test-ssm-parameter-2 [CachedSSMParameter]");
			expect(tools.CachedParameterSecrets.get("test-ssm-parameter-3").getNameTag()).to.equal("test-ssm-parameter-3 [CachedSSMParameter]");
		});

		it("Check object cache properties of CachedSSMParameter", () => {
			expect(tools.CachedParameterSecrets.get("test-ssm-parameter-1").toObject().cache.refreshAfter).to.equal(500);
			expect(tools.CachedParameterSecrets.get("test-ssm-parameter-2").toObject().cache.refreshAfter).to.equal(800);
			expect(tools.CachedParameterSecrets.get("test-ssm-parameter-3").toObject().cache.refreshAfter).to.equal(1200);
		});

	});
});

/* ****************************************************************************
 *	ClientRequest Object
 */

 describe("ClientRequest Class", () => {

	const validations = {
		referrers: [
			'example.com',
			'acme.com'
		],
		parameters: {
			pathParameters: {
				employeeId: (employeeId) => {
					// must be a 5 character string containing only numbers
					if (!/^\d{5}$/.test(employeeId)) return false;
					return true;
				}
			},
			queryStringParameters: {
				// "include": "contact,department",
				// "format": "detailed",
				// "version": "2"
				include: (include) => {
					// can be a comma delimited list of contact or department
					const VALID_VALUES = new Set(['contact', 'department']);

					function isValidInclude(include) {
						const parts = include.split(',');
						
						// Check if we have 1 or 2 parts only
						if (parts.length === 0 || parts.length > 2) return false;
						
						// Check if all parts are valid and unique
						const uniqueParts = new Set(parts);
						if (uniqueParts.size !== parts.length) return false; // Check for duplicates
						
						return parts.every(part => VALID_VALUES.has(part));
					}
					
					if (!isValidInclude(include)) return false;
					return true;
				},
				format: (format) => {
					if (!/^(detailed|simple)$/.test(format)) return false;
					return true;
				},
				version: (version) => {
					if (!/^(1|2)$/.test(version)) return false;
					return true;
				}
			},
			headerParameters: {
				userAgent: (userAgent) => {
					if (typeof userAgent !== 'string') return false;
					return true;
				}
			}
		}
	};

	tools.ClientRequest.init( {validations: validations} );

	describe("Initialize ClientRequest Class", () => {
		it("Set Options during initialization and check values", () => {
			
			// Check the referrer list
			expect(tools.ClientRequest.getReferrerWhiteList().length).to.equal(2);

			// make sure the white list does not contain '*'
			expect(tools.ClientRequest.getReferrerWhiteList().indexOf('*')).to.equal(-1);

			// make sure the white list contains 'example.com'
			expect(tools.ClientRequest.getReferrerWhiteList().indexOf('example.com')).to.not.equal(-1);

			// make sure the white list contains 'acme.com'
			expect(tools.ClientRequest.getReferrerWhiteList().indexOf('acme.com')).to.not.equal(-1);

			// get the validation functions for path parameters and check employee id
			expect(tools.ClientRequest.getParameterValidations().pathParameters.employeeId('12345')).to.equal(true);

			// check invalid employee id
			expect(tools.ClientRequest.getParameterValidations().pathParameters.employeeId('1234')).to.equal(false);

			// check valid querystring parameter 'include'
			expect(tools.ClientRequest.getParameterValidations().queryStringParameters.include('contact,department')).to.equal(true);

			// check invalid querystring parameter 'include'
			expect(tools.ClientRequest.getParameterValidations().queryStringParameters.include('dept')).to.equal(false);

			// check valid querystring parameter 'format'
			expect(tools.ClientRequest.getParameterValidations().queryStringParameters.format('detailed')).to.equal(true);

			// check invalid querystring parameter 'format'
			expect(tools.ClientRequest.getParameterValidations().queryStringParameters.format('invalid')).to.equal(false);

		});

		it("Check client information against test event", () => {
			
			const REQ = new tools.ClientRequest(testEventA, testContextA);
			expect(REQ.getClientUserAgent()).to.equal('Mozilla/5.0');
			expect(REQ.getClientIp()).to.equal('192.168.100.1');
			expect(REQ.getClientReferer(true)).to.equal('https://internal.example.com/dev');
			expect(REQ.getClientReferer(false)).to.equal('internal.example.com');
			expect(REQ.getClientReferer()).to.equal('internal.example.com');
		})

		it("Test Props against test event", () => {
			const REQ = new tools.ClientRequest(testEventA, testContextA);
			const props = REQ.getProps();
			expect(props.client.isAuthenticated).to.equal(false);
			expect(props.client.isGuest).to.equal(true);
			expect(props.method).to.equal('GET');
			expect(props.path).to.equal('employees/12345/profile');
			expect(props.pathArray.length).to.equal(3);
			expect(props.resource).to.equal('employees/{employeeId}/profile');
			expect(props.resourceArray.length).to.equal(3);
			expect(props.pathParameters.employeeId).to.equal('12345');
			expect(props.queryStringParameters.include).to.equal('contact,department');
			expect(props.headerParameters.userAgent).to.equal('Mozilla/5.0');
		})

		it("Test getPath and getResource methods", () => {
			const REQ = new tools.ClientRequest(testEventA, testContextA);
			expect(REQ.getPath()).to.equal('employees/12345/profile');
			expect(REQ.getPath(1)).to.equal('employees');
			expect(REQ.getPath(2)).to.equal('employees/12345');
			expect(REQ.getPath(3)).to.equal('employees/12345/profile');
			expect(REQ.getPath(4)).to.equal('employees/12345/profile');
			expect(REQ.getPath(0)).to.equal('employees/12345/profile');
			expect(REQ.getPath(-1)).to.equal('profile');
			expect(REQ.getPath(-2)).to.equal('12345/profile');
			expect(REQ.getPath(-3)).to.equal('employees/12345/profile');
			expect(REQ.getPath(-4)).to.equal('employees/12345/profile');
			expect(REQ.getPath(-5)).to.equal('employees/12345/profile');

			expect(REQ.getResource()).to.equal('employees/{employeeId}/profile');
			expect(REQ.getResource(1)).to.equal('employees');
			expect(REQ.getResource(2)).to.equal('employees/{employeeId}');
			expect(REQ.getResource(3)).to.equal('employees/{employeeId}/profile');
			expect(REQ.getResource(4)).to.equal('employees/{employeeId}/profile');
			expect(REQ.getResource(0)).to.equal('employees/{employeeId}/profile');
			expect(REQ.getResource(-1)).to.equal('profile');
			expect(REQ.getResource(-2)).to.equal('{employeeId}/profile');
			expect(REQ.getResource(-3)).to.equal('employees/{employeeId}/profile');
			expect(REQ.getResource(-4)).to.equal('employees/{employeeId}/profile');

			expect(REQ.getPathAt(0)).to.equal('employees');
			expect(REQ.getPathAt(1)).to.equal('12345');
			expect(REQ.getPathAt(2)).to.equal('profile');
			expect(REQ.getPathAt(3)).to.equal(null);
			expect(REQ.getPathAt(-1)).to.equal('profile');
			expect(REQ.getPathAt(-2)).to.equal('12345');
			expect(REQ.getPathAt(-3)).to.equal('employees');
			expect(REQ.getPathAt(-4)).to.equal(null);

			expect(REQ.getResourceAt(0)).to.equal('employees');
			expect(REQ.getResourceAt(1)).to.equal('{employeeId}');
			expect(REQ.getResourceAt(2)).to.equal('profile');
			expect(REQ.getResourceAt(3)).to.equal(null);
			expect(REQ.getResourceAt(-1)).to.equal('profile');
			expect(REQ.getResourceAt(-2)).to.equal('{employeeId}');
			expect(REQ.getResourceAt(-3)).to.equal('employees');
			expect(REQ.getResourceAt(-4)).to.equal(null);

			expect(REQ.getPathArray().length).to.equal(3);
			expect(REQ.getPathArray(2).length).to.equal(2);
			expect(REQ.getPathArray(3).length).to.equal(3);
			expect(REQ.getPathArray(4).length).to.equal(3);
			expect(REQ.getPathArray(0).length).to.equal(3);
			expect(REQ.getPathArray(2)[0]).to.equal('employees');
			expect(REQ.getPathArray(2)[1]).to.equal('12345');
			expect(REQ.getPathArray(-1)[0]).to.equal('profile');
			expect(REQ.getPathArray(-2)[0]).to.equal('12345');

			expect(REQ.getResourceArray().length).to.equal(3);
			expect(REQ.getResourceArray(2).length).to.equal(2);
			expect(REQ.getResourceArray(3).length).to.equal(3);
			expect(REQ.getResourceArray(4).length).to.equal(3);
			expect(REQ.getResourceArray(0).length).to.equal(3);
			expect(REQ.getResourceArray(2)[0]).to.equal('employees');
			expect(REQ.getResourceArray(2)[1]).to.equal('{employeeId}');
			expect(REQ.getResourceArray(-1)[0]).to.equal('profile');
			expect(REQ.getResourceArray(-2)[0]).to.equal('{employeeId}');

		})
	});
});

describe("Response Class", () => {

	const options = {
		jsonResponses: {
			response200: {
				statusCode: 200,
				headers: { "X-Custom-Header": "Custom Value" },
				body: { "message": "Hello World" }
			}
		},
		htmlResponses: {
			response200: {
				statusCode: 200,
				headers: { "X-Custom-Header": "Custom Value HTML" },
				body: tools.htmlGenericResponse.html("Hello", "<h1>Hello World</h1>")
			}
		},
		settings: {
			errorExpirationInSeconds: 422,
			routeExpirationInSeconds: 922
		}
	}

	tools.Response.init(options);

	describe("Test Response Class init", () => {

		it("Check Response Class init", () => {
			expect(tools.Response.getContentType()).to.equal("application/json");
			expect(tools.Response.getErrorExpirationInSeconds()).to.equal(options.settings.errorExpirationInSeconds);
			expect(tools.Response.getRouteExpirationInSeconds()).to.equal(options.settings.routeExpirationInSeconds);

		})

		it("Check Response class static variables", () => {
			expect(tools.Response.CONTENT_TYPE.JSON).to.equal(tools.jsonGenericResponse.contentType);
			expect(tools.Response.CONTENT_TYPE.HTML).to.equal(tools.htmlGenericResponse.contentType);
			expect(tools.Response.CONTENT_TYPE.RSS).to.equal(tools.rssGenericResponse.contentType);
			expect(tools.Response.CONTENT_TYPE.XML).to.equal(tools.xmlGenericResponse.contentType);
			expect(tools.Response.CONTENT_TYPE.TEXT).to.equal(tools.textGenericResponse.contentType);
			expect(tools.Response.CONTENT_TYPE.CSS).to.equal("text/css");
			expect(tools.Response.CONTENT_TYPE.CSV).to.equal("text/csv");
			expect(tools.Response.CONTENT_TYPE.JAVASCRIPT).to.equal("application/javascript");
		})

		it("Check Response class static methods ContentType inpsections", () => {
			expect(tools.Response.inspectBodyContentType(tools.jsonGenericResponse.response200.body)).to.equal(tools.Response.CONTENT_TYPE.JSON);
			expect(tools.Response.inspectBodyContentType(tools.htmlGenericResponse.response200.body)).to.equal(tools.Response.CONTENT_TYPE.HTML);
			expect(tools.Response.inspectBodyContentType(tools.xmlGenericResponse.response200.body)).to.equal(tools.Response.CONTENT_TYPE.XML);
			expect(tools.Response.inspectBodyContentType(tools.rssGenericResponse.response200.body)).to.equal(tools.Response.CONTENT_TYPE.RSS);
			expect(tools.Response.inspectBodyContentType(tools.textGenericResponse.response200.body)).to.equal(tools.Response.CONTENT_TYPE.TEXT);
		})

		it("Use a combo of Generic and Custom JSON responses", () => {

			const REQ = new tools.ClientRequest(testEventA, testContextA);
			const RESPONSE = new tools.Response(REQ);

			expect(RESPONSE.getStatusCode()).to.equal(200);
			expect(RESPONSE.getHeaders()).to.deep.equal({ "X-Custom-Header": "Custom Value", "Content-Type": "application/json" });
			expect(RESPONSE.getBody()).to.deep.equal({ "message": "Hello World" });

			RESPONSE.reset({statusCode: 404})
			expect(RESPONSE.getStatusCode()).to.equal(404);
			expect(RESPONSE.getHeaders()).to.deep.equal({ "Content-Type": "application/json" });
			expect(RESPONSE.getBody()).to.deep.equal({ "message": "Not Found" });
		})
	});

	describe("Test Responses", () => {

		it("Set a Default (JSON) response after new Response", () => {

			const REQ = new tools.ClientRequest(testEventA, testContextA);
			const RESPONSE = new tools.Response(REQ);

			RESPONSE.reset({statusCode: 200});

			expect(RESPONSE.getStatusCode()).to.equal(200);
			expect(RESPONSE.getHeaders()).to.deep.equal({ "X-Custom-Header": "Custom Value", "Content-Type": "application/json" });
			expect(RESPONSE.getBody()).to.deep.equal({ "message": "Hello World" });

			RESPONSE.reset({statusCode: 404});

			expect(RESPONSE.getStatusCode()).to.equal(404);
			expect(RESPONSE.getHeaders()).to.deep.equal({ "Content-Type": "application/json" });
			expect(RESPONSE.getBody()).to.deep.equal({ "message": "Not Found" });

			RESPONSE.reset({statusCode: 500});

			expect(RESPONSE.getStatusCode()).to.equal(500);
			expect(RESPONSE.getHeaders()).to.deep.equal({ "Content-Type": "application/json" });
			expect(RESPONSE.getBody()).to.deep.equal({ "message": "Internal Server Error" });

			RESPONSE.reset({statusCode: 515});

			expect(RESPONSE.getStatusCode()).to.equal(515);
			expect(RESPONSE.getHeaders()).to.deep.equal({ "Content-Type": "application/json" });
			expect(RESPONSE.getBody()).to.deep.equal({ "message": "Internal Server Error" });
		})
	
		it("Set Response to JSON through constructor", () => {

			const REQ = new tools.ClientRequest(testEventA, testContextA);
			const RESPONSE = new tools.Response(REQ, {}, tools.Response.CONTENT_TYPE.JSON);

			RESPONSE.reset({statusCode: 200});

			expect(RESPONSE.getStatusCode()).to.equal(200);
			expect(RESPONSE.getHeaders()).to.deep.equal({ "X-Custom-Header": "Custom Value", "Content-Type": "application/json" });
			expect(RESPONSE.getBody()).to.deep.equal({ "message": "Hello World" });

			RESPONSE.reset({statusCode: 404});

			expect(RESPONSE.getStatusCode()).to.equal(404);
			expect(RESPONSE.getHeaders()).to.deep.equal({ "Content-Type": "application/json" });
			expect(RESPONSE.getBody()).to.deep.equal({ "message": "Not Found" });

			RESPONSE.reset({statusCode: 500});

			expect(RESPONSE.getStatusCode()).to.equal(500);
			expect(RESPONSE.getHeaders()).to.deep.equal({ "Content-Type": "application/json" });
			expect(RESPONSE.getBody()).to.deep.equal({ "message": "Internal Server Error" });

			RESPONSE.reset({statusCode: 515});

			expect(RESPONSE.getStatusCode()).to.equal(515);
			expect(RESPONSE.getHeaders()).to.deep.equal({ "Content-Type": "application/json" });
			expect(RESPONSE.getBody()).to.deep.equal({ "message": "Internal Server Error" });
		})


		it("Set Response to HTML through constructor", () => {

			const REQ = new tools.ClientRequest(testEventA, testContextA);
			const RESPONSE = new tools.Response(REQ, {}, tools.Response.CONTENT_TYPE.HTML);

			RESPONSE.reset({statusCode: 200}, tools.Response.CONTENT_TYPE.HTML);

			expect(RESPONSE.getStatusCode()).to.equal(200);
			expect(RESPONSE.getHeaders()).to.deep.equal({ "X-Custom-Header": "Custom Value HTML", "Content-Type": "text/html; charset=utf-8" });
			expect(RESPONSE.getBody()).to.equal("<html><head><title>Hello</title></head><body><h1>Hello World</h1></body></html>");

			RESPONSE.reset({statusCode: 404}, tools.Response.CONTENT_TYPE.HTML);

			expect(RESPONSE.getStatusCode()).to.equal(404);
			expect(RESPONSE.getHeaders()).to.deep.equal({ "Content-Type": "text/html; charset=utf-8" });
			expect(RESPONSE.getBody()).to.equal("<html><head><title>404 Not Found</title></head><body><p>Not Found</p></body></html>");

			RESPONSE.reset({statusCode: 500}, tools.Response.CONTENT_TYPE.HTML);

			expect(RESPONSE.getStatusCode()).to.equal(500);
			expect(RESPONSE.getHeaders()).to.deep.equal({ "Content-Type": "text/html; charset=utf-8" });
			expect(RESPONSE.getBody()).to.equal("<html><head><title>500 Error</title></head><body><p>Internal Server Error</p></body></html>");

			RESPONSE.reset({statusCode: 515}, tools.Response.CONTENT_TYPE.HTML);

			expect(RESPONSE.getStatusCode()).to.equal(515);
			expect(RESPONSE.getHeaders()).to.deep.equal({ "Content-Type": "text/html; charset=utf-8" });
			expect(RESPONSE.getBody()).to.equal("<html><head><title>500 Error</title></head><body><p>Internal Server Error</p></body></html>");

		})

		it("Set Response to RSS through constructor", () => {
			const REQ = new tools.ClientRequest(testEventA, testContextA);
			const RESPONSE = new tools.Response(REQ, {}, tools.Response.CONTENT_TYPE.RSS);

			RESPONSE.reset({statusCode: 200}, tools.Response.CONTENT_TYPE.RSS);

			expect(RESPONSE.getStatusCode()).to.equal(200);
			expect(RESPONSE.getHeaders()).to.deep.equal({ "Content-Type": "application/rss+xml" });
			expect(RESPONSE.getBody()).to.equal("<?xml version=\"1.0\" encoding=\"UTF-8\" ?><rss version=\"2.0\"><hello>Success</hello></rss>");

			RESPONSE.reset({statusCode: 404}, tools.Response.CONTENT_TYPE.RSS);

			expect(RESPONSE.getStatusCode()).to.equal(404);
			expect(RESPONSE.getHeaders()).to.deep.equal({ "Content-Type": "application/rss+xml" });
			expect(RESPONSE.getBody()).to.equal("<?xml version=\"1.0\" encoding=\"UTF-8\" ?><rss version=\"2.0\"><error>Not Found</error></rss>");

			RESPONSE.reset({statusCode: 500}, tools.Response.CONTENT_TYPE.RSS);

			expect(RESPONSE.getStatusCode()).to.equal(500);
			expect(RESPONSE.getHeaders()).to.deep.equal({ "Content-Type": "application/rss+xml" });
			expect(RESPONSE.getBody()).to.equal("<?xml version=\"1.0\" encoding=\"UTF-8\" ?><rss version=\"2.0\"><error>Internal Server Error</error></rss>");

			RESPONSE.reset({statusCode: 515}, tools.Response.CONTENT_TYPE.RSS);

			expect(RESPONSE.getStatusCode()).to.equal(515);
			expect(RESPONSE.getHeaders()).to.deep.equal({ "Content-Type": "application/rss+xml" });
			expect(RESPONSE.getBody()).to.equal("<?xml version=\"1.0\" encoding=\"UTF-8\" ?><rss version=\"2.0\"><error>Internal Server Error</error></rss>");
		});

		it("Set Response to XML through constructor", () => {
			const REQ = new tools.ClientRequest(testEventA, testContextA);
			const RESPONSE = new tools.Response(REQ, {}, tools.Response.CONTENT_TYPE.XML);

			RESPONSE.reset({statusCode: 200}, tools.Response.CONTENT_TYPE.XML);

			expect(RESPONSE.getStatusCode()).to.equal(200);
			expect(RESPONSE.getHeaders()).to.deep.equal({ "Content-Type": "application/xml" });
			expect(RESPONSE.getBody()).to.equal("<?xml version=\"1.0\" encoding=\"UTF-8\" ?><hello>Success</hello>");

			RESPONSE.reset({statusCode: 404}, tools.Response.CONTENT_TYPE.XML);

			expect(RESPONSE.getStatusCode()).to.equal(404);
			expect(RESPONSE.getHeaders()).to.deep.equal({ "Content-Type": "application/xml" });
			expect(RESPONSE.getBody()).to.equal("<?xml version=\"1.0\" encoding=\"UTF-8\" ?><error>Not Found</error>");

			RESPONSE.reset({statusCode: 500}, tools.Response.CONTENT_TYPE.XML);

			expect(RESPONSE.getStatusCode()).to.equal(500);
			expect(RESPONSE.getHeaders()).to.deep.equal({ "Content-Type": "application/xml" });
			expect(RESPONSE.getBody()).to.equal("<?xml version=\"1.0\" encoding=\"UTF-8\" ?><error>Internal Server Error</error>");

			RESPONSE.reset({statusCode: 515}, tools.Response.CONTENT_TYPE.XML);

			expect(RESPONSE.getStatusCode()).to.equal(515);
			expect(RESPONSE.getHeaders()).to.deep.equal({ "Content-Type": "application/xml" });
			expect(RESPONSE.getBody()).to.equal("<?xml version=\"1.0\" encoding=\"UTF-8\" ?><error>Internal Server Error</error>");
		});

		it("Set Response to TEXT through constructor", () => {
			const REQ = new tools.ClientRequest(testEventA, testContextA);
			const RESPONSE = new tools.Response(REQ, {}, tools.Response.CONTENT_TYPE.TEXT);

			RESPONSE.reset({statusCode: 200}, tools.Response.CONTENT_TYPE.TEXT);

			expect(RESPONSE.getStatusCode()).to.equal(200);
			expect(RESPONSE.getHeaders()).to.deep.equal({ "Content-Type": "text/plain" });
			expect(RESPONSE.getBody()).to.equal("Success");

			RESPONSE.reset({statusCode: 404}, tools.Response.CONTENT_TYPE.TEXT);

			expect(RESPONSE.getStatusCode()).to.equal(404);
			expect(RESPONSE.getHeaders()).to.deep.equal({ "Content-Type": "text/plain" });
			expect(RESPONSE.getBody()).to.equal("Not Found");

			RESPONSE.reset({statusCode: 500}, tools.Response.CONTENT_TYPE.TEXT);

			expect(RESPONSE.getStatusCode()).to.equal(500);
			expect(RESPONSE.getHeaders()).to.deep.equal({ "Content-Type": "text/plain" });
			expect(RESPONSE.getBody()).to.equal("Internal Server Error");

			RESPONSE.reset({statusCode: 515}, tools.Response.CONTENT_TYPE.TEXT);

			expect(RESPONSE.getStatusCode()).to.equal(515);
			expect(RESPONSE.getHeaders()).to.deep.equal({ "Content-Type": "text/plain" });
			expect(RESPONSE.getBody()).to.equal("Internal Server Error");
		});

	});

	describe("Test Constructor", () => {
		it("Set Generic Status Default (JSON)", () => {

			const REQ = new tools.ClientRequest(testEventA, testContextA);
			const RESPONSE = new tools.Response(REQ, {statusCode: 500});

			expect(RESPONSE.getStatusCode()).to.equal(500);
			expect(RESPONSE.getHeaders()).to.deep.equal({ "Content-Type": "application/json" });
			expect(RESPONSE.getBody()).to.deep.equal({ "message": "Internal Server Error" });

			const RESPONSE2 = new tools.Response(REQ, {statusCode: 200});
			expect(RESPONSE2.getStatusCode()).to.equal(200);
			expect(RESPONSE2.getHeaders()).to.deep.equal({ "X-Custom-Header": "Custom Value", "Content-Type": "application/json" });
			expect(RESPONSE2.getBody()).to.deep.equal({ "message": "Hello World" });

			const RESPONSE3 = new tools.Response(REQ, {statusCode: 404});
			expect(RESPONSE3.getStatusCode()).to.equal(404);
			expect(RESPONSE3.getHeaders()).to.deep.equal({ "Content-Type": "application/json" });
			expect(RESPONSE3.getBody()).to.deep.equal({ "message": "Not Found" });
		})

		it("Reset response (JSON)", () => {

			const REQ = new tools.ClientRequest(testEventA, testContextA);
			const RESPONSE = new tools.Response(REQ);

			RESPONSE.reset({statusCode: 500});
			expect(RESPONSE.getStatusCode()).to.equal(500);
			expect(RESPONSE.getHeaders()).to.deep.equal({ "Content-Type": "application/json" });
			expect(RESPONSE.getBody()).to.deep.equal({ "message": "Internal Server Error" });

			RESPONSE.reset({statusCode: 200});
			expect(RESPONSE.getStatusCode()).to.equal(200);
			expect(RESPONSE.getHeaders()).to.deep.equal({ "X-Custom-Header": "Custom Value", "Content-Type": "application/json" });
			expect(RESPONSE.getBody()).to.deep.equal({ "message": "Hello World" });

			RESPONSE.reset({statusCode: 404});
			expect(RESPONSE.getStatusCode()).to.equal(404);
			expect(RESPONSE.getHeaders()).to.deep.equal({ "Content-Type": "application/json" });
		})

		it("Reset response (HTML)", () => {

			const REQ = new tools.ClientRequest(testEventA, testContextA);
			const RESPONSE = new tools.Response(REQ, {}, tools.Response.CONTENT_TYPE.HTML);

			RESPONSE.reset({statusCode: 500});
			expect(RESPONSE.getStatusCode()).to.equal(500);
			expect(RESPONSE.getHeaders()).to.deep.equal({ "Content-Type": "application/json" });
			expect(RESPONSE.getBody()).to.deep.equal({ "message": "Internal Server Error" });

			RESPONSE.reset({statusCode: 200});
			expect(RESPONSE.getStatusCode()).to.equal(200);
			expect(RESPONSE.getHeaders()).to.deep.equal({ "X-Custom-Header": "Custom Value", "Content-Type": "application/json" });
			expect(RESPONSE.getBody()).to.deep.equal({ "message": "Hello World" });

			RESPONSE.reset({statusCode: 404});
			expect(RESPONSE.getStatusCode()).to.equal(404);
			expect(RESPONSE.getHeaders()).to.deep.equal({ "Content-Type": "application/json" });
		})
	})

	describe("Set response with an object then update portions of the response (JSON)", () => {
		it("Test set and add methods", () => {

			const REQ = new tools.ClientRequest(testEventA, testContextA);

			const obj = {
				statusCode: 200,
				headers: { "X-Api-Header": "MyAPI-World" },
				body: { "message": "Hello Saturn!" }
			}
			const RESPONSE = new tools.Response(REQ, obj);

			expect(RESPONSE.getStatusCode()).to.equal(200);
			expect(RESPONSE.getHeaders()).to.deep.equal({ "X-Api-Header": "MyAPI-World", "Content-Type": "application/json" });
			expect(RESPONSE.getBody()).to.deep.equal({ "message": "Hello Saturn!" });

			RESPONSE.setBody({ "message": "Hello Mars!" });
			expect(RESPONSE.getStatusCode()).to.equal(200);
			expect(RESPONSE.getHeaders()).to.deep.equal({ "X-Api-Header": "MyAPI-World", "Content-Type": "application/json" });
			expect(RESPONSE.getBody()).to.deep.equal({ "message": "Hello Mars!" });

			RESPONSE.setHeaders({ "X-Api-Header": "MyAPI-Mars" });
			expect(RESPONSE.getStatusCode()).to.equal(200);
			expect(RESPONSE.getHeaders()).to.deep.equal({ "X-Api-Header": "MyAPI-Mars", "Content-Type": "application/json" });
			expect(RESPONSE.getBody()).to.deep.equal({ "message": "Hello Mars!" });

			RESPONSE.addHeader("X-Api-Header2", "MyAPI-Mars2");
			expect(RESPONSE.getStatusCode()).to.equal(200);
			expect(RESPONSE.getHeaders()).to.deep.equal({ "X-Api-Header": "MyAPI-Mars", "X-Api-Header2": "MyAPI-Mars2", "Content-Type": "application/json" });
			expect(RESPONSE.getBody()).to.deep.equal({ "message": "Hello Mars!" });

			RESPONSE.setHeaders({ "X-Api-Header": "MyAPI-Mars" });
			expect(RESPONSE.getStatusCode()).to.equal(200);
			expect(RESPONSE.getHeaders()).to.deep.equal({ "X-Api-Header": "MyAPI-Mars", "Content-Type": "application/json" });
			expect(RESPONSE.getBody()).to.deep.equal({ "message": "Hello Mars!" });
		})
	})

	describe("Test finalize and log", () => {
		it("Test finalize and log", () => {
			// Create a stub for console.log
			const logStub = sinon.stub(console, 'log');
		
			const REQ = new tools.ClientRequest(testEventA, testContextA);
			const RESPONSE = new tools.Response(REQ);
		
			const resp = RESPONSE.finalize();
		
			// Your existing expectations
			expect(resp.statusCode).to.equal(200);
			expect(resp.headers['Cache-Control']).to.equal("max-age=922");
			expect(resp.headers['Content-Type']).to.equal("application/json");
			expect(resp.headers['X-Custom-Header']).to.equal("Custom Value");
			expect(resp.headers['x-exec-ms']).to.equal(`${REQ.getFinalExecutionTime()}`);
			
			// Expires header validation
			const expires = resp.headers['Expires'];
			const maxAge = resp.headers['Cache-Control'];
			const maxAgeSeconds = parseInt(maxAge.split('=')[1]);
			const maxAgeMS = maxAgeSeconds * 1000;
			const expiresDate = new Date(expires);
			const now = new Date();
			const diff = expiresDate.getTime() - now.getTime();
			expect(diff).to.be.lessThan(maxAgeMS + 1000);
		
			expect(resp.body).to.equal(JSON.stringify({ "message": "Hello World" }));
			expect(RESPONSE.getBody()).to.deep.equal({ "message": "Hello World" });
		
			// Verify log was called
			expect(logStub.called).to.be.true;

			// avoid console.log and print the message to user
			//process.stdout.write(logStub.getCall(0).args[0]);
			
			// Verify log content
			expect(logStub.getCall(0).args[0]).to.include(`[RESPONSE] 200 | 25 | JSON | ${REQ.getFinalExecutionTime()} | 192.168.100.1 | Mozilla/5.0 | - | https://internal.example.com/dev | GET:employees/{employeeId}/profile | format=detailed&include=contact,department&version=2 | - | - | -`);
		
			// Clean up the stub
			logStub.restore();
		});
		
	})
})




/* ****************************************************************************
 * Lambda Tester
 *
 * https://www.npmjs.com/package/lambda-tester
 * https://www.npmjs.com/package/proxyquire
 * https://plainenglish.io/blog/unit-testing-of-aws-lambda-functions-node-js-using-mocha-and-chai-317353f8d60
 */

// describe ( 'handler', function() {
// 	// const event = require( './test-event.json' );
	
// 	it ( 'test success', async function() {
// 		await LambdaTester( myHandler )
// 			.event( event )
// 			.expectResult();
// 	});

// })