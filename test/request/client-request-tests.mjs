import { expect } from 'chai';
import { ClientRequest } from '../../src/lib/tools/index.js';

import testEventA from '../helpers/test-event-a.json' with { type: 'json' };
import {testContextA} from '../helpers/test-context.js';

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

	ClientRequest.init( {validations: validations} );

	describe("Initialize ClientRequest Class", () => {
		it("Set Options during initialization and check values", () => {
			
			// Check the referrer list
			expect(ClientRequest.getReferrerWhiteList().length).to.equal(2);

			// make sure the white list does not contain '*'
			expect(ClientRequest.getReferrerWhiteList().indexOf('*')).to.equal(-1);

			// make sure the white list contains 'example.com'
			expect(ClientRequest.getReferrerWhiteList().indexOf('example.com')).to.not.equal(-1);

			// make sure the white list contains 'acme.com'
			expect(ClientRequest.getReferrerWhiteList().indexOf('acme.com')).to.not.equal(-1);

			// get the validation functions for path parameters and check employee id
			expect(ClientRequest.getParameterValidations().pathParameters.employeeId('12345')).to.equal(true);

			// check invalid employee id
			expect(ClientRequest.getParameterValidations().pathParameters.employeeId('1234')).to.equal(false);

			// check valid querystring parameter 'include'
			expect(ClientRequest.getParameterValidations().queryStringParameters.include('contact,department')).to.equal(true);

			// check invalid querystring parameter 'include'
			expect(ClientRequest.getParameterValidations().queryStringParameters.include('dept')).to.equal(false);

			// check valid querystring parameter 'format'
			expect(ClientRequest.getParameterValidations().queryStringParameters.format('detailed')).to.equal(true);

			// check invalid querystring parameter 'format'
			expect(ClientRequest.getParameterValidations().queryStringParameters.format('invalid')).to.equal(false);

		});

		it("Check client information against test event", () => {
			
			const REQ = new ClientRequest(testEventA, testContextA);
			expect(REQ.getClientUserAgent()).to.equal('Mozilla/5.0');
			expect(REQ.getClientIp()).to.equal('192.168.100.1');
			expect(REQ.getClientReferer(true)).to.equal('https://internal.example.com/dev');
			expect(REQ.getClientReferer(false)).to.equal('internal.example.com');
			expect(REQ.getClientReferer()).to.equal('internal.example.com');
		})

		it("Test Props against test event", () => {
			const REQ = new ClientRequest(testEventA, testContextA);
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
			const REQ = new ClientRequest(testEventA, testContextA);
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
