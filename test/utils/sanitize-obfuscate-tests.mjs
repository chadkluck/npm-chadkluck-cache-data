import { expect } from 'chai';
import { obfuscate, sanitize, DebugAndLog } from '../../src/lib/tools/index.js'

import sinon from 'sinon';

describe("Sanitize and Obfuscate", () => {

	describe("Obfuscate", () => {
		it("Obfuscate Default", async () => {
			let str = "ThisIsMyExample12345678";
		
			expect(obfuscate(str)).to.equal('******5678')
		});

		it("Obfuscate Pad Character", async () => {
			let str = "ThisIsMyExample12345678";
			let opt = {char: 'X' };
		
			expect(obfuscate(str, opt)).to.equal('XXXXXX5678')
		});

		it("Obfuscate Keep", async () => {
			let str = "ThisIsMyExample12345679";
			let opt = {keep: 6 };
		
			expect(obfuscate(str, opt)).to.equal('****345679')
		});

		it("Obfuscate Keep Upper Limit", async () => {
			let str = "ThisIsMyExample12345678";
			let opt = {keep: 8 };
		
			expect(obfuscate(str, opt)).to.equal('****345678')
		});

		it("Obfuscate Keep Lower Limit", async () => {
			let str = "1234";
			let opt = {keep: 8 };
		
			expect(obfuscate(str, opt)).to.equal('*********4')
		});

		it("Obfuscate Set Size", async () => {
			let str = "1234567890123456789";
			let opt = {keep: 4, len: 16 };
		
			expect(obfuscate(str, opt)).to.equal('************6789')
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
			
			let o = sanitize(obj);
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

			let o = sanitize(obj);

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

			let o = sanitize(obj).urls;

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

			let o = sanitize(obj).headers;

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

			let o = sanitize(obj).multiValueHeaders;
			
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

		let logStub, warnStub, errorStub;

		beforeEach(() => {
			logStub = sinon.stub(console, 'log');
			warnStub = sinon.stub(console, 'warn');
			errorStub = sinon.stub(console, 'error');
		});

		afterEach(() => {
			logStub.restore();
			warnStub.restore();
			errorStub.restore();
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
			await DebugAndLog.log("My Object", "LOG", obj);

			// Verify that log was actually called
			expect(logStub.called).to.be.true;

			// Get all calls and their arguments
			const calls = logStub.getCalls();
			expect(calls.length).to.be.greaterThan(0, "Expected at least one log call");

			// Get the log output from the first call
			const logOutput = calls[0].args.join(' ')
				.replace(/\u001b\[\d+m/g, '') // remove colorization of console text
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

			DebugAndLog.warn("My Object", obj);

			expect(warnStub.called).to.be.true;
			
			// Get the warning output and remove ANSI color codes
			const warnOutput = warnStub.firstCall.args
				.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : arg)
				.join(' ')
				.replace(/\u001b\[\d+m/g, '') // remove colorization of console text
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

			DebugAndLog.error("My Object", obj);

			expect(errorStub.called).to.be.true;
			
			// Get the error output and remove ANSI color codes
			const errorOutput = errorStub.firstCall.args
				.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : arg)
				.join(' ')
				.replace(/\u001b\[\d+m/g, '') // remove colorization of console text
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