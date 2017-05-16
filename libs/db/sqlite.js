const _ = require('js-common-utils')
const jwt = require('jsonwebtoken')

const api = require('../../utils/api')
const logger = require('../../utils/logging')
const sql = require('../../utils/sql')

exports.openDb = (type, config) => {
	const dblite = require('dblite')
	db = dblite(':memory:', '-header')
	db.query('attach database :db as :schema', {db: require('path').join(__dirname, '..', '..', 'db', config.get('Database.Connection.StorageDb')), schema: 'STORAGE'})
	db.query('attach database :db as :schema', {db: require('path').join(__dirname, '..', '..', 'db', config.get('Database.Connection.ConfigDb')), schema: 'CONF'})
	return db
}

/** GET RESPONSES **/

exports.getAll = async (object, params) => {
	const { status, code, data } = await getAll(object, params)
	return status ? api.success(data, code) : api.error(data, code)
}

/** GET QUERIES **/

/**
 *	Récupère les données d'un objet passé en paramètre
 * @param {object} object - La définition de l'objet recherché
 * @param {object} params - Les critères de recherche {id, page, size, sort, filter, fields}
 * @param {function} callback
 */
// /api/object?fields=field1,field2&sort=field1,-field2&page=1&size=100&filter={field1:"value",field2:"value"}
const GET_ALL = sql(require('path').join('sql', 'GET_ALL.sql'))
const getAll = async (object, params) => {
	let query = GET_ALL

	// REQUESTED FIELDS
	if(params.fields && !(params.fields instanceof Function)) {
		const requestedFields = object.fields.filter(e => params.fields.split(',').indexOf(e.name) !== -1)
		if(requestedFields.length > 0) {
			query += ' AND (' + requestedFields.map(f => " F.NAME = '" + f.name + "'").join('OR') + ')'
		}
	}

	query += ' ORDER BY F.POS ASC;'

	let join = false
	let fieldString = ''
	let joinString = ''

	const rows = await new Promise((resolve, reject) => {
		db.query(query, { id_object: object.id }, (err, rows) => {
			if(err) {
				reject({ status: false, code: 500, data: err })
				logger.error(err)
			}
			else {
				resolve(rows)
			}
		})
	})

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
	fieldString = _.removeLastChar(fieldString)

	query = 'SELECT ' + fieldString + ' FROM ' + object.schema + '.' + object.name + ' ' + object.alias + ' ' + joinString

	const filterParams = {}
	// GET ONE BY ID
	if(params.id) {
		query += ' WHERE ' + object.alias + '.ID = :id'
		filterParams.id = params.id
	}

	// QUERY FILTERS
	if(params.filter) {
		try {
			const filters = JSON.parse(params.filter)
			const filterFields = object.fields.filter(f => Object.keys(filters).indexOf(f.name) !== -1)
			if(filterFields.length > 0) {
				query += (params.id ? ' AND ' : ' WHERE ')
					+ filterFields.map((f, i) => {
						filterParams[f.name + i] = filters[f.name]
						return f.foreign ?
							f.referencedObject + f.id + '.' + f.referencedField + ' = :' + f.name + i :
							object.alias + '.' + f.name + ' = :' + f.name + i
					}).join(' AND ')
			}
		}
		catch(e) {
			logger.error(e)
			return { status: false, code: 400, data: 'Filter parsing error.'}
		}
	}

	// SORT QUERY IF PARAMS.SORT EXISTS; - FOR DESC SORT
	if(params.sort && !(params.sort instanceof Function)) {
			const sortFields = params.sort.split(',')
				.filter(f => object.fields.map(f => f.name).indexOf(['-', '+'].indexOf(f.charAt(0)) !== -1 ? f.slice(1, f.length) : f) !== -1)
				.map(f => f.charAt(0) === '-' ? { name: f.slice(1, f.length), dir: 'DESC' } : { name: f, dir: 'ASC' })
		if(sortFields.length > 0) {
			query += ' ORDER BY ' + sortFields.map(f => object.alias + '.' + f.name + ' ' + f.dir).join(',')
		}
	}

	// QUERY PAGINATION ; PAGE SIZE : DEFAULT 20 / MAX 100
	const page = params.page && parseInt(params.page) || 1
	const size = params.size && Math.min(parseInt(params.size), 100) || 20
	query += ' LIMIT ' + size + ' OFFSET ' + ((page - 1) * size) + ';'

	try {
		return await new Promise((resolve, reject) => {
			db.query(query, filterParams, dataMap, (err, rows) => {
				if(err) {
					reject({ status: false, code: 500, data: err.message })
					console.error(err, rows)
				}
				else if(rows.length === 0) {
					reject({ status: false, code: 404, data: 'Specified resource does not exists' })
				}
				else {
					resolve({ status: true, code: 200, data: rows })
				}
			})
		})
	}
	catch(err) {
		return err
	}
}

/** PUT QUERIES **/

exports.postCreate = async (object, params, callback) => {
	if (arguments.length === 2) {
		if (params instanceof Function) {
			callback = params;
		}
		else {
			throw 'Callback is not a function.';
		}
	}

	let isParamsValid = true
	let messages = []
	let query = ''
	let baseQuery = 'INSERT INTO ' + object.schema + '.' + object.name
	let tableInfo = ' ('

	for (field of object.fields.filter(f => f.name !== 'id')) {
		/**
		 * Test des paramètres
		**/
		// Required fields
		if(params[field.name] === undefined) {
			if(field.required) {
				isParamsValid = false
				messages.push(`Missing required parameter : ${field.name}`)
				continue
			}
			continue
		}
		// Foreign fields
		if(field.foreign) {
			if(!parseInt(params[field.name])) {
				isParamsValid = false
				messages.push(`Foreign field ${field.name} requires numeric value not : ${params[field.name]}`)
				continue
			}
			try {
				let foreignExists = await checkForeignField(params[field.name], field.referencedObject)
				if(!foreignExists) {
					isParamsValid = false
					messages.push(`Value ${params[field.name]} does not exist for foreign field ${field.name}`)
					continue
				}
			}
			catch(e) {
				console.log(e)
				continue
			}
		}
		// Date fields
		if(field.type === 'Date') {
			if(isNaN(new Date(params[field.name]).getTime())) {
				isParamsValid = false
				messages.push(`Invalid format for date parameter ${field.name}. ISO8601 is prefered.`)
				continue
			}
			else {
				params[field.name] = new Date(params[field.name]).toISOString()
			}
		}
		// Numeric field
		if(field.type === 'Number' && (isNaN(parseFloat(params[field.name])) || isFinite(params[field.name]))) {
			isParamsValid = false
			messages.push(`Invalid format for numeric parameter ${field.name}`)
			continue
		}

		// Construction de la requête
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

	if(!isParamsValid) {
		callback(api.error(messages, 400))
		return
	}

	query = query.substring(0, query.length -1)
	tableInfo = tableInfo.substring(0, tableInfo.length -1) + ')'
	query = baseQuery + tableInfo + ' VALUES (' + query + ');'

	db.query(query, params, async (err) => {
		if (err) {
			console.error(err)
			typeof callback === 'function' && callback(api.error(err.message))
		}
		else {
			try {
				const { status, code, data } = await fetchLastInserted(object)
				typeof callback === 'function' && callback(status ? api.success(data, code) : api.error(data, code))
			}
			catch(err) {
				typeof callback === 'function' && callback(api.error(err.message))
			}
		}
	})
}

/** DELETE QUERIES **/

exports.postDelete = async (object, id) => {
	const entry = await getAll(object, { id: id })
	if (!entry.status) {
		return api.error(entry.data, entry.code)
	}
	let query = 'DELETE FROM ' + object.schema + '.' + object.name + ' WHERE ID = :id'
	try {
		return await new Promise((resolve, reject) => {
			db.once('error', err => reject(api.error(err, 500)))
			db.query(query, { id: id }, _ => {
				resolve(api.success({}))
			})
		})
	}
	catch(err) {
		return err
	}
}

/** HELPERS **/

/** POST **/

const checkForeignField = (id, objectName) => {
	const query = 'SELECT COUNT(1) as "count" FROM ' + objectName + ' WHERE ID = :id';
	return new Promise((resolve, reject) => {
		db.query(query, { id: id }, { count: Number }, (err, rows) => {
			if(!err && rows) {
				// False if count = 0; True otherwise
				resolve(rows[0].count !== 0)
			}
			else {
				console.error(err)
				reject(false)
			}
		})
	})
}

const fetchLastInserted = (object) => {
	return new Promise((resolve, reject) => {
		db.lastRowID(object.name, id => {
			resolve(getAll(object, { id: id }))
		})
	})
}


/**
 *	OLD
**/

exports.getCount = (object, callback) => {
	const query = 'SELECT COUNT(1) AS "count" FROM STORAGE.' + object.name + ';'
	db.query(query, (err, rows) => {
		typeof callback === 'function' && callback(rows[0])
	})
}

exports.getUsedGroups = (prod, callback) => {
	const query = 'SELECT DISTINCT CG.ID id, CG.NAME name, CG.POS pos, CG.VALID valid FROM CONF.OBJECT CO INNER JOIN CONF.OBJECTGROUP CG ON CG.ID = CO.PARENT_GROUP WHERE VALID = 1 ' + (prod ? 'AND ID >= 100' : '') + ' ORDER BY CG.POS ASC'
	db.query(query, { id: Number, name: String, pos: Number, valid: Boolean }, rows => {
		typeof callback === 'function' && callback(rows)
	})
}

exports.getGroupObjects = (prod, callback) => {
	const query = 'SELECT CG.ID AS groupId, CG.NAME groupName, CG.POS AS groupPos, CO.ID objectId, CO.NAME objectName, CO.LABEL AS objectLabel, CO.POS AS objectPos FROM CONF.OBJECT CO JOIN CONF.OBJECTGROUP CG ON CO.PARENT_GROUP = CG.ID ORDER BY CG.POS ASC;'
	db.query(query, rows => {
		typeof callback === 'function' && callback(rows)
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
	var result_set = { name: Number, label: Number }
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
				getViewObjects(() => {
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

/** HELPERS **/

/** POST HELPERS **/

/** USERS **/

exports.getAllUsers = (callback) => {
	var query = 'SELECT ID AS id, LOGIN AS login, LEVEL AS level, ACTIVE AS active FROM CONF.USER WHERE LEVEL < 99;';
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
	var query = 'UPDATE CONF.USER SET LEVEL = :level WHERE ID = :id;'
	db.query(query, { id: id, level: data.userLevelModify }, (err, rows) => {
		err ? callback({ msg: 'KO', detail: err }) : callback({ msg: 'OK' })
	})
}

exports.deleteUser = (id, callback) => {
	var query = 'DELETE FROM CONF.USER WHERE ID_ = :id;'
	db.query(query, { id: id }, (err, rows) => {
		err ? callback({ msg: 'KO', detail: err }) : callback({ msg: 'OK' })
	})
}

exports.activateUser = (id, callback) => {
	var query = 'UPDATE CONF.USER SET ACTIVE = CASE WHEN ACTIVE = 0 THEN 1 ELSE 0 END WHERE ID = :id';
	db.query(query, { id: id }, function (err, rows) {
		err ? callback({ msg: 'KO', detail: err }) : callback({ msg: 'OK' });
	});
}

/** CONFIGURATION **/

const SCHEMA_QUERY = sql(require('path').join('sql', 'VIEW_OBJECTS.sql'))

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
	groupId: (groupId) => {
		return groupId === '' ? null : Number(groupId)
	},
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

exports.getViewObjects = function (params, callback) {
	if (arguments.length === 1) {
		if (params instanceof Function) {
			callback = params;
		}
		else {
			throw 'Callback is not a function.';
		}
	}

	let query = SCHEMA_QUERY
	query += params.id ? ' WHERE O.ID = :id' : ''
	query += params.defaultObject ? ' WHERE O."default" = 1' : ''
	query += params.prod ? ' WHERE O.ID >= 100' : ''
	query += ' ORDER BY O.POS;'

	db.query(query,	params,	SCHEMA_TYPES,	(err, rows) => {
			if(err) {
				logger.error(err)
				typeof callback === 'function' && callback(api.error(err))
			}
			else {
				typeof callback === 'function' && callback(api.success(rows))
			}

	})
}

exports.isValidRoute = (apiUrl, callback) => {
	const query = SCHEMA_QUERY + ' WHERE apiUrl = :apiUrl'
	db.query(query, { apiUrl: '/' + apiUrl },	SCHEMA_TYPES,	(err, rows) => {
			typeof callback === 'function' && callback(rows[0]);
	})
}

/** AUTHENTICATION **/

exports.authenticate = function (username, password, done) {
	const query = 'SELECT id as "id_user", login as "login", level as "level" FROM CONF.USER WHERE login = :user and password = :pass'
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

exports.authenticateJWT = (username, password, callback) => {
	console.log(username, password);
	if(username === undefined || password === undefined) {
		callback(api.error('Bad request', 400))
		return
	}
	const query = 'SELECT id, login, level FROM CONF.USER WHERE login = :user AND password = :pass'
	db.query(query, { user: username, pass: password }, (err, rows) => {
		if(err) {
			callback(api.error('Internal error.'))
			console.error(err)
		}
		else if (rows.length === 0) {
			callback(api.error('Cannot authenticate user.', 401))
		}
		else if (rows[0].active === 0) {
			callback(api.error('This account has been suspended. Please contact an administrator.', 401))
		}
		else {
			callback(api.success({
				token: jwt.sign({
					exp: Math.floor(Date.now() / 1000) + (604800)
				}, 'jsforms')
			}))
		}
	})
}

exports.deserializeUser = function (id, done) {
	const query = 'select id as "id_user", login as "login", level as "level" FROM CONF.USER WHERE id = :id_user'
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
