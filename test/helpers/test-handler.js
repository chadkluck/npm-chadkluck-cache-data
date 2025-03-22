const { ClientRequest, Response } = require("../../src/lib/tools");

exports.handler = function( event, context, callback ) {

    const req = new ClientRequest(event, context);

    const resp = new Response(req, {statusCode: 200, headers: {}, body: "hello!"});

    callback( null, resp.finalize() );
}