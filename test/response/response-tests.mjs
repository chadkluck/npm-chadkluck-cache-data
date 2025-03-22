import sinon from 'sinon';
import { expect } from 'chai';

import { Response, ClientRequest, htmlGenericResponse, jsonGenericResponse, xmlGenericResponse, rssGenericResponse, textGenericResponse } from '../../src/lib/tools/index.js';

import testEventA from '../helpers/test-event-a.json' with { type: 'json' };
import {testContextA} from '../helpers/test-context.js';

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
				body: htmlGenericResponse.html("Hello", "<h1>Hello World</h1>")
			}
		},
		settings: {
			errorExpirationInSeconds: 422,
			routeExpirationInSeconds: 922
		}
	}

	Response.init(options);

	describe("Test Response Class init", () => {

		it("Check Response Class init", () => {
			expect(Response.getContentType()).to.equal("application/json");
			expect(Response.getErrorExpirationInSeconds()).to.equal(options.settings.errorExpirationInSeconds);
			expect(Response.getRouteExpirationInSeconds()).to.equal(options.settings.routeExpirationInSeconds);

		})

		it("Check Response class static variables", () => {
			expect(Response.CONTENT_TYPE.JSON).to.equal(jsonGenericResponse.contentType);
			expect(Response.CONTENT_TYPE.HTML).to.equal(htmlGenericResponse.contentType);
			expect(Response.CONTENT_TYPE.RSS).to.equal(rssGenericResponse.contentType);
			expect(Response.CONTENT_TYPE.XML).to.equal(xmlGenericResponse.contentType);
			expect(Response.CONTENT_TYPE.TEXT).to.equal(textGenericResponse.contentType);
			expect(Response.CONTENT_TYPE.CSS).to.equal("text/css");
			expect(Response.CONTENT_TYPE.CSV).to.equal("text/csv");
			expect(Response.CONTENT_TYPE.JAVASCRIPT).to.equal("application/javascript");
		})

		it("Check Response class static methods ContentType inspections", () => {
			expect(Response.inspectBodyContentType(jsonGenericResponse.response200.body)).to.equal(Response.CONTENT_TYPE.JSON);
			expect(Response.inspectBodyContentType(htmlGenericResponse.response200.body)).to.equal(Response.CONTENT_TYPE.HTML);
			expect(Response.inspectBodyContentType(xmlGenericResponse.response200.body)).to.equal(Response.CONTENT_TYPE.XML);
			expect(Response.inspectBodyContentType(rssGenericResponse.response200.body)).to.equal(Response.CONTENT_TYPE.RSS);
			expect(Response.inspectBodyContentType(textGenericResponse.response200.body)).to.equal(Response.CONTENT_TYPE.TEXT);
		})

		it("Use a combo of Generic and Custom JSON responses", () => {

			const REQ = new ClientRequest(testEventA, testContextA);
			const RESPONSE = new Response(REQ);

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

			const REQ = new ClientRequest(testEventA, testContextA);
			const RESPONSE = new Response(REQ);

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

			const REQ = new ClientRequest(testEventA, testContextA);
			const RESPONSE = new Response(REQ, {}, Response.CONTENT_TYPE.JSON);

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

			const REQ = new ClientRequest(testEventA, testContextA);
			const RESPONSE = new Response(REQ, {}, Response.CONTENT_TYPE.HTML);

			RESPONSE.reset({statusCode: 200}, Response.CONTENT_TYPE.HTML);

			expect(RESPONSE.getStatusCode()).to.equal(200);
			expect(RESPONSE.getHeaders()).to.deep.equal({ "X-Custom-Header": "Custom Value HTML", "Content-Type": "text/html; charset=utf-8" });
			expect(RESPONSE.getBody()).to.equal("<html><head><title>Hello</title></head><body><h1>Hello World</h1></body></html>");

			RESPONSE.reset({statusCode: 404}, Response.CONTENT_TYPE.HTML);

			expect(RESPONSE.getStatusCode()).to.equal(404);
			expect(RESPONSE.getHeaders()).to.deep.equal({ "Content-Type": "text/html; charset=utf-8" });
			expect(RESPONSE.getBody()).to.equal("<html><head><title>404 Not Found</title></head><body><p>Not Found</p></body></html>");

			RESPONSE.reset({statusCode: 500}, Response.CONTENT_TYPE.HTML);

			expect(RESPONSE.getStatusCode()).to.equal(500);
			expect(RESPONSE.getHeaders()).to.deep.equal({ "Content-Type": "text/html; charset=utf-8" });
			expect(RESPONSE.getBody()).to.equal("<html><head><title>500 Error</title></head><body><p>Internal Server Error</p></body></html>");

			RESPONSE.reset({statusCode: 515}, Response.CONTENT_TYPE.HTML);

			expect(RESPONSE.getStatusCode()).to.equal(515);
			expect(RESPONSE.getHeaders()).to.deep.equal({ "Content-Type": "text/html; charset=utf-8" });
			expect(RESPONSE.getBody()).to.equal("<html><head><title>500 Error</title></head><body><p>Internal Server Error</p></body></html>");

		})

		it("Set Response to RSS through constructor", () => {
			const REQ = new ClientRequest(testEventA, testContextA);
			const RESPONSE = new Response(REQ, {}, Response.CONTENT_TYPE.RSS);

			RESPONSE.reset({statusCode: 200}, Response.CONTENT_TYPE.RSS);

			expect(RESPONSE.getStatusCode()).to.equal(200);
			expect(RESPONSE.getHeaders()).to.deep.equal({ "Content-Type": "application/rss+xml" });
			expect(RESPONSE.getBody()).to.equal("<?xml version=\"1.0\" encoding=\"UTF-8\" ?><rss version=\"2.0\"><hello>Success</hello></rss>");

			RESPONSE.reset({statusCode: 404}, Response.CONTENT_TYPE.RSS);

			expect(RESPONSE.getStatusCode()).to.equal(404);
			expect(RESPONSE.getHeaders()).to.deep.equal({ "Content-Type": "application/rss+xml" });
			expect(RESPONSE.getBody()).to.equal("<?xml version=\"1.0\" encoding=\"UTF-8\" ?><rss version=\"2.0\"><error>Not Found</error></rss>");

			RESPONSE.reset({statusCode: 500}, Response.CONTENT_TYPE.RSS);

			expect(RESPONSE.getStatusCode()).to.equal(500);
			expect(RESPONSE.getHeaders()).to.deep.equal({ "Content-Type": "application/rss+xml" });
			expect(RESPONSE.getBody()).to.equal("<?xml version=\"1.0\" encoding=\"UTF-8\" ?><rss version=\"2.0\"><error>Internal Server Error</error></rss>");

			RESPONSE.reset({statusCode: 515}, Response.CONTENT_TYPE.RSS);

			expect(RESPONSE.getStatusCode()).to.equal(515);
			expect(RESPONSE.getHeaders()).to.deep.equal({ "Content-Type": "application/rss+xml" });
			expect(RESPONSE.getBody()).to.equal("<?xml version=\"1.0\" encoding=\"UTF-8\" ?><rss version=\"2.0\"><error>Internal Server Error</error></rss>");
		});

		it("Set Response to XML through constructor", () => {
			const REQ = new ClientRequest(testEventA, testContextA);
			const RESPONSE = new Response(REQ, {}, Response.CONTENT_TYPE.XML);

			RESPONSE.reset({statusCode: 200}, Response.CONTENT_TYPE.XML);

			expect(RESPONSE.getStatusCode()).to.equal(200);
			expect(RESPONSE.getHeaders()).to.deep.equal({ "Content-Type": "application/xml" });
			expect(RESPONSE.getBody()).to.equal("<?xml version=\"1.0\" encoding=\"UTF-8\" ?><hello>Success</hello>");

			RESPONSE.reset({statusCode: 404}, Response.CONTENT_TYPE.XML);

			expect(RESPONSE.getStatusCode()).to.equal(404);
			expect(RESPONSE.getHeaders()).to.deep.equal({ "Content-Type": "application/xml" });
			expect(RESPONSE.getBody()).to.equal("<?xml version=\"1.0\" encoding=\"UTF-8\" ?><error>Not Found</error>");

			RESPONSE.reset({statusCode: 500}, Response.CONTENT_TYPE.XML);

			expect(RESPONSE.getStatusCode()).to.equal(500);
			expect(RESPONSE.getHeaders()).to.deep.equal({ "Content-Type": "application/xml" });
			expect(RESPONSE.getBody()).to.equal("<?xml version=\"1.0\" encoding=\"UTF-8\" ?><error>Internal Server Error</error>");

			RESPONSE.reset({statusCode: 515}, Response.CONTENT_TYPE.XML);

			expect(RESPONSE.getStatusCode()).to.equal(515);
			expect(RESPONSE.getHeaders()).to.deep.equal({ "Content-Type": "application/xml" });
			expect(RESPONSE.getBody()).to.equal("<?xml version=\"1.0\" encoding=\"UTF-8\" ?><error>Internal Server Error</error>");
		});

		it("Set Response to TEXT through constructor", () => {
			const REQ = new ClientRequest(testEventA, testContextA);
			const RESPONSE = new Response(REQ, {}, Response.CONTENT_TYPE.TEXT);

			RESPONSE.reset({statusCode: 200}, Response.CONTENT_TYPE.TEXT);

			expect(RESPONSE.getStatusCode()).to.equal(200);
			expect(RESPONSE.getHeaders()).to.deep.equal({ "Content-Type": "text/plain" });
			expect(RESPONSE.getBody()).to.equal("Success");

			RESPONSE.reset({statusCode: 404}, Response.CONTENT_TYPE.TEXT);

			expect(RESPONSE.getStatusCode()).to.equal(404);
			expect(RESPONSE.getHeaders()).to.deep.equal({ "Content-Type": "text/plain" });
			expect(RESPONSE.getBody()).to.equal("Not Found");

			RESPONSE.reset({statusCode: 500}, Response.CONTENT_TYPE.TEXT);

			expect(RESPONSE.getStatusCode()).to.equal(500);
			expect(RESPONSE.getHeaders()).to.deep.equal({ "Content-Type": "text/plain" });
			expect(RESPONSE.getBody()).to.equal("Internal Server Error");

			RESPONSE.reset({statusCode: 515}, Response.CONTENT_TYPE.TEXT);

			expect(RESPONSE.getStatusCode()).to.equal(515);
			expect(RESPONSE.getHeaders()).to.deep.equal({ "Content-Type": "text/plain" });
			expect(RESPONSE.getBody()).to.equal("Internal Server Error");
		});

	});

	describe("Test Constructor", () => {
		it("Set Generic Status Default (JSON)", () => {

			const REQ = new ClientRequest(testEventA, testContextA);
			const RESPONSE = new Response(REQ, {statusCode: 500});

			expect(RESPONSE.getStatusCode()).to.equal(500);
			expect(RESPONSE.getHeaders()).to.deep.equal({ "Content-Type": "application/json" });
			expect(RESPONSE.getBody()).to.deep.equal({ "message": "Internal Server Error" });

			const RESPONSE2 = new Response(REQ, {statusCode: 200});
			expect(RESPONSE2.getStatusCode()).to.equal(200);
			expect(RESPONSE2.getHeaders()).to.deep.equal({ "X-Custom-Header": "Custom Value", "Content-Type": "application/json" });
			expect(RESPONSE2.getBody()).to.deep.equal({ "message": "Hello World" });

			const RESPONSE3 = new Response(REQ, {statusCode: 404});
			expect(RESPONSE3.getStatusCode()).to.equal(404);
			expect(RESPONSE3.getHeaders()).to.deep.equal({ "Content-Type": "application/json" });
			expect(RESPONSE3.getBody()).to.deep.equal({ "message": "Not Found" });
		})

		it("Reset response (JSON)", () => {

			const REQ = new ClientRequest(testEventA, testContextA);
			const RESPONSE = new Response(REQ);

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

			const REQ = new ClientRequest(testEventA, testContextA);
			const RESPONSE = new Response(REQ, {}, Response.CONTENT_TYPE.HTML);

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

			const REQ = new ClientRequest(testEventA, testContextA);

			const obj = {
				statusCode: 200,
				headers: { "X-Api-Header": "MyAPI-World" },
				body: { "message": "Hello Saturn!" }
			}
			const RESPONSE = new Response(REQ, obj);

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
		
			const REQ = new ClientRequest(testEventA, testContextA);
			const RESPONSE = new Response(REQ);
		
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

