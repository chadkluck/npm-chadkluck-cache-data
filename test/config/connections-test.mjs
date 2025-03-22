import { expect } from 'chai';

import { Connection, ConnectionAuthentication, Connections } from '../../src/lib/tools/index.mjs';

describe("Test Connection, Connections, and ConnectionAuthentication Classes", () => {
	describe("Test Connection Class", () => {
		it('toString with defaults', () => {
			let conn = new Connection({
				host: 'api.chadkluck.net',
				path: '/games/'
			})

			expect(conn.toString()).to.equal("null null null://api.chadkluck.net/games/")
	
		})
	})
 })