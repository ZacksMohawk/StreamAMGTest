let server = require("../MessageConsumer");
let chai = require("chai");
let chaiHttp = require("chai-http");

chai.should();
chai.use(chaiHttp);

describe("MessageConsumer API Testing", () => {
	it("Test homepage response", (done) => {
		chai.request(server)
			.get("/")
			.end((err, response) => {
				response.should.have.status(200);
				response.text.should.be.eql('MessageConsumer v1.0.0');
				done();
			});
	});
});