/** CUSTOM LIB TEMPLATE **/

var Custom = { rev : '0.1' };

Custom.Custom = function () {
	
	this.simple = function (params) {
		//do something
	}

	this.callback = function (params, callback) {
		//do somthing
		callback();
	}

	// ...
}

module.exports = Custom;