class Service {
	
	constructor() {
		this.name = 'did-registries';
		
		this.global = null;

		this.current_version = "0.40.38.2024.02.06";
	}

	loadService() {
		this.global.log('loadService called for service ' + this.name);

	}
	
	// optional  service functions
	registerHooks() {
		console.log('registerHooks called for ' + this.name);

		var global = this.global;

		global.registerHook('prepareInitialSetupForm_asynchook', this.name, this.prepareInitialSetupForm_asynchook);
		
		global.registerHook('installMysqlTables_asynchook', this.name, this.installMysqlTables_asynchook);
		global.registerHook('installWebappConfig_asynchook', this.name, this.installWebappConfig_asynchook);

		// start
		global.registerHook('registerRoutes_hook', this.name, this.registerRoutes_hook);
	}
	
	
	//
	// hooks
	//
	async prepareInitialSetupForm_asynchook(result, params) {
		var global = this.global;

		global.log('prepareInitialSetupForm_asynchook called for ' + this.name);

		var session = params[0];
		var data = params[1];

		data.title = "Did:Web Registries";

		// remove REST entries
		data.remove_rest_group = true;

		// add our own entries
		let xtra_inputs = [];

		xtra_inputs.group_title = "Did:Web";

		let entry;

		// site_did_web_domain
		entry = {label: 'Site did:web domain', name: 'site_did_web_domain', placeholder: 'mydids.example.com'};
		xtra_inputs.push(entry);

		// site_did_web_root_path
		entry = {label: 'Site did:web root path (if any)', name: 'site_did_web_root_path', placeholder: '/myroot', notrequired: true};
		xtra_inputs.push(entry);

		// site_did_web_api_path
		entry = {label: 'Site did:web api url', name: 'site_did_web_api_path', placeholder: 'https://mydids.example.com/api/registries'};
		xtra_inputs.push(entry);
		
		// site_root_did_key
		entry = {label: 'Site root did:key', name: 'site_root_did_key', placeholder: ''};
		xtra_inputs.push(entry);


		data.form_xtra_inputs = xtra_inputs;


		result.push({service: this.name, handled: true});
		
		return true;
	}

	async installMysqlTables_asynchook(result, params) {
		var global = this.global;

		global.log('installMysqlTables_asynchook called for ' + this.name);
		

		var session = params[0];
		var mysqlcon = params[1];
		var install_step = params[2];

		switch(install_step) {
			case 'initial_setup': {
				// we create tables
				var tablename;
				var sql;
				
				// open connection
				await mysqlcon.openAsync();

				// identifiers table
				tablename = mysqlcon.getTableName('registries_identifiers');
				sql = "CREATE TABLE IF NOT EXISTS ";
			
				sql += tablename;
				sql += ` ( 
							IdentifierId int(11) NOT NULL AUTO_INCREMENT,
							IdentifierUUID varchar(36) NOT NULL,
							IdentifierStatus int(11) NOT NULL,
							DidKey varchar(256) NOT NULL,
						
							PRIMARY KEY (IdentifierId),
							UNIQUE KEY DidKey (DidKey),
							UNIQUE KEY IdentifierUUID (IdentifierUUID)
						)`;

				// execute query
				var res = await mysqlcon.executeAsync(sql);


				// paths table
				tablename = mysqlcon.getTableName('registries_identifier_paths');
				sql = "CREATE TABLE IF NOT EXISTS ";
			
				sql += tablename;
				sql += ` ( 
							PathId int(11) NOT NULL AUTO_INCREMENT,
							PathUUID varchar(36) NOT NULL,
							PathStatus int(11) NOT NULL,
							IdentifierId int(11) NOT NULL,
							Path varchar(256) NOT NULL,
							Rights int(11) DEFAULT 0,
						
							PRIMARY KEY (PathId),
							UNIQUE KEY PathUUID (PathUUID),
							UNIQUE KEY Path (Path)
						)`;

				// execute query
				var res = await mysqlcon.executeAsync(sql);

				
				// identifier_attributes table
				tablename = mysqlcon.getTableName('registries_identifier_attributes');
				sql = "CREATE TABLE IF NOT EXISTS ";
			
				sql += tablename;
				sql += ` ( 
							AttributeId int(11) NOT NULL AUTO_INCREMENT,
							AttributeUUID varchar(36) NOT NULL,
							AttributeStatus int(11) NOT NULL,
							IdentifierId int(11) NOT NULL,
							Attribute varchar(1024) NOT NULL,
							ReporterLevel int(11) DEFAULT 0,
							ReporterIdentifierId int(11) NOT NULL,
							ReporterSignature varchar(256),
						
							PRIMARY KEY (AttributeId),
							UNIQUE KEY AttributeUUID (AttributeUUID)
						)`;

				// execute query
				var res = await mysqlcon.executeAsync(sql);

								
				// identifier_attributes table
				tablename = mysqlcon.getTableName('registries_credential_statuslist');
				sql = "CREATE TABLE IF NOT EXISTS ";
			
				sql += tablename;
				sql += ` ( 
							StatusId int(11) NOT NULL AUTO_INCREMENT,
							CredentialHash varchar(128) NOT NULL,
							CredentialStatus int(11) NOT NULL,
							ModifiedOn datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
							ModifiedBy int(11) NOT NULL,
						
							PRIMARY KEY (StatusId)
						)`;

				// execute query
				var res = await mysqlcon.executeAsync(sql);


				// close connection
				await mysqlcon.closeAsync();
				
			}
			break;

			default:
				break;
		}
		

		result.push({service: this.name, handled: true});
		
		return true;
	}

	async installWebappConfig_asynchook(result, params) {
		var global = this.global;

		global.log('installWebappConfig_asynchook called for ' + this.name);

		var session = params[0];
		var config = params[1];
		var install_step = params[2];
		var install_inputs = params[3];

		switch(install_step) {
			case 'initial_setup': {

				let rest_server_url = install_inputs.rest_server_url;
				let rest_server_api_path = install_inputs.rest_server_api_path;
		

				//
				// overload of ethereum_webapp setting parameters
				delete config.rest_server_url;
				delete config.rest_server_api_path;

				config.overload_dapp_files = 0;
				config.copy_dapp_files = 0;

				config.authkey_server_passthrough = "0"
				config.auth_check_frequency = "5000";

				config.session_time_length = "-1";
				config.session_obsolence_length = "300000";

				config.activate_ethnode = "0";
				config.activate_cli_cont = "0"	;


				//
				// did_web_registries setting parameters

				// site_api_secret
				config.site_api_secret = session.guid();

				// site_private_key
				const CryptoUtils = require('./model/includes/crypto-block/crypto-utils.js');
				config.site_private_key = await CryptoUtils.generateHexPrivateKey();
		
				
				// site_did_web_api_path
				config.site_did_web_api_path = install_inputs.site_did_web_api_path;
				
				// site_did_web_domain
				config.site_did_web_domain = install_inputs.site_did_web_domain;

				if (install_inputs.site_did_web_root_path)
				config.site_did_web_root_path = install_inputs.site_did_web_root_path;

				// site_root_did_key
				config.site_root_did_key = (install_inputs.site_root_did_key ? install_inputs.site_root_did_key  : '');

			}
			break;

			default:
				break;
		}



		result.push({service: this.name, handled: true});
		
		return true;
	}


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
