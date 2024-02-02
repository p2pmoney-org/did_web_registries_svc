class AuthorizationServer {
	constructor(service) {
	   this.service = service;
	   this.global = service.global;

	   var Persistor = require('./interface/database-persistor.js');

	   this.persistor =  new Persistor(service);
   }

   	// openid
	async openid_configuration(options) {
		var global = this.global;
		var json = {};

		let site_did_web_api_path = global.getConfigValue('site_did_web_api_path');

		json.authorization_endpoint = site_did_web_api_path + '/authorization/authentication-requests';

		return json;
	}

	// api authorization
   async isSiteAdminApiCall(api_secret) {
		var global = this.global;

		let site_api_secret = global.getConfigValue('site_api_secret');

		return (site_api_secret && (site_api_secret == api_secret) ? true : false);
	}

	// siop sequence
	async _getSiteKeySet(alg) {
		var global = this.global;

		const JwCryptoKeys = require('./includes/jw/jw-cryptokeys.js');

		let site_private_key = global.getConfigValue('site_private_key');
		
		// build a KeySet from this hex private key
		let privateKeyJWK = await JwCryptoKeys.importPrivateKeyJwk(site_private_key, alg);
		let publicKeyJWK = await JwCryptoKeys.getPublicKeyJwk(privateKeyJWK);

		let jwkKeyPair = {publicKey: publicKeyJWK, privateKey: privateKeyJWK};

		let cryptoKeyPair = await await JwCryptoKeys.importCryptoKeyPairFromJwk(jwkKeyPair);

		let keySet = {alg, jwkKeyPair, cryptoKeyPair};

		return keySet;
	}

	async getAuthToken(access_token) {
		let auth_token = {authenticated: false};

		// decrypt access_token with site_private_key 

		// decode access token;
		const JWT = require('./includes/jw/jwt.js');

		let access_token_obj = await JWT.decodeJWT(access_token);

		// validate access token;
		if (access_token_obj) {
			auth_token.authenticated = true
			auth_token.did = access_token_obj.payload.sub;
		}

		return auth_token;
	}

	async authorization_challenge(session_section, options, params) {
		var global = this.global;
		var json = {};

		let alg = 'ES256';

		const Did = require('./includes/did/did.js');
		const JWT = require('./includes/jw/jwt.js');
		

		// get site keySet
		const keySet = await this._getSiteKeySet(alg);

		// get site did:key
		let site_did_key = await Did.buildDidFromKeySet(keySet, 'key');
		let site_kid_key = await Did.computeKid(site_did_key, keySet)

		// build an id_token for the site
		let _options = {};

		_options.sub_did = site_did_key;
		_options.sub_kid = site_kid_key;

		_options.iss_kid = site_kid_key;

		_options.client_id = options.client_id;

		_options.jti_uuid = session_section.guid();
		_options.nonce = session_section.guid();

		let id_token = await JWT.getIdTokenJwt(keySet, alg, _options);

		json.code = id_token;

		return json;
	}

	_validateChallengeResponse(code_obj, id_token_obj) {

		if (code_obj.payload.nonce == id_token_obj.payload.nonce)
			return true;

		return false;
	}

	async authorization_siop_sessions(session_section, options, params) {
		var global = this.global;
		var json = {};

		let alg = 'ES256';

		const Did = require('./includes/did/did.js');
		const JWT = require('./includes/jw/jwt.js');


		let grant_type  = params.grant_type;
		let code = params.code;
		let id_token = params.id_token;

		let code_obj = await JWT.decodeJWT(code);
		let id_token_obj = await JWT.decodeJWT(id_token);

		if (!this._validateChallengeResponse(code_obj, id_token_obj))
			return Promise.reject('challenge is not met');

		// build an access token

		// get site keySet
		const keySet = await this._getSiteKeySet(alg);
		
		// get site did:key
		let site_did_key = await Did.buildDidFromKeySet(keySet, 'key');
		let site_kid_key = await Did.computeKid(site_did_key, keySet)

		let header = {alg};

		let payload = {};

		payload.sub = id_token_obj.payload.sub;
		payload.iss = site_did_key;

		payload.nonce = code_obj.payload.nonce;

		let jwt_obj = await JWT.getObject(header, payload);

		let access_token_jwt_plain = await jwt_obj._createJWTFromKeySet(keySet);

		// encrypt it with site_private_key

		json.token_type = 'Bearer';
		json.access_token = access_token_jwt_plain;

		return json;
	}
}
 
module.exports = AuthorizationServer;