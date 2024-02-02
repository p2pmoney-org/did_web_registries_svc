class Service {
	
	constructor() {
		this.name = 'did-registries';
		
		this.global = null;

		this.current_version = "0.40.36.2023.11.22";
	}

	loadService() {
		this.global.log('loadService called for service ' + this.name);

	}
	
	// optional  service functions
	registerHooks() {
		console.log('registerHooks called for ' + this.name);

		var global = this.global;

		// start
		global.registerHook('registerRoutes_hook', this.name, this.registerRoutes_hook);
	}
	
	
	//
	// hooks
	//
	registerRoutes_hook(result, params) {
		var global = this.global;

		global.log('registerRoutes_hook called for ' + this.name);
		
		var app = params[0];
		var global = params[1];
		
		//
		// Verifiable Credentials routes
		//
		var RegistriesRoutes = require( './routes/routes.js');
		
		var registriesroutes = new RegistriesRoutes(app, global);
		
		registriesroutes.registerRoutes();
		
		result.push({service: this.name, handled: true});
	}

	//
	// functions
	//

	getAuthorizationServerInstance() {
		if (this.authorizationserverinstance)
			return this.authorizationserverinstance;
		
		var AuthorizationServer = require('./model/authorization-server.js');
		
		this.authorizationserverinstance = new AuthorizationServer(this);
		
		return this.authorizationserverinstance;
	}

	getDidRegistriesServerInstance() {
		if (this.didregistriesserverinstance)
			return this.didregistriesserverinstance;
		
		var DidRegistriesServer = require('./model/didregistries-server.js');
		
		this.didregistriesserverinstance = new DidRegistriesServer(this);
		
		return this.didregistriesserverinstance;
	}

	getSigningAlgorithms() {
		return ['ES256'];
	}

}



module.exports = Service;
