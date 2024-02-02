class JwCryptoKeys {

	//
	// JWK keys
	static _getJwkKeySigningAlg(jwk) {
		let signingAlg = 'ES256';

		if (!jwk)
			return signingAlg;

		switch(jwk.crv) {
			case 'P-256':
				signingAlg = "ES256";
				break;
			case 'secp256k1':
				signingAlg = 'ES256K';
				break;
			default:
				throw new Error(`Curve ${jwk.crv} not supported`);
		}

		return signingAlg;
	}	
	
	static async importPrivateKeyJwk(privateKeyHex, signingAlg){
		const _Buffer = Buffer;

		const jose = require('jose');

		let publicKeyJWK;

 		switch (signingAlg) {
			case "ES256K": {
 				let EC = require('elliptic').ec;

				let ec = new EC('secp256k1'); 

				// import key
				let keyPair = ec.keyFromPrivate(privateKeyHex.split('x')[1]);
				
				let pubPoint = keyPair.getPublic();
				let xBN = pubPoint.getX();
				let yBN = pubPoint.getY();

				let xbuf = xBN.toArrayLike(_Buffer);
				let ybuf = yBN.toArrayLike(_Buffer);

				let x64url = jose.base64url.encode(xbuf);
				let y64url = jose.base64url.encode(ybuf);

				publicKeyJWK = {
					alg: "ES256K",
					kty: "EC",
					crv: "secp256k1",
					x: x64url,
					y: y64url
				};
			}
			break;

			case "ES256": {
 				let EC = require('elliptic').ec;

				//let ec = new EC('secp256k1'); 
				let ec = new EC('p256');

				// import key
				let keyPair = ec.keyFromPrivate(privateKeyHex.split('x')[1]);
				
				let pubPoint = keyPair.getPublic();
				let xBN = pubPoint.getX();
				let yBN = pubPoint.getY();

				let xbuf = xBN.toArrayLike(_Buffer);
				let ybuf = yBN.toArrayLike(_Buffer);

				let x64url = jose.base64url.encode(xbuf);
				let y64url = jose.base64url.encode(ybuf);

				publicKeyJWK = {
					alg: "ES256",
					kty: "EC",
					crv: "P-256",
					x: x64url,
					y: y64url
				};
			}
			break;

			case "EdDSA": {
				throw new Error(`Algorithm ${signingAlg} not supported`);
			}
			break;

			default:
			  throw new Error(`Algorithm ${signingAlg} not supported`);
		};

		// build JWK private key
		const d = _Buffer.from(privateKeyHex.split('x')[1], "hex")
		  .toString("base64")
		  .replace(/\+/g, "-")
		  .replace(/\//g, "_")
		  .replace(/=/g, "");

		let privateKeyJWK = { ...publicKeyJWK, d };

		privateKeyJWK.alg = signingAlg; // note alg for CryptoKey imports/exports
		privateKeyJWK.ext = true;

		return privateKeyJWK;
	}

	static async getPublicKeyJwk(privateJwk) {
		const signingAlg = JwCryptoKeys._getJwkKeySigningAlg(privateJwk);

		switch (signingAlg) {
		  case "ES256K":
		  case "ES256":
		  case "EdDSA": {
			const { d, ...publicJwk } = privateJwk;
			// TODO: maybe we should change key_ops to ['verify'];
			return publicJwk;
		  }
		  case "RS256": {
			const { d, p, q, dp, dq, qi, ...publicJwk } = privateJwk;
			return publicJwk;
		  }
		  default:
			throw new Error(`Algorithm ${signingAlg} not supported`);
		}
	}

	static getJwkKeyAlg(publicJwk) {
		let alg = 'ES256';

		if (!publicJwk)
			return alg;

		switch(publicJwk.crv) {
			case 'P-256':
				alg = "ES256";
				break;
			case 'secp256k1':
				alg = 'ES256K';
				break;
			default:
				throw new Error(`Curve ${publicJwk.crv} not supported`);
		}

		return alg;
	}

	static async computeThumbprint(publicJwk, crpt = 'sha256') {
		// we compute the thumbprint of publickey
		const jose = require('jose');

		return jose.calculateJwkThumbprint(publicJwk, crpt);
	}


	static async importJwkKeyPair(privateKeyHex, signingAlg) {
		let privKeyJWK = await JwCryptoKeys.importPrivateKeyJwk(privateKeyHex, signingAlg);
		let pubKeyJWK = await JwCryptoKeys.getPublicKeyJwk(privKeyJWK);

		const jwkKeyPair = {privateKey: privKeyJWK, publicKey: pubKeyJWK};

		return jwkKeyPair;

	}


	//
	// CryptoKey keys
	static async importCryptoKeyFromJwk(jwkKey) {
		const jose = require('jose');

		let signingAlg = jwkKey.alg;
		let importAlg;

		switch (signingAlg) {
			case "ES256K": {
				throw new Error('can not import secp256k1 curve');
			}
			break;
			case "ES256": {
				importAlg = "ES256";
			}
			break;
			default:
				throw new Error(`Algorithm ${signingAlg} not supported`);
		};

		let cryptoKey = await jose.importJWK(jwkKey, importAlg);

		return cryptoKey;
	}

	static async importCryptoKeyPairFromJwk(jwkKeyPair) {
		const jose = require('jose');

		let signingAlg = (jwkKeyPair.privateKey ? jwkKeyPair.privateKey.alg : jwkKeyPair.alg);
		let importAlg;

		switch (signingAlg) {
			case "ES256K": {
				throw new Error('can not import secp256k1 curve');
			}
			break;
			case "ES256": {
				importAlg = "ES256";
			}
			break;
			default:
				throw new Error(`Algorithm ${signingAlg} not supported`);
		};

		let cryptoPrivKey = (jwkKeyPair.privateKey ? await jose.importJWK(jwkKeyPair.privateKey, importAlg) : null);
		let cryptoPubKey = await jose.importJWK(jwkKeyPair.publicKey, importAlg);

		const cryptoKeyPair = {privateKey: cryptoPrivKey, publicKey: cryptoPubKey};

		return cryptoKeyPair;
	}

}
 
module.exports = JwCryptoKeys;