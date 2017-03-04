//
const path = require('path')
const execFile = require('child_process').execFile
const Lib = require('../libs/lib.js')

module.exports = (data) => {

	const app = data.app
	const passport = data.passport
	const DbLib = data.dblib
	const configFile = data.conf
	const releases = data.storage
	const auth = data.auth

	app.use((req, res, next) => {
	    res.setHeader('Access-Control-Allow-Origin', configFile.allowedRemoteHosts.join(' '))
	    res.setHeader('Access-Control-Allow-Methods', configFile.allowedRemoteMethods.join(', '))
	    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type')
	    res.setHeader('Access-Control-Allow-Credentials', true)
    	next()
	})

	/** ROOT **/

	app.get('/dev', (req, res) => {
		res.sendFile(path.join(__dirname, '..', 'views', 'index.html'))
	})

	if (configFile.devMode) {
		app.get('/', (req, res) => {
			res.sendFile(path.join(__dirname, '..', 'views', 'index.html'))
		})
	}
	else {
		app.get('/', loggedIn, (req, res) => {
			var user = req.user
			res.sendFile(path.join(__dirname, '..', 'views', 'index.html'))
		})
	}

	/** AUTH **/

	/** GET ROUTES **/
	const isValidRoute = (req, res, next) => {
		DbLib.isValidRoute(req.params.apiUrl, (object) => {
			if(object !== undefined) {
				req.object = object
				next()
			}
			else {
				res.status(404)
				res.render('404')
			}
		})
	}

	app.get('/api/get/:apiUrl', isValidRoute, (req, res) => {
		DbLib.getAll(req.object, (rows) => {
			res.send(rows)
		})
	})



	app.get('/api/limit/:apiUrl/:page', isValidRoute, (req, res) => {
		DbLib.getAll(req.object, {page: req.params.page}, (rows) => {
			res.send(rows)
		})
	})

	app.get('/api/count/:apiUrl', isValidRoute, (req, res) => {
		DbLib.getCount(req.object, (rows) => {
			res.send(rows)
		})
	})

	app.get('/api/get/:apiUrl/:id', isValidRoute, (req, res) => {
		DbLib.getAll(req.object, {id: req.params.id}, (rows) => {
			res.send(rows)
		})
	})

	/** POST ROUTES **/

	app.post('/api/create/:apiUrl', isValidRoute, (req, res) => {
		DbLib.postCreate(req.object, req.body, (rows) => {
			res.send(rows)
		})
	})

	app.post('/api/activate/:apiUrl/:id', isValidRoute, (req, res) => {
		DbLib.postActivate(req.object, req.params.id, (rows) => {
			res.send(rows)
		})
	})

	// ∕api >> SLASH MYSTIQUE ??? ∕∕∕∕∕∕ == NOT A SLASH ????

	app.delete('/api/:apiUrl/:id', isValidRoute, (req, res) => {
		DbLib.postDelete(req.object, req.params.id, (rows) => {
			res.send(rows)
		})
	})

	app.post('/api/modify/:apiUrl/:id', isValidRoute, (req, res) => {
		DbLib.postModify(req.object, req.params.id, req.body, (data) => {
			res.send(data)
		})
	})

	/** MAINTENANCE **/
	/** Manager views and fields **/

	app.get('/api/maintenance/appname', function (req, res) {
		res.send({msg: 'OK', obj: configFile.appName})
	})

	app.get('/api/maintenance/groups', function (req, res) {
		DbLib.getGroups(!configFile.devMode, (data) => {
			res.send(data);
		});
	});

	app.get('/api/maintenance/usedgroups', function (req, res) {
		DbLib.getUsedGroups(!configFile.devMode, (data) => {
			res.send(data);
		});
	});

	app.post('/api/maintenance/addview', function (req, res) {
		DbLib.addView(req.body, function (data) {
			res.send(data);
		});
	});

	app.post('/api/maintenance/setdefault', function (req, res) {
		DbLib.setDefault(req.body.name, function (data) {
			res.send(data);
		});
	});

	app.post('/api/maintenance/addcolumn', function (req, res) {
		DbLib.addColumn(req.body, function (data) {
			res.send(data);
		});
	});

	app.post('/api/maintenance/view/remove/:name', function (req, res) {
		DbLib.removeView(req.params.name, function (data) {
			res.send(data);
		});
	});

	app.post('/api/maintenance/column/edit/:object/:field', function (req, res) {
		DbLib.editField(req.params.object, req.params.field, req.body, function (data) {
			res.send(data);
		});
	});

	app.post('/api/maintenance/column/order/:object', function (req, res) {
		DbLib.editColumnOrder(req.params.object, req.body, function (data) {
			res.send(data);
		});
	});

	app.post('/api/maintenance/column/remove/:object/:field', function (req, res) {
		DbLib.removeField(req.params.object, req.params.field, function (data) {
			res.send(data);
		});
	});

	app.post('/api/maintenance/object/edit/:object', function (req, res) {
		DbLib.editObject(req.params.object, req.body, function (data) {
			res.send(data);
		});
	});

	app.post('/api/maintenance/object/order', function (req, res) {
		DbLib.editObjectOrder(req.body, function (data) {
			res.send(data);
		});
	});

	/** USERS **/

	app.get('/api/maintenance/users', function (req, res) {
		DbLib.getAllUsers(function (data) {
			res.send(data);
		});
	});

	app.post('/api/maintenance/users/create', function (req, res) {
		DbLib.createUser(req.body, function (data) {
			res.send(data);
		});
	});

	app.post('/api/maintenance/users/remove/:id', function (req, res) {
		DbLib.deleteUser(req.params.id, function (data) {
			res.send(data);
		})
	});

	app.post('/api/maintenance/users/modify/:id', function (req, res) {
		DbLib.modifyUser(req.params.id, req.body, function (data) {
			res.send(data);
		})
	});

	app.post('/api/maintenance/users/activate/:id', function (req, res) {
		DbLib.activateUser(req.params.id, function (data) {
			res.send(data);
		})
	});

	/** CONFIGURATION **/

	app.get('/init', function (req, res) {
		DbLib.updateViewObjects({prod: !configFile.devMode}, function (data) {
			res.send(data);
		});
	});

	app.get('/api/init/view/:id', function (req, res) {
		DbLib.updateViewObjects({id: req.params.id}, function (data) {
			res.send(data)
		})
	})

	/** AUTH **/

	app.get('/login', function (req, res) {
		let alert = ''
		const flash = req.flash().error
		if(flash) {
			for (i in flash) {
				alert += '<div class="alert alert-danger form-signin" role="alert">' + flash[i] + '</div>'
			}
		}
		const template = { errs: alert }
		res.render('login', template)
	})

	app.post('/login',
		passport.authenticate('local',
		{
			successRedirect: '/',
			failureRedirect: '/login',
			failureFlash: true
		})
	)

	app.get('/logout', function (req, res) {
		req.logout()
		res.redirect('/')
	})

	function loggedIn(req, res, next) {
		if (req.user) {
			next()
		}
		else {
			res.redirect('/login')
		}
	}

	function requirePrivilege(req, res, next) {
		if(req.user) {
			if(req.user === 0) {
				console.log('Insufficient rights')
				res.status(401).send({ msg: 'KO', detail: 'Insufficient rights.' })
			}
			else {
				next()
			}
		}
		else {
			res.redirect('/login')
		}
	}

	function requireAdmin(req, res, next) {
		if(req.user) {
			if(req.user.level < 2) {
				res.status(401).send({msg: 'KO', detail: 'Insufficient rights.'})
			}
			else {
				next()
			}
		}
		else {
			res.redirect('/login')
		}
	}

	function requireDev(req, res, next) {
		if(req.user) {
			if(req.user.level !== 99) {
				res.status(401).send({msg: 'KO', detail: 'Insufficient rights.'})
			}
			else {
				next()
			}
		}
		else {
			res.redirect('/login')
		}
	}

	if(!configFile.devMode) {
		app.all('/api/create/*', requirePrivilege)
		app.all('/api/activate/*', requirePrivilege)
		app.all('/api/delete/*', requirePrivilege)
		app.all('/api/modify/*', requirePrivilege)
		app.all('/api/maintenance/admin/*', requireAdmin)
		app.all('/api/maintenance/dev/*', requireDev)
	}

	/** FILE UPLOAD **/

	app.post('/api/files/upload', releases.single('upload'), function (req, res) {
		console.log(req.file);
	});

	app.get('/api/files/download/:fileid', function (req, res) {

	});

	/** TEST **/

	if(configFile.devMode) {
		app.get('/test', function (req, res) {

			//var s = Knex('conf.object');
			//s = s.where('name', 'software');
			//s = s.select('pos');
			//s.then(function (rows) {
			//	res.send(rows);
			//})

			Knex.select(Knex.raw("'1' as pos, 'software' as name"))
				.union(Knex.raw("select '2' as pos, 'download' as name"))
				.then(function (rows) {
					res.send(rows)
				})

		});

		app.get('/test0', function (req, res) {
			var query = "WITH T1 AS "
			query += "(SELECT SUM(F.ISFOREIGN) AS HASJOIN FROM __FIELD F WHERE F.PARENT_OBJECT = (SELECT O.ID_OBJECT FROM __OBJECT O WHERE O.NAME = :object)) "
			query += "SELECT "
			query += "CASE WHEN T1.HASJOIN > 0 THEN "
			query += "CASE WHEN F.ISFOREIGN THEN "
			query += "RO.ALIAS || F.ID_FIELD || '.' || RF.NAME "
			query += "ELSE "
			query += "CASE WHEN DT.NAME = 'Date' THEN "
			query += "'STRFTIME(\"%d-%m-%Y %H:%M\", ' || O.ALIAS || '.' || F.NAME || ')' "
			query += "ELSE O.ALIAS || '.' || F.NAME END "
			query += "END "
			query += "ELSE "
			query += "CASE WHEN DT.NAME = 'Date' THEN "
			query += "'STRFTIME(\"%d-%m-%Y %H:%M\", ' || F.NAME || ')' "
			query += "ELSE "
			query += "F.NAME "
			query += "END "
			query += "END, "
			query += "CASE WHEN F.ISFOREIGN = 1 "
			query += "THEN 'JOIN ' || RO.NAME || ' ' || RO.ALIAS || F.ID_FIELD || ' ON ' || O.ALIAS || '.' || F.NAME || ' =  || RO.ALIAS || F.ID_FIELD || '.ID' "
			query += "ELSE '' END "
			query += "FROM __FIELD F, T1 "
			query += "JOIN __OBJECT O ON F.PARENT_OBJECT = O.ID_OBJECT "
			query += "JOIN __DATATYPE DT ON F.DATATYPE = DT.ID_DATATYPE "
			query += "LEFT JOIN __DATADEFAULT DD ON F.DATADEFAULT = DD.ID_DATADEFAULT "
			query += "LEFT JOIN __OBJECT RO ON F.REFERENCED_OBJECT = RO.ID_OBJECT "
			query += "LEFT JOIN __FIELD RF ON F.REFERENCED_FIELD = RF.ID_FIELD "
			query += "WHERE F.PARENT_OBJECT = (SELECT O.ID_OBJECT FROM __OBJECT O WHERE O.NAME = :object);"

			var dateFormat = '%d-%m-%Y %H:%M'

			db.query(query, {object: 'software'}, function (err, rows) {
				res.send(rows)
			});
		});

		app.get('/test1', function (req, res) {
			var query = 'SELECT NAME, LABEL, ALIAS, APIURL, VIEWID, ISDEFAULT, ISACTIVABLE FROM __OBJECT;'
			var result_set = {name: String, label: String, alias: String, apiUrl: String, view_id: String, isdefault: Number, isactivable: Number}
			db.query(query, result_set, function (err, rows) {
				res.send(rows)
			});
		});

		app.get('/test2', function (req, res) {
			var query = 'INSERT INTO SALUT (id, label3, label1, label2, label4) values '
			query += '(null, :label3, :label1, :label2, :label4)'

			params = {label3: 'v3', label1: 'v1', label2: 'v2', label4: 'v4'}

			db.query(query, params, function (err, rows) {
				res.send('ok')
			});
		});
	}

	/** 404 **/

	app.use(function (req, res, next) {
		res.status(404)
		res.render('404')
	});

}
