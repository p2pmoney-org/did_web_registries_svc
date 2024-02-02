'use strict';

class AdminRoutes {
	constructor(global) {
		this.global = global;
		
		var AdminControllers = require('../controllers/admincontrollers.js');
		this.controllers = new AdminControllers(global);
	}
	
	router() {
		var express = require('express');
		var router = express.Router();
		
		var controllers = this.controllers;
		
		router.get('/', function(req, res, next) { return controllers.get_index(req, res, next);});
		router.post('/', function(req, res, next) { return controllers.post_index(req, res, next);});
		
		return router;
	}
	
}

module.exports = AdminRoutes;
