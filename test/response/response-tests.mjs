import sinon from 'sinon';
import { expect } from 'chai';
import { Response, ClientRequest } from '../../src/lib/tools/index.js';
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
