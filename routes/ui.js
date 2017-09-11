/** SERVE UI **/
const path = require('path')
const express = require('express')
const config = require('config')
const router = express.Router()

router.get('/dev', (req, res) => {
	res.sendFile(path.join(__dirname, '..', 'views', 'index.html'))
})

if (config.has('App.Mode') && (config.get('App.Mode') == 'DEV')) {
	router.get('/', (req, res) => {
		res.sendFile(path.join(__dirname, '..', 'views', 'index.html'))
	})
}
else {
	router.get('/', loggedIn, (req, res) => {
		var user = req.user
		res.sendFile(path.join(__dirname, '..', 'views', 'index.html'))
	})
}

module.exports = router
