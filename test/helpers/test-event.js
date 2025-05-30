function deepFreeze(object) {
    // Retrieve the property names defined on object
    const propNames = Object.getOwnPropertyNames(object);

    // Freeze properties before freezing self
    propNames.forEach(name => {
        const value = object[name];

        if (value && typeof value === "object") {
            deepFreeze(value);
        }
    });

    return Object.freeze(object);
}

exports.testEventA = deepFreeze({
	resource: "/employees/{employeeId}/profile",
	path: "/employees/12345/profile",
	httpMethod: "GET",
	headers: {
		Accept: "application/json",
		Host: "api.example.com",
		"User-Agent": "Mozilla/5.0",
		"X-ClientRequest-ID": "c6af9ac6-7b61-11e6-9a41-93e8deadbeef",
		Referer: "https://internal.example.com/dev"
	},
	pathParameters: {
		employeeId: "12345"
	},
	queryStringParameters: {
		include: "contact,department",
		format: "detailed",
		version: "2"
	},
	requestContext: {
		accountId: "123456789012",
		resourceId: "abc123",
		stage: "prod",
		requestId: "c6af9ac6-7b61-11e6-9a41-93e8deadbeef",
		identity: {
			cognitoIdentityPoolId: null,
			accountId: null,
			cognitoIdentityId: null,
			caller: null,
			apiKey: "",
			sourceIp: "192.168.100.1",
			accessKey: null,
			cognitoAuthenticationType: null,
			cognitoAuthenticationProvider: null,
			userArn: null,
			userAgent: "Mozilla/5.0",
			user: null
		},
		resourcePath: "/employees/{employeeId}/profile",
		httpMethod: "GET",
		apiId: "1234567890"
	},
	body: null,
	isBase64Encoded: false
});
