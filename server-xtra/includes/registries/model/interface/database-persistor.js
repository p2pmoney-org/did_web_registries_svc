class DataBasePersistor {
	constructor(service) {
		this.service = service;
		this.global = service.global;
	}

	//
	// did:key pages
	async getIdentifierListCountAsync() {
		var global = this.global;
		
		var mysqlcon = await global.getMySqlConnectionAsync();
		
		var tablename = mysqlcon.getTableName('registries_identifiers');

		var sql = "SELECT COUNT(IdentifierId) AS IdentifierCount FROM " + tablename+ ";";
		
		// open connection
		await mysqlcon.openAsync();
		
		// execute query
		var result = await mysqlcon.executeAsync(sql);
		
		
		var count = -1;
		
		if (result) {
			var rows = (result['rows'] ? result['rows'] : []);
			
			if (rows[0]) {
				var row = rows[0];
			
				count = row.IdentifierCount;
			}
		}
		
		
		// close connection
		await mysqlcon.closeAsync();
			
			
		return count;
	}


	async getIdentiferChunkListAsync(pageafter, pagesize) {
		var global = this.global;
		
		var array = [];
		
		var mysqlcon = await global.getMySqlConnectionAsync();
		
		var tablename = mysqlcon.getTableName('registries_identifiers');

		let offset = (pageafter > 1 ? pageafter - 1 : 0) * pagesize;

		var sql = "SELECT * FROM " + tablename;
		sql += " LIMIT " + offset + "," + pagesize + ";";
		
		// open connection
		await mysqlcon.openAsync();
		
		// execute query
		var result = await mysqlcon.executeAsync(sql);
		
		
		if (result) {
			var rows = (result['rows'] ? result['rows'] : []);
			
			for (var i = 0; i < rows.length; i++) {
				var row = rows[i];
				var record = {};
				
				record['id'] = row.IdentifierId;
				record['uuid'] = row.IdentifierUUID;

				record['did'] = row.DidKey;
				record['identifierstatus'] = row.IdentifierStatus;

				array.push(record);
			}
			
		}
		
		
		// close connection
		await mysqlcon.closeAsync();
			
			
		return array;
	}

	//
	// did:web pages
	async getIdentifierPathListCountAsync() {
		var global = this.global;
		
		var mysqlcon = await global.getMySqlConnectionAsync();
		
		var tablename = mysqlcon.getTableName('registries_identifiers');
		var pathstablename = mysqlcon.getTableName('registries_identifier_paths');

		var sql = "SELECT COUNT(" + tablename + ".IdentifierId) AS IdentifierCount FROM " + tablename;

		sql += " INNER JOIN " + pathstablename;
		sql += " ON " + tablename + ".IdentifierId=" + pathstablename + ".IdentifierId";
		sql += ";";
		
		// open connection
		await mysqlcon.openAsync();
		
		// execute query
		var result = await mysqlcon.executeAsync(sql);
		
		
		var count = -1;
		
		if (result) {
			var rows = (result['rows'] ? result['rows'] : []);
			
			if (rows[0]) {
				var row = rows[0];
			
				count = row.IdentifierCount;
			}
		}
		
		
		// close connection
		await mysqlcon.closeAsync();
			
			
		return count;
	}


	async getIdentifierPathChunkListAsync(pageafter, pagesize) {
		var global = this.global;
		
		var array = [];
		
		
		var mysqlcon = await global.getMySqlConnectionAsync();
		
		var tablename = mysqlcon.getTableName('registries_identifiers');
		var pathstablename = mysqlcon.getTableName('registries_identifier_paths');

		let offset = (pageafter > 1 ? pageafter - 1 : 0) * pagesize;

		var sql = "SELECT * FROM " + tablename;

		sql += " INNER JOIN " + pathstablename;
		sql += " ON " + tablename + ".IdentifierId=" + pathstablename + ".IdentifierId";

		sql += " LIMIT " + offset + "," + pagesize + ";";
		
		// open connection
		await mysqlcon.openAsync();
		
		// execute query
		var result = await mysqlcon.executeAsync(sql);
		
		
		if (result) {
			var rows = (result['rows'] ? result['rows'] : []);
			
			for (var i = 0; i < rows.length; i++) {
				var row = rows[i];
				var record = {};
				
				record['identifier_uuid'] = row['IdentifierUUID'];
				record['identifier_status'] = row['IdentifierStatus'];

				record['did'] = row['DidKey'];

				record['path_uuid'] = row['PathUUID'];
				record['path_status'] = row['PathStatus'];
				record['path'] = row['Path'];
				record['rights'] = row['Rights'];


				array.push(record);
			}
			
		}
		

		// close connection
		await mysqlcon.closeAsync();
			
			
		return array;
	}

	//
	// issuers pages
	async getIssuerListCountAsync() {
		var global = this.global;
		
		var mysqlcon = await global.getMySqlConnectionAsync();
		
		var tablename = mysqlcon.getTableName('registries_identifiers');
		var pathstablename = mysqlcon.getTableName('registries_identifier_paths');

		var sql = "SELECT COUNT(" + tablename + ".IdentifierId) AS IdentifierCount FROM " + tablename;

		sql += " INNER JOIN " + pathstablename;
		sql += " ON " + tablename + ".IdentifierId=" + pathstablename + ".IdentifierId";
		sql += " WHERE " + pathstablename + ".Rights & 1 = 1 AND (" + pathstablename + ".Rights & 4 = 4 OR " + pathstablename + ".Rights & 8 = 8)";
		sql += ";";
		
		// open connection
		await mysqlcon.openAsync();
		
		// execute query
		var result = await mysqlcon.executeAsync(sql);
		
		
		var count = -1;
		
		if (result) {
			var rows = (result['rows'] ? result['rows'] : []);
			
			if (rows[0]) {
				var row = rows[0];
			
				count = row.IdentifierCount;
			}
		}
		
		
		// close connection
		await mysqlcon.closeAsync();
			
			
		return count;
	}
	
	async getIssuerChunkListAsync(pageafter, pagesize) {
		var global = this.global;
		
		var array = [];
		
		
		var mysqlcon = await global.getMySqlConnectionAsync();
		
		var tablename = mysqlcon.getTableName('registries_identifiers');
		var pathstablename = mysqlcon.getTableName('registries_identifier_paths');

		let offset = (pageafter > 1 ? pageafter - 1 : 0) * pagesize;

		var sql = "SELECT * FROM " + tablename;

		sql += " INNER JOIN " + pathstablename;
		sql += " ON " + tablename + ".IdentifierId=" + pathstablename + ".IdentifierId";

		sql += " WHERE " + pathstablename + ".Rights & 1 = 1 AND (" + pathstablename + ".Rights & 4 = 4 OR " + pathstablename + ".Rights & 8 = 8)";

		sql += " LIMIT " + offset + "," + pagesize + ";";
		
		// open connection
		await mysqlcon.openAsync();
		
		// execute query
		var result = await mysqlcon.executeAsync(sql);
		
		
		if (result) {
			var rows = (result['rows'] ? result['rows'] : []);
			
			for (var i = 0; i < rows.length; i++) {
				var row = rows[i];
				var record = {};
				
				record['identifier_uuid'] = row['IdentifierUUID'];
				record['identifier_status'] = row['IdentifierStatus'];

				record['did'] = row['DidKey'];

				record['path_uuid'] = row['PathUUID'];
				record['path_status'] = row['PathStatus'];
				record['path'] = row['Path'];
				record['rights'] = row['Rights'];


				array.push(record);
			}
			
		}
		

		// close connection
		await mysqlcon.closeAsync();
			
			
		return array;
	}

	//
	// Identifier
	async _getIdentifierFromIdAsync(identifierId) {
		var global = this.global;
		
		var record = {};
		
	
		var mysqlcon = await global.getMySqlConnectionAsync();
		
		var tablename = mysqlcon.getTableName('registries_identifiers');

		var _identifierId = await mysqlcon.escapeAsync(identifierId);
		
		var sql = "SELECT * FROM " + tablename + " WHERE " + tablename + ".IdentifierId = " + _identifierId + ";";
		
		// open connection
		await mysqlcon.openAsync();
		
		// execute query
		var result = await mysqlcon.executeAsync(sql);		
		
		if (result) {
			var rows = (result['rows'] ? result['rows'] : []);
			
			if (rows[0]) {
				var row = rows[0];
				
				record['id'] = row.IdentifierId;
				record['uuid'] = row.IdentifierUUID;

				record['identifier_uuid'] = row.IdentifierUUID;
				record['did'] = row.DidKey;
				record['identifierstatus'] = row.IdentifierStatus;
			}
			
		}
		
		
		// close connection
		await mysqlcon.closeAsync();
			
			
		return record;
	}

	async _getIdentifierAsyncFromUUID(identifier_uuid) {
		var global = this.global;
		
		var record = {};
		
		if (!identifier_uuid)
			return;
		
		var mysqlcon = await global.getMySqlConnectionAsync();
		
		var tablename = mysqlcon.getTableName('registries_identifiers');

		var _identifier_uuid = await mysqlcon.escapeAsync(identifier_uuid);
		
		var sql = "SELECT * FROM " + tablename + " WHERE IdentifierUUID = " + _identifier_uuid + ";";
		
		// open connection
		await mysqlcon.openAsync();
		
		// execute query
		var result = await mysqlcon.executeAsync(sql);
		
		
		if (result) {
			var rows = (result['rows'] ? result['rows'] : []);
			
			if (rows[0]) {
				var row = rows[0];
				
				record['id'] = row.IdentifierId;
				record['uuid'] = row.IdentifierUUID;

				record['identifier_uuid'] = row.IdentifierUUID;
				record['did'] = row.DidKey;
				record['identifierstatus'] = row.IdentifierStatus;
			}
			
		}
		
		
		// close connection
		await mysqlcon.closeAsync();
			
			
		return record;
	}

	async _getIdentifierAsyncFromDid(did) {
		var global = this.global;
		
		var record = {};
		
		if (!did)
			return record;

		
		var mysqlcon = await global.getMySqlConnectionAsync();
		
		var tablename = mysqlcon.getTableName('registries_identifiers');
		var pathstablename = mysqlcon.getTableName('registries_identifier_paths');

		var _did = await mysqlcon.escapeAsync(did);
		
		var sql = "SELECT * FROM " + tablename + " WHERE " + tablename + ".DidKey = " + _did + ";";
		
		// open connection
		await mysqlcon.openAsync();
		
		// execute query
		var result = await mysqlcon.executeAsync(sql);		
		
		if (result) {
			var rows = (result['rows'] ? result['rows'] : []);
			
			if (rows[0]) {
				var row = rows[0];
				
				record['id'] = row.IdentifierId;
				record['uuid'] = row.IdentifierUUID;

				record['identifier_uuid'] = row.IdentifierUUID;
				record['did'] = row.DidKey;
				record['identifierstatus'] = row.IdentifierStatus;
			}
			
		}
		
		
		// close connection
		await mysqlcon.closeAsync();
			
			
		return record;
	}

	async getIdentifierAsync(did) {
		var global = this.global;
		
		var record = {};
		
		if (!did)
			return record;

		
		// get record
		var _identifier_record = await this._getIdentifierAsyncFromDid(did);
		
		record['identifier_uuid'] = _identifier_record['identifier_uuid'];
		record['identifier_status'] = _identifier_record['identifierstatus'];

		record['did'] = _identifier_record['did'];

			
		return record;
	}

	async putIdentifierAsync(record) {
		var global = this.global;

		var did = record['did'];
		var identifier_uuid = record['identifier_uuid'];
		var identifier_status = ( record['identifier_status'] !== undefined ?  record['identifier_status'] : 1);

		if (!did || !identifier_uuid  )
			return;
		
		var mysqlcon = await global.getMySqlConnectionAsync();
		
		var tablename = mysqlcon.getTableName('registries_identifiers');

		var _identifier_uuid = await mysqlcon.escapeAsync(identifier_uuid);
		var _did = await mysqlcon.escapeAsync(did);
		var _identifier_status = await mysqlcon.escapeAsync(identifier_status);

		
		var sql;
		
		// open connection
		await mysqlcon.openAsync();
		
		sql = `INSERT INTO ` +  tablename + ` (
		  IdentifierUUID,
		  IdentifierStatus,
		  DidKey
		  )
		  VALUES (
			` + _identifier_uuid + `,
			` + _identifier_status + `,
			` + _did + `
		  );`;
		
		
		// execute query
		var result = await mysqlcon.executeAsync(sql);

		
		// close connection
		await mysqlcon.closeAsync();
	}

	async updateIdentifierAsync(did, record) {
		var global = this.global;

		var identifier_status = (record['identifier_status'] !== undefined ? record['identifier_status'] : 1);

		if (!did)
			return;
		
		var mysqlcon = await global.getMySqlConnectionAsync();
		
		var tablename = mysqlcon.getTableName('registries_identifiers');

		var _did = await mysqlcon.escapeAsync(did);
		var _identifier_status = await mysqlcon.escapeAsync(identifier_status);

		
		var sql;
		
		// open connection
		await mysqlcon.openAsync();
		
		sql = `UPDATE ` +  tablename + ` SET
					  IdentifierStatus = ` + _identifier_status + `
				WHERE DidKey = ` + _did + `;`;
		

		
		
		// execute query
		var result = await mysqlcon.executeAsync(sql);

		
		// close connection
		await mysqlcon.closeAsync();
	}


	//
	// path
	async addIdentifierPath(did, record) {
		var global = this.global;

		//
		// insert data in path table
		var path = record['path'];
		var path_uuid = record['path_uuid'];
		var path_status = (record['path_status'] !== undefined ? record['path_status'] : 1);
		var rights = (record['rights'] !== undefined ? record['rights'] : 0);

		
		if (!path || !path_uuid )
			return;

		let _identifier_record = await this._getIdentifierAsyncFromDid(did);

		if ((!_identifier_record) || (!_identifier_record['id']))
			throw new Error('identifier not found for did: ' + did);
		

		var mysqlcon = await global.getMySqlConnectionAsync();
		
		var tablename = mysqlcon.getTableName('registries_identifier_paths');

		var _identifier_id = await mysqlcon.escapeAsync(_identifier_record['id']);
		var _path_uuid = await mysqlcon.escapeAsync(path_uuid);
		var _path_status = await mysqlcon.escapeAsync(path_status);
		var _path = await mysqlcon.escapeAsync(path);
		var _rights = await mysqlcon.escapeAsync(rights);


		var sql;
		
		// open connection
		await mysqlcon.openAsync();
		
		sql = `INSERT INTO ` +  tablename + ` (
			PathUUID,
			PathStatus,
			IdentifierId,
			Path,
			Rights
			)
			VALUES (
				` + _path_uuid + `,
				` + _path_status + `,
				` + _identifier_id + `,
				` + _path + `,
				` + _rights + `
		);`;

		// execute query
		var result = await mysqlcon.executeAsync(sql);

		
		// close connection
		await mysqlcon.closeAsync();
	}

	async updateIdentifierPath(path_uuid, record) {
		var global = this.global;

		//
		// update data in path table
		var path_status = (record['path_status'] !== undefined ? record['path_status'] : 1);
		var rights = (record['rights'] !== undefined ? record['rights'] : 0);

		
		if (!path_uuid )
			return;


		var mysqlcon = await global.getMySqlConnectionAsync();
		
		var tablename = mysqlcon.getTableName('registries_identifier_paths');

		var _path_uuid = await mysqlcon.escapeAsync(path_uuid);
		var _path_status = await mysqlcon.escapeAsync(path_status);
		var _rights = await mysqlcon.escapeAsync(rights);


		var sql;
		
		// open connection
		await mysqlcon.openAsync();

		sql = `UPDATE ` +  tablename + ` SET
					  PathStatus = ` + _path_status + `,
					  Rights = ` + _rights + `
				WHERE PathUUID = ` + _path_uuid + `;`;
		
		// execute query
		var result = await mysqlcon.executeAsync(sql);

		
		// close connection
		await mysqlcon.closeAsync();
	}

	async getIdentifierPathListAsync(did) {
		var global = this.global;
		
		var array = [];
		
		if (!did)
			return array;
	
		
		var mysqlcon = await global.getMySqlConnectionAsync();
		
		var tablename = mysqlcon.getTableName('registries_identifiers');
		var pathstablename = mysqlcon.getTableName('registries_identifier_paths');

		var _did = await mysqlcon.escapeAsync(did);
		
		var sql = "SELECT * FROM " + tablename;

		sql += " INNER JOIN " + pathstablename;
		sql += " ON " + tablename + ".IdentifierId=" + pathstablename + ".IdentifierId";

		sql += " WHERE " + tablename + ".DidKey = " + _did + ";";
		
		// open connection
		await mysqlcon.openAsync();
		
		// execute query
		var result = await mysqlcon.executeAsync(sql);
		
		
		if (result) {
			var rows = (result['rows'] ? result['rows'] : []);
			
			for (var i = 0; i < rows.length; i++) {
				var row = rows[i];
				var record = {};
				
				record['identifier_uuid'] = row['IdentifierUUID'];
				record['identifier_status'] = row['IdentifierStatus'];

				record['did'] = row['DidKey'];

				record['path_uuid'] = row['PathUUID'];
				record['path_status'] = row['PathStatus'];
				record['path'] = row['Path'];
				record['rights'] = row['Rights'];


				array.push(record);
			}
			
		}
		
		
		// close connection
		await mysqlcon.closeAsync();
			
			
		return array;
	}

	async getIdentifierPathListFromUUIDAsync(identifier_uuid) {
		var global = this.global;
		
		var array = [];
		
		var _identifier_record = await this._getIdentifierAsyncFromUUID(identifier_uuid);

		if (!_identifier_record || !_identifier_record['id'] )
		return record;
		
		var mysqlcon = await global.getMySqlConnectionAsync();
		
		var tablename = mysqlcon.getTableName('registries_identifiers');
		var pathstablename = mysqlcon.getTableName('registries_identifier_paths');

		var sql = "SELECT * FROM " + tablename;

		sql += " INNER JOIN " + pathstablename;
		sql += " ON " + tablename + ".IdentifierId=" + pathstablename + ".IdentifierId";

		sql += " WHERE " + tablename + ".IdentifierId=" + _identifier_record['id'] + ";";
		
		// open connection
		await mysqlcon.openAsync();
		
		// execute query
		var result = await mysqlcon.executeAsync(sql);
		
		
		if (result) {
			var rows = (result['rows'] ? result['rows'] : []);
			
			for (var i = 0; i < rows.length; i++) {
				var row = rows[i];
				var record = {};
				
				record['identifier_uuid'] = row['IdentifierUUID'];
				record['identifier_status'] = row['IdentifierStatus'];

				record['did'] = row['DidKey'];

				record['path_uuid'] = row['PathUUID'];
				record['path_status'] = row['PathStatus'];
				record['path'] = row['Path'];
				record['rights'] = row['Rights'];


				array.push(record);
			}
			
		}
		

		// close connection
		await mysqlcon.closeAsync();
			
			
		return array;
	}



	async getIdentifierWithPathAsync(did, path) {
		var global = this.global;
		
		var record = {};
		
		if (!did || !path)
			return record;

		
		var mysqlcon = await global.getMySqlConnectionAsync();
		
		var tablename = mysqlcon.getTableName('registries_identifiers');
		var pathstablename = mysqlcon.getTableName('registries_identifier_paths');

		var _did = await mysqlcon.escapeAsync(did);
		var _path = await mysqlcon.escapeAsync(path);
		
		var sql = "SELECT * FROM " + tablename;

		sql += " INNER JOIN " + pathstablename;
		sql += " ON " + tablename + ".IdentifierId=" + pathstablename + ".IdentifierId";

		sql += " WHERE " + tablename + ".DidKey = " + _did;
		sql += " AND " + pathstablename + ".Path = " + _path + ";";
		
		// open connection
		await mysqlcon.openAsync();
		
		// execute query
		var result = await mysqlcon.executeAsync(sql);
		
		
		
		if (result) {
			var rows = (result['rows'] ? result['rows'] : []);
			
			if (rows[0]) {
				var row = rows[0];
				
				record['identifier_uuid'] = row['IdentifierUUID'];
				record['identifier_status'] = row['IdentifierStatus'];

				record['did'] = row['DidKey'];

				record['path_uuid'] = row['PathUUID'];
				record['path_status'] = row['PathStatus'];
				record['path'] = row['Path'];
				record['rights'] = row['Rights'];
			}
			
		}
		
		
		// close connection
		await mysqlcon.closeAsync();
			
			
		return record;
	}

	async _getIdentifierFromPathAsync(path) {
		// Note: today we have only one Identifier for each path (UNIQUE KEY `Path` (`Path`))
		// if we want to have support multiple Dids for a path (e.g. for key rotations)
		// we'll need to implement getIdentifierListFromPathAsync instead
		var global = this.global;
		
		var record = {};
		
		if (!path)
			return record;

		
		var mysqlcon = await global.getMySqlConnectionAsync();
		
		var tablename = mysqlcon.getTableName('registries_identifiers');
		var pathstablename = mysqlcon.getTableName('registries_identifier_paths');

		var _path = await mysqlcon.escapeAsync(path);
		
		var sql = "SELECT * FROM " + tablename;

		sql += " INNER JOIN " + pathstablename;
		sql += " ON " + tablename + ".IdentifierId=" + pathstablename + ".IdentifierId";

		sql += " WHERE " + pathstablename + ".Path = " + _path + ";";
		
		// open connection
		await mysqlcon.openAsync();
		
		// execute query
		var result = await mysqlcon.executeAsync(sql);
		
		
		
		if (result) {
			var rows = (result['rows'] ? result['rows'] : []);
			
			if (rows[0]) {
				var row = rows[0];
				
				record['identifier_id'] = row['IdentifierId'];
				record['identifier_uuid'] = row['IdentifierUUID'];
				record['identifier_status'] = row['IdentifierStatus'];

				record['did'] = row['DidKey'];

				record['path_id'] = row['PathId'];
				record['path_uuid'] = row['PathUUID'];
				record['path_status'] = row['PathStatus'];
				record['path'] = row['Path'];
				record['rights'] = row['Rights'];
			}
			
		}
		
		
		// close connection
		await mysqlcon.closeAsync();
			
			
		return record;
	}

	async getIdentifierFromPathAsync(path) {
		var record = {};

		let row = await this._getIdentifierFromPathAsync(path);

		record['identifier_uuid'] = row['identifier_uuid'];
		record['identifier_status'] = row['identifier_status'];

		record['did'] = row['did'];

		record['path_uuid'] = row['path_uuid'];
		record['path_status'] = row['path_status'];
		record['path'] = row['path'];
		record['rights'] = row['rights'];

		return record;
	}

	//
	// attributes
	async addIdentifierAttribute(did, record) {
		var global = this.global;

		//
		// insert data in path table
		var attribute = record['attribute'];
		var attribute_uuid = record['attribute_uuid'];
		var attribute_status = (record['attribute_status'] !== undefined ? record['attribute_status'] : 1);

		var reporter_level = (record['reporter_level'] !== undefined ? record['reporter_level'] : 0);
		var reporter_did = record['reporter_did'];
		var reporter_signature = record['reporter_signature'];

		
		if (!attribute || !attribute_uuid )
			return;

		let _identifier_record = await this._getIdentifierAsyncFromDid(did);

		if ((!_identifier_record) || (!_identifier_record['id']))
			throw new Error('identifier not found for did: ' + did);
		
		let _reporter_record = await this._getIdentifierAsyncFromDid(reporter_did);

		if ((!_reporter_record) || (!_reporter_record['id']))
			throw new Error('identifier not found for did: ' + reporter_did);
	
		var mysqlcon = await global.getMySqlConnectionAsync();
		
		var tablename = mysqlcon.getTableName('registries_identifier_attributes');

		var _identifier_id = await mysqlcon.escapeAsync(_identifier_record['id']);
		var _attribute_uuid = await mysqlcon.escapeAsync(attribute_uuid);
		var _attribute_status = await mysqlcon.escapeAsync(attribute_status);
		var _attribute = await mysqlcon.escapeAsync(attribute);

		var _reporter_level = await mysqlcon.escapeAsync(reporter_level);
		var _reporter_signature = await mysqlcon.escapeAsync(reporter_signature);
		var _reporter_id = await mysqlcon.escapeAsync(_reporter_record['id']);


		var sql;
		
		// open connection
		await mysqlcon.openAsync();
		
		sql = `INSERT INTO ` +  tablename + ` (
			AttributeUUID,
			AttributeStatus,
			IdentifierId,
			Attribute,
			ReporterLevel,
			ReporterIdentifierId,
			ReporterSignature
			)
			VALUES (
				` + _attribute_uuid + `,
				` + _attribute_status + `,
				` + _identifier_id + `,
				` + _attribute + `,
				` + _reporter_level + `,
				` + _reporter_id + `,
				` + _reporter_signature + `
		);`;

		// execute query
		var result = await mysqlcon.executeAsync(sql);

		
		// close connection
		await mysqlcon.closeAsync();
	}

	async getIdentifierAttributeListAsync(did) {
		var global = this.global;
		
		var array = [];
		
		if (!did)
			return array;
	
		
		var mysqlcon = await global.getMySqlConnectionAsync();
		
		var tablename = mysqlcon.getTableName('registries_identifiers');
		var attributestablename = mysqlcon.getTableName('registries_identifier_attributes');

		var _did = await mysqlcon.escapeAsync(did);
		
		var sql = "SELECT * FROM " + tablename;

		sql += " INNER JOIN " + attributestablename;
		sql += " ON " + tablename + ".IdentifierId=" + attributestablename + ".IdentifierId";

		sql += " WHERE " + tablename + ".DidKey = " + _did + ";";
		
		// open connection
		await mysqlcon.openAsync();
		
		// execute query
		var result = await mysqlcon.executeAsync(sql);
		
		
		if (result) {
			var rows = (result['rows'] ? result['rows'] : []);
			
			for (var i = 0; i < rows.length; i++) {
				var row = rows[i];
				var record = {};
				
				record['identifier_uuid'] = row['IdentifierUUID'];
				record['identifier_status'] = row['IdentifierStatus'];

				record['did'] = row['DidKey'];

				record['attribute_uuid'] = row['AttributeUUID'];
				record['attribute_status'] = row['AttributeStatus'];
				record['attribute'] = row['Attribute'];

				record['reporter_level'] = row['ReporterLevel'];
				record['reporter_signature'] = row['ReporterSignature'];

				let _reporter_identifier = await this._getIdentifierFromIdAsync(row['ReporterIdentifierId']);

				record['reporter_did'] = _reporter_identifier.did;
				record['reporter_identifierstatus'] = _reporter_identifier.identifierstatus;

				array.push(record);
			}
			
		}
		
		
		// close connection
		await mysqlcon.closeAsync();
			
			
		return array;
	}

	async getIdentifierWithAttributeAsync(did, attribute_uuid) {
		var global = this.global;
		
		var record = {};
		
		if (!did || !attribute_uuid)
			return record;

		
		var mysqlcon = await global.getMySqlConnectionAsync();
		
		var tablename = mysqlcon.getTableName('registries_identifiers');
		var attributestablename = mysqlcon.getTableName('registries_identifier_attributes');

		var _did = await mysqlcon.escapeAsync(did);
		var _attribute_uuid = await mysqlcon.escapeAsync(attribute_uuid);
		
		var sql = "SELECT * FROM " + tablename;

		sql += " INNER JOIN " + attributestablename;
		sql += " ON " + tablename + ".IdentifierId=" + attributestablename + ".IdentifierId";

		sql += " WHERE " + tablename + ".DidKey = " + _did;
		sql += " AND " + attributestablename + ".AttributeUUID = " + _attribute_uuid + ";";
		
		// open connection
		await mysqlcon.openAsync();
		
		// execute query
		var result = await mysqlcon.executeAsync(sql);
		
		
		
		if (result) {
			var rows = (result['rows'] ? result['rows'] : []);
			
			if (rows[0]) {
				var row = rows[0];

				record['identifier_uuid'] = row['IdentifierUUID'];
				record['identifier_status'] = row['IdentifierStatus'];

				record['did'] = row['DidKey'];

				record['attribute_uuid'] = row['AttributeUUID'];
				record['attribute_status'] = row['AttributeStatus'];
				record['attribute'] = row['Attribute'];

				record['reporter_level'] = row['ReporterLevel'];
				record['reporter_signature'] = row['ReporterSignature'];

				let _reporter_identifier = await this._getIdentifierFromIdAsync(row['ReporterIdentifierId']);

				record['reporter_did'] = _reporter_identifier.did;
				record['reporter_identifierstatus'] = _reporter_identifier.identifierstatus;

			}
			
		}
		
		
		// close connection
		await mysqlcon.closeAsync();
			
			
		return record;
	}

	// credential status lists
	async getCredentialStatusHistoryAsync(credential_hash) {
		var global = this.global;
		
		var array = [];
		
		var mysqlcon = await global.getMySqlConnectionAsync();
		
		var tablename = mysqlcon.getTableName('registries_credential_statuslist');
		var pathstablename = mysqlcon.getTableName('registries_identifier_paths');

		var _credential_hash = await mysqlcon.escapeAsync(credential_hash);

		var sql = "SELECT *";
		sql += " FROM " + tablename;

		sql += " INNER JOIN " + pathstablename;
		sql += " ON " + tablename + ".ModifiedBy=" + pathstablename + ".PathId";
		
		sql += " WHERE CredentialHash=" + _credential_hash;
		sql += " ORDER BY ModifiedOn DESC;";
		
		// open connection
		await mysqlcon.openAsync();
		
		// execute query
		var result = await mysqlcon.executeAsync(sql);
		
		
		if (result) {
			var rows = (result['rows'] ? result['rows'] : []);
			
			for (var i = 0; i < rows.length; i++) {
				var row = rows[i];
				var record = {};
				
				record['id'] = row.StatusId;

				record['credential_hash'] = row.CredentialHash;

				record['credential_status'] = row.CredentialStatus;

				record['modified_on'] = row.ModifiedOn.getTime();
				record['modifier_path'] = row.Path;


				array.push(record);
			}
			
		}
		
		
		// close connection
		await mysqlcon.closeAsync();
			
			
		return array;
	}

	async getCredentialStatusListAsync(credential_hash, modifier_path) {
		var global = this.global;

		if (!modifier_path || !credential_hash  )
		return;
	
		var _modifier_record = await this._getIdentifierFromPathAsync(modifier_path);

		if ((!_modifier_record) || (!_modifier_record['patt_id']))
		throw new Error('identifier not found for path: ' + modifier_path);

		
		var array = [];
		
		var mysqlcon = await global.getMySqlConnectionAsync();
		
		var tablename = mysqlcon.getTableName('registries_credential_statuslist');

		var _credential_hash = await mysqlcon.escapeAsync(credential_hash);

		var sql = "SELECT * FROM " + tablename;
		sql += " WHERE CredentialHash=" + _credential_hash;
		sql += " AND ModifiedBy=" + _modifier_record['path_id'];
		sql += " ORDER BY ModifiedOn DESC;";
		
		// open connection
		await mysqlcon.openAsync();
		
		// execute query
		var result = await mysqlcon.executeAsync(sql);
		
		
		if (result) {
			var rows = (result['rows'] ? result['rows'] : []);
			
			for (var i = 0; i < rows.length; i++) {
				var row = rows[i];
				var record = {};
				
				record['id'] = row.StatusId;

				record['credential_hash'] = row.CredentialHash;

				record['credential_status'] = row.CredentialStatus;

				record['modified_on'] = row.ModifiedOn.getTime();

				array.push(record);
			}
			
		}
		
		
		// close connection
		await mysqlcon.closeAsync();
			
			
		return array;
	}
	
	async putCredentialStatusAsync(record) {
		var global = this.global;

		var modifier_path = record['modifier_path'];
		var credential_hash = record['credential_hash'];
		var credential_status = ( record['credential_status'] !== undefined ?  record['credential_status'] : 1);

		if (!modifier_path || !credential_hash  )
			return;
		
		var _modifier_record = await this._getIdentifierFromPathAsync(modifier_path);

		if ((!_modifier_record) || (!_modifier_record['path_id']))
		throw new Error('identifier not found for path: ' + modifier_path);


		var mysqlcon = await global.getMySqlConnectionAsync();
		
		var tablename = mysqlcon.getTableName('registries_credential_statuslist');

		var _credential_hash = await mysqlcon.escapeAsync(credential_hash);
		var _credential_status = await mysqlcon.escapeAsync(credential_status);
		var _modifier_path_id = await mysqlcon.escapeAsync(_modifier_record['path_id']);

		var sql;
		
		// open connection
		await mysqlcon.openAsync();
		
		sql = `INSERT INTO ` +  tablename + ` (
		  CredentialHash,
		  CredentialStatus,
		  ModifiedBy
		  )
		  VALUES (
			` + _credential_hash + `,
			` + _credential_status + `,
			` + _modifier_path_id + `
		  );`;
		
		
		// execute query
		var result = await mysqlcon.executeAsync(sql);

		
		// close connection
		await mysqlcon.closeAsync();
	}
}


module.exports = DataBasePersistor;