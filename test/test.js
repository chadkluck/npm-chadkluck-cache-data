
const { tools, cache, endpoint } = require('../src/index.js');

const chai = require("chai")
const chaiHttp = require("chai-http");
const expect = chai.expect
chai.use(chaiHttp)

// https://www.sitepoint.com/delay-sleep-pause-wait/
function sleep(ms) {
	return new Promise(resolve => setTimeout(resolve, ms));
};

// https://stackoverflow.com/questions/9609393/catching-console-log-in-node-js
function hook_stream (_stream, fn) {
	// Reference default write method
	var old_write = _stream.write;
	// _stream now write with our shiny function
	_stream.write = fn;

	return function() {
		// reset to the default write method
		_stream.write = old_write;
	};
};

/* ****************************************************************************
 *	APIRequest Class
 */


describe("Call test endpoint", () => {

	it("Test endpoint directly", async () => {
    	let res = await chai
        	.request('https://api.chadkluck.net')
        	.get('/games/')
       
    	expect(res.status).to.equal(200)
       
	});

	describe('Call test endpoint using tools APIRequest class', () => {
		it('Passing uri results in success with a hidden game listed', async () => {
			let req = new tools.APIRequest({uri: 'https://api.chadkluck.net/games/'})
		  	const result = await req.send()
			const obj = JSON.parse(result.body);
			expect(result.statusCode).to.equal(200) 
			&& expect(result.success).to.equal(true) 
			&& expect((typeof result.headers)).to.equal('object')
			&& expect(result.message).to.equal("SUCCESS")
			&& expect(obj.hiddengames.length).to.equal(1)
			&& expect(obj.hiddengames[0]).to.equal("Tic-Tac-Toe")
		})

		it('Passing host and path results in success with a hidden game listed', async () => {
			let req = new tools.APIRequest({host: 'api.chadkluck.net', path: '/games/'})
		  	const result = await req.send()
			const obj = JSON.parse(result.body);
			expect(result.statusCode).to.equal(200) 
			&& expect(result.success).to.equal(true) 
			&& expect((typeof result.headers)).to.equal('object')
			&& expect(result.message).to.equal("SUCCESS")
			&& expect(obj.hiddengames.length).to.equal(1)
			&& expect(obj.hiddengames[0]).to.equal("Tic-Tac-Toe")
		})

		it('Headers were passed along', async () => {

			let headers = {
				Authorization: "Basic somerandomExampleKey",
				'if-none-match': "528cd81ca4",
				'if-modified-since': "Mon, 14 Feb 2022 03:44:00 GMT",
				'x-my-custom-header': "hello world",
				'User-Agent': "My User Agent"
			};
			let req = new tools.APIRequest({
				method: "POST",
				host: "labkit.api.63klabs.net",
				path: "/echo/",
				headers: headers,
				uri: "",
				protocol: "https",
				body: null,
				parameters: {}
			})
		  	const result = await req.send()
			const obj = JSON.parse(result.body);

			expect(result.statusCode).to.equal(200) 
			&& expect(result.success).to.equal(true) 
			&& expect((typeof result.headers)).to.equal('object')
			&& expect(result.message).to.equal("SUCCESS")
			&& expect(obj.headers.Authorization).to.equal(headers.Authorization)
			&& expect(obj.headers['if-none-match']).to.equal(headers['if-none-match'])
			&& expect(obj.headers['if-modified-since']).to.equal(headers['if-modified-since'])
			&& expect(obj.headers['x-my-custom-header']).to.equal(headers['x-my-custom-header'])
			&& expect(obj.userAgent).to.equal(headers['User-Agent'])
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

			let req = new tools.APIRequest({
				method: "POST",
				host: "labkit.api.63klabs.net",
				path: "/echo/",
				headers: headers,
				uri: "",
				protocol: "https",
				body: null,
				parameters: parameters
			})
		  	const result = await req.send()
			const obj = JSON.parse(result.body);

			expect(result.statusCode).to.equal(200) 
			&& expect(result.success).to.equal(true) 
			&& expect((typeof result.headers)).to.equal('object')
			&& expect(result.message).to.equal("SUCCESS")
			&& expect(obj.parameters.param1).to.equal(parameters.param1)
			&& expect(obj.parameters.param2).to.equal(parameters.param2)
			&& expect(obj.parameters.param3).to.equal(parameters.param3.join(','))
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
				host: "labkit.api.63klabs.net",
				path: "/echo/",
				headers: headers,
				uri: "",
				protocol: "https",
				body: body,
				parameters: parameters
			})
		  	const result = await req.send()
			const obj = JSON.parse(result.body);

			expect(result.statusCode).to.equal(200) 
			&& expect(result.success).to.equal(true) 
			&& expect((typeof result.headers)).to.equal('object')
			&& expect(result.message).to.equal("SUCCESS")
			&& expect(obj.body).to.equal(body)
			&& expect(obj.method).to.equal("POST")
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
				host: "labkit.api.63klabs.net",
				path: "/echo/",
				headers: headers,
				uri: "",
				protocol: "https",
				body: null,
				parameters: parameters
			})
		  	const result = await req.send()
			const obj = JSON.parse(result.body);

			expect(result.statusCode).to.equal(200) 
			&& expect(result.success).to.equal(true) 
			&& expect((typeof result.headers)).to.equal('object')
			&& expect(result.message).to.equal("SUCCESS")
			&& expect(obj.method).to.equal("GET")
		});

		it('Passing host and path and an empty uri results in success with a hidden game listed', async () => {
			let req = new tools.APIRequest({host: 'api.chadkluck.net', path: '/games/', uri: ''})
		  	const result = await req.send()
			const obj = JSON.parse(result.body);
			expect(result.statusCode).to.equal(200) 
			&& expect(result.success).to.equal(true) 
			&& expect((typeof result.headers)).to.equal('object')
			&& expect(result.message).to.equal("SUCCESS")
			&& expect(obj.hiddengames.length).to.equal(1)
			&& expect(obj.hiddengames[0]).to.equal("Tic-Tac-Toe")
		})

		it('Passing uri results in 404', async () => {
			let req = new tools.APIRequest({uri: 'https://api.chadkluck.net/games2-waf/'})
		  	const result = await req.send()
			expect(result.statusCode).to.equal(404) 
			&& expect(result.success).to.equal(false) 
			&& expect((typeof result.headers)).to.equal('object')
			&& expect(result.message).to.equal("FAIL")
		})

		it('Passing uri results in no redirect', async () => {
			let req = new tools.APIRequest({uri: 'https://api.chadkluck.net/games/'})
		  	const result = await req.send()
			expect(result.statusCode).to.equal(200) 
			&& expect(req.toObject().redirects.length).to.equal(0)
		})

		it('Passing uri results in redirect', async () => {
			let err = [], unhook_stderr = hook_stream(process.stderr, function(string, encoding, fd) {err.push(string.trim());});

			let req = new tools.APIRequest({uri: 'https://api.chadkluck.net/games'})
		  	const result = await req.send();

			unhook_stderr();

			expect(result.statusCode).to.equal(200) 
			&& expect(req.toObject().redirects.length).to.equal(1)
			&& expect(err[0]).to.include('[WARN] 301 | Redirect (Moved Permanently) received |');
		})
	})


	describe('Test APIRequest class', () => {

		it('Testing setter and getter functions of APIRequest without sending', async () => {
			let obj = {
				method: "GET",
				host: "labkit.api.63klabs.net",
				path: "/echo/",
				headers: { "My-Custom-Header": "my custom header value"},
				uri: "",
				protocol: "https",
				body: null,
				parameters: {q: "prime+numbers", limit: "5"},
				options: { timeout: 2000}
			};

			let req = new tools.APIRequest(obj);

			expect(req.getMethod()).to.equal(obj.method)
			&& expect(req.getBody()).to.equal(obj.body)
			&& expect(req.getTimeOutInMilliseconds()).to.equal(obj.options.timeout)
		});


		it('Testing min value of timeOutInMilliseconds', async () => {

			let obj = {
				method: "GET",
				host: "labkit.api.63klabs.net",
				path: "/echo/",
				headers: { "My-Custom-Header": "my custom header value"},
				uri: "",
				protocol: "https",
				body: null,
				parameters: {q: "prime+numbers", limit: "5"},
				options: { timeout: 0}
			};

			let req = new tools.APIRequest(obj);

			expect(req.getMethod()).to.equal(obj.method)
			&& expect(req.getBody()).to.equal(obj.body)
			&& expect(req.getTimeOutInMilliseconds()).to.equal(8000)
		});

		it('Test timeout', async () => {

			let err = [], unhook_stderr = hook_stream(process.stderr, function(string, encoding, fd) {err.push(string.trim());});

			let obj = {
				method: "GET",
				host: "labkit.api.63klabs.net",
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

			unhook_stderr();

			expect(result.statusCode).to.equal(504) 
			&& expect(result.success).to.equal(false) 
			&& expect(result.message).to.equal("https.request resulted in timeout")
			&& expect(err[0]).to.include(`[WARN] Endpoint request timeout reached (${obj.options.timeout}ms) for host: ${obj.host} | `);
		});
	})

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

	describe('Check logging', async () => {
		it('Check Console Logs', async () => {

			let logs = [], err = [],
			// hook up standard errors
			unhook_stderr = hook_stream(process.stderr, function(string, encoding, fd) {
				err.push(string.trim());
			}),
			// hook up standard output
			unhook_stdout = hook_stream(process.stdout, function(string, encoding, fd) {
				logs.push(string.trim());
			});

			// These are logs, so they should show
			tools.DebugAndLog.log("1. Test Foo");
			tools.DebugAndLog.log("2. Test Bar");

			// These are errors so they should not show
			tools.DebugAndLog.warn("3. Test warn");
			tools.DebugAndLog.error("4. Test error");

 			// we are in prod so these shouldn't capture
			tools.DebugAndLog.debug("5. Test Debug");
			tools.DebugAndLog.message("6. Test Info");
			tools.DebugAndLog.diag("7. Test diagnostics");

			unhook_stderr();
			unhook_stdout();

			expect(logs.length).to.equal(2)
			&& expect(logs[0]).to.equal("[LOG] 1. Test Foo")
			&& expect(logs[1]).to.equal("[LOG] 2. Test Bar");

		});

		it('Check Errors and Warnings', async () => {

			let logs = [], err = [],
			// hook up standard errors
			unhook_stderr = hook_stream(process.stderr, function(string, encoding, fd) {
				err.push(string.trim());
			}),
			// hook up standard output
			unhook_stdout = hook_stream(process.stdout, function(string, encoding, fd) {
				logs.push(string.trim());
			});

			// These are logs, not errors so shouldn't show
			tools.DebugAndLog.log("1. Test Foo");
			tools.DebugAndLog.log("2. Test Bar");

			// These are errors so should show
			tools.DebugAndLog.warn("3. Test warn");
			tools.DebugAndLog.error("4. Test error");

 			// we are in prod so these shouldn't capture, especially to err
			tools.DebugAndLog.debug("5. Test Debug");
			tools.DebugAndLog.message("6. Test Info");
			tools.DebugAndLog.diag("7. Test diagnostics");

			unhook_stderr();
			unhook_stdout();

			expect(err.length).to.equal(2)
			&& expect(err[0]).to.equal("[WARN] 3. Test warn")
			&& expect(err[1]).to.equal("[ERROR] 4. Test error");

		});

	})

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
			expect(t1.isRunning()).to.equal(true)
			&& expect(t1.wasStarted()).to.equal(true)
			&& expect(t1.notStarted()).to.equal(false)
			&& expect(t1.wasStopped()).to.equal(false)
			&& expect(t1.status()).to.equal("IS_RUNNING")
		})

		it('Check if timer 2 not started', async () => {
			expect(t2.isRunning()).to.equal(false)
			&& expect(t2.wasStarted()).to.equal(false)
			&& expect(t2.notStarted()).to.equal(true)
			&& expect(t2.wasStopped()).to.equal(false)
			&& expect(t2.status()).to.equal("NOT_STARTED")
		})

		it('Check if timer 3 not started', async () => {
			expect(t3.isRunning()).to.equal(false)
			&& expect(t3.wasStarted()).to.equal(false)
			&& expect(t3.notStarted()).to.equal(true)
			&& expect(t3.wasStopped()).to.equal(false)
			&& expect(t3.status()).to.equal("NOT_STARTED")
		})

		const t4 = new tools.Timer("Timer 1 start", true);
		const t5 = new tools.Timer("Timer 2 no start", false);
		const t6 = new tools.Timer("Timer 3 default start");
		t4.start();
		t4.stop();
		t5.start();
		t6.start();

		it('Check if timer 4 stopped', async () => {
			expect(t4.isRunning()).to.equal(false)
			&& expect(t4.wasStarted()).to.equal(true)
			&& expect(t4.notStarted()).to.equal(false)
			&& expect(t4.wasStopped()).to.equal(true)
			&& expect(t4.status()).to.equal("IS_STOPPED")
		})

		it('Check if timer 5 started', async () => {
			expect(t5.isRunning()).to.equal(true)
			&& expect(t5.wasStarted()).to.equal(true)
			&& expect(t5.notStarted()).to.equal(false)
			&& expect(t5.wasStopped()).to.equal(false)
			&& expect(t5.status()).to.equal("IS_RUNNING")
		})

		it('Check if timer 6 started', async () => {
			expect(t6.isRunning()).to.equal(true)
			&& expect(t6.wasStarted()).to.equal(true)
			&& expect(t6.notStarted()).to.equal(false)
			&& expect(t6.wasStopped()).to.equal(false)
			&& expect(t6.status()).to.equal("IS_RUNNING")
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
    	let res = await chai
        	.request('https://api.chadkluck.net')
        	.get('/games/')
       
    	expect(res.status).to.equal(200)
       
	});

	describe('Call test endpoint using Endpoint DAO class', () => {
		it('Passing uri results in success with a hidden game listed', async () => {
		  	const result = await endpoint.getDataDirectFromURI({uri: 'https://api.chadkluck.net/games/'})
			const obj = result.body;
			expect(result.statusCode).to.equal(200) 
			&& expect(result.success).to.equal(true) 
			&& expect((typeof result.headers)).to.equal('object')
			&& expect(result.message).to.equal("SUCCESS")
			&& expect(obj.hiddengames.length).to.equal(1)
			&& expect(obj.hiddengames[0]).to.equal("Tic-Tac-Toe")
		})

		it('Passing host and path results in success with a hidden game listed', async () => {
		  	const result = await endpoint.getDataDirectFromURI({host: 'api.chadkluck.net', path: '/games/'});
			const obj = result.body;
			expect(result.statusCode).to.equal(200) 
			&& expect(result.success).to.equal(true) 
			&& expect((typeof result.headers)).to.equal('object')
			&& expect(result.message).to.equal("SUCCESS")
			&& expect(obj.hiddengames.length).to.equal(1)
			&& expect(obj.hiddengames[0]).to.equal("Tic-Tac-Toe")
		})

		it('Headers were passed along', async () => {

			let headers = {
				Authorization: "Basic somerandomExampleKey",
				'if-none-match': "528cd81ca4",
				'if-modified-since': "Mon, 14 Feb 2022 03:44:00 GMT",
				'x-my-custom-header': "hello world",
				'User-Agent': "My User Agent"
			};
			let conn = {
				method: "POST",
				host: "labkit.api.63klabs.net",
				path: "/echo/",
				headers: headers,
				uri: "",
				protocol: "https",
				body: null,
				parameters: {}
			}
		  	const result = await endpoint.getDataDirectFromURI(conn);
			const obj = result.body;

			expect(result.statusCode).to.equal(200) 
			&& expect(result.success).to.equal(true) 
			&& expect((typeof result.headers)).to.equal('object')
			&& expect(result.message).to.equal("SUCCESS")
			&& expect(obj.headers.Authorization).to.equal(headers.Authorization)
			&& expect(obj.headers['if-none-match']).to.equal(headers['if-none-match'])
			&& expect(obj.headers['if-modified-since']).to.equal(headers['if-modified-since'])
			&& expect(obj.headers['x-my-custom-header']).to.equal(headers['x-my-custom-header'])
			&& expect(obj.userAgent).to.equal(headers['User-Agent'])
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
				host: "labkit.api.63klabs.net",
				path: "/echo/",
				headers: headers,
				uri: "",
				protocol: "https",
				body: null,
				parameters: parameters
			}
		  	const result = await endpoint.getDataDirectFromURI(conn);
			const obj = result.body;

			expect(result.statusCode).to.equal(200) 
			&& expect(result.success).to.equal(true) 
			&& expect((typeof result.headers)).to.equal('object')
			&& expect(result.message).to.equal("SUCCESS")
			&& expect(obj.parameters.param1).to.equal(parameters.param1)
			&& expect(obj.parameters.param2).to.equal(parameters.param2)
			&& expect(obj.parameters.param3).to.equal(parameters.param3.join(','))
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
				host: "labkit.api.63klabs.net",
				path: "/echo/",
				headers: headers,
				uri: "",
				protocol: "https",
				body: null,
				parameters: parameters
			}
		  	const result = await endpoint.getDataDirectFromURI(conn);
			const obj = result.body;

			expect(result.statusCode).to.equal(200) 
			&& expect(result.success).to.equal(true) 
			&& expect((typeof result.headers)).to.equal('object')
			&& expect(result.message).to.equal("SUCCESS")
			&& expect(obj.method).to.equal("GET")
		});

		it('Passing host and path and an empty uri results in success with a hidden game listed', async () => {
			const conn = {host: 'api.chadkluck.net', path: '/games/', uri: ''}
		  	const result = await endpoint.getDataDirectFromURI(conn);
			const obj = result.body;
			expect(result.statusCode).to.equal(200) 
			&& expect(result.success).to.be.true 
			&& expect((typeof result.headers)).to.equal('object')
			&& expect(result.message).to.equal("SUCCESS")
			&& expect(obj.hiddengames.length).to.equal(1)
			&& expect(obj.hiddengames[0]).to.equal("Tic-Tac-Toe")
		})

		it('Test timeout', async () => {

			let err = [], unhook_stderr = hook_stream(process.stderr, function(string, encoding, fd) {err.push(string.trim());});

			let conn = {
				method: "GET",
				host: "labkit.api.63klabs.net",
				path: "/echo/",
				headers: { "My-Custom-Header": "my custom header value"},
				uri: "",
				protocol: "https",
				body: null,
				parameters: {q: "prime+numbers", limit: "5"},
				options: { timeout: 2}
			};

			const result = await endpoint.getDataDirectFromURI(conn);

			unhook_stderr();

			expect(result.statusCode).to.equal(504) 
			&& expect(result.success).to.be.false 
			&& expect(result.message).to.equal("https.request resulted in timeout")
			&& expect(err[0]).to.include(`[WARN] Endpoint request timeout reached (${conn.options.timeout}ms) for host: ${conn.host} | `);
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

			expect(o.secret).to.equal("********56")
			&& expect(o.secret1).to.equal("******3332")
			&& expect(o.apiId).to.equal(null)
			&& expect(o.apiKey1).to.equal(9999992345)
			&& expect(o.apiKey2).to.equal(null)
			&& expect(o.apiKey3).to.equal(true)
			&& expect(o.apiKey4).to.equal(false)
			&& expect(o.apiKey5).to.equal("null")
			&& expect(o.apiKey6).to.equal("******3456")
			&& expect(o.apiKey7).to.equal("******1981")
			&& expect(o.apiKey8).to.equal("true")
			&& expect(o.apiKey9).to.equal("false")
			&& expect(o['secret-pin']).to.equal(9999999110)
			&& expect(o['pin-token']).to.equal("******3822")
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

			expect(o.uri_1).to.equal("https://www.api.example.com/api/?count=433&apiKey=******8E1D&debug=true")
			&& expect(o.uri_2).to.equal("https://www.api.example.com/api/?secret=******JO3i")
			&& expect(o.uri_3).to.equal("https://www.api.example.com/api/?token=******7C18&debug=true")
			&& expect(o.uri_4).to.equal("https://www.api.example.com/api/?secret_token=******AFE4&debug=true")
			&& expect(o.uri_5).to.equal("https://www.api.example.com/api/?count=433&key=******9HyC&debug=true")
			&& expect(o.uri_6).to.equal("https://www.api.example.com/api/?apitoken=******asdf")
			&& expect(o.uri_7).to.equal("https://www.api.example.com/api/?api_key=******1BFD&debug=true")
			&& expect(o.uri_8).to.equal("https://www.api.example.com/api/?secret-key=******A4F6")
			&& expect(o.uri_9).to.equal("https://www.api.example.com/api/?client_secret=******04DA&debug=true")
			&& expect(o.uri_10).to.equal("https://www.api.example.com/api/?count=433&list=daisy&test=true&api_secret=******h530&debug=true")
			&& expect(o.uri_11).to.equal("https://www.api.example.com/api/?count=433&api_token=******h530&debug=true")
			&& expect(o.uri_12).to.equal("https://www.api.example.com/api/?count=433")
			&& expect(o.uri_13).to.equal("https://www.api.example.com/api/?pin-token=******8271")
			&& expect(o.uri_14).to.equal("https://www.api.example.com/api/?secret-pin=*******789")
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

			expect(o.auth_1.Authorization).to.equal("Digest ******fsdf")
			&& expect(o.auth_2.Authorization).to.equal("Bearer ******9n==")
			&& expect(o.auth_3.Authorization).to.equal("App ******A45F")
			&& expect(o.auth_4.Authorization).to.equal("IPSO ******D3DD")
			&& expect(o.auth_5.Authorization).to.equal("Key ******CWTb")
			&& expect(o.auth_6.Authorization).to.equal("Digest ******yapp")
			&& expect(o.auth_7.Authorization).to.equal("Digest ******0e\"")
			&& expect(o.auth_8.Authorization).to.equal("Digest ******0e\"")
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
			
			expect(o['Postman-Token'][0]).to.equal("******3eed")
			&& expect(o['Client-Keys'][0]).to.equal("******CDEF")
			&& expect(o['Client-Keys'][1]).to.equal("******cdef")
			&& expect(o['Client-Secrets'][0]).to.equal("******WXYZ")
			&& expect(o['Client-Secrets'][1]).to.equal("******wxyz")
			&& expect(o['Client-Secrets'][2]).to.equal("******wXyZ")
			&& expect(o['Client-Tokens'][0]).to.equal("******MNOP")
			&& expect(o['Client-Tokens'][1]).to.equal("******mnop")
			&& expect(o['Client-Tokens'][2]).to.equal("******MnOp")
			&& expect(o['Client-Tokens'][3]).to.equal("******MNop")
		});

	});

	describe("Sanitize Debug and Log", () => {
		it("Log Sanitization", async () => {
			let logs = [], unhook_stdout = hook_stream(process.stdout, function(string, encoding, fd) {logs.push(string.trim());});

			const obj = {
				secret: "123456",
				secret1: "hdEXAMPLEsuaskleasdkfjs8e229das-43332",
				apiKey1: 123456789012345,
				apiKey6: "5773ec73EXAMPLE123456",
				apiKey7: "82777111004727281981",
				"secret-pin": 457829110,
				"pin-token": "5843920573822"
			};

			tools.DebugAndLog.log("My Object", 'log', obj);

			unhook_stdout();

			expect(logs[0]).to.include("[LOG] My Object |")
			&& expect(logs[0]).to.include("********56")
			&& expect(logs[0]).to.include("******3332")
			&& expect(logs[0]).to.include("9999992345")
			&& expect(logs[0]).to.include("******3456")
			&& expect(logs[0]).to.include("******1981")
			&& expect(logs[0]).to.include("9999999110")
			&& expect(logs[0]).to.include("******3822")

		});

		it("Warning Sanitization", async () => {
			let err = [], unhook_stderr = hook_stream(process.stderr, function(string, encoding, fd) {err.push(string.trim());});

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

			unhook_stderr();

			expect(err[0]).to.include("[WARN] My Object |")
			&& expect(err[0]).to.include("********56")
			&& expect(err[0]).to.include("******3332")
			&& expect(err[0]).to.include("9999992345")
			&& expect(err[0]).to.include("******3456")
			&& expect(err[0]).to.include("******1981")
			&& expect(err[0]).to.include("9999999110")
			&& expect(err[0]).to.include("******3822")

		});

		it("Error Sanitization", async () => {
			let err = [], unhook_stderr = hook_stream(process.stderr, function(string, encoding, fd) {err.push(string.trim());});

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

			unhook_stderr();

			expect(err[0]).to.include("[ERROR] My Object |")
			&& expect(err[0]).to.include("********56")
			&& expect(err[0]).to.include("******3332")
			&& expect(err[0]).to.include("9999992345")
			&& expect(err[0]).to.include("******3456")
			&& expect(err[0]).to.include("******1981")
			&& expect(err[0]).to.include("9999999110")
			&& expect(err[0]).to.include("******3822")

		});
	});
});
