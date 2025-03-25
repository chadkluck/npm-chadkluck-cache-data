import sinon from 'sinon';
import { expect } from 'chai';

import { Response, ClientRequest, htmlGenericResponse } from '../../src/lib/tools/index.js';


import { testEventA } from '../helpers/test-event.js';
import {testContextA} from '../helpers/test-context.js';

describe("Response Class", () => {


	let REQ;
	let options;

	beforeEach(() => {
		options = {
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

		REQ = new ClientRequest(testEventA, testContextA);
		Response.init(options);
	})

	afterEach(() => {
		REQ = null;
	})

	describe("Test Response Class Generic Classes", () => {

		it("Use a combo of Generic and Custom JSON responses", () => {

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

})