
const { tools, cache, endpoint } = require('../src/index.js');

const chai = require("chai")
const chaiHttp = require("chai-http")
const expect = chai.expect
chai.use(chaiHttp)

// https://www.sitepoint.com/delay-sleep-pause-wait/
function sleep(ms) {
	return new Promise(resolve => setTimeout(resolve, ms));
}

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

			let ms = 9000;

			let req = new tools.APIRequest({
				method: "POST",
				host: "labkit.api.63klabs.net",
				path: "/echo/",
				headers: headers,
				uri: "",
				protocol: "https",
				body: body,
				parameters: parameters,
				timeOutInMilliseconds: ms
			})
		  	const result = await req.send()
			const obj = JSON.parse(result.body);

			expect(result.statusCode).to.equal(200) 
			&& expect(result.success).to.equal(true) 
			&& expect((typeof result.headers)).to.equal('object')
			&& expect(result.message).to.equal("SUCCESS")
			&& expect(obj.body).to.equal(body)
			&& expect(obj.method).to.equal("POST")
			&& expect(req.getTimeOutInMilliseconds()).to.equal(ms)
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
			let req = new tools.APIRequest({uri: 'https://api.chadkluck.net/games'})
		  	const result = await req.send()
			expect(result.statusCode).to.equal(200) 
			&& expect(req.toObject().redirects.length).to.equal(1)
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
				timeOutInMilliseconds: 2000
			};

			let req = new tools.APIRequest(obj);

			expect(req.getMethod()).to.equal(obj.method)
			&& expect(req.getBody()).to.equal(obj.body)
			&& expect(req.getTimeOutInMilliseconds()).to.equal(obj.timeOutInMilliseconds)
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
				timeOutInMilliseconds: 0
			};

			let req = new tools.APIRequest(obj);

			expect(req.getMethod()).to.equal(obj.method)
			&& expect(req.getBody()).to.equal(obj.body)
			&& expect(req.getTimeOutInMilliseconds()).to.equal(8000)
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
	})

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