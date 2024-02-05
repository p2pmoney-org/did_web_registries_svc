/**
 * 
 */
'use strict';


class RegistriesControllers {
	
	constructor(global) {
		this.global = global;
	}


	_parseAccessTokenFromRequests(req) {
		let headers = req.headers;
		let authorization = headers.authorization;

		let access_token;

		if (authorization && authorization.startsWith('Bearer')) {
			// remove 'Bearer'
			let _token = authorization.replace('Bearer', '');

			access_token = _token.trim();
		}

		return access_token;
	}

	//
	// Service functions
	//

	async root(req, res) {
		// GET
		var jsonresult;
		
		var global = this.global;
		
		try {
			var verifiablecredentialinfo = {};
			
			var now = new Date();
			var nowstring = global.formatDate(now, 'YYYY-mm-dd HH:MM:SS');
			
			verifiablecredentialinfo.servertime = nowstring;
			
			jsonresult = {status: 1, data: verifiablecredentialinfo};
		}
		catch(e) {
			global.log("exception in RegistriesControllers.root: " + e);
			
			jsonresult = {status: 0, error: "could not retrieve information"};
		}

		
		res.json(jsonresult);
	}

	async version(req, res) {
		// GET
		var global = this.global;
		
		var now = new Date();
		var nowstring = global.formatDate(now, 'YYYY-mm-dd HH:MM:SS');
		
		var verifiablecredentialsservice = global.getServiceInstance('did-registries');
		
		var version = (verifiablecredentialsservice ? (verifiablecredentialsservice.current_version ? verifiablecredentialsservice.current_version : global.getCurrentVersion()) : null);
		var versioninfo = global.getVersionInfo();
		
		var jsonresult = {status: 1, version:  version, versioninfo: versioninfo, servertime: nowstring};
		
		res.json(jsonresult);
	}


	// server
	async server(req, res) {
		// GET
		var global = this.global;

		var jsonresult;
		
		try {
			var registriesservice = global.getServiceInstance('did-registries');

			var verifiablecredentialinfo = await registriesservice.getRegisitriesServerInfo();
			
			jsonresult = {status: 1, data: verifiablecredentialinfo};
			
		}
		catch(e) {
			global.log("exception in RegistriesControllers.server: " + e);
			
			jsonresult = {status: 0, error: "could not retrieve information"};
		}

		
		res.json(jsonresult);
	}


	//
	// configuration endpoints

	// openid
	async openid_configuration(req, res) {
		// GET
		var global = this.global;

		global.log("openid_configuration called");

		var jsonresult
		
		try {
			var didregistriesservice = global.getServiceInstance('did-registries');

			let authorizationserver = didregistriesservice.getAuthorizationServerInstance();
			
			let options ={};
			jsonresult = await authorizationserver.openid_configuration(options);
		}
		catch(e) {
			global.log("exception in VerifiableCredentialsControllers.openid_configuration: " + e);
			
			jsonresult = {status: 0, error: "could not retrieve information"};
		}

		res.json(jsonresult);
	}
	
	
	// for registry
	async registries_configuration(req, res) {
		// GET
		var global = this.global;

		let current_host = req.headers.host

		global.log("registries_configuration called");

		var jsonresult
		
		try {
			var didregistriesservice = global.getServiceInstance('did-registries');

			let didregistriesserver = didregistriesservice.getDidRegistriesServerInstance();
			
			let options = {current_host};
			jsonresult = await didregistriesserver.registries_configuration(options);
		}
		catch(e) {
			global.log("exception in VerifiableCredentialsControllers.registries_configuration: " + e);
			
			jsonresult = {status: 0, error: "could not retrieve information"};
		}

		res.json(jsonresult);
	}

	// .well-known/did.json
	async root_did_key_document(req, res) {
		// GET
		var global = this.global;

		global.log("root_did_key_document called");

		let key = req.params.key;


		var jsonresult
		
		try {
			var didregistriesservice = global.getServiceInstance('did-registries');
			let didregistriesserver = didregistriesservice.getDidRegistriesServerInstance();
			
			let options = {key};
			jsonresult = await didregistriesserver.root_did_key_document(options);
		}
		catch(e) {
			global.log("exception in RegistriesControllers.root_did_key_document: " + e);
			
			jsonresult = {status: 0, error: "could not retrieve information"};
		}

		res.json(jsonresult);
	}


	//
	// authorization

	async authorization_authentication_requests(req, res) {
		// POST
		var global = this.global;
		var sessionuuid = req.get("sessiontoken");

		global.log("authorization_authentication_requests called for sessiontoken " + sessionuuid);

		var jsonresult;
		var responseURL;

		var scope = (typeof req.query.scope !== 'undefined' ? req.query.scope : 'openid');


		try {
			var commonservice = global.getServiceInstance('common');
			var Session = commonservice.Session;

			var session_section = Session.openSessionSection(global, sessionuuid, 'authorization_authentication_requests');
			var session = await session_section.getSessionAsync();

			var didregistriesservice = global.getServiceInstance('did-registries');

			let authorizationserver = didregistriesservice.getAuthorizationServerInstance();

			let options = {};
			let params = {scope};

			jsonresult = await authorizationserver.authorization_challenge(session_section, options, params);

			responseURL = jsonresult.responseURL;
		}
		catch(e) {
			global.log("exception in RegistriesControllers.authorization_authentication_requests: " + e);
			global.log(e.stack);
			
			jsonresult = {status: 0, error: "could not retrieve information"};
		}

		if (session_section) session_section.close();

		if (responseURL)
		res.redirect(responseURL);
		else {
			res.json(jsonresult);
		}
	}

	async authorization_siop_sessions(req, res) {
		// POST
		var global = this.global;
		var sessionuuid = req.get("sessiontoken");

		global.log("authorization_siop_sessions called for sessiontoken " + sessionuuid);

		var jsonresult;

		var grant_type  = req.body.grant_type;
		var code = req.body.code;
		var id_token = req.body.id_token;

		try {
			var commonservice = global.getServiceInstance('common');
			var Session = commonservice.Session;

			var session_section = Session.openSessionSection(global, sessionuuid, 'authorization_siop_sessions');
			var session = await session_section.getSessionAsync();

			var didregistriesservice = global.getServiceInstance('did-registries');

			let authorizationserver = didregistriesservice.getAuthorizationServerInstance();

			let options = {};
			let params = {grant_type, code, id_token};

			jsonresult = await authorizationserver.authorization_siop_sessions(session_section, options, params);
		}
		catch(e) {
			global.log("exception in RegistriesControllers.authorization_siop_sessions: " + e);
			global.log(e.stack);
			
			jsonresult = {status: 0, error: "could not retrieve information"};
		}

		if (session_section) session_section.close();
		res.json(jsonresult);
	}


	async _isAuthenticated(access_token) {
		var global = this.global;

		var didregistriesservice = global.getServiceInstance('did-registries');
		let didregistriesserver = didregistriesservice.getDidRegistriesServerInstance();
		let authorizationserver = didregistriesservice.getAuthorizationServerInstance();
	
		let auth_token = await authorizationserver.getAuthToken(access_token);
		let isAuthenticated = (auth_token && auth_token.authenticated ? true : false);

		return isAuthenticated;
	}

	//
	// did:web create, update, deactivate
	// (methods require a session)
	async _isAuthorizedForDid(global, did, access_token, api_secret, authorization = 7) {
		let isAuthorized = false;

		// authorization
		// 7 full level
		// 3 modify level (can be same did)
		// 1 read level

		if (!did)
		return isAuthorized;

		var didregistriesservice = global.getServiceInstance('did-registries');
		let authorizationserver = didregistriesservice.getAuthorizationServerInstance();
		let didregistriesserver = didregistriesservice.getDidRegistriesServerInstance();

		if (access_token) {
			let auth_token = await authorizationserver.getAuthToken(access_token);

			if (did.startsWith('did:key')) {
				if (auth_token && auth_token.authenticated && (auth_token.did == did)) {
					isAuthorized = true;
				}
				else if (didregistriesserver._isSiteRootDiKey(auth_token.did)) {
					// call by site root did key
					isAuthorized = true;
				}
			}
			else if (did.startsWith('did:web')) {
				let auth_did_key = auth_token.did;
				let did_web_domain = didregistriesservice._getDidWebDomain(did_web);
				let did_web_array = await didregistriesserver.getDidWebListFromDidKey(auth_did_key, did_web_domain);

				for (var i = 0; i < did_web_array.length; i++) {
					let did_web = did_web_array[i];

					let level = await didregistriesserver.getDidWebRelationship(did_web, did);

					if (level == 2) {
						// higher in the path hierarchy
						isAuthorized = true;
						break;
					}
					else if ((level == 1) && ((authorization & 0b00000100) == 0)) {
						// same level (it is the did itself)
						// authorized for simple modification
						isAuthorized = true;
						break;
					}
				}

			}


		}

		if (!isAuthorized && api_secret) {
			let isAdminApiCall = await authorizationserver.isSiteAdminApiCall(api_secret);

			if (isAdminApiCall)
			isAuthorized = true;
		}
		
		return isAuthorized;
	}

	async _isAuthorizedForPath(global, path, access_token, api_secret) {
		let isAuthorized = false;

		if (!path)
			return isAuthorized;

		var didregistriesservice = global.getServiceInstance('did-registries');
		let didregistriesserver = didregistriesservice.getDidRegistriesServerInstance();

		let node_list = await didregistriesserver.getTrustChain(path);
		let authorizationserver = didregistriesservice.getAuthorizationServerInstance();

		let auth_token = await authorizationserver.getAuthToken(access_token);

		for (var i = 0; i < node_list.length; i++) {
			let _did = (node_list[i].identifier && node_list[i].identifier.did ? node_list[i].identifier.did : null);

			if (auth_token && auth_token.authenticated && auth_token.did && (auth_token.did == _did)) {
				isAuthorized = true;
				break;
			}
		}

		if (!isAuthorized && api_secret) {
			let isAdminApiCall = await authorizationserver.isSiteAdminApiCall(api_secret);

			if (isAdminApiCall)
			isAuthorized = true;
		}
		
		return isAuthorized;
	}

	//
	// did:key
	async did_key(req, res) {
		// POST
		var global = this.global;
		var sessionuuid = req.get("sessiontoken");
		
		global.log("did_key called for sessiontoken " + sessionuuid);

		let access_token = this._parseAccessTokenFromRequests(req);
		
		var api_secret = req.body.api_secret;
		var did  = req.body.did;
		let did_web_domain = req.body.domain
		
		var jsonresult;
		
		try {
			var commonservice = global.getServiceInstance('common');
			var Session = commonservice.Session;

			var session_section = Session.openSessionSection(global, sessionuuid, 'did_key');
			var session = await session_section.getSessionAsync();

			var didregistriesservice = global.getServiceInstance('did-registries');
			let didregistriesserver = didregistriesservice.getDidRegistriesServerInstance();
			let authorizationserver = didregistriesservice.getAuthorizationServerInstance();

			let auth_token = await authorizationserver.getAuthToken(access_token);
	

			let isAuthorized = await this._isAuthorizedForDid(global, did, access_token, api_secret, 3);

			if (isAuthorized) {

				let options = {auth_token};
				let params = {did, did_web_domain};
				let result = await didregistriesserver.did_key(session_section, options, params);
				
				jsonresult = Object.assign({status: 1}, result);
			}
			else {
				jsonresult = {status: 0, error: "no rights to read did:key " + did};
			}
		}
		catch(e) {
			global.log("exception in did_key for sessiontoken " + sessionuuid + ": " + e);
			global.log(e.stack);

			jsonresult = {status: 0, error: "exception could not read did"};
		}

		if (session_section) session_section.close();
		res.json(jsonresult);
	}

	//
	// did:web list, read, create, update, deactivate
	async did_web_list(req, res) {
		// GET
		var global = this.global;
		var sessionuuid = req.get("sessiontoken");
		
		global.log("did_web_list called for sessiontoken " + sessionuuid);

		let access_token = this._parseAccessTokenFromRequests(req);
		
		let did_web_domain = req.query.domain

		var jsonresult;
		
		try {
			var commonservice = global.getServiceInstance('common');
			var Session = commonservice.Session;

			var session_section = Session.openSessionSection(global, sessionuuid, 'did_web_list');
			var session = await session_section.getSessionAsync();

			var didregistriesservice = global.getServiceInstance('did-registries');
			let didregistriesserver = didregistriesservice.getDidRegistriesServerInstance();
			let authorizationserver = didregistriesservice.getAuthorizationServerInstance();

			let auth_token = await authorizationserver.getAuthToken(access_token);
	
			let options = {did_web_domain, auth_token};
			let result = await didregistriesserver.did_web_list(session_section, options);
			
			jsonresult = Object.assign({status: 1}, result);

		}
		catch(e) {
			global.log("exception in did_web_list for sessiontoken " + sessionuuid + ": " + e);
			global.log(e.stack);

			jsonresult = {status: 0, error: "exception could not get did list"};
		}

		if (session_section) session_section.close();
		res.json(jsonresult);
	}

	async did_web(req, res) {
		// POST
		var global = this.global;
		var sessionuuid = req.get("sessiontoken");
		
		global.log("did_web called for sessiontoken " + sessionuuid);

		let access_token = this._parseAccessTokenFromRequests(req);
		
		var api_secret = req.body.api_secret;
		var did  = req.body.did;
		
		var jsonresult;
		
		try {
			var commonservice = global.getServiceInstance('common');
			var Session = commonservice.Session;

			var session_section = Session.openSessionSection(global, sessionuuid, 'did_web');
			var session = await session_section.getSessionAsync();

			var didregistriesservice = global.getServiceInstance('did-registries');
			let didregistriesserver = didregistriesservice.getDidRegistriesServerInstance();
			let authorizationserver = didregistriesservice.getAuthorizationServerInstance();

			let auth_token = await authorizationserver.getAuthToken(access_token);
	

			let did_path = didregistriesserver._getPathFromDidWeb(did);
			let isAuthorized = await this._isAuthorizedForPath(global, did_path, access_token, api_secret);

			if (isAuthorized) {

				let options = {auth_token, did_path};
				let params = {did, did_path};
				let result = await didregistriesserver.did_web(session_section, options, params);
				
				jsonresult = Object.assign({status: 1}, result);
			}
			else {
				jsonresult = {status: 0, error: "no rights to read path " + path};
			}
		}
		catch(e) {
			global.log("exception in did_web for sessiontoken " + sessionuuid + ": " + e);
			global.log(e.stack);

			jsonresult = {status: 0, error: "exception could not read did"};
		}

		if (session_section) session_section.close();
		res.json(jsonresult);
	}

	async did_web_create(req, res) {
		// POST
		var global = this.global;
		var sessionuuid = req.get("sessiontoken");
		
		global.log("did_web_create called for sessiontoken " + sessionuuid);

		let access_token = this._parseAccessTokenFromRequests(req);
		
		var api_secret = req.body.api_secret;
		var did_key  = req.body.did;
		var path  = req.body.path;
		let did_web_domain = req.body.domain
		
		var jsonresult;
		
		try {
			var commonservice = global.getServiceInstance('common');
			var Session = commonservice.Session;

			var session_section = Session.openSessionSection(global, sessionuuid, 'did_web_create');
			var session = await session_section.getSessionAsync();

			var didregistriesservice = global.getServiceInstance('did-registries');
			let didregistriesserver = didregistriesservice.getDidRegistriesServerInstance();
			let authorizationserver = didregistriesservice.getAuthorizationServerInstance();

			let auth_token = await authorizationserver.getAuthToken(access_token);
	

			let parent_path = didregistriesserver.getParentPath(path);
			let isAuthorized = await this._isAuthorizedForPath(global, parent_path, access_token, api_secret);

			if (isAuthorized) {

				let options = {auth_token, parent_path};
				let params = {did_key, path, did_web_domain};
				let result = await didregistriesserver.did_web_create(session_section, options, params);
				
				jsonresult = Object.assign({status: 1}, result);
			}
			else {
				jsonresult = {status: 0, error: "no rights to create path " + path};
			}
		}
		catch(e) {
			global.log("exception in did_web_create for sessiontoken " + sessionuuid + ": " + e);
			global.log(e.stack);

			jsonresult = {status: 0, error: "exception could not create did"};
		}

		if (session_section) session_section.close();
		res.json(jsonresult);
	}

	async did_web_update(req, res) {
		// POST
		var global = this.global;
		var sessionuuid = req.get("sessiontoken");
		
		global.log("did_web_update called for sessiontoken " + sessionuuid);

		let access_token = this._parseAccessTokenFromRequests(req);
		
		var api_secret = req.body.api_secret;
		var did  = req.body.did;
		var update  = req.body.update;
		
		var jsonresult;
		
		try {
			var commonservice = global.getServiceInstance('common');
			var Session = commonservice.Session;

			var session_section = Session.openSessionSection(global, sessionuuid, 'did_web_update');
			var session = await session_section.getSessionAsync();

			var didregistriesservice = global.getServiceInstance('did-registries');
			let didregistriesserver = didregistriesservice.getDidRegistriesServerInstance();
			let authorizationserver = didregistriesservice.getAuthorizationServerInstance();

			let auth_token = await authorizationserver.getAuthToken(access_token);
	

			let isAuthorized = await this._isAuthorizedForDid(global, did, access_token, api_secret, 3);

			if (isAuthorized) {

				let options = {auth_token};
				let params = {did, update};
				let result = await didregistriesserver.did_web_update(session_section, options, params);
				
				jsonresult = Object.assign({status: 1}, result);
			}
			else {
				jsonresult = {status: 0, error: "no rights to modify issuer: " + did};
			}
		}
		catch(e) {
			global.log("exception in did_web_update for sessiontoken " + sessionuuid + ": " + e);
			global.log(e.stack);

			jsonresult = {status: 0, error: "exception could not modify identifier"};
		}

		if (session_section) session_section.close();
		res.json(jsonresult);
	}

	async did_web_deactivate(req, res) {
		// POST
		var global = this.global;
		var sessionuuid = req.get("sessiontoken");
		
		global.log("did_web_deactivate called for sessiontoken " + sessionuuid);

		let access_token = this._parseAccessTokenFromRequests(req);
		
		var api_secret = req.body.api_secret;
		var did  = req.body.did;
		
		var jsonresult;
		
		try {
			var commonservice = global.getServiceInstance('common');
			var Session = commonservice.Session;

			var session_section = Session.openSessionSection(global, sessionuuid, 'did_web_deactivate');
			var session = await session_section.getSessionAsync();

			var didregistriesservice = global.getServiceInstance('did-registries');
			let didregistriesserver = didregistriesservice.getDidRegistriesServerInstance();
			let authorizationserver = didregistriesservice.getAuthorizationServerInstance();

			let auth_token = await authorizationserver.getAuthToken(access_token);
	

			let isAuthorized = await this._isAuthorizedForDid(global, did, access_token, api_secret, 3);

			if (isAuthorized) {

				let options = {auth_token};
				let params = {did};
				let result = await didregistriesserver.did_web_deactivate(session_section, options, params);
				
				jsonresult = Object.assign({status: 1}, result);
			}
			else {
				jsonresult = {status: 0, error: "no rights to deactivate issuer: " + did};
			}
		}
		catch(e) {
			global.log("exception in did_web_deactivate for sessiontoken " + sessionuuid + ": " + e);
			global.log(e.stack);

			jsonresult = {status: 0, error: "exception could not deactivate identifier"};
		}

		if (session_section) session_section.close();
		res.json(jsonresult);
	}




	//
	// did:key

	async _did_key_document(req, res) {
		// GET
		var global = this.global;

		global.log("_did_key_document called");

		let key = req.params.key;


		var jsonresult
		
		try {
			var didregistriesservice = global.getServiceInstance('did-registries');
			let didregistriesserver = didregistriesservice.getDidRegistriesServerInstance();
			
			let options = {key};
			jsonresult = await didregistriesserver.did_key_document(options);
		}
		catch(e) {
			global.log("exception in RegistriesControllers._did_key_document: " + e);
			
			jsonresult = {status: 0, error: "could not retrieve information"};
		}

		res.json(jsonresult);
	}

	//
	// path
	async _path_document(req, res) {
		// GET
		var global = this.global;

		global.log("_path_document called");

		let current_host = req.headers.host
		let full_path = req.originalUrl;


		var jsonresult
		
		try {
			let path = full_path.slice(full_path.indexOf('/didweb') + 7);
			path = path.split('/did.json')[0];

			if ((path.length == 0) || (path == '/.well-known')) {
				// turn to root path /
				path = '/';
			}
			else {
				if ((path.length > 1) && (path.charAt(path.length - 1) == '/')) {
					// remove trailing / (e.g. when missing did.json)
					path = path.substring(0, path.length - 1); 
				}
			}

			var didregistriesservice = global.getServiceInstance('did-registries');
			let didregistriesserver = didregistriesservice.getDidRegistriesServerInstance();
			
			let options = {current_host, path};
			jsonresult = await didregistriesserver.path_document(options);
		}
		catch(e) {
			global.log("exception in RegistriesControllers._path_document: " + e);
			
			jsonresult = {status: 0, error: "could not retrieve information"};
		}

		res.json(jsonresult);
	}
	
	//
	// registry functions

	// identifiers (did & documents)
	async did_registry_identifiers(req, res) {
		// GET
		var global = this.global;

		global.log("did_registry_identifiers called");

		let pageafter = (req.query.page ? req.query.page.after : 0);
		let pagesize = (req.query.page ? req.query.page.size : -1);

		let did_web_domain = req.query.domain

		var jsonresult
		
		try {
			var didregistriesservice = global.getServiceInstance('did-registries');
			let didregistriesserver = didregistriesservice.getDidRegistriesServerInstance();
			
			let options = {did_web_domain};
			jsonresult = await didregistriesserver.did_registry_identifiers(pageafter, pagesize, options);
		}
		catch(e) {
			global.log("exception in RegistriesControllers.did_registry_identifiers: " + e);
			
			jsonresult = {status: 0, error: "could not retrieve information"};
		}

		res.json(jsonresult);
	}

	async did_registry_did_document(req, res) {
		// GET
		var global = this.global;

		global.log("did_registry_did_document called");

		let did = req.params.did;


		var jsonresult
		
		try {
			var didregistriesservice = global.getServiceInstance('did-registries');
			let didregistriesserver = didregistriesservice.getDidRegistriesServerInstance();
			
			let options = {};
			jsonresult = await didregistriesserver.did_registry_did_document(did, options);
		}
		catch(e) {
			global.log("exception in RegistriesControllers.did_registry_did_document: " + e);
			
			jsonresult = {status: 0, error: "could not retrieve information"};
		}

		res.json(jsonresult);
	}

	// identifier attributes
	async did_registry_identifier_attributes(req, res) {
		var global = this.global;

		global.log("did_registry_identifier_attributes called");

		let did = req.params.did;


		var jsonresult
		
		try {
			var didregistriesservice = global.getServiceInstance('did-registries');
			let didregistriesserver = didregistriesservice.getDidRegistriesServerInstance();
			
			let options = {};
			jsonresult = await didregistriesserver.did_registry_identifier_attributes(did, options);
		}
		catch(e) {
			global.log("exception in RegistriesControllers.did_registry_identifier_attributes: " + e);
			
			jsonresult = {status: 0, error: "could not retrieve information"};
		}

		res.json(jsonresult);
	}

	async did_registry_identifier_attribute_add(req, res) {
		// POST
		var global = this.global;
		var sessionuuid = req.get("sessiontoken");
		
		global.log("did_registry_identifier_attribute_add called for sessiontoken " + sessionuuid);

		let access_token = this._parseAccessTokenFromRequests(req);
		
		var did  = req.body.did;
		var attribute  = req.body.attribute;
		var attribute_signature  = req.body.attribute_signature;
		var algorithm_string  = req.body.algorithm;
		
		var jsonresult;
		
		try {
			var commonservice = global.getServiceInstance('common');
			var Session = commonservice.Session;

			var session_section = Session.openSessionSection(global, sessionuuid, 'did_registry_identifier_attribute_add');
			var session = await session_section.getSessionAsync();

			var didregistriesservice = global.getServiceInstance('did-registries');
			let didregistriesserver = didregistriesservice.getDidRegistriesServerInstance();
			let authorizationserver = didregistriesservice.getAuthorizationServerInstance();

			let auth_token = await authorizationserver.getAuthToken(access_token);

			if (auth_token.authenticated) {

				let options = {auth_token};
				let params = {did, attribute, attribute_signature, algorithm_string};
				let result = await didregistriesserver.did_registry_identifier_attribute_add(session_section, options, params);
				
				jsonresult = Object.assign({status: 1}, result);
			}
			else {
				jsonresult = {status: 0, error: "no rights to add an attribute"};
			}
		}
		catch(e) {
			global.log("exception in did_registry_identifier_attribute_add for sessiontoken " + sessionuuid + ": " + e);
			global.log(e.stack);

			jsonresult = {status: 0, error: "exception could not add attribute"};
		}

		if (session_section) session_section.close();
		res.json(jsonresult);
	}

	async did_registry_identifier_attribute_deactivate(req, res) {
		// POST
		var global = this.global;
		var sessionuuid = req.get("sessiontoken");
		
		global.log("did_registry_identifier_attribute_deactivate called for sessiontoken " + sessionuuid);

		let access_token = this._parseAccessTokenFromRequests(req);
		
		var did  = req.body.did;
		var attribute_cmd_string  = req.body.attribute_cmd;
		var attribute_signature  = req.body.attribute_signature;
		var algorithm_string  = req.body.algorithm;
		
		var jsonresult;
		
		try {
			var commonservice = global.getServiceInstance('common');
			var Session = commonservice.Session;

			var session_section = Session.openSessionSection(global, sessionuuid, 'did_registry_identifier_attribute_deactivate');
			var session = await session_section.getSessionAsync();

			var didregistriesservice = global.getServiceInstance('did-registries');
			let didregistriesserver = didregistriesservice.getDidRegistriesServerInstance();
			let authorizationserver = didregistriesservice.getAuthorizationServerInstance();

			let auth_token = await authorizationserver.getAuthToken(access_token);

			if (auth_token.authenticated) {

				let options = {auth_token};
				let params = {did, attribute_cmd_string, attribute_signature, algorithm_string};
				let result = await didregistriesserver.did_registry_identifier_attribute_deactivate(session_section, options, params);
				
				jsonresult = Object.assign({status: 1}, result);
			}
			else {
				jsonresult = {status: 0, error: "no rights to add an attribute"};
			}
		}
		catch(e) {
			global.log("exception in did_registry_identifier_attribute_deactivate for sessiontoken " + sessionuuid + ": " + e);
			global.log(e.stack);

			jsonresult = {status: 0, error: "exception could not deactivate attribute"};
		}

		if (session_section) session_section.close();
		res.json(jsonresult);
	}
	
	// trust chain
	async did_trust_chain(req, res) {
		// GET
		var global = this.global;

		global.log("did_trust_chain called");

		let did = req.params.did;


		var jsonresult
		
		try {
			var didregistriesservice = global.getServiceInstance('did-registries');
			let didregistriesserver = didregistriesservice.getDidRegistriesServerInstance();

			let options = {};
			jsonresult = await didregistriesserver.did_trust_chain(did, options);
		}
		catch(e) {
			global.log("exception in RegistriesControllers.did_trust_chain: " + e);
			
			jsonresult = {status: 0, error: "could not retrieve information"};
		}

		res.json(jsonresult);
	}


	//
	// issuers
	async did_registry_issuers(req, res) {
		// GET
		var global = this.global;

		global.log("did_registry_issuers called");

		let pageafter = (req.query.page ? req.query.page.after : 0);
		let pagesize = (req.query.page ? req.query.page.size : -1);

		let did_web_domain = req.query.domain

		var jsonresult
		
		try {
			var didregistriesservice = global.getServiceInstance('did-registries');
			let didregistriesserver = didregistriesservice.getDidRegistriesServerInstance();

			let options = {did_web_domain};
			jsonresult = await didregistriesserver.did_registry_issuers(pageafter, pagesize, options);
		}
		catch(e) {
			global.log("exception in RegistriesControllers.did_registry_issuers: " + e);
			
			jsonresult = {status: 0, error: "could not retrieve information"};
		}

		res.json(jsonresult);
	}

	async did_registry_issuer(req, res) {
		// GET
		var global = this.global;

		global.log("did_registry_issuer called");

		let did = req.params.did;


		var jsonresult
		
		try {
			var didregistriesservice = global.getServiceInstance('did-registries');
			let didregistriesserver = didregistriesservice.getDidRegistriesServerInstance();
			
			let options = {};
			jsonresult = await didregistriesserver.did_registry_issuer(did, options);
		}
		catch(e) {
			global.log("exception in RegistriesControllers.did_registry_issuer: " + e);
			
			jsonresult = {status: 0, error: "could not retrieve information"};
		}

		res.json(jsonresult);
	}

	async did_issuer_create(req, res) {
		// POST
		var global = this.global;
		var sessionuuid = req.get("sessiontoken");
		
		global.log("did_issuer_create called for sessiontoken " + sessionuuid);

		let access_token = this._parseAccessTokenFromRequests(req);
		
		var api_secret = req.body.api_secret;
		var did  = req.body.did;
		
		var jsonresult;
		
		try {
			var commonservice = global.getServiceInstance('common');
			var Session = commonservice.Session;

			var session_section = Session.openSessionSection(global, sessionuuid, 'did_issuer_create');
			var session = await session_section.getSessionAsync();

			var didregistriesservice = global.getServiceInstance('did-registries');
			let didregistriesserver = didregistriesservice.getDidRegistriesServerInstance();
			let authorizationserver = didregistriesservice.getAuthorizationServerInstance();

			let auth_token = await authorizationserver.getAuthToken(access_token);
	

			let isAuthorized = await this._isAuthorizedForDid(global, did, access_token, api_secret, 3);

			if (isAuthorized) {

				let options = {auth_token};
				let params = {did};
				let result = await didregistriesserver.did_issuer_create(session_section, options, params);
				
				jsonresult = Object.assign({status: 1}, result);
			}
			else {
				jsonresult = {status: 0, error: "no rights to make an issuer: " + did};
			}
		}
		catch(e) {
			global.log("exception in did_issuer_create for sessiontoken " + sessionuuid + ": " + e);
			global.log(e.stack);

			jsonresult = {status: 0, error: "exception could not create issuer"};
		}

		if (session_section) session_section.close();
		res.json(jsonresult);
	}

	async did_issuer_update(req, res) {
		// POST
		var global = this.global;
		var sessionuuid = req.get("sessiontoken");
		
		global.log("did_issuer_update called for sessiontoken " + sessionuuid);

		let access_token = this._parseAccessTokenFromRequests(req);
		
		var api_secret = req.body.api_secret;
		var did  = req.body.did;
		var update  = req.body.update;
		
		var jsonresult;
		
		try {
			var commonservice = global.getServiceInstance('common');
			var Session = commonservice.Session;

			var session_section = Session.openSessionSection(global, sessionuuid, 'did_issuer_update');
			var session = await session_section.getSessionAsync();

			var didregistriesservice = global.getServiceInstance('did-registries');
			let didregistriesserver = didregistriesservice.getDidRegistriesServerInstance();
			let authorizationserver = didregistriesservice.getAuthorizationServerInstance();

			let auth_token = await authorizationserver.getAuthToken(access_token);
	

			let isAuthorized = await this._isAuthorizedForDid(global, did, access_token, api_secret);

			if (isAuthorized) {

				let options = {auth_token};
				let params = {did, update};
				let result = await didregistriesserver.did_issuer_update(session_section, options, params);
				
				jsonresult = Object.assign({status: 1}, result);
			}
			else {
				jsonresult = {status: 0, error: "no rights to modify issuer: " + did};
			}
		}
		catch(e) {
			global.log("exception in did_issuer_update for sessiontoken " + sessionuuid + ": " + e);
			global.log(e.stack);

			jsonresult = {status: 0, error: "exception could not modify issuer"};
		}

		if (session_section) session_section.close();
		res.json(jsonresult);
	}

	async did_issuer_deactivate(req, res) {
		// POST
		var global = this.global;
		var sessionuuid = req.get("sessiontoken");
		
		global.log("did_issuer_deactivate called for sessiontoken " + sessionuuid);

		let access_token = this._parseAccessTokenFromRequests(req);
		
		var api_secret = req.body.api_secret;
		var did  = req.body.did;
		
		var jsonresult;
		
		try {
			var commonservice = global.getServiceInstance('common');
			var Session = commonservice.Session;

			var session_section = Session.openSessionSection(global, sessionuuid, 'did_issuer_update');
			var session = await session_section.getSessionAsync();

			var didregistriesservice = global.getServiceInstance('did-registries');
			let didregistriesserver = didregistriesservice.getDidRegistriesServerInstance();
			let authorizationserver = didregistriesservice.getAuthorizationServerInstance();

			let auth_token = await authorizationserver.getAuthToken(access_token);
	

			let isAuthorized = await this._isAuthorizedForDid(global, did, access_token, api_secret);

			if (isAuthorized) {

				let options = {auth_token};
				let params = {did};
				let result = await didregistriesserver.did_issuer_deactivate(session_section, options, params);
				
				jsonresult = Object.assign({status: 1}, result);
			}
			else {
				jsonresult = {status: 0, error: "no rights to deactivate issuer: " + did};
			}
		}
		catch(e) {
			global.log("exception in did_issuer_deactivate for sessiontoken " + sessionuuid + ": " + e);
			global.log(e.stack);

			jsonresult = {status: 0, error: "exception could not deactivate issuer"};
		}

		if (session_section) session_section.close();
		res.json(jsonresult);
	}

	//
	// credentials
	async issuer_credential_status_history(req, res) {
		// POST
		var global = this.global;

		global.log("issuer_credential_status_history called");

		var credential_hash  = req.body.credential_hash;
		let did_web_domain = req.body.domain

		var jsonresult
		
		try {
			var didregistriesservice = global.getServiceInstance('did-registries');
			let didregistriesserver = didregistriesservice.getDidRegistriesServerInstance();
			
			let options = {};
			let params = {credential_hash, did_web_domain};
			jsonresult = await didregistriesserver.issuer_credential_status_history(options, params);
		}
		catch(e) {
			global.log("exception in RegistriesControllers.issuer_credential_status_history: " + e);
			
			jsonresult = {status: 0, error: "could not retrieve information"};
		}

		res.json(jsonresult);
	}

	async issuer_credential_status_modifications_list(req, res) {
		// POST
		var global = this.global;

		global.log("issuer_credential_status_modifications_list called");

		var credential_hash  = req.body.credential_hash;
		let modifier_did = req.body.modifier_did;

		var jsonresult
		
		try {
			var didregistriesservice = global.getServiceInstance('did-registries');
			let didregistriesserver = didregistriesservice.getDidRegistriesServerInstance();
			
			let options = {};
			let params = {credential_hash, modifier_did};
			jsonresult = await didregistriesserver.issuer_credential_status_modifications_list(options, params);
		}
		catch(e) {
			global.log("exception in RegistriesControllers.issuer_credential_status_modifications_list: " + e);
			
			jsonresult = {status: 0, error: "could not retrieve information"};
		}

		res.json(jsonresult);
	}

	async issuer_credential_revoke(req, res) {
		// POST
		var global = this.global;
		var sessionuuid = req.get("sessiontoken");
		
		global.log("issuer_credential_revoke called for sessiontoken " + sessionuuid);

		let access_token = this._parseAccessTokenFromRequests(req);
		
		var credential_hash  = req.body.credential_hash;
		
		var jsonresult;
		
		try {
			var commonservice = global.getServiceInstance('common');
			var Session = commonservice.Session;

			var session_section = Session.openSessionSection(global, sessionuuid, 'did_issuer_update');
			var session = await session_section.getSessionAsync();

			var didregistriesservice = global.getServiceInstance('did-registries');
			let didregistriesserver = didregistriesservice.getDidRegistriesServerInstance();
			let authorizationserver = didregistriesservice.getAuthorizationServerInstance();
	
			let auth_token = await authorizationserver.getAuthToken(access_token);
			let isAuthenticated = (auth_token && auth_token.authenticated ? true : false);
	
			if (isAuthenticated) {

				let options = {auth_token};
				let params = {credential_hash};
				let result = await didregistriesserver.issuer_credential_revoke(session_section, options, params);
				
				jsonresult = Object.assign({status: 1}, result);
			}
			else {
				jsonresult = {status: 0, error: "no rights to vet credential with hash: " + credential_hash};
			}
		}
		catch(e) {
			global.log("exception in issuer_credential_revoke for sessiontoken " + sessionuuid + ": " + e);
			global.log(e.stack);

			jsonresult = {status: 0, error: "exception could not revoke credential"};
		}

		if (session_section) session_section.close();
		res.json(jsonresult);
	}
	
	async issuer_credential_enact(req, res) {
		// POST
		var global = this.global;
		var sessionuuid = req.get("sessiontoken");
		
		global.log("issuer_credential_enact called for sessiontoken " + sessionuuid);

		let access_token = this._parseAccessTokenFromRequests(req);
		
		var credential_hash  = req.body.credential_hash;
		
		var jsonresult;
		
		try {
			var commonservice = global.getServiceInstance('common');
			var Session = commonservice.Session;

			var session_section = Session.openSessionSection(global, sessionuuid, 'did_issuer_update');
			var session = await session_section.getSessionAsync();

			var didregistriesservice = global.getServiceInstance('did-registries');
			let didregistriesserver = didregistriesservice.getDidRegistriesServerInstance();
			let authorizationserver = didregistriesservice.getAuthorizationServerInstance();
	
			let auth_token = await authorizationserver.getAuthToken(access_token);
			let isAuthenticated = (auth_token && auth_token.authenticated ? true : false);
	
			if (isAuthenticated) {
				let options = {auth_token};
				let params = {credential_hash};
				let result = await didregistriesserver.issuer_credential_enact(session_section, options, params);
				
				jsonresult = Object.assign({status: 1}, result);
			}
			else {
				jsonresult = {status: 0, error: "no rights to vet credential with hash: " + credential_hash};
			}
		}
		catch(e) {
			global.log("exception in issuer_credential_enact for sessiontoken " + sessionuuid + ": " + e);
			global.log(e.stack);

			jsonresult = {status: 0, error: "exception could not enact credential"};
		}

		if (session_section) session_section.close();
		res.json(jsonresult);
	}
	


	/**********************************************************************
	 *                                                                    *
	 *     served by specific subdomain https://mydidweb.example.com      *
	 *                                                                    *
	 **********************************************************************/


	//
	// did:web read

	async did_web_document(req, res) {
		// GET
		var global = this.global;

		let full_path = req.originalUrl;


		// triage between web calls and api calls
		var jsonresult
		
		try {
			let path = full_path.slice(full_path.indexOf('/didweb/') + 8);
			let parts = path.split('/');

			switch(parts[0]) {
				case '.well-known': {
					let conf_path = parts[1];
					switch(conf_path) {
						case 'openid-configuration':
							return this.openid_configuration(req, res);
						case 'registries-configuration':
							return this.registries_configuration(req, res);
						default:
							return this._path_document(req, res);

					}
				}

				case 'key': {
					req.params.key = parts[1];
					return this._did_key_document(req, res);
				}

				default: {

					return this._path_document(req, res);
				}
			}
		}
		catch(e) {
			global.log("exception in RegistriesControllers.did_web: " + e);
			
			jsonresult = {status: 0, error: "could not retrieve information"};
		}

		res.json(jsonresult);
	
	}
}

module.exports = RegistriesControllers;