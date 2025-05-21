let server = require("../StreamAMGApp");
let chai = require("chai");
let chaiHttp = require("chai-http");

chai.should();
chai.use(chaiHttp);

describe("StreamAMGApp API Testing", () => {
	it("Test homepage response", (done) => {
		chai.request(server)
			.get("/")
			.end((err, response) => {
				response.should.have.status(200);
				response.text.should.be.eql('StreamAMGApp v1.3.0');
				done();
			});
	});
});