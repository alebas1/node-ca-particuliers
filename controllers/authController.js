const { validationResult } = require("express-validator");
const Authenticator = require("../authenticator");

const login = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).json({ errors: errors.array() });
    }

    const body = req.body;
    const session = await Authenticator.createSession(body.username, body.password, body.region);

    res.json(session);
}

module.exports = { login };