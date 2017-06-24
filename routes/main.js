//
const express = require('express')
const config = require('config')
const jwt = require('express-jwt')

const DbLib = require(require('path').join(__dirname, '..', 'libs', 'db', config.get('App.DatabaseDriver')))
const api = require(require('path').join(__dirname, '..', 'utils', 'api'))

const router = express.Router()

/** ROUTE VALIDATION **/

// MIDDLEWARE CHECKING IF AUTHENTICATED
const auth = jwt({ secret: 'jsforms' })

// MIDDLEWARE CHECKING IF REQUESTED ROUTE EXISTS
const isValidRoute = (req, res, next) => {
	DbLib.isValidRoute(req.params.apiUrl, object => {
		if(object !== undefined) {
			if(object.schema.toUpperCase() === 'CONF' && object.name.toUpperCase() === 'SCHEMA' && req.method.toUpperCase() !== 'GET') {
				res.status(400).send(`This operation isn't permitted on schema object`)
			}
			else if(object.schema.toUpperCase() === 'CONF' && object.name.toUpperCase() === 'DATATYPE' && ['GET', 'POST'].indexOf(req.method.toUpperCase()) === -1) {
				res.status(400).send(`This operation isn't permitted on datatype object`)
			}
			else {
				req.object = object
				next()
			}
		}
		else {
			res.status(404).send(api.error('Requested object does not exist.'))
		}
	})
}

// MIDDLEWARE CHECKING IF REQUESTED ID IS NUMERIC
const parseId = (req, res, next) => {
	if(['PUT', 'DELETE'].indexOf(req.method.toUpperCase()) !== -1 && req.params.id === undefined) {
		res.status(400).send(api.error(`${req.method} method requires an object to modify.`).data)
	}
	else if(req.params.id !== undefined && !parseInt(req.params.id)) {
		res.status(400).send(api.error('Id must be numeric').data)
	}
	else {
		next()
	}
}

/** API **/

// router.get(/\/([a-z]+)\/?([0-9]+?)/ig, (req, res) => {
// router.get(/^\/([a-z]+)\/?([0-9]+)?\/?([a-z]+)?(?:\/(?=$))?$/ig, (req, res) => {
router.get('/:obj[a-z]+', (req, res) => {
	res.send(req.params)
})

router.post('/authenticate', (req, res) => {
	DbLib.authenticateJWT(req.body.username, req.body.password, rst => {
		const { code, data } = rst
		res.status(code).send(data)
	})
})

router.get('/init/:id?', parseId, (req, res) => {
	DbLib.getViewObjects({ prod: false, id: req.params.id }, data => {
		res.send(data)
	})
})

router.route('/:apiUrl/:id?')
	.get(auth, isValidRoute, parseId, async (req, res) => {
		const params = req.query || {}
		if(params.id !== undefined)
			params.id = req.params.id
		const { code, data } = await DbLib.getAll(req.object, params)
		res.status(code).send(data)
	})
	.post(auth, isValidRoute, async (req, res) => {
		const { code, data } = await DbLib.postCreate(req.object, req.body)
		res.status(code).send(data)
	})
	.put(auth, isValidRoute, parseId, async (req, res) => {
		const { code, data } = await DbLib.postUpdate(req.object, req.params.id, req.body)
		res.status(code).send(data)
	})
	.delete(auth, isValidRoute, parseId, async (req, res) => {
		const { code, data } = await DbLib.postDelete(req.object, req.params.id)
		res.status(code).send(data)
	})

// router.use((req, res, next) => {
// 	console.log(req);
// 	res.status(404).send('404')
// })

module.exports = router
