class AdminControllers {
	constructor(global) {
		this.global = global;
		
		var AdminControllers = require('../../../app/admin/controllers/admincontrollers.js');
		this.core_controllers = new AdminControllers(global);

	}
	
	async get_index(req, res, next) {
		var global = this.global;

		return this.core_controllers.get_index(req, res, next)
	}

	async post_index(req, res, next) {
		var global = this.global;
		
		return this.core_controllers.post_index(req, res, next)
	}

}

module.exports = AdminControllers;
