const usernameSchema = {
    username: {
        isString: true,
        isLength: {
            options: {min: 11, max: 11},
            errorMessage: 'Username must be 11 characters long'
        },
        isNumeric: true,
    },
}

const passwordSchema = {
    password: {
        isString: true,
        isLength: {
            options: {min: 6, max: 6},
            errorMessage: 'Password must be 6 characters long'
        },
        isNumeric: true,
    },
}

const regionSchema = {
    region: {
        isString: true,
        isAlpha: true,
    }
}

module.exports = {
    usernameSchema,
    passwordSchema,
    regionSchema
}