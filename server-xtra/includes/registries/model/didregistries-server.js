class DidRegistriesServer {
	constructor(service) {
	   this.service = service;
	   this.global = service.global;

	   var Persistor = require('./interface/database-persistor.js');

	   this.persistor =  new Persistor(service);
	}

	// did web domains served by site
	_getSiteDidWebDomainAliasList() {
		var global = this.global;
		let list = [];

		try {
			let site_did_web_domain_alias_list = global.getConfigValue("site_did_web_domain_alias_list");

			if (site_did_web_domain_alias_list) {
				let arr = JSON.parse(site_did_web_domain_alias_list);

				for (var i = 0; i < (arr ? arr.length : 0); i++) {
					let domain = (arr[i].domain ? arr[i].domain.toLowerCase() : '');
					let root_path = arr[i].root_path;

					// TODO: check root_path is well formed
					let id = root_path.replaceAll('/', ':');
					list.push({domain, root_path, id});
				}
			}
		}
		catch(e) {
		}

		return list;
	}


	_getSiteDidWebDomainEntry(did_web_domain) {
		var global = this.global;
		let site_did_web_domain = global.getConfigValue("site_did_web_domain");
		let site_did_web_root_path = (global.getConfigValue("site_did_web_root_path") ? global.getConfigValue("site_did_web_root_path") : '');

		let entry = {};
		entry.domain = site_did_web_domain;
		entry.root_path = site_did_web_root_path;

		if (!did_web_domain || (site_did_web_domain === did_web_domain))
		return entry;

		// check it is in the list of aliases
		let alias_list = this._getSiteDidWebDomainAliasList();

		for (var i = 0; i < (alias_list ? alias_list.length : 0); i++) {
			let alias_entry = alias_list[i];
			if (alias_entry.domain === did_web_domain) {
				return alias_entry;
			}
		}
	}

	_getSiteDidWebDomain(did_web_domain) {
		let site_did_web_entry = this._getSiteDidWebDomainEntry(did_web_domain);
		return (site_did_web_entry ? site_did_web_entry.domain : null)
	}

	_getSiteDidWebRootPath(did_web_domain) {
		let site_did_web_entry = this._getSiteDidWebDomainEntry(did_web_domain);
		return (site_did_web_entry ? site_did_web_entry.root_path : null)
	}


	//
	// connection between did:web and rest api
	async registries_configuration(options) {
		var global = this.global;
		var json = {};

		let current_host = options.current_host;

		// did web domain and root
		let canonical_site_did_web_domain = this._getSiteDidWebDomain();
		let canonical_site_did_web_root = this._getSiteRootDidWeb();

		json.canonical_did_web_domain_name = canonical_site_did_web_domain;
		json.canonical_did_web_root = canonical_site_did_web_root;

		let site_did_web_domain = this._getSiteDidWebDomain(current_host);
		let site_did_web_root = this._getSiteRootDidWeb(current_host);

		json.current_did_web_domain_name = site_did_web_domain;
		json.current_did_web_root = site_did_web_root;

		// api end point and signing alg
		let site_did_web_api_path = global.getConfigValue('site_did_web_api_path');

		json.api_endpoint = site_did_web_api_path;

		json.signing_algs = this.service.getSigningAlgorithms();

		return json;
	}

	//
	// did:key and did:web
	getDidMethod(did) {
		var parts = did.split(':');

		return parts[1];
	}

	_getDidWebDomain(did_web) {
		if (!did_web) return;

		let full = did_web.substring(8); // remove did:web:
		let domain = (full.indexOf(':') > 0 ? full.substring(0, full.indexOf(':')) : full);

		return domain;
	}

	_isSiteRootDidWeb(did_web) {
		let did_web_domain = this._getDidWebDomain(did_web);

		let site_root_did_web = this._getSiteRootDidWeb(did_web_domain);

		return(did_web == site_root_did_web ? true : false);
	}

	_getSiteRootDidWeb(did_web_domain) {
		var global = this.global;
		let site_did_web_domain = this._getSiteDidWebDomain(did_web_domain);

		let site_did_web_root_path = this._getSiteDidWebRootPath(did_web_domain);


		return 'did:web:' + site_did_web_domain + (site_did_web_root_path ? site_did_web_root_path.replaceAll('/', ':') : '');
	}

	_isSiteRootDiKey(did_key) {
		let site_root_did_key = this._getSiteRootDidKey();

		return(did_key == site_root_did_key ? true : false);
	}

	_getSiteRootDidKey() {
		var global = this.global;

		let site_root_did_key = global.getConfigValue("site_root_did_key");

		return site_root_did_key;
	}

	async getDidWebRelationship(did_web, sub_did_web) {
		let level = 0;

		if (!did_web || !sub_did_web)
		return level;

		let identifier_record = await this._getIdentifierFromDidWeb(did_web);
		let sub_identifier_record = await this._getIdentifierFromDidWeb(sub_did_web);

		if (!identifier_record || !sub_identifier_record)
		return level;

		if (did_web == sub_did_web) {
			level = 1;
			return level;
		}

		if (this._isSiteRootDidWeb(did_web)) {
			level = 2;
			return level;
		}

		let sub_path = sub_identifier_record.path;

		let identifier_path_arr = await this._getIdentifierPathList(identifier_record.did);

		for (var i = 0; i < identifier_path_arr.length; i++) {
			let _path = identifier_path_arr[i].path;

			if (sub_path.startsWith(_path)) {
				level = 2; // upper node
				break;
			}
			else if (_path.startsWith(sub_path)) {
				level = 3; // lower node
				break;
			}
		}

		if (level == 0)
		level = 4; // peer

		return level
	}

	async _getDidKeyJwk(did_key) {
		let doc = await this._resolveDidKey(did_key);

		if (!doc || !doc.verificationMethod)
		return;

		return doc.verificationMethod[0].publicKeyJwk;
	}


   async _resolveDidKey(did_key) {
		if (!did_key)
			return {};
		
		let did_method = this.getDidMethod(did_key);

		if (did_method != 'key')
			return {};

		if (did_key.startsWith('did:key:z2dm')) {
			// EBSI version
			const Ebsi_key_did_resolver = require('@cef-ebsi/key-did-resolver');
			const did_resolver = require('did-resolver');
			const Resolver = did_resolver.Resolver;

			const ebsiResolver = Ebsi_key_did_resolver.getResolver();

			const didResolver = new Resolver(ebsiResolver);

			const doc = await didResolver.resolve(did_key);
	
			return doc.didDocument;
		}
		else {
			const KeyDIDResolver = await import('key-did-resolver');
			const did_resolver = require('did-resolver');
			const Resolver = did_resolver.Resolver;
			
			const keyDidResolver = KeyDIDResolver.getResolver();
	
			const didResolver = new Resolver(keyDidResolver)
			const doc = await didResolver.resolve(did_key);
	
			return doc.didDocument;
		}

	}

	//
	// path
	getParentPath(path) {
		let parent_path = '/';
    
		if (!path) return parent_path;

		let _path = (path[0] !== '/' ? '/' + path : path);
		
		_path = (_path[_path.length - 1] === '/' ? _path.substring(0, _path.length - 1) : _path);
		
		// remove last folder
		parent_path = ( _path.lastIndexOf('/') > 0 ? _path.substring(0, _path.lastIndexOf('/')) : '/');

		return parent_path;
	}

	async getTrustChain(path) {
		let list = [];

		let curr_path = path;

		while (curr_path.length > 1) {
			let node_identifier = await this.persistor.getIdentifierFromPathAsync(curr_path);

			list.push({identifier: node_identifier, path: curr_path});

			curr_path = this.getParentPath(curr_path);
		}

		// root
		let site_root_did_key_identifier = this._getSiteRootDidKeyIdentifier();

		list.push({identifier: site_root_did_key_identifier, path: '/'});

		return list;
	}

	async _getTaoFromDidWeb(did_web) {
		let did_web_domain = this._getDidWebDomain(did_web);

		let path = this._getPathFromDidWeb(did_web);
		let node_list = await this.getTrustChain(path, did_web_domain);

		for (var i = 1; i < node_list.length; i++) {
			let _identifier = node_list[i].identifier;
			
			if (_identifier.did && (_identifier.rights & 0b00001000)) {
				let _did_web = this._getIdentifierDidWeb(_identifier, did_web_domain);
				return _did_web;
			}
		}
	}


	//
	// identifiers
	_getSiteRootDidKeyIdentifier() {
		let site_root_did_key = this._getSiteRootDidKey();

		let identifier = {did:site_root_did_key};

		identifier.identifier_status = 1;
		identifier.identifier_uuid = 'root';
		identifier.path_uuid= 'root';
		identifier.path_status = 1;
		identifier.path = '/';
		identifier.rights = 31;

		return identifier;
	}

	async _geControllingIdentifier(did_key, sub_did_web) {
		let identifier;

		if (!did_key || !sub_did_web)
		return identifier;

		let identifier_record = await this._getIdentifierFromDidKey(did_key);
		let sub_identifier_record = await this._getIdentifierFromDidWeb(sub_did_web);

		if (!identifier_record || !sub_identifier_record)
		return identifier;

		let site_root_did_key = this._getSiteRootDidKey();

		if (did_key == site_root_did_key)
		return this._getSiteRootDidKeyIdentifier();

		// we look in the path list with identifier can control this sub_did_web
		let sub_path = sub_identifier_record.path;

		let identifier_path_arr = await this._getIdentifierPathList(identifier_record.did);

		for (var i = 0; i < identifier_path_arr.length; i++) {
			let _path = identifier_path_arr[i].path;

			if (sub_path.startsWith(_path)) {
				identifier = identifier_path_arr[i]; // upper node
				break;
			}
		}
		return identifier;
	}

	_getIdentifierDidWeb(identifier, did_web_domain) {
		let _path = identifier.path;

		return this._getDidWebFromPath(_path, did_web_domain);
	}

	_getIdentifierPathRights(identifier) {
		var global = this.global;

		let site_root_did_key = this._getSiteRootDidKey();

		let rights = [];

		if (identifier.did == site_root_did_key)
		rights.push('RooTAO');

		if (identifier.rights & 0b00000001) {
			rights.push('DOC');

			if (identifier.rights & 0b00000010)
			rights.push('TR');

			if (identifier.rights & 0b00000100)
			rights.push('TI');

			if (identifier.rights & 0b00001000)
			rights.push('TAO');
		}

		return rights;
	}

	async _getIdentifierFromDidWeb(did_web) {
		let path = this._getPathFromDidWeb(did_web);

		return this._getIdentifierFromPath(path);
	}

	async _getIdentifierFromDidKey(did_key) {
		let site_root_did_key = this._getSiteRootDidKey();
		
		if (did_key == site_root_did_key)
		return this._getSiteRootDidKeyIdentifier();

		let identifier_record = await this.persistor.getIdentifierAsync(did_key);

		if (!identifier_record)
		return;

		return identifier_record;
	}

	async _getIdentifierWithPath(did_key, path) {

		let site_root_did_key = this._getSiteRootDidKey();
		
		if (did_key == site_root_did_key) {
			return this._getSiteRootDidKeyIdentifier();
		}

		let identifier_record = await this.persistor.getIdentifierWithPathAsync(did_key, path).catch(err => {});

		if (!identifier_record)
		return;

		return identifier_record;
	}


	async _getIdentifierFromPath(path) {

		if (path == '/')
		return this._getSiteRootDidKeyIdentifier();

		let identifier_record = await this.persistor.getIdentifierFromPathAsync(path);

		if (!identifier_record)
		return;

		return identifier_record;
	}

	async _getIdentifierPathList(did_key) {

		let arr = [];

		// add '/' if this did_key is also the site root key
		let site_root_did_key = this._getSiteRootDidKey();
		
		if (did_key == site_root_did_key) {
			let entry = this._getSiteRootDidKeyIdentifier();
			arr.push(entry);
		}
		else {
			arr = await this.persistor.getIdentifierPathListAsync(did_key);
		}

		return arr;
	}

	async _getIdentifierAttributeListAsync(did_key) {
		let site_root_did_key = this._getSiteRootDidKey();
		
		if (did_key == site_root_did_key) {
			// check it has been inserted in the database
			let root_identifier_record = await this.persistor.getIdentifierAsync(did_key).catch(err=>{});

			if (!root_identifier_record || !root_identifier_record.did) {
				let record = {did: did_key};

				let identifieruuid = global.guid();

				// identifier table
				record.identifier_uuid = identifieruuid;

				await this.persistor.putIdentifierAsync(record);
			}
		}

		let arr = await this.persistor.getIdentifierAttributeListAsync(did_key);

		return arr
	}

	//
	// did:key
	async did_key(session_section, options, params) {
		var json = {};

		let auth_did_key = options.auth_token.did;

		let sub_did_key  = params.did;
		let did_web_domain = params.did_web_domain;

		// check auth_did_key and sub_did_web match

		// return privy info on did_key
		json.did_webs = await this.getDidWebListFromDidKey(sub_did_key, did_web_domain);

		return json;
	}

	//
	// list, create, update, deactivate
	async did_web_list(session_section, options) {
		var json = {};

		let auth_token = options.auth_token;
		let did_key = auth_token.did;

		let did_web_domain = options.did_web_domain;

		json.did_webs = await this.getDidWebListFromDidKey(did_key, did_web_domain);

		return json;
	}

	async did_web(session_section, options, params) {
		var json = {};

		let auth_did_key = options.auth_token.did;

		let sub_did_web  = params.did;

		// check auth_did_key and sub_did_web match

		// return privy info on did_web
		json.identifier = await this._getIdentifierFromDidWeb(sub_did_web);

		json.siblings = await this.getDidWebListFromDidKey(auth_did_key);

		return json;
	}

	async did_web_create(session_section, options, params) {
		var json = {};

		let node_did_key = options.auth_token.did;
		let node_path = options.parent_path;

		let node_identifier = await this._getIdentifierWithPath(node_did_key, node_path).catch(err => {});
		let node_rights = this._getIdentifierPathRights(node_identifier);

		if (!node_rights.includes('TR'))
		return {error: 'no right to onboard did'};

		let did_key = params.did_key;
		let path = (params.path ? params.path.toLowerCase() : null);
		let did_web_domain = params.did_web_domain;

		json.path = path;

		// is identifier already inserted
		let did_identifier = await this._getIdentifierFromDidKey(did_key).catch(err => {});

		if (!did_identifier || !did_identifier.identifier_uuid) {
			let record = {did: did_key};

			let identifieruuid = session_section.guid();

			// identifier table
			record.identifier_uuid = identifieruuid;

			await this.persistor.putIdentifierAsync(record);

			did_identifier = await this._getIdentifierFromDidKey(did_key).catch(err => {});

			if (!did_identifier) {
				json = {error: 'could not insert did in identifiers'};
				return json;
			}

			json.identifieruuid = identifieruuid;
		}
		else {
			json.identifieruuid = did_identifier.identifier_uuid;
		}

		if (path) {
			let record = {path};

			// identifier path table
			let pathuuid = session_section.guid();

			record.path_uuid = pathuuid;
			record.rights = 3; // default 'DOC' and 'TR' rights

			await this.persistor.addIdentifierPath(did_key, record);

			json.pathuuid = pathuuid;
		}

		did_identifier.path = path;
		json.did = this._getIdentifierDidWeb(did_identifier, did_web_domain);

		return json;
	}

	async did_web_update(session_section, options, params) {
		var json = {};

		let sub_did_web  = params.did;
		let sub_update  = params.update;

		let sub_identifier = await this._getIdentifierFromDidWeb(sub_did_web);

		if (!sub_identifier) {
			json.error = 'did is not registered: ' + sub_did_web;
			return json;
		}

		let sub_identifier_status = sub_identifier.identifier_status;

		let sub_did_key  = sub_identifier.did;


		if (sub_update.addition && sub_update.addition.status) {
			if (sub_update.addition.status.includes('DOC'))
			sub_identifier_status = sub_identifier_status | 0b00000001; // to reactivate after deactivate

			if (sub_update.addition.status.includes('PRIV'))
			sub_identifier_status = sub_identifier_status | 0b00000010; // private, should not be shown to others
		}

		if (sub_update.removal && sub_update.removal.status) {
			if (sub_update.removal.status.includes('PRIV'))
			sub_identifier_status = sub_identifier_status & 0b11111101;
		}

		await this.persistor.updateIdentifierAsync(sub_did_key, {identifier_status: sub_identifier_status});

		json.did = sub_did_web;
		json.identifier_status = sub_identifier_status;

		return json;
	}

	async did_web_deactivate(session_section, options, params) {
		var json = {};

		let sub_did_web  = params.did;
		let sub_update  = params.update;

		let sub_identifier = await this._getIdentifierFromDidWeb(sub_did_web);

		if (!sub_identifier) {
			json.error = 'did is not registered: ' + sub_did_web;
			return json;
		}

		let sub_identifier_status = 0; // deactivate

		let sub_did_key  = sub_identifier.did;

		await this.persistor.updateIdentifierAsync(sub_did_key, {identifier_status: sub_identifier_status});

		json.did = sub_did_web;
		json.identifier_status = sub_identifier_status;


		return json;
	}

	//
	// read
   async root_did_key_document(options) {
		var json = {};

		let site_root_did_key = this._getSiteRootDidKey();

		json = await this._resolveDidKey(site_root_did_key);

		return json;
	}

	async did_key_document(options) {
		var json = {};

		let did_key = 'did:key:' + options.key;

		json = await this._resolveDidKey(did);

		let identifier_record = await this._getIdentifierFromDidKey(did_key).catch(err => {});

		if (!identifier_record) {
			json.error = 'did is not registered: ' + did_key;

			return json;
		}

		json = await this._resolveDidKey(did_key);


		return json;
	}

	async path_document(options) {
		const JwCryptoKeys = require('./includes/jw/jw-cryptokeys.js');

		var global = this.global;
		var json = {};

		let current_host = (options.current_host ? options.current_host.toLowerCase() : null);
		let path = (options.path ? options.path.toLowerCase() : null);

		if (!path) {
			json.error = 'no path defined';
			return json;
		}

		let identifier_record = await this._getIdentifierFromPath(path);

		if (!identifier_record) {
			json.error = 'No did registered for: ' + path;
			
			return json;
		}

		let did_key = identifier_record.did;
		let did_web = this._getIdentifierDidWeb(identifier_record, current_host);

		let publicKeyJWK = await this._getDidKeyJwk(did_key);

		if (!publicKeyJWK) {
			json.error = 'could not find public key of: ' + path;
			return json;
		}

		let tumbprint = await JwCryptoKeys.computeThumbprint(publicKeyJWK, 'sha256');
		let kid_web = did_web + '#' + tumbprint;

		json = await this._resolveDidKey(did_key);

		if (!json.verificationMethod) {
			json.error = 'Could not resolve key for: ' + path;
			
			return json;
		}

		json.id = did_web;

		json.verificationMethod[0].id = kid_web;
		json.verificationMethod[0].controller = did_web;

		json.authentication = [kid_web];
		json.assertionMethod = [kid_web];
		json.capabilityInvocation = [kid_web];
		json.capabilityDelegation = [kid_web];

		// add attributes signed by this did_web
		let attributes = await this._getIdentifierAttributeListAsync(did_key);

		for (var i = 0; i < (attributes ? attributes.length : 0); i++) {
			let attribute = attributes[i];

			if ((attribute.attribute_status === 1) && (attribute.reporter_did === did_key)) {
				try {
					let attribute_json = JSON.parse(attribute.attribute);

					if (attribute_json && attribute_json.key) {
						let attribute_name = attribute_json.key;
						let attribute_value = attribute_json.value;

						if (!json[attribute_name])
						json[attribute_name] = [];

						if (Array.isArray(json[attribute_name]) && attribute_value)
						json[attribute_name].push(attribute_value);
					}
				}
				catch(e) {}
			}
		}


		return json;
	}

	//
	// registry functions
	async did_registry_identifiers(pageafter, pagesize, options) {
		var json = {};

		let count = await this.persistor.getIdentifierPathListCountAsync() + 1; // + 1 for root identifer
		let items = [];

		let did_web_domain = options.did_web_domain;

		let offset;
		let chunksize;

		if (pageafter == 1) {
			// we introduce root identifier as first element
			let identifier = this._getSiteRootDidWeb(did_web_domain);
			let item = {};

			item.status = identifier.identifier_status & identifier.path_status;
			item.uuid = identifier.path_uuid;

			item.did = this._getIdentifierDidWeb(identifier, did_web_domain);
			item.rights = this._getIdentifierPathRights(identifier);

			items.push(item);

			offset = 0;
			chunksize = pagesize - 1;
		}
		else {
			offset = (pageafter - 1) * pagesize - 1;
			chunksize = pagesize;
		}

		let _identifiers = await this.persistor.getIdentifierPathChunkListAsync(offset, chunksize);

		for (var i = 0; i < _identifiers.length; i++) {
			let identifier = _identifiers[i];
			let item = {};

			item.status = identifier.identifier_status & identifier.path_status;
			item.uuid = identifier.path_uuid;

			item.did = this._getIdentifierDidWeb(identifier, did_web_domain);
			item.rights = this._getIdentifierPathRights(identifier);

			items.push(item);
		}

		json.total = count;
		json.items = items;

		return json;
	}

	_getDidWebFromPath(path, did_web_domain) {
		let site_did_web_domain = this._getSiteDidWebDomain(); // defaullt
		let site_did_web_root_path = this._getSiteDidWebRootPath(); // default
		
		if (did_web_domain && (did_web_domain !== site_did_web_domain)) {
			// check if it is an alias
			let alias_list = this._getSiteDidWebDomainAliasList();

			for (var i = 0; i < (alias_list ? alias_list.length : 0); i++) {
				let alias_entry = alias_list[i];
				if (alias_entry.domain === did_web_domain) {
					site_did_web_domain = alias_entry.domain
					site_did_web_root_path = alias_entry.root_path;
					break;
				}
			}
		}
	
		let did_web = 'did:web:' + site_did_web_domain + (site_did_web_root_path ? site_did_web_root_path.replaceAll('/', ':') : '');
		let _path = path;

		if (_path && (_path != '/')) {
			let trail = _path.replaceAll('/', ':');
			did_web += (trail && trail.length ? trail : '');
		}

		return did_web;
	}

	_getPathFromDidWeb(did_web) {

		// find did_web_host from did_web
		let did_web_domain = this._getDidWebDomain(did_web);

		let path;

		let site_did_web_entry = this._getSiteDidWebDomainEntry(did_web_domain);
		let site_did_web_domain = site_did_web_entry.domain;
		let site_did_web_root_path = site_did_web_entry.root_path;

		if (!site_did_web_domain)
		return path;

		if (!did_web)
		return path;

		if (this._isSiteRootDidWeb(did_web, did_web_domain)) {
			return '/';
		}

		let index = did_web.indexOf(site_did_web_domain);
		if (!index)
		return path;

		let offset = site_did_web_domain.length + (site_did_web_root_path ? site_did_web_root_path.length : 0);

		let trail = did_web.substring(index + offset);

		path = trail.replaceAll(':', '/');

		return path;
	}

	async getDidWebListFromDidKey(did_key, did_web_domain) {
		var array = [];

		let identifier_path_arr = await this._getIdentifierPathList(did_key);

		for (var i = 0; i < identifier_path_arr.length; i++) {
			let identifier_path_record = identifier_path_arr[i];

			let did_web = this._getIdentifierDidWeb(identifier_path_record, did_web_domain);

			array.push(did_web);
		}

		return array;
	}

	async did_registry_did_document(did_web, options) {
		var json = {};

		let did_web_domain = this._getDidWebDomain(did_web);

		let path = this._getPathFromDidWeb(did_web);

		let did_document = await this.path_document({path, current_host: did_web_domain});

		if (!did_document)
		json.error = 'identifier not found: ' + did_web;

		let identifier = await this._getIdentifierFromDidWeb(did_web);
		let identifier_status = identifier.identifier_status;

		if ((identifier_status & 0b00000001) === 0) 
		json.error = 'identifier deactivated: ' + did_web;

		if ((identifier.identifier_status) & 0b00000010 === 0) 
		json.error = 'identifier is not accessible: ' + did_web;

		let path_status = identifier.path_status;

		if ((path_status & 0b00000001) === 0) 
		json.error = 'did:web deactivated: ' + did_web;

		if (!json.error)
		json = did_document;

		return json;
	}

	async did_registry_did_document_details(did_web, options) {
		var json = {};

		let did_web_domain = this._getDidWebDomain(did_web);

		let path = this._getPathFromDidWeb(did_web);

		let did_document = await this.path_document({path, current_host: did_web_domain});

		if (!did_document)
		json.error = 'identifier not found: ' + did_web;

		let identifier = await this._getIdentifierFromDidWeb(did_web);
		let identifier_status = identifier.identifier_status;

		if ((identifier_status & 0b00000001) === 0) 
		json.error = 'identifier deactivated: ' + did_web;

		if ((identifier.identifier_status) & 0b00000010 === 0) 
		json.error = 'identifier is not accessible: ' + did_web;

		let path_status = identifier.path_status;

		if ((path_status & 0b00000001) === 0) 
		json.error = 'did:web deactivated: ' + did_web;

		if (!json.error) {
			json.did = did_web;
			json.path = path;
			json.identifier_status = identifier_status;
			json.path_status = path_status;
			json.path_rights = this._getIdentifierPathRights(identifier);
		}

		return json;

	}

	// identifier attributes
	async did_registry_identifier_attributes(did_web, options) {
		var json = {};

		let identifier_record = await this._getIdentifierFromDidWeb(did_web);

		json.did = did_web;

		let attributes = await this._getIdentifierAttributeListAsync(identifier_record.did);

		// return all attributes, even de-activated ones

		json.items = attributes;

		return json;
	}
	
	async did_registry_identifier_attribute_add(session_section, options, params) {
		const CryptoUtils = require('./includes/crypto-block/crypto-utils.js');
		const JwCryptoKeys = require('./includes/jw/jw-cryptokeys.js');


		var json = {};

		let auth_token = options.auth_token;

		let attribute_string  = params.attribute;
		let attribute_signature  = params.attribute_signature;

		let algorithm_string  = params.algorithm_string;
		let algorithm = JSON.parse(algorithm_string);

		let body  = params.body;

		let sub_did_web  = params.did;

		let sub_identifier_record = await this._getIdentifierFromDidWeb(sub_did_web);

		if (!sub_identifier_record || !sub_identifier_record.did) {
			json.error = 'did is not registered: ' + sub_did_web;

			return json;
		}

		let sub_did_key = sub_identifier_record.did;



		// check attribute
		let reporter_did_key = auth_token.did;

		let publicKeyJWK = await this._getDidKeyJwk(reporter_did_key);

		if (!publicKeyJWK) {
			json.error = 'could not find public key of: ' + path;
			return json;
		}

		let alg = algorithm.alg;
		let jwkKeyPair = {alg, publicKey: publicKeyJWK};

		let cryptoKeyPair = await JwCryptoKeys.importCryptoKeyPairFromJwk(jwkKeyPair);

		let keySet = {alg, jwkKeyPair, cryptoKeyPair};

		let verified =  await CryptoUtils.validateStringSignature(attribute_string, attribute_signature, keySet, algorithm);

		if (!verified) {
			json.error = 'signature is not valid for: ' + reporter_did_key;

			return json;
		}

		// save attribute
		let attribute_uuid = session_section.guid();


		let reporter_level = 0;
		let proof = Object.assign(algorithm, {sig: attribute_signature});
		//let reporter_signature = algorithm_string + '/' + attribute_signature; // using '/0x' as delimiter
		let reporter_signature = JSON.stringify(proof);

		// define reporter_level
		if (sub_did_key == reporter_did_key) {
			reporter_level = 1; // auto-reporting
		}
		else {
			let sub_path = sub_identifier_record.path;
			let reporter_path_arr = await this._getIdentifierPathList(reporter_did_key);

			for (var i = 0; i < reporter_path_arr.length; i++) {
				let _report_path = reporter_path_arr[i].path;

				if (sub_path && _report_path && sub_path.startsWith(_report_path)) {
					reporter_level = 2; // upper node reporting
					break;
				}
				else if (sub_path && _report_path && _report_path.startsWith(sub_path)) {
					reporter_level = 3; // lower node reporting
					break;
				}
			}

			if (reporter_level == 0)
			reporter_level = 4; // "peer reporting"
		}

		if (this._isSiteRootDiKey(reporter_did_key)) {
			// if this is the site_root_did_key reporting
			// we make sure this did_key it is in the identifier table
			let _identifier = await this.persistor.getIdentifierAsync(reporter_did_key).catch(err => []);

			if (!_identifier || !_identifier.did) {
				let record = {did: reporter_did_key};

				let identifieruuid = session_section.guid();
	
				// identifier table
				record.identifier_uuid = identifieruuid;

				await this.persistor.putIdentifierAsync(record);
			}
		}

		let record = {attribute_uuid, attribute: attribute_string, reporter_did: reporter_did_key, reporter_level, reporter_signature};

		await this.persistor.addIdentifierAttribute(sub_did_key, record);

		if (body) {
			// add body for this attribute
			await this.persistor.addIdentifierAttributeBody(sub_did_key, {attribute_uuid, body});
		}

		json.did = sub_did_web;
		json.attribute_uuid = attribute_uuid;

		return json;
	}

	async did_registry_identifier_attribute_update(session_section, options, params) {
		const CryptoUtils = require('./includes/crypto-block/crypto-utils.js');
		const JwCryptoKeys = require('./includes/jw/jw-cryptokeys.js');


		var json = {};

		let auth_token = options.auth_token;

		let attribute_cmd_string  = params.attribute_cmd_string;
		let attribute_signature  = params.attribute_signature;

		let algorithm_string  = params.algorithm_string;
		let algorithm = JSON.parse(algorithm_string);

		let sub_did_web  = params.did;

		let sub_identifier_record = await this._getIdentifierFromDidWeb(sub_did_web);

		if (!sub_identifier_record || !sub_identifier_record.did) {
			json.error = 'did is not registered: ' + sub_did_web;

			return json;
		}

		let sub_did_key = sub_identifier_record.did;


		let attribute_cmd = JSON.parse(attribute_cmd_string);


		// check command string
		let reporter_did_key = auth_token.did;

		let publicKeyJWK = await this._getDidKeyJwk(reporter_did_key);

		if (!publicKeyJWK) {
			json.error = 'could not find public key of: ' + path;
			return json;
		}

		let alg = algorithm.alg;
		let jwkKeyPair = {alg, publicKey: publicKeyJWK};

		let cryptoKeyPair = await JwCryptoKeys.importCryptoKeyPairFromJwk(jwkKeyPair);

		let keySet = {alg, jwkKeyPair, cryptoKeyPair};

		let verified =  await CryptoUtils.validateStringSignature(attribute_cmd_string, attribute_signature, keySet, algorithm);

		if (!verified) {
			json.error = 'signature is not valid for: ' + reporter_did_key;

			return json;
		}

		let reporter_level = 0;

		// compute reporter_level
		if (sub_did_key == reporter_did_key) {
			reporter_level = 1; // auto-reporting
		}
		else {
			let sub_path = sub_identifier_record.path;
			let reporter_path_arr = await this._getIdentifierPathList(reporter_did_key);

			for (var i = 0; i < reporter_path_arr.length; i++) {
				let _report_path = reporter_path_arr[i].path;

				if (sub_path && _report_path && sub_path.startsWith(_report_path)) {
					reporter_level = 2; // upper node reporting
					break;
				}
				else if (sub_path && _report_path && _report_path.startsWith(sub_path)) {
					reporter_level = 3; // lower node reporting
					break;
				}
			}

			if (reporter_level == 0)
			reporter_level = 4; // "peer reporting"
		}

		// get attribute from database
		let attribute_uuid = attribute_cmd.attribute_uuid;

		let saved_attribute = await this.persistor.getIdentifierWithAttributeAsync(sub_did_key, attribute_uuid);

		if (!saved_attribute) {
			json.error = 'attribute not found: ' + attribute_uuid;

			return json;
		}

		switch(reporter_level) {
			case 1: {
				// auto-reporting

				// can modify only auto-reporting attributes
				if (saved_attribute.reporter_level !== 1) {
					json.error = 'can not modify attributes reported by others: ' + attribute_uuid;

					return json;
				}
			}
			break;

			case 2: {
				// upper node
			}
			break;

			case 3:
			case 4: {
				// lower node reporting or "peer reporting"

				// check this is the same reporter
				if (reporter_did_key !== saved_attribute.reporter_did_key) {
					json.error = 'not original reporter of this attribute: ' + attribute_uuid;

					return json;
				}
			}
			break;
		}

		let record = {attribute_status: attribute_cmd.attribute_status};

		// update attribute status in database
		await this.persistor.updateIdentifierAttribute(sub_did_key, attribute_uuid, record)


		json.success = true;
		json.attribute_uuid = attribute_uuid;

		return json;
	}

	// trust chain
	async did_trust_chain(did_web) {
		var json = {};

		let did_web_domain = this._getDidWebDomain(did_web);

		let trust_chain = [];

		let path = await this._getPathFromDidWeb(did_web);

		let node_list = await this.getTrustChain(path, did_web_domain);

		for (var i = 1; i < node_list.length; i++) {
			let _identifier = node_list[i].identifier;
			let _did_web = await this._getIdentifierDidWeb(_identifier, did_web_domain);
			let entry = {did: _did_web};

			entry.rights = this._getIdentifierPathRights(_identifier);

			trust_chain.push(entry);
		}

		json = trust_chain;

		return json;
	}
	

	// issuers
	async did_registry_issuers(pageafter, pagesize, options) {
		var json = {};

		let did_web_domain = options.did_web_domain;

		let count = await this.persistor.getIssuerListCountAsync() + 1; // + 1 for root issuer
		let items = [];


		let offset;
		let chunksize;


		if (pageafter == 1) {
			// we introduce root issuer as first element
			let identifier = this._getSiteRootDidWeb(did_web_domain);
			let item = {};

			item.status = identifier.identifier_status & identifier.path_status;
			item.uuid = identifier.path_uuid;

			item.did = this._getIdentifierDidWeb(identifier, did_web_domain);
			item.rights = this._getIdentifierPathRights(identifier);

			items.push(item);

			offset = 0;
			chunksize = pagesize - 1;
		}
		else {
			offset = (pageafter - 1) * pagesize - 1;
			chunksize = pagesize;
		}

		let _issuers = await this.persistor.getIssuerChunkListAsync(offset, chunksize);

		for (var i = 0; i < _issuers.length; i++) {
			let issuer = _issuers[i];
			let item = {};

			item.status = issuer.identifier_status & issuer.path_status;
			item.uuid = issuer.path_uuid;

			item.did = this._getIdentifierDidWeb(issuer, did_web_domain);
			item.rights = this._getIdentifierPathRights(issuer);

			items.push(item);
		}

		json.total = count;
		json.items = items;

		return json;
	}

	async did_registry_issuer(did_web, options) {
		var global = this.global;

		var json = {};

		let did_web_domain = this._getDidWebDomain(did_web);

		if (!did_web_domain)
		return json;

		let index = did_web.indexOf(did_web_domain);
		let length = did_web_domain.length;

		if (!index)
		return json;

		let path = this._getPathFromDidWeb(did_web);

		let did_document = await this.path_document({path, current_host: did_web_domain});

		if (!did_document)
		json.error = 'identifier not found: ' + did_web;

		let attributes = [];

		let sub_identifier = await this._getIdentifierFromDidWeb(did_web);

		if (sub_identifier) {
			let sub_rights = sub_identifier.rights;

			if (sub_rights & 0b00000100) {
				let attribute = {uuid: sub_identifier.identifier_uuid + '_ti_right'};
	
				attribute.issuerType = 'TI';
				attribute.tao = await this._getTaoFromDidWeb(did_web);
				attribute.rootTao = this._getSiteRootDidWeb(did_web_domain);
	
				attributes.push(attribute);
			}
	
			if (sub_rights & 0b00001000) {
				let attribute = {uuid: sub_identifier.identifier_uuid + '_tao_right'};
	
				attribute.issuerType = 'TAO';
				attribute.tao = await this._getTaoFromDidWeb(did_web);
				attribute.rootTao = this._getSiteRootDidWeb(did_web_domain);
	
				attributes.push(attribute);
			}
				
			if (sub_rights & 0b00010000) {
				let attribute = {uuid: sub_identifier.identifier_uuid + '_roottao_right'};
	
				attribute.issuerType = 'RootTAO';
				attribute.tao = await this._getTaoFromDidWeb(did_web);
				attribute.rootTao = this._getSiteRootDidWeb(did_web_domain);
	
				attributes.push(attribute);
			}
		}
		
		// add attributes signed by this upper nodes
		let did_key = sub_identifier.did;
		let arr = await this._getIdentifierAttributeListAsync(did_key);

		for (var i = 0; i < (arr ? arr.length : 0); i++) {
			let attr = arr[i];

			if ((attr.attribute_status === 1) && (attr.reporter_level === 2)) {
				try {
					let attribute_json = JSON.parse(attr.attribute);

					if (attribute_json && attribute_json.key) {
						let attribute_name = attribute_json.key;
						let attribute_value = attribute_json.value;

						let attribute = {uuid: attr.attribute_uuid};

						attribute[attribute_name] = attribute_value;
						attribute.body = attr.body;

						attributes.push(attribute);
					}
				}
				catch(e) {}
			}
		}


		json.attributes = attributes;

		return json;

	}

	async did_issuer_create(session_section, options, params) {
		var json = {};

		let auth_token = options.auth_token;
		let node_did_key = auth_token.did;

		let sub_did_web  = params.did;

		let node_identifier = await this._geControllingIdentifier(node_did_key, sub_did_web);
		
		let node_rights = this._getIdentifierPathRights(node_identifier);

		if (!node_rights.includes('TAO'))
		return {error: 'no right to make did an issuer: ' + sub_did_web};

		let sub_identifier = await this._getIdentifierFromDidWeb(sub_did_web);

		let sub_path_uuid = sub_identifier.path_uuid;
		let sub_rights = sub_identifier.rights;

		sub_rights = sub_rights | 0b00000100;

		await this.persistor.updateIdentifierPath(sub_path_uuid, {rights: sub_rights});

		json.path_uuid = sub_path_uuid;

		return json;
	}


	async did_issuer_update(session_section, options, params) {
		var json = {};

		let auth_token = options.auth_token;
		let node_did_key = auth_token.did;

		let sub_did_web  = params.did;
		let sub_update  = params.update;

		let node_identifier = await this._geControllingIdentifier(node_did_key, sub_did_web);
		
		let node_rights = this._getIdentifierPathRights(node_identifier);

		if (!node_rights.includes('TAO'))
		return {error: 'no right to update issuer: ' + sub_did_web};

		let sub_identifier = await this._getIdentifierFromDidWeb(sub_did_web);

		let sub_path_uuid = sub_identifier.path_uuid;
		let sub_rights = sub_identifier.rights;
		let sub_path_status = sub_identifier.path_status;

		if (sub_update.addition && sub_update.addition.rights) {
			if (sub_update.addition.rights.includes('DOC'))
			sub_rights = sub_rights | 0b00000001; // to reactivate after deactivate

			if (sub_update.addition.rights.includes('TR'))
			sub_rights = sub_rights | 0b00000010;

			if (sub_update.addition.rights.includes('TI'))
			sub_rights = sub_rights | 0b00000100;

			if (sub_update.addition.rights.includes('TAO'))
			sub_rights = sub_rights | 0b00001000;
		}

		if (sub_update.removal && sub_update.removal.rights) {
			if (sub_update.removal.rights.includes('TR'))
			sub_rights = sub_rights & 0b11111101;

			if (sub_update.removal.rights.includes('TI'))
			sub_rights = sub_rights | 0b11111011;

			if (sub_update.removal.rights.includes('TAO'))
			sub_rights = sub_rights | 0b11110111;
		}


		await this.persistor.updateIdentifierPath(sub_path_uuid, {rights: sub_rights, path_status: sub_path_status});

		json.path_uuid = sub_path_uuid;

		return json;
	}

	async did_issuer_deactivate(session_section, options, params) {
		var json = {};

		let auth_token = options.auth_token;
		let node_did_key = auth_token.did;

		let sub_did_web  = params.did;
		let sub_update  = params.update;

		let node_identifier = await this._geControllingIdentifier(node_did_key, sub_did_web);
		
		let node_rights = this._getIdentifierPathRights(node_identifier);

		if (!node_rights.includes('TAO'))
		return {error: 'no right to deactivate issuer: ' + sub_did_web};

		let sub_identifier = await this._getIdentifierFromDidWeb(sub_did_web);

		let sub_path_uuid = sub_identifier.path_uuid;
		let sub_path_status = sub_identifier.path_status;

		await this.persistor.updateIdentifierPath(sub_path_uuid, {rights: 0, path_status: sub_path_status});

		json.path_uuid = sub_path_uuid;

		return json;
	}

	//
	// credentials
	async issuer_credential_status_history(options, params) {
		let json = {};

		let did_web_domain = options.did_web_domain;

		let credential_hash = params.credential_hash;

		let credential_status_list = await this.persistor.getCredentialStatusHistoryAsync(credential_hash);

		let history_list = [];

		for (var i = 0; i < credential_status_list.length; i++) {
			let item = {};

			item.credential_hash = credential_status_list[i].credential_hash;
			item.credential_status = credential_status_list[i].credential_status;
			item.modified_on = credential_status_list[i].modified_on;
			item.path = credential_status_list[i].modifier_path;
			item.did = this._getDidWebFromPath(credential_status_list[i].modifier_path, did_web_domain);

			history_list.push(item);
		}

		json.items = history_list;

		return json;
	}

	async issuer_credential_status_modifications_list(options, params) {
		let json = {};

		let credential_hash = params.credential_hash;
		let modifier_did_web = params.modifier_did;

		let modifier_identifier = await this._getIdentifierFromDidWeb(modifier_did_web);
		let modifier_path = modifier_identifier.path;

		let credential_status_list = await this.persistor.getCredentialStatusListAsync(credential_hash, modifier_path);

		let modifications_list = [];

		for (var i = 0; i < credential_status_list.length; i++) {
			let item = {};

			item.credential_hash = credential_status_list[i].credential_hash;
			item.credential_status = credential_status_list[i].credential_status;
			item.modified_on = credential_status_list[i].modified_on;

			modifications_list.push(item);
		}

		json.items = modifications_list;

		return json;
	}

	async issuer_credential_revoke(session_section, options, params) {
		let json = {};

		let auth_token = options.auth_token;
		let modifier_did_key = auth_token.did;

		let credential_hash = params.credential_hash;
		let as_did_web = params.as_did;

		//let identifier_record = await this._getIdentifierFromDidKey(modifier_did_key).catch(err => {});
		let identifier_record = await this._getIdentifierFromDidWeb(as_did_web).catch(err => {});

		if (!identifier_record) {
			json.error = 'did is not registered: ' + as_did_web;

			return json;
		}

		let record = {};

		record.modifier_path = identifier_record.path;
		record.credential_hash = credential_hash;
		record.credential_status = 0;

		await this.persistor.putCredentialStatusAsync(record);

		json.credential_hash = credential_hash;
		json.credential_status = record.credential_status;

		return json;
	}

	async issuer_credential_enact(session_section, options, params) {
		let json = {};

		let auth_token = options.auth_token;
		let modifier_did_key = auth_token.did;

		let credential_hash = params.credential_hash;
		let as_did_web = params.as_did;

		//let identifier_record = await this._getIdentifierFromDidKey(modifier_did_key).catch(err => {});
		let identifier_record = await this._getIdentifierFromDidWeb(as_did_web).catch(err => {});

		if (!identifier_record) {
			json.error = 'did is not registered: ' + as_did_web;

			return json;
		}

		let record = {};

		record.modifier_path = identifier_record.path;
		record.credential_hash = credential_hash;
		record.credential_status = 1;

		await this.persistor.putCredentialStatusAsync(record);

		json.credential_hash = credential_hash;
		json.credential_status = record.credential_status;

		return json;
	}
}
 
module.exports = DidRegistriesServer;