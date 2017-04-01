exports.createActions = (object, params) => {
  switch (object.name) {
    case 'object':
      createView(object)
      break
    case 'field':
      createField(object)
      break
    default:
      //
      return
  }
}

exports.updateActions = (object, params) => {

}

exports.deleteActions = (object, params) => {
  switch (object.name) {
    case 'object':
      deleteView(object)
      break
    case 'field':
      deleteField(object)
      break
    default:
      //
      return
  }
}

const createView = (object, callback) => {
  const idQuery = "INSERT INTO CONF.FIELD VALUES (NULL, :name, :label, 2, 0, NULL, 0, NULL, NULL, 0, :parent_object, 0, 1);"
  const createQuery = 'CREATE TABLE ' + object.schema + '.' + object.name + ' (id INTEGER PRIMARY KEY);'
  db.query(idQuery, { name: 'id', label: 'id', parent_object: object.id })
  db.query(createQuery, (err) => {
    if(!err) {
      callback({})
    }
    else {
      callback([])
      console.error(err)
    }
  })
}

const createField = () => {
  const query = 'ALTER TABLE xxx ADD COLUMN name type;'
  db.query(query)
}

const deleteView = (object) => {
  const dropQuery = 'DROP TABLE ' + object.schema + '.' + object.name + ';'
  const deleteQuery = 'DELETE FROM CONF.FIELD WHERE PARENT_OBJECT = :parent_object;'

  db.query(dropQuery)
  db.query(deleteQuery)
}

const deleteField = (object) => {
  const alterQuery = 'ALTER TABLE xxx RENAME TO xxx_old'
  const fieldsQuery = "SELECT F.NAME, DT.DEFINITION FROM CONF.FIELD F INNER JOIN CONF.DATATYPE DT ON F.DATATYPE = DT.ID WHERE PARENT_OBJECT = :id_object"

  db.query(fieldsQuery, (err, rows) => {
    if(err) {
      callback({})
      console.error(err)
      return
    }

    const createQuery = 'CREATE TABLE ' + object.schema + '.' + object.name +
      '(' + rows.map(row => row.name + ' ' + row.definition).join() + ');'
    const insertQuery = 'INSERT INTO ' + object.schema + '.' + object.name +
      '(' rows.map(row => row.name).join() + ')' +
      'SELECT ' + rows.map(row => row.name).join() + ' FROM ' + object.schema + '.' + object.name + '_old;'
    const dropQuery = 'DROP TABLE ' + object.schema + '.' + object.name + '_old;'

    db.query(createQuery)
    db.query(insertQuery)
    db.query(dropQuery)
  })
}
