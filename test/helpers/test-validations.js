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

exports.testValidationsA = deepFreeze( {
	referrers: [
		'example.com',
		'acme.com'
	],
	parameters: {
		pathParameters: {
			employeeId: (employeeId) => {
				// must be a 5 character string containing only numbers
				if (!/^\d{5}$/.test(employeeId)) return false;
				return true;
			}
		},
		queryStringParameters: {
			// "include": "contact,department",
			// "format": "detailed",
			// "version": "2"
			include: (include) => {
				// can be a comma delimited list of contact or department
				const VALID_VALUES = new Set(['contact', 'department']);

				function isValidInclude(include) {
					const parts = include.split(',');
					
					// Check if we have 1 or 2 parts only
					if (parts.length === 0 || parts.length > 2) return false;
					
					// Check if all parts are valid and unique
					const uniqueParts = new Set(parts);
					if (uniqueParts.size !== parts.length) return false; // Check for duplicates
					
					return parts.every(part => VALID_VALUES.has(part));
				}
				
				if (!isValidInclude(include)) return false;
				return true;
			},
			format: (format) => {
				if (!/^(detailed|simple)$/.test(format)) return false;
				return true;
			},
			version: (version) => {
				if (!/^(1|2)$/.test(version)) return false;
				return true;
			}
		},
		headerParameters: {
			userAgent: (userAgent) => {
				if (typeof userAgent !== 'string') return false;
				return true;
			}
		}
	}
});