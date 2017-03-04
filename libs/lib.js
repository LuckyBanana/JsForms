var Lib = { rev : '0.1' };

Lib.DataDefault = function () {

	// STRING
	this.guid = function () {
	  function s4() {
	    return Math.floor((1 + Math.random()) * 0x10000)
	      .toString(16)
	      .substring(1);
	  }
	  return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
	    s4() + '-' + s4() + s4() + s4();
	}

	// DATE
	this.now = function () {
		return "(SELECT DATETIME(CURRENT_TIMESTAMP, 'localtime'))";
	}
}

Lib.DataTypes = function() {

	this.String = function () {
		return String;
	}

	this.Number = function () {
		return Number;
	}

	this.Date = function () {
		return String;
	}

	this.File = function () {
		return String;
	}
}

Lib.Maintenance = function() {

	/** /!\ FUNCTION NAMES MUST BE LOWERCASE ONLY **/

	this.reset = function (object, callback) {
		var query = 'BEGIN;';
		for (type in viewObjects) {
			var object = viewObjects[type];
			query += 'DELETE FROM ' + type + ';';
		}
		query += 'ROLLBACK;';
		//query += 'COMMIT;';
		db.query(query, function (err, rows) {
			(err ? callback('KO') : callback('OK'))
		});			
	}

	this.addview = function (object, callback) {
		var returnData = {};
		var errors = {};

		if(viewObjects[object.viewIdInput]) {
			errors['viewIdInput'] = 'Table name already in use.';
		}
		for (name in viewObjects) {
			var view = viewObjects[name];
			if(view.label == object.viewLabelInput) {
				errors['viewLabelInput'] = 'Pretty name already in use';
			}
			if(view.alias == object.viewAliasInput) {
				errors['viewAliasInput'] = 'Alias already in use';
			}
			if(view.apiUrl == object.getUrlInput) {
				errors['getUrlInput'] = 'GET URL already in use';
			}
		}
		
		return callback(Object.keys(errors).length != 0 ? { msg : 'KO', err : errors } : { msg : 'OK', err : {} });

	}
}

module.exports = Lib;

