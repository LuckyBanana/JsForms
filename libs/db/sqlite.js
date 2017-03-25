
exports.openDb = (type, config) => {
	const dblite = require('dblite')
	db = dblite(':memory:', '-header')
	db.query('attach database :db as :schema', {db: require('path').join(__dirname, '..', '..', 'db', config.get('Database.Connection.StorageDb')), schema: 'STORAGE'})
	db.query('attach database :db as :schema', {db: require('path').join(__dirname, '..', '..', 'db', config.get('Database.Connection.ConfigDb')), schema: 'CONF'})
	return db
}


/** GET QUERIES **/
// Params :
	// id: "getOneById",
	// page: "20 résultats par page",
	// condition: "Sql query condition"

/**
 *	Récupère les données d'un objet passé en paramètre
 * @param {object} object - La définition de l'objet recherché
 * @param {object} params - Les critères de recherche {id, page, conditionSql}
 * @param {function} callback
 */
exports.getAll = (...args) => {
	let [ object, params, callback ] = args

	if(callback === undefined) {
		if (params instanceof Function) {
			callback = params
		}
		else {
			throw 'Callback is not a function'
		}
	}

	let query = "SELECT \
		CASE WHEN T1.HASJOIN > 0 THEN \
		CASE WHEN F.ISFOREIGN THEN \
		RO.ALIAS || F.ID_FIELD || '.' || RF.NAME \
		ELSE \
		CASE WHEN DT.NAME = 'Date' THEN \
		'STRFTIME(\"%Y/%m/%d %H:%M\", ' || O.ALIAS || '.' || F.NAME || ')' \
		ELSE O.ALIAS || '.' || F.NAME END \
		END \
		ELSE \
		CASE WHEN DT.NAME = 'Date' THEN \
		'STRFTIME(\"%Y/%m/%d %H:%M\", ' || F.NAME || ')' \
		ELSE \
		F.NAME \
		END \
		END AS 'field', \
		CASE WHEN F.ISFOREIGN = 1 \
		THEN 'LEFT JOIN ' || RO.SCHEMA || '.' || RO.NAME || ' ' || RO.ALIAS || F.ID_FIELD || ' ON ' || O.ALIAS || '.' || F.NAME || ' = ' || RO.ALIAS || F.ID_FIELD || '.ID' || CASE WHEN RO.SCHEMA = 'CONF' COLLATE NOCASE THEN '_' || RO.NAME ELSE '' END \
		ELSE '' END AS 'join', \
		F.NAME AS 'name', \
		DT.NAME as 'type' \
		FROM CONF.FIELD F \
		INNER JOIN (\
			SELECT SUM(F.ISFOREIGN) AS HASJOIN FROM CONF.FIELD F WHERE F.PARENT_OBJECT = :id_object\
		) T1 ON 1 \
		JOIN CONF.OBJECT O ON F.PARENT_OBJECT = O.ID_OBJECT \
		JOIN CONF.DATATYPE DT ON F.DATATYPE = DT.ID_DATATYPE \
		LEFT JOIN CONF.DATADEFAULT DD ON F.DATADEFAULT = DD.ID_DATADEFAULT \
		LEFT JOIN CONF.OBJECT RO ON F.REFERENCED_OBJECT = RO.ID_OBJECT \
		LEFT JOIN CONF.FIELD RF ON F.REFERENCED_FIELD = RF.ID_FIELD \
		WHERE F.PARENT_OBJECT = :id_object \
		ORDER BY F.POS ASC;"

	let join = false
	let fieldString = ''
	let joinString = ''

	db.query(query, {id_object: object.id}, (err, rows) => {
		if(err) {
			console.error(err);
			callback([])
			return
		}
		for (row of rows) {
			if(row.join != '') {
				join = true
				break
			}
		}
		const dataMap = {}
		for (row of rows) {
			try {
				dataMap[row.name] = eval(row.type)
			}
			catch(e) {
				dataMap[row.name] = String
			}
			fieldString += row.field + ' AS ' + row.name + ','
			joinString += row.join != '' ? '' + row.join + ' ' : ''
		}
		fieldString = __removeLastChar(fieldString)

		query = 'SELECT ' + fieldString + ' FROM ' + object.schema +  '.' + object.name + ' ' + object.alias  + ' ' + joinString
		query += object.schema.toUpperCase() === 'CONF' ? ' WHERE ' + object.alias + '.ID_' + object.name + ' > 100' : ''
		query += (params.id && !(params.id instanceof Function)) ?
			(object.schema === 'CONF' ? ' AND ' : ' WHERE ') + ' ' + object.alias + '.ID = ' + params.id :
			''
		query += (params.page && !(params.page instanceof Function) ? ' LIMIT ' + params.page*20 + ' OFFSET ' + (params.page-1)*20 + ';': ';')

		db.query(query, dataMap, (err, rows) => {
			if(err) {
				console.error(err);
				callback([])
				return
			}
			typeof callback === 'function' && callback(rows)
		})
	})
}

exports.getCount = (object, callback) => {
	const query = 'SELECT COUNT(1) AS "count" FROM STORAGE.' + object.name + ';'
	db.query(query, (err, rows) => {
		typeof callback === 'function' && callback(rows[0])
	})
}

exports.getGroups = (callback) => {
	const query = 'SELECT ID_OBJECTGROUP AS id, NAME AS name FROM CONF.OBJECTGROUP WHERE VALID = 1 ORDER BY POS ASC;'
	db.query(query, (rows) => {
		typeof callback === 'function' && callback(rows)
	})
}

exports.getUsedGroups = (prod, callback) => {
	const query = 'SELECT DISTINCT CG.ID_OBJECTGROUP id, CG.NAME name, CG.POS pos, CG.VALID valid FROM CONF.OBJECT CO INNER JOIN CONF.OBJECTGROUP CG ON CG.ID_OBJECTGROUP = CO.PARENT_GROUP WHERE VALID = 1 ' + (prod ? 'AND ID_OBJECTGROUP >= 100' : '') + ' ORDER BY CG.POS ASC'
	db.query(query, { id: Number, name: String, pos: Number, valid: Boolean }, (rows) => {
		typeof callback === 'function' && callback(rows)
	})
}

exports.getGroupObjects = (prod, callback) => {
	const query = 'SELECT CG.ID_OBJECTGROUP AS groupId, CG.NAME groupName, CG.POS AS groupPos, CO.ID_OBJECT objectId, CO.NAME objectName, CO.LABEL AS objectLabel, CO.POS AS objectPos FROM CONF.OBJECT CO JOIN CONF.OBJECTGROUP CG ON CO.PARENT_GROUP = CG.ID_OBJECTGROUP ORDER BY CG.POS ASC;'
	db.query(query, (rows) => {
		typeof callback === 'function' && callback(rows)
	})
}
/** POST QUERIES **/

exports.postCreate = function(object, params, callback) {

	if (arguments.length == 2) {
		if (params instanceof Function) {
			callback = params;
		}
		else {
			throw 'Callback is not a function.';
		}
	}

	let query = ''
	let baseQuery = 'INSERT INTO ' + object.schema + '.' + object.name
	let tableInfo = ' ('

	for (field of object.fields) {

		tableInfo += field.name + ','
		if(field.name === 'id') {
			query +=  'null,'
		}
		else if (field.name === 'valid') {
			query += '1,'
		}
		else if (field.type === 'Date') {
			query += ':' + field.name + ','
		}
		else {
			if (field.generated === true) {
				params[field.name] = DD[field.default]()
			}
			query += ':' + field.name + ','
		}
	}

	query = query.substring(0, query.length -1)
	tableInfo = tableInfo.substring(0, tableInfo.length -1) + ')'
	query = baseQuery + tableInfo + ' VALUES (' + query + ');'

	db.query(query, params, (err, rows) => {
		if (err) {
			console.error(err)
			typeof callback === 'function' && callback({msg: 'KO', err: err})
		}
		else {
			typeof callback === 'function' && callback({msg: 'OK', obj: ''})
		}
	})
}

exports.postActivate = (object, id, callback) => {
	let query = 'UPDATE STORAGE.' + object.name + ' SET VALID = CASE WHEN VALID = 0 THEN 1 ELSE 0 END WHERE ID = :id'
	db.query(query, {id: id}, (err, rows) => {
		if (!err) {
			typeof callback === 'function' && callback({msg: 'OK', obj: 'Enregistrement activé'})
		}
		else {
			typeof callback === 'function' && callback({msg: 'KO', obj: err})
		}
	})
}

exports.postDelete = (object, id, callback) => {
	let query = 'DELETE FROM STORAGE.' + object.name + ' WHERE ID = :id'
	db.query(query, {id: id}, (err, rows) => {
		if (!err) {
			typeof callback === 'function' && callback({msg: 'OK', obj: 'Enregistrement supprimé'})
		}
		else {
			typeof callback === 'function' && callback({msg: 'KO', obj: err})
		}
	})
}

exports.postModify = (object, id, params, callback) => {

	let fields = object.fields
	let query = 'UPDATE STORAGE.' + object.name + ' SET '

	for (field of fields) {
		query += field.name + ' = :' + field.name + ','
	}

	query = query.substring(0, query.length - 1) + ' WHERE ID = :id;'
	params.id = id

	db.query(query, params, (err, rows) => {
		typeof callback === 'function' && callback({msg: 'OK', obj: []})
	})
}

exports.addView = (data, callback) => {
	let unique = true
	let result = {name: false};
	let query = 'SELECT NAME = :name FROM CONF.OBJECT;'
	let params = {name: data.viewIdInput}
	db.query(query, params, (err, rows) => {
		if (err) {
			console.error(err);
			typeof callback === 'function' && callback({msg: 'KO', err: err});
		}
		if (rows.length !== 0 && rows[0] === 1) {
			unique = false;
		}
		if (!unique) {
			console.error('View id not unique.');
			typeof callback === 'function' && callback({msg: 'KO', err: result});
		}
		else {
			params.label = data.viewLabelInput
			params.alias = data.viewIdInput
			params.apiUrl = '/' + data.viewIdInput
			params.viewId = params.name + '_view'
			params.isdefault = data.defaultInput
			params.isactivable = data.activableInput
			db.query('BEGIN TRANSACTION;');
			if (params.isdefault === 1) {
				query = 'UPDATE CONF.OBJECT SET ISDEFAULT = 0 WHERE ISDEFAULT = 1;'
				db.query(query, (err, rows) => {
					if (err) {
						db.query('ROLLBACK;')
						typeof callback === 'function' && callback({msg: 'KO', detail: 'Error while updating default view.'})
					}
				})
			}
			query = 'INSERT INTO CONF.OBJECT VALUES (NULL, :name, :label, :alias, :apiUrl, :viewId, :isdefault, :isactivable, (SELECT MAX(POS) + 1 FROM CONF.OBJECT), NULL);'

			db.query(query, params, (err, rows) => {
				if (!err) {
					db.query('COMMIT')
					query = 'CREATE TABLE STORAGE.:name (id INTEGER PRIMARY KEY, valid INTEGER default 1);'
					db.query(query, {name : params.name}, (err, rows) => {
						if (err) {
							console.error(err)
							typeof callback === 'function' && callback({msg: 'KO', detail: 'Oops something went wrong.'})
						}
						else {
							typeof callback === 'function' && callback({msg: 'OK'})
						}
					})
				}
				else {
					db.query('ROLLBACK;')
					typeof callback === 'function' && callback({msg: 'KO', detail: 'Oops something went wrong.'})
				}
			});
		}
	});
}

// [20-01-2016] : OK >> A tester avec un datadefault.

exports.addColumn = (data, callback) => {
	let unique = true
	let result = {name: false, label: false}
	const query = 'SELECT F.NAME = :name AS "name", F.LABEL = :label AS "label" FROM CONF.FIELD F WHERE F.PARENT_OBJECT = (SELECT O.ID_OBJECT FROM CONF.OBJECT O WHERE O.NAME = :objectName);'
	var alterQuery = ''
	var result_set = {name: Number, label: Number}
	var params = {name: data.columnIdInput, label: data.columnLabelInput, objectName: data.objectName}
	db.query(query, params, (err, rows) => {
		if (err) {
			console.error(err);
			typeof callback === 'function' && callback(err)
		}
		for (object of rows) {
			for (name in object) {
				if (object[name] == 1) {
					unique = false
					result[name] = true
				}
			}
		}
		if (!unique) {
			typeof callback === 'function' && callback({ msg: 'KO', err : result })
		}
		else {
			db.query('BEGIN TRANSACTION;');
			query = 'INSERT INTO CONF.FIELD SELECT NULL, :name, :label, CDT.ID_DATATYPE, ';
			fromQuery = 'FROM CONF.OBJECT CO JOIN CONF.DATATYPE CDT ON CDT.NAME = :type ';
			if (data.columnDefaultInput == 1) {
				params.defaultValue = data.columnDefaultInput_val;
				query += '1, CDT.ID_DATATYPE, ';
				fromQuery += 'JOIN CONF.DATADEFAULT CDD ON CDD.NAME = :defaultValue ';
			}
			else {
				query += '0,  NULL, ';
			}
			if (data.columnForeignInput == 1) {
				params.referencedObject = data.referencedObjectInput_val;
				params.referencedField = data.referencedFieldInput_val;
				query += '1, COO.ID_OBJECT, CF.ID_FIELD, ';
				fromQuery += 'JOIN CONF.OBJECT COO ON COO.NAME = :referencedObject ';
				fromQuery += 'JOIN CONF.FIELD CF ON CF.LABEL = :referencedField AND CF.PARENT_OBJECT = COO.ID_OBJECT ';
			}
			else {
				params.foreignValue = '';
				query += '0, NULL, NULL, ';
			}
			query += '(SELECT COALESCE(MAX(F.POS) + 1, 0) FROM CONF.FIELD F WHERE F.PARENT_OBJECT = CO.ID_OBJECT), CO.ID_OBJECT ';
			fromQuery += 'WHERE CO.NAME = :objectName;';
			params.type = data.columnTypeInput;
			var newId;
			db.query(query + fromQuery, params);
			db.query('SELECT ROWID FROM CONF.FIELD ORDER BY ROWID DESC LIMIT 1', (rows) => {
				newId = rows[0]['ID_FIELD']
				if (!newId) {
					db.query('ROLLBACK;');
					typeof callback === 'function' && callback({ msg: 'KO' })
					return;
				}
				query = 'SELECT "ALTER TABLE STORAGE.' + data.objectName + ' ADD COLUMN " || name || CASE WHEN ISFOREIGN THEN " INTEGER" '
				query += 'ELSE (SELECT " " || DEFINITION FROM CONF.DATATYPE WHERE ID_DATATYPE = datatype) END '
				query += '|| CASE WHEN ISGENERATED THEN CASE WHEN (SELECT DEFINITION = "" FROM CONF.DATADEFAULT WHERE ID_DATADEFAULT = datadefault) THEN "" ELSE '
				query += '(SELECT " DEFAULT " || DEFINITION FROM CONF.DATADEFAULT WHERE ID_DATADEFAULT = datadefault) END ELSE "" END || ";" AS "query"'
				query += 'FROM CONF.FIELD WHERE ID_FIELD = :fieldId;'
				db.query(query, {fieldId: newId}, (err, rows) => {
					query = rows[0].query
					db.query(query, (err, rows) => {
						db.query('COMMIT;')
						typeof callback === 'function' && callback({ msg: 'OK' })
					});
				});
			});
		}
	});

}

exports.removeView = (name, callback) => {
	let query = 'BEGIN TRANSACTION;\
		UPDATE CONF.OBJECT SET ISDEFAULT = CASE WHEN (SELECT ISDEFAULT = 1 FROM CONF.OBJECT WHERE NAME = :name) THEN 1 ELSE ISDEFAULT END WHERE ID_OBJECT \
		= (SELECT MIN(ID_OBJECT) FROM CONF.OBJECT WHERE NAME <> :name);\
		DELETE FROM CONF.FIELD WHERE PARENT_OBJECT = (SELECT ID_OBJECT FROM CONF.OBJECT WHERE NAME = :name);\
		DELETE FROM CONF.OBJECT WHERE NAME = :name;';

	db.query(query, {name: name}, (err, rows) => {
		if (!err) {
			query = 'DROP TABLE STORAGE.:name'
			db.query(query, {name: name}, (err, rows) => {
				if(!err) {
					db.query('COMMIT;')
					typeof callback === 'function' && callback({ msg: 'OK' })
				}
				else {
					db.query('ROLLBACK;')
					typeof callback === 'function' && callback({ msg: 'KO', detail: err })
				}
			})
		}
		else {
			console.error(err)
			db.query('ROLLBACK')
			typeof callback === 'function' && callback({ msg: 'KO', detail: err })
		}
	});
}

exports.setDefault = (name, callback) => {
	var query = 'UPDATE CONF.OBJECT SET ISDEFAULT = 0 WHERE ISDEFAULT = 1;'
	db.query(query, (err, rows) => {
		query = 'UPDATE CONF.OBJECT SET ISDEFAULT = 1 WHERE NAME = :name;'
		db.query(query, {name: name}, (err, rows) => {
			typeof callback === 'function' && callback({ msg: 'OK' })
		});
	});
}

exports.editField = (object, field, data, callback) => {

	var query = 'SELECT :columnLabelEdit AS "label", DT.ID_DATATYPE AS "datatype", DT.NAME AS "type", '
	query += (data.columnDefaultEdit == '1' ? '1 AS "generated", DD.ID_DATADEFAULT AS "datadefault", DD.NAME AS "default",' : '0 AS "generated", NULL AS "datadefault", NULL AS "default", ');
	query += (data.columnForeignEdit == '1' ? '1 AS "foreign", CO.ID_OBJECT AS "referenced_object", CF.ID_FIELD AS "referenced_field", CO.NAME AS "referencedObject", CF.NAME AS "referencedField"'
		: '0 AS "foreign", NULL AS "referenced_object", NULL AS "referenced_field", NULL AS "referencedObject", NULL AS "referencedField" ');
	query += 'FROM CONF.DATATYPE DT ' + (data.columnDefaultEdit == '1' ? 'JOIN CONF.DATADEFAULT DD ON DD.NAME = :columnTypeEdit ' : '');
	query += (data.columnForeignEdit == '1' ? 'JOIN CONF.OBJECT CO ON CO.NAME = :referencedObjectEdit_val JOIN CONF.FIELD CF ON CF.NAME = :referencedFieldEdit_val AND CF.PARENT_OBJECT = CO.ID_OBJECT '
		: '');
	query += 'WHERE DT.NAME = :columnTypeEdit;';

	var oldField = viewObjects[object].fields[field];
	var params = {};

	for (key in data) {
		var parsed = parseInt(data[key]);
		params[key] = (isNaN(parsed) ? data[key] : parsed);
	}

	db.query(query, params, (err, rows) => {
			if (err || rows.length != 1) {
				//faire un truc
				db.query('ROLLBACK')
				typeof callback === 'function' && callback({ msg: 'KO', detail: err })
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
				updateViewObjects(() => {
					typeof callback === 'function' && callback({ msg: 'OK' });
				});
			}
		});
}

// SQLITE Independant
const isDeleteColumn = (field1, field2) => {
	deleteValues = ['type', 'referencedObject', 'referencedField'];
	for (key in field1) {
		if (deleteValues.indexOf(key) != -1) {
			if (field1[key] != field2[key]) {
				return true;
			}
		}
	}
	return false;
}

exports.editColumnOrder = (object, data, callback) => {

	var query;
	db.query('BEGIN TRANSACTION;');

	for(field in data) {
		query = 'UPDATE CONF.FIELD SET POS = :pos WHERE PARENT_OBJECT = ';
		query += '(SELECT ID_OBJECT FROM CONF.OBJECT WHERE NAME = :objectName) ';
		query += 'AND NAME = :fieldName;'
		db.query(query, {pos: data[field], objectName: object, fieldName: field})
	}

	db.query('COMMIT;', (err, rows) => {
		err ? callback({msg: 'KO', detail: err}) : callback({msg: 'OK'});
	});
}

exports.removeField = (object, field, callback) => {
	var query;

	db.query('BEGIN TRANSACTION;');

	query = 'SELECT F.ID_FIELD as id_field FROM CONF.FIELD F WHERE F.PARENT_OBJECT = ';
	query += '(SELECT O.ID_OBJECT FROM CONF.OBJECT O WHERE O.NAME = :object) AND F.NAME = :field';

	db.query(query, {object: object, field: field}, (err, rows) => {
		if (err || rows.length != 1) {
			console.error(err);
			db.query('ROLLBACK');
			typeof callback === 'function' && callback({msg: 'KO', detail: err});
			return;
		}
		else {
			var idField = rows[0].id_field;
			query = 'DELETE FROM CONF.FIELD WHERE ID_FIELD = :id_field';
			db.query(query, {id_field: idField});
			db.query('SELECT * FROM CONF.FIELD WHERE ID_FIELD = :id_field', {id_field: idField}, function (err, rows) {
				if(rows.length != 0) {
					console.error(err);
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
							console.error(err);
							db.query('ROLLBACK');
							return;
						}
						for (i in rows) {
							fieldString += rows[i].name + ' ' + rows[i].field + ',';
							nameString += rows[i].name + ',';
						}
						fieldString = __removeLastChar(fieldString);
						nameString = __removeLastChar(nameString);

						query = 'ALTER TABLE STORAGE.' + object  + ' RENAME TO ' + object + '_old;';
						query += 'CREATE TABLE STORAGE.' + object + '(' + fieldString + ');';
						query += 'INSERT INTO STORAGE.' + object + ' SELECT ' + nameString + ' FROM STORAGE.' + object + '_old;';
						db.query(query, function (err, rows) {
							if(err) {
								console.error(err);
								db.query('ROLLBACK');
								typeof callback === 'function' && callback({ msg: 'KO', detail: err });
								return;
							}
							else {
								db.query('DROP TABLE ' + object + '_old;');
								db.query('COMMIT');
								typeof callback === 'function' && callback({ msg: 'OK' });
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

exports.editObjectOrder = (data, callback) => {

	let query
	db.query('BEGIN TRANSACTION;')

	for (object in data) {
		query = 'UPDATE OBJECT SET POS = :pos WHERE NAME = :name;'
		db.query(query, { name: object, pos: data[object] })
	}

	db.query('COMMIT;', (err, rows) => {
		err ? callback({ msg: 'KO', detail: err }) : callback({ msg: 'OK' })
	})
}

/** USERS **/

exports.getAllUsers = (callback) => {
	var query = 'SELECT ID_USER AS id, LOGIN AS login, LEVEL AS level, ACTIVE AS active FROM CONF.USER WHERE LEVEL < 99;';
	db.query(query, (err, rows) => {
		typeof callback === 'function' && callback(rows)
	});
}

exports.createUser = (data, callback) => {
	const query = 'INSERT OR ROLLBACK INTO CONF.USER VALUES (NULL, :login, :password, :level, 1);'
	db.query('SELECT COALESCE(MAX(LOGIN = :login), 0) AS "exists" FROM CONF.USER;', { login: data.userLoginInput }, (err, rows) => {
		console.error(err);
		if (rows[0].exists === 0) {
			db.query(query, { login: data.userLoginInput, password: data.userPasswordInput, level: data.userLevelInput }, (err, rows) => {
				err ? callback({ msg: 'KO', detail: err }) : callback({ msg: 'OK' })
			})
		}
		else {
			typeof callback === 'function' && callback({ msg: 'KO', detail: {unique: 0 }})
		}
	})
}

exports.modifyUser = (id, data, callback) => {
	var query = 'UPDATE CONF.USER SET LEVEL = :level WHERE ID_USER = :id;'
	db.query(query, { id: id, level: data.userLevelModify }, (err, rows) => {
		err ? callback({ msg: 'KO', detail: err }) : callback({ msg: 'OK' })
	})
}

exports.deleteUser = (id, callback) => {
	var query = 'DELETE FROM CONF.USER WHERE ID_USER = :id;'
	db.query(query, { id: id }, (err, rows) => {
		err ? callback({ msg: 'KO', detail: err }) : callback({ msg: 'OK' })
	})
}

exports.activateUser = (id, callback) => {
	var query = 'UPDATE CONF.USER SET ACTIVE = CASE WHEN ACTIVE = 0 THEN 1 ELSE 0 END WHERE ID_USER = :id';
	db.query(query, { id: id }, function (err, rows) {
		err ? callback({msg: 'KO', detail: err}) : callback({ msg: 'OK' });
	});
}

/** CONFIGURATION **/

const SCHEMA_QUERY = "SELECT O.ID_OBJECT id, \
				 O.SCHEMA schema, \
				 O.NAME name, \
				 O.LABEL label, \
				 O.ALIAS alias, \
				 O.APIURL apiUrl, \
				 O.VIEW_ID viewId, \
				 O.ISDEFAULT \"default\", \
				 O.ISACTIVABLE activable, \
				 O.POS pos, \
				 G.NAME \"group\", \
				 G.ID_OBJECTGROUP groupId, \
				 O.CUSTOM custom, \
				 O.ISFORM \"isform\", \
				 COALESCE(F.FIELDS, JSON_ARRAY() ) fields \
FROM OBJECT O \
LEFT JOIN ( \
		SELECT PARENT_OBJECT, \
						 JSON_GROUP_ARRAY(JSON_OBJECT('id', ID_FIELD, 'name', NAME, 'label', LABEL, 'type', DATATYPE, \ 'generated', ISGENERATED, 'default', DATADEFAULT, 'foreign', ISFOREIGN, 'referencedObject', REFERENCED_OBJECT, 'referencedField', REFERENCED_FIELD, 'pos', POS, 'parentObject', PARENT_OBJECT, 'hidden', HIDDEN, 'required', REQUIRED) ) FIELDS \
				FROM ( \
						SELECT F.PARENT_OBJECT, \
						 F.ID_FIELD, \
						 F.NAME, \
						 F.LABEL, \
						 DT.NAME AS DATATYPE, \
						 F.ISGENERATED, \
						 DD.NAME AS DATADEFAULT, \
						 F.ISFOREIGN, \
						 F.REFERENCED_OBJECT, \
						 F.REFERENCED_FIELD, \
						 F.POS, \
						 F.HIDDEN, \
						 F.REQUIRED \
				FROM FIELD F \
						 LEFT JOIN \
						 DATATYPE DT ON F.DATATYPE = DT.ID_DATATYPE \
						 LEFT JOIN \
						 DATADEFAULT DD ON F.DATADEFAULT = DD.ID_DATADEFAULT \
			 ORDER BY F.POS \
		 ) FIELDS \
			 GROUP BY PARENT_OBJECT \
) F ON O.ID_OBJECT = F.PARENT_OBJECT \
LEFT JOIN OBJECTGROUP G ON O.PARENT_GROUP = G.ID_OBJECTGROUP"

const SCHEMA_TYPES = {
	id: Number,
	schema: String,
	name: String,
	label: String,
	alias: String,
	apiUrl: String,
	viewId: String,
	default: Boolean,
	activable: Boolean,
	pos: Number,
	group: String,
	groupId: String,
	custom: Boolean,
	isform: Boolean,
	fields: (fieldValue) => {
		return JSON.parse(fieldValue, (key, value) => {
			if(['generated', 'foreign', 'hidden', 'required'].indexOf(key) !== -1) {
				return Boolean(value)
			}
			else {
				return value
			}
		})
	}
}

exports.updateViewObjects = function (params, callback) {

	if (arguments.length === 1) {
		if (params instanceof Function) {
			callback = params;
		}
		else {
			throw 'Callback is not a function.';
		}
	}

	let query = SCHEMA_QUERY
	query += params.id ? ' WHERE id = :id' : ''
	query += params.defaultObject ? ' WHERE "default" = 1' : ''
	query += params.prod ? ' WHERE ID_OBJECT >= 100' : ''
	query += ' ORDER BY O.POS;'

	db.query(query,	params,	SCHEMA_TYPES,	(err, rows) => {
			err && console.error(err)
			typeof callback === 'function' && callback({msg: 'OK', obj: rows})
	})
}

exports.isValidRoute = (apiUrl, callback) => {
	const query = SCHEMA_QUERY + ' WHERE apiUrl = :apiUrl'
	db.query(query, {apiUrl: '/' + apiUrl},	SCHEMA_TYPES,	(err, rows) => {
			typeof callback === 'function' && callback(rows[0]);
	})
}

/** AUTHENTICATION **/

exports.authenticate = function (username, password, done) {
	const query = 'SELECT id_user as "id_user", login as "login", level as "level" FROM CONF.USER WHERE login = :user and password = :pass'
	db.query(query,	{ user: username, pass: password }, (err, rows) => {
			if(rows.length === 0) {
				return done(null, false, {message: 'Cannot authenticate user.'})
			}
			else if (rows[0].active === 0) {
				return done(null, false, {message: 'This account has been suspended.<br> Please contact an administrator.'})
			}
			else {
				return done(null, rows[0])
			}
	})
}

exports.deserializeUser = function (id, done) {
	const query = 'select id_user as "id_user", login as "login", level as "level" FROM CONF.USER WHERE id_user = :id_user'
	db.query(query, { id_user: id }, (err, rows) => {
		done(null, rows[0])
	})
}

/** UTILS **/

const __removeLastChar = (string) => {
	return string.substring(0, string.length - 1)
}

const oftype = (name) => {
	return {
		'undefined': undefined,
		'object': Object,
		'boolean': Boolean,
		'number': Number,
		'string': String,
		'function': Function
	}[name]
}
