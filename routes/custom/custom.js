/** CUSTOM ROUTES TEMPLATE **/

var CustomLib = require('../../libs/custom/custom.js')
Custom = new CustomLib.Digiposte();

module.exports = function (app) {

	app.get('/custom/route1', Custom.simple({}));

	app.get('/custom/route2', function (req, res) {
		Custom.callback({}, function () {});
	});

	// ...
}
