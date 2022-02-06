
const { tools, cache, endpoint } = require('../src/index.js');

const chai = require("chai")
const chaiHttp = require("chai-http")
const expect = chai.expect
chai.use(chaiHttp)

describe("GET games", () => {

	it("should return status 200", async () => {
    	let res = await chai
        	.request('https://api.chadkluck.net')
        	.get('/games/')
       
    	expect(res.status).to.equal(200)
       
	});

});