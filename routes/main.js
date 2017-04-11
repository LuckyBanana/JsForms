//
const express = require('express')
const path = require('path')
const config = require('config')
const jwt = require('express-jwt')
const execFile = require('child_process').execFile

// const Lib = require('../libs/lib.js')
const DbLib = require(path.join(__dirname, '..', 'libs', 'db', config.get('App.DatabaseDriver') + '.js'))
const api = require('../utils/api')

const router = express.Router()
const auth = jwt({ secret: 'jsforms' })

/** ROUTE VALIDATION **/

const isValidRoute = (req, res, next) => {
	console.log(req.params);
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

/** API **/

router.route('/:apiUrl/:id?')
	.get(isValidRoute, (req, res) => {
		console.log(req.params)
		console.log(req.query);
		if(req.params.id !== undefined && parseInt(req.params.id)) {
			console.log('ok');
		}
		else {
			console.log('ko');
		}
		DbLib.getAll(req.object, req.query, (data) => {
			res.send(data)
		})
	})
	.put(isValidRoute, (req, res) => {
		DbLib.postCreate(req.object, req.body, (data) => {
			res.send(data)
		})
	})
	.post(isValidRoute, (req, res) => {

	})
	.delete(isValidRoute, (req, res) => {
		if(req.params.id !== undefined && parseInt(req.params.id)) {
			DbLib.postDelete(req.object, req.params.id, (data) => {
				res.send(data)
			})
		}
		else {
			res.status(400).send(api.error('DELETE method requires an object to modify.'))
		}
	})

router.get('/init', (req, res) => {

})

// router.use((req, res, next) => {
// 	console.log(req);
// 	res.status(404).send('404')
// })

module.exports = router
