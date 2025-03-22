import sinon from 'sinon';

import * as chai from 'chai';
import {default as chaiHttp, request} from 'chai-http';

import Endpoint from '../../src/lib/dao-endpoint.js';

chai.use(chaiHttp);
const expect = chai.expect;

describe("Test Endpoint DAO", () => {

	it("Test endpoint directly", async () => {
		let res = await request.execute('https://api.chadkluck.net')
			.get('/games/')

		expect(res.status).to.equal(200)

	});

	describe('Call test endpoint using Endpoint DAO class', () => {

		it('Passing uri results in success with a hidden game listed', async () => {
			const result = await Endpoint.getDataDirectFromURI({uri: 'https://api.chadkluck.net/games/'})
			const obj = result.body;
			expect(result.statusCode).to.equal(200);
			expect(result.success).to.equal(true);
			expect((typeof result.headers)).to.equal('object');
			expect(result.message).to.equal("SUCCESS");
			expect(obj.hiddengames.length).to.equal(1);
			expect(obj.hiddengames[0]).to.equal("Tic-Tac-Toe")
		})

		it('Passing host and path results in success with a hidden game listed', async () => {
			const result = await Endpoint.getDataDirectFromURI({host: 'api.chadkluck.net', path: '/games/'});
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
			const result = await Endpoint.getDataDirectFromURI(conn);
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
			const result = await Endpoint.getDataDirectFromURI(conn);
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
			const result = await Endpoint.getDataDirectFromURI(conn);
			const obj = result.body;

			expect(result.statusCode).to.equal(200);
			expect(result.success).to.equal(true);
			expect((typeof result.headers)).to.equal('object');
			expect(result.message).to.equal("SUCCESS");
			expect(obj.requestInfo.method).to.equal("GET")
		});

		it('Passing host and path and an empty uri results in success with a hidden game listed', async () => {
			const conn = {host: 'api.chadkluck.net', path: '/games/', uri: ''}
			const result = await Endpoint.getDataDirectFromURI(conn);
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

				const result = await Endpoint.getDataDirectFromURI(conn);

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
