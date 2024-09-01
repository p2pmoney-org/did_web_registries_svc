console.log('starting did web registries');

//setting environment variables
var process = require('process');

// instantiating global object
var Global = require('../server/includes/common/global.js');

// setting global var in Global
if (process.env.ETHEREUM_WEBAPP_BASE_DIR) {
	Global.ETHEREUM_WEBAPP_BASE_DIR = process.env.ETHEREUM_WEBAPP_BASE_DIR;
}

if (process.env.ETHEREUM_WEBAPP_EXEC_DIR) {
	Global.ETHEREUM_WEBAPP_EXEC_DIR = process.env.ETHEREUM_WEBAPP_EXEC_DIR;
}

var global = Global.getGlobalInstance();

//force logging
/*global.releaseConsoleLog();
global.enableLog(true);
global.setExecutionEnvironment('dev');*/

// prevent admin ui
global.setConfigValue('start_no_admin_ui', true);

try {

	// register services
	var Service;
	
	// additional services
	Service = require('./includes/registries/service.js');
	global.registerServiceInstance(new Service());

	// local services

	// admin
	Service = require('./includes/admin/service.js');
	global.registerServiceInstance(new Service());


}
catch(e) {
	global.log("ERROR during initServer: " + e);
	global.log(e.stack);
}

// call standard start sequence
var server = require('../server/server.js');



global.log('did web registries finished starting');