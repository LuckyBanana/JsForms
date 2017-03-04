/** NOT USED ANYMORE **/

/** CRUD **/

/**
	*	TODO
	*
	* > editField
	* > editColumnOrder
	*	> removeField
	* > editObjectOrder
	* > Dans le cas de suppression de vue défaut la réaffectation ne fonctionne pas
	*
**/

exports.openDb = function (type, config) {

	var database = {}
	database.client = databaseClient(type)
	dbCli = database.client

	if(database.client === 'sqlite3') {
			database.connection = {filename : ':memory:'}
			database.useNullAsDefault = true

			var confDatabase = config.get('Database.Connection.ConfigDb')
			var storageDatabase = config.get('Database.Connection.StorageDb')

			Knex = require('knex')(database)

			Knex
				.raw('ATTACH DATABASE ? AS ?;', ['../db/' + storageDatabase, 'STORAGE'])
				.then(function () {
					typeof callback === 'function' && callback(Knex)
				});

			Knex
				.raw('ATTACH DATABASE ? AS ?;', ['../db/' + confDatabase, 'CONF'])
				.then(function () {
					typeof callback === 'function' && callback(Knex)
				})
	}
	else {

		var defaultDbPorts = {
			'pg': 5432,
			'oracle': 1521,
			'mysql': 3306
		}

		database.connection = {
			host: config.get('Database.Connection.Host'),
			port: config.has('Database.Connection.Port') ? config.get('Database.Connection.Port') : defaultDbPorts[database.client],
			user: config.get('Database.Connection.User'),
			password: config.get('Database.Connection.Pass'),
			database: config.get('Database.Connection.Name')
		}

		Knex = require('knex')(database)
	}

}

exports.authenticate = function (username, password, done) {
	Knex('conf.user').where({
		login: username,
		password: password
	}).select('id_user as id', 'login as login', 'level as level').then(function (rows) {
		if (!rows[0]) {
			return done(null, false, {message: 'Cannot authenticate user.'})
		}
		else if (rows[0].active === 0){
			return done(null, false, {message: 'This account has been suspended.<br> Please contact an administrator.'})
		}
		else {
			return done(null, rows[0])
		}
	});
}

exports.deserializeUser = function (id, done) {
	Knex('conf.user').where({
		id_user: id
	}).select('id_user as id', 'login as login', 'level as level').then(function (rows) {
		done(null, rows[0])
	});
}


// Params :
	// id: "getOneById",
	// page: "20 résultats par page",
	// condition: "Sql query condition"
/**
 * @param  {String} Nom de la table
 * @param  {mixed{}} id : getOneById, page : 20 résultats par page, condition : SQL query
 * @param  {Function} callback {msg, obj}
 * @return {}
 */
exports.getAll = function (name, params, callback) {

	if (arguments.length === 2) {
		if (params instanceof Function) {
			callback = params;
		}
		else {
			throw 'Callback is not a function.';
		}
	}

	var object = viewObjects[name];

	var subObjectId = Knex('conf.object').where({name: name}).select('id_object');
	var subquery = Knex('conf.field').where('parent_object', '=', subObjectId).sum('isforeign as hasjoin');

	var fieldStringQuery = "CASE WHEN t1.hasjoin > 0 THEN ";
	//fieldStringQuery += "CASE WHEN f.isforeign THEN ";
	fieldStringQuery += "CASE WHEN f.isforeign = 1 THEN ";
	fieldStringQuery += "ro.alias || f.id_field || '.' || rf.name ";
	fieldStringQuery += "ELSE ";
	fieldStringQuery += "CASE WHEN dt.name = 'Date' THEN ";
	fieldStringQuery += dbCli == 'sqlite3' ? "'STRFTIME(\"%d-%m-%Y %H:%M\", ' || o.alias || '.' || f.name || ')' " : "'to_char( ' || o.alias || '.' || f.name || ', ''DD-MM-YYYY HH24:MI'')'";
	fieldStringQuery += "ELSE o.alias || '.' || f.name END ";
	fieldStringQuery += "END ";
	fieldStringQuery += "ELSE ";
	fieldStringQuery += "CASE WHEN dt.name = 'Date' THEN ";
	fieldStringQuery += dbCli == 'sqlite3' ? "'STRFTIME(\"%d-%m-%Y %H:%M\", ' || f.name || ')' " : "'to_char( ' || f.name || ', ''DD-MM-YYYY HH24:MI'')'";
	fieldStringQuery += "ELSE ";
	fieldStringQuery += "f.name ";
	fieldStringQuery += "END ";
	fieldStringQuery += 'END AS "field"';

	var joinStringQuery = "CASE WHEN f.isforeign = 1 ";
	joinStringQuery += "THEN 'LEFT JOIN storage.' || ro.name || ' ' || ro.alias || f.id_field || ' ON ' || o.alias || '.' || f.name || ' = ' || ro.alias || f.id_field || '.id' ";
	joinStringQuery += "ELSE '' END AS " + '"join"';

	var join;
	var fieldString = '';
	var joinString = '';

	Knex.from('conf.field AS f')
		// .join(function() {
			// this.from('conf.field').where('parent_object', '=', subObjectId).sum('isforeign as hasjoin').as('t1');
		// })
		.joinRaw('inner join (SELECT SUM(f.isforeign) AS hasjoin FROM conf.field f WHERE f.parent_object = (SELECT o.id_object FROM conf.object o WHERE o.name = ' + "'" + name + "'" + ')) t1 on 1=1')
		.join('conf.object as o', 'f.parent_object', '=', 'o.id_object')
		.join('conf.datatype as dt', 'f.datatype', '=', 'dt.id_datatype')
		.leftJoin('conf.datadefault as dd', 'f.datadefault', '=', 'dd.id_datadefault')
		.leftJoin('conf.object as ro', 'f.referenced_object', '=', 'ro.id_object')
		.leftJoin('conf.field as rf', 'f.referenced_field', '=', 'rf.id_field')
		.where('f.parent_object', '=', subObjectId)
		.orderBy('f.pos', 'ASC')
		.select(Knex.raw(fieldStringQuery), Knex.raw(joinStringQuery), 'f.name AS name', 'dt.name as type')
		.then(function (rows) {
			for(i in rows) {
				if(rows[i].join != '') {
					join = true;
					break;
				}
			}
			fieldString += (join ? object.alias + "." : "") + "id," + (object.activable == "1" ? (join ? object.alias + '.' : '') + 'valid,' : "");
			for (i in rows) {
				fieldString += rows[i].field + ' AS ' + rows[i].name + ',';
				joinString += rows[i].join != '' ? '' + rows[i].join + ' ' : '';
			}
			fieldString = removeLastChar(fieldString);
			Knex
				.from('storage.' + name)
				.joinRaw(Knex.raw(joinString))
				.select(Knex.raw(fieldString))
				.limit(params.page && !(params.page instanceof Function) ? params.page*20 : -1)
				.offset(params.page && !(params.page instanceof Function) ? (params.page-1)*20 : 0)
				.then(function (rows) {
					//typeof callback === 'function' && callback(rows);
					typeof callback === 'function' && callback(parseRows(rows));
				})
				.catch(function (err) {
					typeof callback === 'function' && callback(parseError(err, 'Unable to retreive table data'));
				});
		})
		.catch(function (err) {
			typeof callback === 'function' && callback(parseError(err, 'Unable to retreive table definition'));
		});
}

exports.getCount = function(name, callback) {
	// 'SELECT COUNT(1) AS "count" FROM STORAGE.' + name + ';';

	Knex('storage.' + name)
		.count('id AS count')
		.then(function (rows) {
			//typeof callback === 'function' && callback(rows[0]);
			typeof callback === 'function' && callback(parseRows(rows, 0));
		})
		.catch(function (err) {
			typeof callback === 'function' && callback(parseError(err, 'Unable to retreive field count'));
		});
}

exports.getGroups = function(callback) {
	// 'SELECT ID_GROUP AS id, NAME AS name FROM CONF.GROUP WHERE VALID = 1 ORDER BY POS ASC;';

	Knex('conf.group')
		.where({valid: 1})
		.orderBy('pos', 'ASC')
		.select('id_group as id', 'name as name')
		.then(function (rows) {
			typeof callback === 'function' && callback(parseRows(rows));
		})
		.catch(function (err) {
			typeof callback === 'function' && callback(parseError(err, 'Unable to retreive groups'));
		});
}

// ??
exports.getUsedGroups = function(callback) {
	// 'SELECT CG.ID_GROUP AS id, CG.NAME AS name FROM CONF.OBJECT CO JOIN CONF.GROUP CG ON CO.PARENT_GROUP = CG.ID_GROUP ORDER BY CG.POS ASC;';

	Knex('CONF.GROUP')
		.join('CONF.')
		.orderBy('POS', 'ASC')
		.select('ID_GROUP as id', 'NAME as name')
		.then(function (rows) {
			typeof callback === 'function' && callback(parseRows(rows));
		})
		.catch(function (err) {
			typeof callback === 'function' && callback(parseError(err, 'Unable to retreive used groups'));
		});
}

exports.postCreate = function(name, params, callback) {

	if (arguments.length === 2) {
		if (params instanceof Function) {
			callback = params;
		}
		else {
			throw 'Callback is not a function.';
		}
	}
	var object = viewObjects[name];

	var tableInfo = {};

	for (value in object.fields) {
		var field = object.fields[value];
		if(value === 'id') {
			//tableInfo[value] = null;
		}
		else if (value === 'valid') {
			tableInfo[value] = 1;
		}
		else if (field.foreign === '1') {
			tableInfo[value] = Knex('storage.' + field.referencedObject).where(field.referencedField, param[value].replace('\\', '')).select('id');
		}
		else if (field.type === 'Date' && field.generated === '1') {
			tableInfo[value] = DD[field.default]();
		}
		else if (field.type === 'Date') {
			// Gestion des dates ahah
			tableInfo[value] = params[value];
		}
		else {
			if (field.generated === '1') {
				tableInfo[value] = DD[field.default]();
			}
			tableInfo[value] = params[value];
		}
	}

	Knex('storage.' + name)
		.insert(tableInfo)
		.then(function () {
			getLastOne(name, function (data) {
				typeof callback === 'function' && callback(parseRows(rows));
			});
		})
		.catch(function (err) {
			typeof callback === 'function' && callback(parseError(err, 'Unable to create new entry'));
		});
}

exports.postActivate = function(name, id, callback) {
	// 'UPDATE STORAGE.' + name + ' SET VALID = CASE WHEN VALID = 0 THEN 1 ELSE 0 END WHERE ID = :id';

	Knex('storage.' + name)
		.where('id', id)
		.update('valid', Knex.raw('CASE WHEN valid = 0 THEN 1 ELSE 0 END'))
		.then(function () {
			getOneById(name, id, function (rows) {
				typeof callback === 'function' && callback(parseRows(rows));
			});
		})
		.catch(function (err) {
			typeof callback === 'function' && callback(parseError(err, 'Unable to activate selected entry'));
		});
}

exports.postDelete = function(name, id, callback) {
	// 'DELETE FROM STORAGE.' + name + ' WHERE ID = :id';

	Knex('storage.' + name)
		.where('id', id)
		.del()
		.then(function () {
			typeof callback === 'function' && callback(parseRows());
		})
		.catch(function (err) {
			typeof callback === 'function' && callback(parseError(err, 'Unable to delete selected entry'));
		});
}

exports.postModify = function(name, id, params, callback) {

	var fields = viewObjects[name].fields;

	var tableInfo = {};
	tableInfo.id = id;

	for (val in params) {
		if(fields[val].foreign === 1) {
			params[val] = Knex('storage.' + field[val].referencedObject).where(fields[val].referencedField, params[val]).select('id');
		}
		else if (fields[val].generated == 1 && val != 'id') {
			//SEARCH FOR MATCHING TYPE
			if (params[val] === 1) {
				params[val] = DD[fields[val].default]();
			}
		}
	}

	Knex('storage.' + name)
		.where('id', id)
		.update(params)
		.then(function () {
			getOneById(name, id, function (data) {
				typeof callback === 'function' && callback(parseRows(rows));
			});
		})
		.catch(function (err) {
			typeof callback === 'function' && callback(parseError(err, 'Unable to update selected entry'));
		});

}

/** MODEL **/

// Affiner le catch
exports.addView = function(data, callback) {
	var unique = true;
	var result = {name: false};
	var query = 'SELECT name = :name FROM conf.object;';
	var params = {name: data.viewIdInput};

	Knex.schema
		.withSchema('storage')
		.hasTable(params.name)
		.then(function (exists) {
			if(exists) {
				console.log('View id not unique.');
				var obj = {};
				obj['viewIdInput'] = exists;
				typeof callback === 'function' && callback({msg: 'WAR', obj: obj});
			}
			else {
				Knex.transaction(function (trx) {
					//params.id_object = null;
					params.label = data.viewLabelInput;
					params.alias = data.viewIdInput;
					params.apiurl = '/' + data.viewIdInput;
					params.view_id = params.name + '_view';
					params.isdefault = data.defaultInput;
					params.isactivable = data.activableInput;
					params.pos = Knex('conf.object').select(Knex.raw('MAX(pos) + 1 as pos'));
					params.parent_group = null;
					if(params.isdefault === 1) {
						Knex('conf.object')
							.transacting(trx)
							.update('isdefault', 0)
							.where('isdefault', 1)
							.catch(function (err) {
								trx.rollback;
								console.log(err);
								typeof callback === 'function' && callback(parseError(err, 'Unable to set new default view'));
							});
					}
					Knex('conf.object')
						.transacting(trx)
						.insert(params)
						.then(function () {
							Knex.schema
								.withSchema('storage')
								.transacting(trx)
								.createTable(params.name, function(table) {
									table.increments();
									table.integer('valid').defaultTo(1)
								})
								.then(trx.commit)
								.then(function () {
									exports.updateViewObjects(function () {
										typeof callback === 'function' && callback(parseRows());
									});
								})
								.catch(function (err) {
									trx.rollback;
									typeof callback === 'function' && callback(parseError(err, 'Unable to create new table'));
								})
						})
						.catch(function (err) {
							trx.rollback;
							typeof callback === 'function' && callback(parseError(err, 'Unable to insert new table'));
						})
				})
			}
		})
		.catch(function (err) {
			typeof callback === 'function' && callback(parseError(err, 'Unable to check if the provided table name already exists'));
		})
}

// [20-01-2016] : OK >> A tester avec un datadefault.

exports.addColumn = function(data, callback) {
	//var query = 'SELECT F.NAME = :name AS "name", F.LABEL = :label AS "label" FROM CONF.FIELD F WHERE F.PARENT_OBJECT = (SELECT O.ID_OBJECT FROM CONF.OBJECT O WHERE O.NAME = :objectName);';

	console.log(data);


	Knex.schema
		.withSchema('storage')
		.hasColumn(data.objectName, data.columnIdInput)
		.then(function (exists) {
			if(exists) {
				console.log('This column already exists.');
				typeof callback === 'function' && callback(parseRows(rows));
			}
			else {
				Knex.transaction(function (trx) {
					Knex('conf.object as o')
						.transacting(trx)
						.select(
							data.columnIdInput,
							data.columnLabelInput,
							'dt.id_datatype',
							data.columnDefaultInput,
							'dd.id_datadefault',
							data.columnForeignInput,
							'ro.id_object',
							'rf.id_field',
							'max(f.pos)+1',
							'o.id_object'
						)
						.innerJoin('conf.field as f', 'f.parent_object', 'o.id_object')
						.innerJoin('conf.datatype as dt', 'dt.name', data.columnTypeInput) // Cannot join on value :((
						.leftJoin('conf.datadefault as dd', 'dd.name', emptyToNull(data.columnDefaultInput_val))
						.leftJoin('conf.object as ro', 'ro.name', emptyToNull(data.referencedObjectInput_val))
						.leftJoin('conf.field as rf', function () {
							this.on('rf.label', (data.referencedFieldInput_val == '' ? 'rf.label' : data.referencedFieldInput_val))
								.andOn('rf.parent_object', '=', 'ro.id_object')
						})
						.where('o.name', data.objectName)
						.groupBy('dt.id_datatype', 'dd.id_datadefault', 'ro.id_object', 'rf.id_field', 'o.id_object')
						.then(function (rows) {
							return Knex.insert(rows[0]).into('storage.field').transacting(trx);
						})
						.then(function (row) {
							var query = 'SELECT "ALTER TABLE STORAGE.' + data.objectName + ' ADD COLUMN " || name || CASE WHEN ISFOREIGN THEN " INTEGER" '
							query += 'ELSE (SELECT " " || DEFINITION FROM CONF.DATATYPE WHERE ID_DATATYPE = datatype) END ';
							query += '|| CASE WHEN ISGENERATED THEN CASE WHEN (SELECT DEFINITION = "" FROM CONF.DATADEFAULT WHERE ID_DATADEFAULT = datadefault) THEN "" ELSE '
							query += '(SELECT " DEFAULT " || DEFINITION FROM CONF.DATADEFAULT WHERE ID_DATADEFAULT = datadefault) END ELSE "" END || ";" AS "query"';
							query += 'FROM CONF.FIELD WHERE NAME = ? AND PARENT_OBJECT = (SELECT ID_OBJECT FROM CONF.OBJECT WHERE NAME = ?)';
							return Knex.raw(query, [data.columnIdInput, data.objectName])
								.transacting(trx)
								.then(function (rows) {
									var alterQuery = rows[0];
									return alterQuery;
								})
						})
						.then(function (query) {
							Knex.raw(query)
								.transacting(trx);
						})
						.then(trx.commit)
						.then(function () {
								typeof callback === 'function' && callback(parseRows());
						})
						.catch(function (err) {
							typeof callback === 'function' && callback(parseError(err, 'Unable to create new field'));
						});
					});
				}
			})
			.catch(function (err) {
				typeof callback === 'function' && callback(parseError(err, 'Unable to check if the provided field name already exists'));
			});
			return;
}

exports.removeView = function(name, callback) {
	// var query = 'BEGIN TRANSACTION;';
	// query += 'UPDATE CONF.OBJECT SET ISDEFAULT = CASE WHEN (SELECT ISDEFAULT = 1 FROM CONF.OBJECT WHERE NAME = :name) THEN 1 ELSE ISDEFAULT END WHERE ID_OBJECT ';
	// query += '= (SELECT MIN(ID_OBJECT) FROM CONF.OBJECT WHERE NAME <> :name);';
	// query += 'DELETE FROM CONF.FIELD WHERE PARENT_OBJECT = (SELECT ID_OBJECT FROM CONF.OBJECT WHERE NAME = :name);';
	// query += 'DELETE FROM CONF.OBJECT WHERE NAME = :name;';

	Knex.transaction(function (trx) {

		var updateClause = "case when (select isdefault = 1 from conf.object where name = '" + name + "') then 1 else isdefault end";
		var whereClause = Knex('conf.object').min('pos').whereNot('name', name);
		Knex('conf.object')
			.transacting(trx)
			.update('isdefault', Knex.raw(updateClause))
			.where('id_object', whereClause)
			.then(function () {

				var delClause = Knex('conf.object').select('id_object').where('name', name);
				Knex('conf.field')
					.transacting(trx)
					.where('parent_object', delClause)
					.del()
					.then(function () {
						Knex('conf.object')
							.transacting(trx)
							.where('name', name)
							.del()
							.then(trx.commit)
							.then(function () {
								Knex.schema
									.withSchema('storage')
									.dropTable(name)
									.then(function () {
										typeof callback === 'function' && callback({msg: 'OK', obj: []});
									});
							})
							.catch(function (err) {
								trx.rollback;
								typeof callback === 'function' && callback(parseError(err, 'Unable to delete the specified view'));
							});
					})
					.catch(function (err) {
						trx.rollback;
						typeof callback === 'function' && callback(parseError(err, 'Unable to delete the fields of the specified view'));
					})
			})
			.catch(function (err) {
				trx.rollback;
				typeof callback === 'function' && callback(parseError(err, 'Unable to update default view'));
			})
	});

}

exports.setDefault = function(name, callback) {
	// 'UPDATE CONF.OBJECT SET ISDEFAULT = 0 WHERE ISDEFAULT = 1;';

	Knex('conf.object')
		.where('isdefault', 1)
		.update('isdefault', 0)
		.then(function () {
			Knex('conf.object')
				.where('name', name)
				.update('isdefault', 1)
				.then(function () {
					Knex('conf.object')
						.where('name', name)
						.select('*')
						.then(function (rows) {
							typeof callback === 'function' && callback(parseRows(rows, 0));
						})
						.catch(function (err) {
							typeof callback === 'function' && callback(parseError(err, 'Unable to update default view'));
						});
				});
		});
}

exports.editField = function(object, field, data, callback) {

	var query = 'SELECT :columnLabelEdit AS "label", DT.ID_DATATYPE AS "datatype", DT.NAME AS "type", '
	query += (data.columnDefaultEdit === '1' ? '1 AS "generated", DD.ID_DATADEFAULT AS "datadefault", DD.NAME AS "default",' : '0 AS "generated", NULL AS "datadefault", NULL AS "default", ');
	query += (data.columnForeignEdit === '1' ? '1 AS "foreign", CO.ID_OBJECT AS "referenced_object", CF.ID_FIELD AS "referenced_field", CO.NAME AS "referencedObject", CF.NAME AS "referencedField"'
		: '0 AS "foreign", NULL AS "referenced_object", NULL AS "referenced_field", NULL AS "referencedObject", NULL AS "referencedField" ');
	query += 'FROM CONF.DATATYPE DT ' + (data.columnDefaultEdit == '1' ? 'JOIN CONF.DATADEFAULT DD ON DD.NAME = :columnTypeEdit ' : '');
	query += (data.columnForeignEdit === '1' ? 'JOIN CONF.OBJECT CO ON CO.NAME = :referencedObjectEdit_val JOIN CONF.FIELD CF ON CF.NAME = :referencedFieldEdit_val AND CF.PARENT_OBJECT = CO.ID_OBJECT '
		: '');
	query += 'WHERE DT.NAME = :columnTypeEdit;';

	console.log(data);
	console.log(query);
	return;

	var oldField = viewObjects[object].fields[field];
	var params = {};

	for (key in data) {
		var parsed = parseInt(data[key]);
		params[key] = (isNaN(parsed) ? data[key] : parsed);
	}

	/* Knex('conf.field')
		.where('name', data.columnTypeEdit)
		.update()
	*/

			if (err || rows.length !== 1) {
				//faire un truc
				console.log(err);
				db.query('ROLLBACK');
				typeof callback === 'function' && callback({msg: 'KO', detail: err});
				return;
			}
			else {
				db.query('BEGIN TRANSACTION;');
				var params = rows[0];
				params.field = field;
				params.object = object;
				query = 'UPDATE CONF.FIELD SET LABEL = :label, DATATYPE = :datatype, ISGENERATED = :generated, DATADEFAULT = :datadefault, ISFOREIGN = :foreign, ';
				query += 'REFERENCED_OBJECT = :referenced_object, REFERENCED_FIELD = :referenced_field WHERE NAME = :field AND PARENT_OBJECT = (SELECT ID_OBJECT FROM CONF.OBJECT WHERE NAME = :object);';
				db.query(query, params);

				if (isDeleteColumn(oldField, params)) {
					query = 'UPDATE STORAGE.' + object + ' SET ' + field + ' = NULL;';
					db.query(query);
				}
				db.query('COMMIT;');
				updateViewObjects(function () {
					typeof callback === 'function' && callback({msg: 'OK'});
				});
			}
		// });
}

// SQLITE Independant
function isDeleteColumn(field1, field2) {
	deleteValues = ['type', 'referencedObject', 'referencedField'];
	for (key in field1) {
		if (deleteValues.indexOf(key) !== -1) {
			if (field1[key] != field2[key]) {
				return true;
			}
		}
	}
	return false;
}

exports.editColumnOrder = function(object, data, callback) {
	var query;
	db.query('BEGIN TRANSACTION;');

	for(field in data) {
		query = 'UPDATE CONF.FIELD SET POS = :pos WHERE PARENT_OBJECT = ';
		query += '(SELECT ID_OBJECT FROM CONF.OBJECT WHERE NAME = :objectName) ';
		query += 'AND NAME = :fieldName;'
		db.query(query, {pos: data[field], objectName: object, fieldName: field})
	}

	db.query('COMMIT;', function (err, rows) {
		err ? callback({msg: 'KO', detail: err}) : callback({msg: 'OK'});
	});
}

exports.removeField = function(object, field, callback) {
	var query;

	db.query('BEGIN TRANSACTION;');

	query = 'SELECT F.ID_FIELD as id_field FROM CONF.FIELD F WHERE F.PARENT_OBJECT = ';
	query += '(SELECT O.ID_OBJECT FROM CONF.OBJECT O WHERE O.NAME = :object) AND F.NAME = :field';

	db.query(query, {object: object, field: field}, function (err, rows) {
		if (err || rows.length !== 1) {
			console.log(err);
			db.query('ROLLBACK');
			typeof callback === 'function' && callback({msg: 'KO', detail: err});
			return;
		}
		else {
			var idField = rows[0].id_field;
			query = 'DELETE FROM CONF.FIELD WHERE ID_FIELD = :id_field';
			db.query(query, {id_field: idField});
			db.query('SELECT * FROM CONF.FIELD WHERE ID_FIELD = :id_field', {id_field: idField}, function (err, rows) {
				if(rows.length !== 0) {
					console.log(err);
					db.query('ROLLBACK');
					typeof callback === 'function' && callback({msg: 'KO', detail: err});
					return;
				}
				else {
					query = "SELECT F.NAME AS name, CASE WHEN ISFOREIGN = 0 THEN DT.DEFINITION ELSE 'INTEGER' END || CASE WHEN ISGENERATED = 1 THEN CASE WHEN DD.DEFINITION != '' ";
					query += "THEN ' DEFAULT ' || DD.DEFINITION ELSE '' END ELSE '' END AS field "
					query += "FROM CONF.FIELD F JOIN CONF.OBJECT O ON F.PARENT_OBJECT = O.ID_OBJECT AND O.NAME = :object ";
					query += "JOIN CONF.DATATYPE DT ON F.DATATYPE = DT.ID_DATATYPE LEFT JOIN CONF.DATADEFAULT DD ON F.DATADEFAULT = DD.ID_DATADEFAULT";

					var fieldString = 'id INTEGER PRIMARY KEY,';
					var nameString = 'ID,';

					db.query(query, {object: object}, function (err, rows) {
						if (err) {
							console.log(err);
							db.query('ROLLBACK');
							return;
						}
						for (i in rows) {
							fieldString += rows[i].name + ' ' + rows[i].field + ',';
							nameString += rows[i].name + ',';
						}
						fieldString = removeLastChar(fieldString);
						nameString = removeLastChar(nameString);

						query = 'ALTER TABLE STORAGE.' + object  + ' RENAME TO ' + object + '_old;';
						query += 'CREATE TABLE STORAGE.' + object + '(' + fieldString + ');';
						query += 'INSERT INTO STORAGE.' + object + ' SELECT ' + nameString + ' FROM STORAGE.' + object + '_old;';
						db.query(query, function (err, rows) {
							if(err) {
								console.log(err);
								db.query('ROLLBACK');
								typeof callback === 'function' && callback({msg: 'KO', detail: err});
								return;
							}
							else {
								db.query('DROP TABLE ' + object + '_old;');
								db.query('COMMIT');
								typeof callback === 'function' && callback({msg: 'OK'});
							}
						});
					});

					return;
				}
			});
		}
	});
}

exports.editObject = function(object, data, callback) {

}

exports.editObjectOrder = function(data, callback) {

	console.log(data);
	var statement = Knex;
	var index = 0;
	for (object in data) {
		if(index = 0) {
			var select = '?' + dbCli === 'pg' ? '::integer' : '' + ' as p, ?? as n' + dbCli === 'oracle' ? ' from dual' : '';
			statement = statement.select(Knex.raw(select, [parseInt(data[object]), object]))
		}
		else {
			var select = 'select ?' + dbCli === 'pg' ? '::integer' : '' + ' as p, ?? as n' + dbCli === 'oracle' ? ' from dual' : '';
			statement = statement.union(Knex.raw(select, [parseInt(data[object]), object]))
		}
		index++;
	}

	console.log(statement.toString())
	var query = 'update conf.object set pos=p from (' + statement.toString() + ') t where name=n';

	Knex.raw(query)
		.then(function (rows) {
			typeof callback === 'function' && callback({msg: 'OK', obj: []});
		})
		.catch(function (err) {
			typeof callback === 'function' && callback(parseError(err, 'Unable to update view order'));
		})

	//console.log(statement.toString());

	/*
	db.query('BEGIN TRANSACTION;');

	for (object in data) {
		query = 'UPDATE OBJECT SET POS = :pos WHERE NAME = :name;';
		db.query(query, {name: object, pos: data[object]});
	}

	db.query('COMMIT;', function (err, rows) {
		err ? callback({msg: 'KO', detail: err}) : callback({msg: 'OK'});
	});
	*/
}

/** USERS **/

exports.getAllUsers = function(callback) {
	// 'SELECT ID_USER AS id, LOGIN AS login, LEVEL AS level, ACTIVE AS active FROM CONF.USER WHERE LEVEL < 99;';
	Knex('conf.user')
		.where('level', '<', 99)
		.select('id_user AS id', 'login as login', 'level as level', 'active as active')
		.then(function (rows) {
			typeof callback === 'function' && callback(parseRows(rows));
		})
		.catch(function (err) {
			typeof callback === 'function' && callback(parseError(err, 'Unable to retreive users'));
		});
}

exports.createUser = function(data, callback) {
	// 'INSERT OR ROLLBACK INTO CONF.USER VALUES (NULL, :login, :password, :level, 1);';

	Knex('conf.user')
		.where('login', data.userLoginInput)
		.count()
		.then(function (rows) {
			if(rows[0].count === 0) {
				Knex('conf.user')
					.insert({
						login: data.userLoginInput,
						password: data.userPasswordInput,
						level: data.userLevelInput,
						active: 1
					})
					.then(function () {
						Knex('conf.user')
							.where('login', data.userLoginInput)
							.select('id_user AS id', 'login AS login', 'level AS level, active as active')
							.then(function (rows) {
								console.log(rows);
								//typeof callback === 'function' && callback({msg: 'OK', object: rows[0]});
								typeof callback === 'function' && callback(parseRows(rows, 0));
							});
					})
					.catch(function (err) {
						typeof callback === 'function' && callback(parseError(err, 'Unable to create new user'));
					});
			}
			else {
				console.log('login ko');
				typeof callback === 'function' && callback({msg: 'WAR', err: 'This login already exists.'});
			}
		});
}

exports.modifyUser = function(id, data, callback) {
	// 'UPDATE CONF.USER SET LEVEL = :level WHERE ID_USER = :id;';

	Knex('conf.user')
		.where('id_user', id)
		.update({
			level: data.userLevelModify
		})
		.then(function () {
			Knex('conf.user')
				.where('login', data.userLoginInput)
				.select('id_user AS id', 'login AS login', 'level AS level, active as active')
				.then(function (rows) {
					typeof callback === 'function' && callback(parseRows(rows, 0));
				});
		})
		.catch(function (err) {
			typeof callback === 'function' && callback(parseError(err, 'Unable to update specified user'));
		});
}

exports.deleteUser = function(id, callback) {
	// 'DELETE FROM CONF.USER WHERE ID_USER = :id;';

	Knex('conf.user')
		.where('id_user', id)
		.del()
		.then(function () {
			typeof callback === 'function' && callback(parseRows(rows, 0));
		});
}

exports.activateUser = function(id, callback) {
	// var query = 'UPDATE conf.user SET active = CASE WHEN active = 0 THEN 1 ELSE 0 END WHERE id_user = :id';

	Knex('conf.user')
		.where('id_user', id)
		.update('valid', Knex.raw('CASE WHEN valid = 0 THEN 1 ELSE 0 END'))
		.then(function () {
			Knex('conf.user')
				.where('login', data.userLoginInput)
				.select('id_user AS id', 'login AS login', 'level AS level, active as active')
				.then(function (rows) {
					typeof callback === 'function' && callback(parseRows(rows, 0));
				});
		})
		.catch(function (err) {
			typeof callback === 'function' && callback(parseError(err, 'Unable to activate specified user'));
		});
}

/** CONFIGURATION **/

exports.updateViewObjects = function(callback) {
	viewObjects = {};

	Knex.from('conf.object as co')
		.leftJoin('conf.group as cg', 'co.parent_group', '=', 'cg.id_group')
		.select('co.name AS name', 'co.label AS label', 'co.alias AS alias', 'co.apiurl AS apiUrl',
			'co.view_id AS viewId', 'co.isdefault AS default', 'co.isactivable AS activable', 'cg.name AS group', 'co.custom AS custom')
		.orderBy('co.pos', 'ASC')
		.then(function (rows) {
			var x = 0;
			if(rows.length === 0) {
				typeof callback === 'function' && callback();
				return;
			}
			var loop = function (rows) {
				var object = rows[x];
				viewObjects[object.name] = object;
				getObjectConfiguration(object.name, function () {
					x++;
					if (x < rows.length) {
						loop(rows);
					}
					else {
						typeof callback === 'function' && callback({msg: 'OK', obj: viewObjects});
					}
				});
			}
			loop(rows);
		})
		.catch(function (err) {
			typeof callback === 'function' && callback(parseError(err, 'Unable to retreive objects configuration'));
		});
}

function getObjectConfiguration(name, callback) {

	Knex.from('conf.field as f')
		.join('conf.object as o', 'f.parent_object', '=', 'o.id_object')
		.join('conf.datatype as dt', 'dt.id_datatype', '=', 'f.datatype')
		.leftJoin('conf.datadefault as dd', 'dd.id_datadefault', '=', 'f.datadefault')
		.where('o.name', name)
		.orderBy('f.pos', 'ASC')
		.select('f.id_field AS id', 'f.name AS name', 'f.label AS label', 'dt.name AS type', 'f.isgenerated AS generated', 'dd.name AS default', 'f.isforeign AS foreign')
		.select(Knex.raw('(SELECT o.name FROM conf.object o WHERE o.id_object = f.referenced_object) AS referencedObject'))
		.select(Knex.raw('(SELECT ff.name FROM conf.field ff WHERE ff.id_field = f.referenced_field) AS referencedField'))
		.then(function (rows) {
			viewObjects[name].fields = {};
			viewObjects[name].fields.id = {name: 'id', label : 'Id', generated: true, type: 'Number', foreign: false};
			for (i in rows) {
				var field = rows[i];
				viewObjects[name].fields[field.name] = field;
			}
			typeof callback === 'function' && callback();
		})
		.catch(function (err) {
			console.log(err);
		});
}

/** UTILS **/

function removeLastChar(string) {
	return string.substring(0, string.length - 1);
}

function emptyToNull(string) {
	return string === '' ? null : string;
}

function oftype(name) {
	return {
		'undefined': undefined,
		'object': Object,
		'boolean': Boolean,
		'number': Number,
		'string': String,
		'function': Function
	}[name];
}

function parseRows(rows, index) {
	return rows === undefined ? {msg: 'OK', obj: [] } : (index === undefined ? {msg: 'OK', obj: rows} : {msg: 'OK', obj: rows[index]});
}

function parseError(err, msg) {
	console.log(err);
	return devMode ? {msg: 'KO', obj: err.toString()} : {msg: 'KO', obj: msg};
}

function getOneById(table, id, callback) {
	Knex('STORAGE.' + table)
		.where('ID', id)
		.select('*')
		.then(function (rows) {
			typeof callback === 'function' && callback(rows);
		})
		.catch(function (err) {
			console.log(err);
		});
}

function getLastOne(table, callback) {
	// 'SELECT ROWID FROM `' + table + '` ORDER BY ROWID DESC LIMIT 1'

	if(databaseSystem === 'sqlite') {
		Knex('storage.' + table)
			.orderBy('rowid', 'desc')
			.limit('1')
			.select('*')
			.then(function (rows) {
				typeof callback === 'function' && callback(rows[0]);
			})
			.catch(function (err) {
				console.log(err);
			});
	}
	else {
		typeof callback === 'function' && callback([]);
	}
}

function databaseClient (type) {
	var aliases = {
		'sqlite': 'sqlite3',
		'sqlite3': 'sqlite3',
		'oracle': 'oracle',
		'ora': 'oracle',
		'postgresql': 'pg',
		'postgres': 'pg',
		'psql': 'pg',
		'pg': 'pg',
		'mysql': 'mysql',
		'mariadb': 'mysql',
		'maria': 'mysql'
	}
	return (aliases[type] === undefined ? _throw('Unsupported database or unknown alias.') : aliases[type])
}
