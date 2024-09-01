console.log('DIDWEB')
class Service {
	
	constructor() {
		this.name = 'didweb_admin';
		this.global = null; // filled by Global on service registration
		
		this.adminserver = null;
	}
	
	loadService() {
		this.global.log('loadService called for service ' + this.name);
		
	}

	// optional  service functions
	registerHooks() {
		console.log('registerHooks called for ' + this.name);
		
		var global = this.global;
		
		global.registerHook('postInitServer_asynchook', this.name, this.postInitServer_asynchook);

		global.registerHook('start_admin_ui_hook', this.name, this.start_admin_ui_hook);
	}	

	//
	// hooks
	//
	async postInitServer_asynchook(result, params) {
		var global = this.global;

		global.log('postInitServer_asynchook called for ' + this.name);

		result.push({service: this.name, handled: true});
		
		return true;
	}

	async start_admin_ui_hook(result, params) {
		var global = this.global;

		global.log('start_admin_ui_hook called for ' + this.name);

		const app = global.getServiceInstance('ethereum_webapp').getWebApp();
		
		this.startAdminUI(app);

		result.push({service: this.name, handled: true});
		
		return true;
	}

	startAdminUI(app) {
		var global = this.global;
		
		let bStartNoAdminUI = global.getConfigValue('start_no_admin_ui');
	
		if (bStartNoAdminUI !== true)
		return; // we do not overload

		global.log('startAdminUI called for ' + this.name);

		const express = require('express');
		const path = require('path');

		const adminapproot = '../../../app/admin'
		const adminappxtraroot = '../../../app-xtra/admin'
		
		var AdminRoutes = require( adminappxtraroot + '/routes/adminroutes.js');
		var adminroutes = new AdminRoutes(global);

		app.delete('/admin');

		// static files (we overload ethereum_webapp /admin)
		app.use('/admin/public/', express.static(path.join(__dirname,  adminappxtraroot + '/public')));

		// view engine setup
		app.set('views', path.join(__dirname,  adminapproot + '/views'));
		app.set('view engine', 'pug');

		app.use('/admin', adminroutes.router());

	}


}

module.exports = Service;