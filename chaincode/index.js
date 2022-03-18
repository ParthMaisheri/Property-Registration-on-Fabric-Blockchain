'use strict';
//Module for Users 
const usercontract = require('./user-contract.js');

//Module for Registrar 
const registrarcontract = require('./registrar-contract.js');

//Export the contracts
module.exports.contracts = [usercontract, registrarcontract];