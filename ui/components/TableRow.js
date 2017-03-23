import React from 'react'
import ActionButton from './ActionButtons'
import FontAwesome from 'react-fontawesome'
import { ModalEditor } from './QuillEditor'

export class TableRow extends React.Component {
  constructor(props) {
    super(props)
    this.deleteRow = this.deleteRow.bind(this)
    this.activateRow = this.activateRow.bind(this)
    this.displayEditionForm = this.displayEditionForm.bind(this)
    var valid = this.props.activable && this.props.data.valid === '1';
    this.state =  {
      displayRow: true,
      modifyRow: false,
      isRowValid: valid,
      handlers: {
        delete: this.deleteRow,
        modify: this.displayEditionForm,
        activate: this.activateRow,
        updateMessage: this.props.handlers.updateMessage
      }
    }
  }

  displayEditionForm() {
    this.props.handlers.displayEditionForm(this.props.data.id)
  }

  activateRow() {
    this.setState({
      isRowValid: !this.state.isRowValid
    })
  }

  deleteRow() {
    this.setState({
      displayRow: false
    })
  }

  render() {
    const fieldContent = this.props.definition.map(field => {
      if (field.hidden)
        return null

      if(field.type === 'Date') {
        let formattedDate = ''
        try {
          formattedDate = new Date(this.props.data[field.name]).toLocaleString('fr')//.format('DD-MM-YYYY HH:mm')
          if (formattedDate === 'Invalid Date') {
            formattedDate = ''
          }
        }
        catch(e) {console.error(e)}
        return (
          <td key={this.props.identifier + field.name}>
            {formattedDate}
          </td>
        )
      }
      else if (field.type === 'Boolean') {
        return (
          <td key={this.props.identifier + field.name}>
            <FontAwesome
              name={'toggle-' + (this.props.data[field.name] === true ? 'on' : 'off')}
              size='2x'
            />
          </td>
        )
      }
      else if(field.type === 'Html') {
        return (
          <td key={this.props.identifier + field.name}>
            <ModalEditor
              title={field.label}
              readOnly={true}
              value={this.props.data[field.name]}
          />
          </td>
        )
      }
      else {
        return (
          <td key={this.props.identifier + field.name}>{this.props.data[field.name]}</td>
        )
      }
    })

    if (!this.state.displayRow) {
      return null
    }
    else if (!this.state.modifyRow) {
      //init state
      return (
        <tr className={this.state.isRowValid ? 'active' : ''}>
          {fieldContent}
          <ActionButton
            alias={this.props.data.alias}
            id={this.props.data.id}
            activable={this.props.activable}
            valid={this.state.isRowValid}
            apiUrl={this.props.apiUrl}
            handlers={this.state.handlers}
          />
        </tr>
      )
    }
    else {
      //modify
      return (
        <tr>
          <EditRow />
        </tr>
      )
    }
  }
}

export default TableRow
