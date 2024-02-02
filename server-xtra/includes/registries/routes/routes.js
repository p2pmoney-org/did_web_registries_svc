class RegistriesRoutes {
	
	constructor(app, global) {
		this.app = app;
		this.global = global;
		
		var registriesservice = global.getServiceInstance('did-registries');
		
		registriesservice.routes = this; // keep this referenced to stay in memory
		
		var RegistriesControllers = require('../controllers/controllers.js');
		
		this.controllers = new RegistriesControllers(global);
	}
	
	registerRoutes() {
		var app = this.app;
		var global = this.global;
		
		var controllers = this.controllers;
		
		global.log('RegistriesRoutes.registerRoutes called')
		
		var route_root_path = global.route_root_path + '/registries';


		/**********************************************************************
		 *                                                                    *
		 *     served by rest subdomain https://rest-api.example.com          *
		 *                                                                    *
		 **********************************************************************/


		//
		// Service functions
		//


		app.route(route_root_path + '/')
		.get(function(req, res) { controllers.root(req, res); });
		
		// server level
		app.route(route_root_path + '/version')
		.get(function(req, res) { controllers.version(req, res); });
		
		app.route(route_root_path + '/server')
		.get(function(req, res) { controllers.server(req, res); });

		//
		// configuration endpoints

		// for openid
		app.route(route_root_path + '/.well-known/openid-configuration')
		.get(function(req, res) { controllers.openid_configuration(req, res); });

		// for registry
		app.route(route_root_path + '/.well-known/registries-configuration')
		.get(function(req, res) { controllers.registries_configuration(req, res); });

		// for did:web read
		app.route(route_root_path + '/.well-known/did.json')
		.get(function(req, res) { controllers.root_did_key_document(req, res); });

		//
		// authorization

		// siop session
		app.route(route_root_path + '/authorization/authentication-requests')
		.post(function(req, res) { controllers.authorization_authentication_requests(req, res); });
		
		app.route(route_root_path + '/authorization/siop-sessions')
		.post(function(req, res) { controllers.authorization_siop_sessions(req, res); });

		//
		// did:web create, update, deactivate
		app.route(route_root_path + '/dids')
		.get(function(req, res) { controllers.did_web_list(req, res); });

		app.route(route_root_path + '/did')
		.post(function(req, res) { controllers.did_web(req, res); });
		app.route(route_root_path + '/did/create')
		.post(function(req, res) { controllers.did_web_create(req, res); });
		app.route(route_root_path + '/did/update')
		.post(function(req, res) { controllers.did_web_update(req, res); });
		app.route(route_root_path + '/did/deactivate')
		.post(function(req, res) { controllers.did_web_deactivate(req, res); });


		//
		// registry functions
		//

		//
		// identifiers (did & documents)
		app.route(route_root_path + '/did/identifiers')
		.get(function(req, res) { controllers.did_registry_identifiers(req, res); });

		app.route(route_root_path + '/did/identifiers/:did')
		.get(function(req, res) { controllers.did_registry_did_document(req, res); });

		// identifier attributes
		app.route(route_root_path + '/did/identifiers/:did/attributes')
		.get(function(req, res) { controllers.did_registry_identifier_attributes(req, res); });
		app.route(route_root_path + '/did/identifiers/:did/attribute/add')
		.post(function(req, res) { controllers.did_registry_identifier_attribute_add(req, res); });
		app.route(route_root_path + '/did/identifiers/:did/attribute/deactivate')
		.post(function(req, res) { controllers.did_registry_identifier_attribute_deactivate(req, res); });

		// trust chain
		app.route(route_root_path + '/did/trust_chain/:did')
		.get(function(req, res) { controllers.did_trust_chain(req, res); });


		//
		// issuers
		app.route(route_root_path + '/did/issuers')
		.get(function(req, res) { controllers.did_registry_issuers(req, res); });

		app.route(route_root_path + '/did/issuers/:did')
		.get(function(req, res) { controllers.did_registry_issuer(req, res); });

		app.route(route_root_path + '/did/issuer/create')
		.post(function(req, res) { controllers.did_issuer_create(req, res); });
		app.route(route_root_path + '/did/issuer/update')
		.post(function(req, res) { controllers.did_issuer_update(req, res); });
		app.route(route_root_path + '/did/issuer/deactivate')
		.post(function(req, res) { controllers.did_issuer_deactivate(req, res); });

		//
		// credentials
		app.route(route_root_path + '/issuer/credential/status/history')
		.post(function(req, res) { controllers.issuer_credential_status_history(req, res); });
		app.route(route_root_path + '/issuer/credential/status/modifications/list')
		.post(function(req, res) { controllers.issuer_credential_status_modifications_list(req, res); });
		app.route(route_root_path + '/issuer/credential/revoke')
		.post(function(req, res) { controllers.issuer_credential_revoke(req, res); });
		app.route(route_root_path + '/issuer/credential/enact')
		.post(function(req, res) { controllers.issuer_credential_enact(req, res); });

		/**********************************************************************
		 *                                                                    *
		 *     served by specific subdomain https://mydidweb.example.com      *
		 *                                                                    *
		 **********************************************************************/

		//
		// did:web read
		app.route(route_root_path + '/didweb/*')
		.get(function(req, res) { controllers.did_web_document(req, res); });


	}
	
	
}

module.exports = RegistriesRoutes;