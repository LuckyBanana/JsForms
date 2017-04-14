//
const express = require('express')
const path = require('path')
const config = require('config')
const jwt = require('express-jwt')
const execFile = require('child_process').execFile

const DbLib = require(path.join(__dirname, '..', 'libs', 'db', config.get('App.DatabaseDriver') + '.js'))
const api = require('../utils/api')

const router = express.Router()
const auth = jwt({ secret: 'jsforms' })

/** ROUTE VALIDATION **/

// MIDDLEWARE CHECKING IF REQUESTED ROUTE EXISTS
const isValidRoute = (req, res, next) => {
	DbLib.isValidRoute(req.params.apiUrl, (object) => {
		if(object !== undefined) {
			req.object = object
			next()
		}
		else {
			res.status(404).send(api.error('Requested object does not exist.'))
		}
	})
}

// MIDDLEWARE CHECKING IF REQUESTED ID IS NUMERIC
const parseId = (req, res, next) => {
	console.log(req.params);
	if(['POST', 'DELETE'].indexOf(req.method.toUpperCase()) !== -1 && req.params.id === undefined) {
		res.status(400).send(api.error(`${req.method} method requires an object to modify.`))
	}
	else if(req.params.id !== undefined && !parseInt(req.params.id)) {
		res.status(400).send(api.error('Id must be numeric'))
		return
	}
	else {
		next()
	}
}

/** API **/

router.get('/init/:id?', parseId, (req, res) => {
	DbLib.getViewObjects({ prod: false, id: req.params.id }, (data) => {
		res.send(data)
	})
})

router.route('/:apiUrl/:id?')
	.get(isValidRoute, parseId, (req, res) => {
		const params = req.query || {}
		params.id = req.params.id
		DbLib.getAll(req.object, params, (data) => {
			res.send(data)
		})
	})
	.put(isValidRoute, (req, res) => {
		DbLib.postCreate(req.object, req.body, (data) => {
			res.send(data)
		})
	})
	.post(isValidRoute, parseId, (req, res) => {
		res.send(api.success('TEST'))
	})
	.delete(isValidRoute, parseId, (req, res) => {
		if(req.params.id !== undefined && parseInt(req.params.id)) {
			DbLib.postDelete(req.object, req.params.id, (data) => {
				res.send(data)
			})
		}
		else {
			res.status(400).send(api.error('DELETE method requires an object to modify.'))
		}
	})

// router.use((req, res, next) => {
// 	console.log(req);
// 	res.status(404).send('404')
// })

module.exports = router
