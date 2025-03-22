import { expect } from 'chai';
import { DebugAndLog } from '../../src/lib/tools/index.js'

import sinon from 'sinon';

describe("DebugAndLog tests", () => {

	describe('Check the defaults', () => {
		it('Check the default log level', async () => {
			expect(DebugAndLog.getLogLevel()).to.equal(0)
		})

		it('Get the default environment', async () => {
			expect(DebugAndLog.getEnv()).to.equal("PROD")
		})
	});

	describe('Check environment booleans', () => {
		it('Check isNotProduction', async () => {
			expect(DebugAndLog.isNotProduction()).to.equal(false)
		})

		it('Check isProduction', async () => {
			expect(DebugAndLog.isProduction()).to.equal(true)
		})

		it('Check isDevelopment', async () => {
			expect(DebugAndLog.isDevelopment()).to.equal(false)
		})

		it('Check isTest', async () => {
			expect(DebugAndLog.isTest()).to.equal(false)
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
			DebugAndLog.log("1. Test Foo");
			DebugAndLog.log("2. Test Bar");
			DebugAndLog.warn("3. Test warn");
			DebugAndLog.error("4. Test error");
			DebugAndLog.debug("5. Test Debug");
			DebugAndLog.message("6. Test Info");
			DebugAndLog.diag("7. Test diagnostics");

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
