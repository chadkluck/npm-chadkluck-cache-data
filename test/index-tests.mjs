import { nodeVer, nodeVerMajor, AWS } from '../src/lib/tools/index.js';

console.log(`Testing Against Node version ${nodeVerMajor} (${nodeVer})`);
if (nodeVerMajor < 16) {
	console.log("Node version is too low, skipping tests");
	process.exit(0);
}
if (nodeVerMajor < 18) {
	console.warn("Lambda running Node v16 or less will use AWS-SDK v2. Upgrade your Lambda function to use Node v18 or higher so that AWS-SDK v3 may be used. @chadkluck/cache-data will still work under Node 16/AWS-SDK v2, but you will receive warnings about upgrading AWS-SDK to v3");
}

console.log(`Node ${AWS.NODE_VER} MAJOR ${AWS.NODE_VER_MAJOR} MINOR ${AWS.NODE_VER_MINOR} PATCH ${AWS.NODE_VER_PATCH} MAJOR MINOR ${AWS.NODE_VER_MAJOR_MINOR} SDK ${AWS.SDK_VER} REGION ${AWS.REGION} V2 ${AWS.SDK_V2} V3 ${AWS.SDK_V3}`, AWS.nodeVersionArray);
console.log(`AWS.INFO`, AWS.INFO);
