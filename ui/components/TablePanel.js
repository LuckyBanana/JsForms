import React from 'react'
import EditRow from './EditRow'
import TableRow from './TableRow'

export class TablePanel extends React.Component {
  constructor(props) {
    super(props)
    this.refreshView = this.refreshView.bind(this)
    this.displayEditionForm = this.displayEditionForm.bind(this)
    this.dismissEditionForm = this.dismissEditionForm.bind(this)
    this.state = {
      data: [],
      currentPage: 1,
      handlers: {
        displayEditionForm: this.displayEditionForm
      }
    }
  }

  getData(page) {
    var self = this;
    var req = {
      method: 'GET',
      mode: 'cors',
      cache: 'default'
    }
    fetch('api/limit' + this.props.definition.apiUrl + '/' + page, req)
      .then(function (res) {
        return res.json()
      })
      .then(function (json) {
        var data = json.map(function (obj) {
          obj.editMode = false
          return obj
        })
        this.setState({
          data: data
        })
      }.bind(this))
      .catch(function (err) {
        console.error(err);
      })
  }

  refreshView() {
    this.getData(this.state.currentPage)
  }

  displayEditionForm(rowId) {
    let dataCopy = this.state.data
    for (let obj of dataCopy) {
      if (obj.id === rowId) {
        obj.editMode = true
        // break
      }
    }
    this.setState({
      data: dataCopy
    })
  }

  dismissEditionForm(rowId) {
    let dataCopy = this.state.data
    for (let obj of dataCopy) {
      if (obj.id === rowId) {
        obj.editMode = false
        // break
      }
    }
    this.setState({
      data: dataCopy
    })
  }

  displayCreationForm() {

  }

  initializeButtons(level) {

  }

  componentDidMount() {
    let handlers = {
      displayEditionForm: this.displayEditionForm
    }
    Object.assign(handlers, this.props.handlers)
    this.setState({
      handlers: handlers
    })
    this.refreshView()
  }

  render() {
    const tableHeader = this.props.definition.fields.map(function (col) {
      return col.hidden !== 1 && <th key={this.props.definition.alias + 'def' + col.name}>{col.label}</th>
    }.bind(this))
    const tableBody = this.state.data.map((obj, index) => {
      if(obj.editMode) {
        return <EditRow
            mode='edit'
            hideForm={this.dismissEditingForm}
            objectId={this.props.definition.id}
            apiUrl={this.props.definition.apiUrl}
            key={this.props.definition.id + '_cf'}
            definition={this.props.definition.fields}
            data={obj}
            updateMessage={this.props.handlers.updateMessage}
            refreshView={this.refreshView}
            hideForm={this.dismissEditionForm}
          />
      }
      else {
        return <TableRow
            key={this.props.definition.name + '-' + index}
            identifier={this.props.definition.name + '-' + index}
            data={obj}
            activable={this.props.definition.activable}
            apiUrl={this.props.definition.apiUrl}
            handlers={this.state.handlers}
            definition={this.props.definition.fields}
          />
      }
    })
    return (
      <div className="table">
        <table className="table table-bordered">
          <thead>
            <tr>
              {tableHeader}
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {this.props.displayForm ?
              <EditRow
                mode='new'
                hideForm={this.props.handlers.hideCreationForm}
                objectId={this.props.definition.id}
                apiUrl={this.props.definition.apiUrl}
                key={this.props.definition.id + '_cf'}
                definition={this.props.definition.fields}
                updateMessage={this.props.handlers.updateMessage}
                refreshView={this.refreshView}
              /> :
              null}
            {tableBody}
          </tbody>
        </table>
      </div>
    )
  }
}

export default TablePanel
