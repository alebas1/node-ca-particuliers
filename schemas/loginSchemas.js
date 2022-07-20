const { usernameSchema, passwordSchema, regionSchema } = require('./schemas');

const loginValidators = {
    ...usernameSchema,
    ...passwordSchema,
    ...regionSchema
}

module.exports = loginValidators;