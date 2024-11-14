exports.testContextA = {
    // Function info
    functionName: 'test-function',
    functionVersion: '$LATEST',
    invokedFunctionArn: 'arn:aws:lambda:us-east-1:123456789012:function:test-function',
    memoryLimitInMB: '128',
    awsRequestId: '123456-7890-1234-5678-12345678',
    logGroupName: '/aws/lambda/test-function',
    logStreamName: '2024/01/01/[$LATEST]123456789',
    
    // Identity info (for mobile apps)
    identity: null,
    clientContext: null,

    // Methods
    getRemainingTimeInMillis: () => 1000,
    done: (error, result) => {},
    fail: (error) => {},
    succeed: (result) => {},

    // Callback
    callbackWaitsForEmptyEventLoop: true
};
