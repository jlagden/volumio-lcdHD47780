'use strict';

var libQ = require('kew');
var fs=require('fs-extra');
var config = new (require('v-conf'))();
var exec = require('child_process').exec;
var execSync = require('child_process').execSync;
var io = require('socket.io-client');
var lcdDisplay = require('./lcdDisplay');

module.exports = ControllerlcdHD47780;

function ControllerlcdHD47780(context) {

    // This fixed variable will let us refer to 'this' object at deeper scopes
    var self = this;

    this.context = context;
    this.commandRouter = this.context.coreCommand;
    this.logger = this.context.logger;
    this.configManager = this.context.configManager;

}

ControllerlcdHD47780.prototype.onVolumioStart = function() {

    var self = this;	
    var configFile=this.commandRouter.pluginManager.getConfigurationFile(this.context,'config.json');
    this.config = new (require('v-conf'))();
    this.config.loadFile(configFile);
    self.logger.info("lcdHD47780 initialized");
    return libQ.resolve();
	
}

ControllerlcdHD47780.prototype.onStart = function() {
	
	var self = this;
	var defer=libQ.defer();
	
	self.lcdDisplay = new lcdDisplay(self.context); 
	self.logger.info("lcdHD47780 started");	
	
	try {

		self.socket = io.connect('http://localhost:3000');
		self.socket.on('pushState', function (data) {
			self.logger.info('lcdHD47780::pushState:Push State recieved');
			self.logger.info(data);
		});
		self.logger.info('lcdHD47780::onStart:Start Successful');
		// Once the Plugin has successfull started resolve the promise
		defer.resolve();

	} catch(err) {

		this.logger.error('lcdHD47780::onStart: ' + err);
		defer.reject(err);

	}

	return defer.promise;
	
};

ControllerlcdHD47780.prototype.onStop = function() {

    var self = this;
    var defer=libQ.defer();

    self.lcdDisplay.close();
	self.logger.info("lcdHD47780 stopped");	
	
    // Once the Plugin has successfull stopped resolve the promise
    defer.resolve();
    return libQ.resolve();
	
}

ControllerlcdHD47780.prototype.onRestart = function() {

    var self = this;
    // Optional, use if you need it

};

// Configuration Methods -----------------------------------------------------------------------------

ControllerlcdHD47780.prototype.getUIConfig = function() {

    var defer = libQ.defer();
    var self = this;

    var lang_code = this.commandRouter.sharedVars.get('language_code');

    self.commandRouter.i18nJson(__dirname+'/i18n/strings_'+lang_code+'.json',
        __dirname+'/i18n/strings_en.json',
        __dirname + '/UIConfig.json')
		
    .then(function(uiconf) {

        uiconf.sections[0].content[0].value = self.config.get('RS');
        uiconf.sections[0].content[1].value = self.config.get('E');
        uiconf.sections[0].content[2].value = self.config.get('D4');
        uiconf.sections[0].content[3].value = self.config.get('D5');
        uiconf.sections[0].content[4].value = self.config.get('D6');
        uiconf.sections[0].content[5].value = self.config.get('D7');
        defer.resolve(uiconf);

	})
	.fail(function() {

        defer.reject(new Error());

	});

    return defer.promise;

};

ControllerlcdHD47780.prototype.setUIConfig = function(data) {

    var self = this;
    //Perform your installation tasks here

};

ControllerlcdHD47780.prototype.getConf = function(varName) {

    var self = this;
    //Perform your installation tasks here

};

ControllerlcdHD47780.prototype.setConf = function(varName, varValue) {

    var self = this;
	//Perform your installation tasks here

};

ControllerlcdHD47780.prototype.saveGPIOConfig = function(data) {
	
	var self = this;
	var defer = libQ.defer();
	
	return defer.promise;
	
};
