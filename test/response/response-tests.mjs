import sinon from 'sinon';
import { expect } from 'chai';
import { Response, ClientRequest, jsonGenericResponse, xmlGenericResponse, rssGenericResponse, textGenericResponse, htmlGenericResponse } from '../../src/lib/tools/index.js';
import { testEventA } from '../helpers/test-event.js';
import { testContextA } from '../helpers/test-context.js';
import { testValidationsA } from '../helpers/test-validations.js';

describe("Response Class", () => {
    // Create a fresh copy of test event for each test
    let REQ;
    let options;
    let logStub;

    ClientRequest.init( { validations: testValidationsA });

    beforeEach(() => {
        // Ensure any previous stubs are cleaned up
        if (logStub) {
            logStub.restore();
        }
        sinon.restore();

        logStub = sinon.stub(console, 'log');

        options = {
            jsonResponses: {
                response200: {
                    statusCode: 200,
                    headers: { "X-Custom-Header": "Custom Value" },
                    body: { message: "Hello World" }
                }
            },
            htmlResponses: {
                response200: {
                    statusCode: 200,
                    headers: { "X-Custom-Header": "Custom Value HTML" },
                    body: "<html><head><title>Hello</title></head><body><h1>Hello World</h1></body></html>"
                }
            },
            settings: {
                errorExpirationInSeconds: 422,
                routeExpirationInSeconds: 922
            }
        };

        // Initialize with fresh options for each test
        Response.init(options);
        REQ = new ClientRequest(testEventA, testContextA);
    });

    afterEach(() => {
        // Clean up after each test
        REQ = null;
        logStub.restore();  // Restore console.log
        sinon.restore();
    });
    
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
    });

	describe("Set response with an object then update portions of the response (JSON)", () => {
		it("Test set and add methods", () => {

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
});

describe("Response Class Finalize", () => {
    // Create a fresh copy of test event for each test
    let REQ;
    let options;
    let logStub;

    ClientRequest.init( { validations: testValidationsA });

    beforeEach(() => {
        // Ensure any previous stubs are cleaned up
        if (logStub) {
            logStub.restore();
        }
        sinon.restore();

        logStub = sinon.stub(console, 'log');

        options = {
            jsonResponses: {
                response200: {
                    statusCode: 200,
                    headers: { "X-Custom-Header": "Custom Value" },
                    body: { message: "Hello World" }
                }
            },
            htmlResponses: {
                response200: {
                    statusCode: 200,
                    headers: { "X-Custom-Header": "Custom Value HTML" },
                    body: "<html><head><title>Hello</title></head><body><h1>Hello World</h1></body></html>"
                }
            },
            settings: {
                errorExpirationInSeconds: 422,
                routeExpirationInSeconds: 922
            }
        };

        // Initialize with fresh options for each test
        Response.init(options);
        REQ = new ClientRequest(testEventA, testContextA);
    });

    afterEach(() => {
        // Clean up after each test
        REQ = null;
        logStub.restore();  // Restore console.log
        sinon.restore();
    });
    
    describe("Test finalize and log", () => {
        it("Test finalize and log", () => {
            
            const RESPONSE = new Response(REQ);
            const resp = RESPONSE.finalize();

            expect(resp.statusCode).to.equal(200);
            expect(resp.headers['Cache-Control']).to.equal("max-age=922");
            expect(resp.headers['Content-Type']).to.equal("application/json");
            expect(resp.headers['X-Custom-Header']).to.equal("Custom Value");
            expect(resp.headers['x-exec-ms']).to.equal(`${REQ.getFinalExecutionTime()}`);

            const expectedLogMessage = `[RESPONSE] 200 | 25 | JSON | ${REQ.getFinalExecutionTime()} | 192.168.100.1 | Mozilla/5.0 | - | https://internal.example.com/dev | GET:employees/{employeeId}/profile | format=detailed&include=contact,department&version=2 | - | - | -`;
            
            // For debugging
            if (logStub.getCall(0)?.args[0] !== expectedLogMessage) {
                console.error('Expected:', expectedLogMessage);
                console.error('Actual:', logStub.getCall(0)?.args[0]);
                console.error('Difference at:', findDifference(expectedLogMessage, logStub.getCall(0)?.args[0]));
            }

            expect(logStub.getCall(0).args[0]).to.equal(expectedLogMessage);
            
        });
    });

});

// Helper function to find string differences
function findDifference(str1, str2) {
    let i = 0;
    while (i < str1.length && i < str2.length) {
        if (str1[i] !== str2[i]) {
            return `Position ${i}: '${str1.substr(i-5, 10)}' vs '${str2.substr(i-5, 10)}'`;
        }
        i++;
    }
    if (str1.length !== str2.length) {
        return `Length difference: ${str1.length} vs ${str2.length}`;
    }
    return 'No difference found';
}
