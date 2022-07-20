const express = require('express');
const router = express.Router();
const { checkSchema } = require("express-validator");

const authController = require('../controllers/authController');
const loginValidators = require('../schemas/loginSchemas');

router.post('/login', checkSchema(loginValidators), authController.login);

module.exports = router;