class JWT {

	constructor(header, body) {
		this.header = header;
		this.body = body;
	}


	async _createJWTFromKeySet(keySet) {
		const publicJwk = keySet.jwkKeyPair.publicKey;

		let signingAlg = keySet.alg;

		let header = Object.assign({}, this.header);
		let body = Object.assign({}, this.body);

		header.alg = signingAlg;
		header.jwk = publicJwk;

		switch(signingAlg) {
			case 'ES256': {
				const jose = require('jose');

				let privateCrypto = keySet.cryptoKeyPair.privateKey;

				let jwt = await new jose.SignJWT(body)
				.setProtectedHeader(header)
				.sign(privateCrypto);
		
				return jwt;
			}
			case 'ES256K': {
				const jsontokens = require('jsontokens');

				if (!keySet.canExportHexPrivateKey())
					throw new Error('key set can not export private key');

				let priv_key = await keySet.exportHexPrivateKey();

				let jwt = new jsontokens.TokenSigner('ES256K', priv_key.split('x')[1]).sign(body, false, header);
		
				return jwt;
			}
			default:
				throw new Error(`Algorithm ${signingAlg} not supported`);

		}
	}

	// static
	static async decodeJWT(jwt) {
		/*const jose = require('jose');

		let data = await jose.decodeJwt(jwt)
		.catch( err => {
			console.log('error in _decodeDidJWT: ' + err);
		});

		return data; */

		const jsontokens = require('jsontokens');

		return jsontokens.decodeToken(jwt);
	}

	static async validateJWTSigning(session, jwt) {
	}

	static async getIdTokenJwt(keySet, alg, options) {

		let sub_did = options.sub_did;
		let sub_kid = options.sub_kid;

		let iss_did = options.iss_did;
		let iss_kid = options.iss_kid;

		let client_id = options.client_id;
		let aud = options.aud;


		let header = { alg,	typ: "JWT" };

		header.kid = (iss_kid ? iss_kid : sub_kid);

		let payload = {	};

		let nowDate = new Date;
		let now = nowDate.getTime();

		let expiration = now + 60*60*1000; // 1 hour

		// payload
		payload.jti = 'urn:did:' + options.jti_uuid;
		payload.sub = sub_did;
		payload.iss = client_id;
		payload.nbf = Math.floor(now / 1000);
		payload.iat = Math.floor(now / 1000);
		payload.exp = Math.floor(expiration / 1000);
		payload.aud = sub_did;
		payload.nonce = options.nonce;
 

		// create jwt
		let jwt_obj = JWT.getObject(header, payload);

		let jwt = await jwt_obj._createJWTFromKeySet(keySet);

		return jwt;
	}

	static getObject(header, body) {
		return new JWT(header, body);
	}
}
 
module.exports = JWT;