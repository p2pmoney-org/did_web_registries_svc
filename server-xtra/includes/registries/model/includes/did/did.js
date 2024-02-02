class Did {

	static async buildDidFromKeySet(keySet, did_method) {

		switch(did_method) {
			case 'key': {
				let alg = keySet.alg;

				switch (alg) {
					case 'ES256':{
						const Ebsi_key_did_resolver = require('@cef-ebsi/key-did-resolver');
						const ebsi_key_did_resolver = Ebsi_key_did_resolver.util;

						let jwk = keySet.jwkKeyPair.publicKey;
				
						let key_did = ebsi_key_did_resolver.createDid(jwk);
				
						return key_did;
					}

					default:
						return Promise.reject('algorithm not supported: ' + alg);
		
				}
		
			}

			default:
				return Promise.reject('did method not supported: ' + did_method);
		}

	}

	static async computeKid(did, keySet) {

		let did_method = Did.getDidMethod(did);

		const jose = require('jose');

		switch(did_method) {
			case 'key': {
				//const kid = `${did}#owner1`;
				let parts = did.split(':')
				const kid = did + '#' + parts[2];
		
				return kid;
			}

			default:
				return Promise.reject('did method not supported: ' + did_method);
		}
	}

	static getDidMethod(did) {
		var parts = did.split(':');

		return parts[1];
	}
}
 
module.exports = Did;