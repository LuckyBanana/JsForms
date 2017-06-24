const fs = require('fs')
const path = require('path')
const minify = require('pg-minify')

const sql = (file) => {
  return minify(fs.readFileSync(path.join(__dirname, '..', file)).toString())
}

module.exports = sql
