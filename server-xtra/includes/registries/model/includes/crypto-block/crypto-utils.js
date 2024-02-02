class CryptoUtils {

	// signature
	static async signString(plaintext, keySet, algorithm) {
		const crypto = require('crypto');

		let signature;

		let cryptoPrivateKey = keySet.cryptoKeyPair.privateKey;

		let hash = algorithm.hash;

		const sign =  crypto.createSign(hash);
		sign.write(plaintext);
		sign.end();
		let signature_buf = sign.sign(cryptoPrivateKey);

		signature = '0x' + signature_buf.toString('hex');

		return signature;
	}

	static async validateStringSignature(plaintext, signature, keySet, algorithm) {
		let verified;

		const crypto = require('crypto');

		let hash = algorithm.hash;

		let cryptoPublicKey = keySet.cryptoKeyPair.publicKey;

		const verify = crypto.createVerify(hash);
		verify.write(plaintext);
		verify.end();

		let signature_buf = Buffer.from(signature.split('x')[1], 'hex')

		verified = verify.verify(cryptoPublicKey, signature_buf);

		return verified;
	}

}
 
module.exports = CryptoUtils;