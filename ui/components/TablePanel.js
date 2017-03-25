import React from 'react'
import EditRow from './EditRow'
import TableRow from './TableRow'

import { GET } from '../utils/api'

export default class TablePanel extends React.Component {
  constructor(props) {
    super(props)
    this.getData = this.getData.bind(this)
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
    GET('/api/limit' + this.props.definition.apiUrl + '/' + page)
      .then(json => {
        var data = json.map(obj => {
          obj.editMode = false
          return obj
        })
        this.setState({
          data: data
        })
      })
      // .catch(err => {
      //   console.error(err)
      // })
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
    this.setState({ data: dataCopy })
  }

  dismissEditionForm(rowId) {
    let dataCopy = this.state.data
    for (let obj of dataCopy) {
      if (obj.id === rowId) {
        obj.editMode = false
        // break
      }
    }
    this.setState({ data: dataCopy })
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
    this.setState({ handlers: handlers })
    this.refreshView()
  }

  render() {
    const tableHeader = this.props.definition.fields.map((col, index) => {
      return !col.hidden && <th key={this.props.definition.alias + '-def-' + index}>{col.label}</th>
    })
    const tableBody = this.state.data.map((obj, index) => {
      if(obj.editMode) {
        return <EditRow
            apiUrl={this.props.definition.apiUrl}
            data={obj}
            definition={this.props.definition.fields}
            hideForm={this.dismissEditionForm}
            key={this.props.definition.id + '-er-' + index}
            mode='edit'
            objectId={this.props.definition.id}
            refreshView={this.refreshView}
            updateMessage={this.props.handlers.updateMessage}
          />
      }
      else {
        return <TableRow
            activable={this.props.definition.activable}
            apiUrl={this.props.definition.apiUrl}
            data={obj}
            definition={this.props.definition.fields}
            key={this.props.definition.name + '-tr-' + index}
            identifier={this.props.definition.name + '-' + index}
            handlers={this.state.handlers}
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
                apiUrl={this.props.definition.apiUrl}
                definition={this.props.definition.fields}
                hideForm={this.props.handlers.hideCreationForm}
                key={this.props.definition.id + '-cf'}
                mode='new'
                objectId={this.props.definition.id}
                refreshView={this.refreshView}
                updateMessage={this.props.handlers.updateMessage}
              /> :
              null}
            {tableBody}
          </tbody>
        </table>
      </div>
    )
  }
}
