import React from 'react'
import { Button, ButtonGroup } from 'react-bootstrap'
import {
  BooleanInputCell,
  DateInputCell,
  DropdownInputCell,
  FileInputCell,
  HtmlInputCell,
  TextInputCell,
} from './CellInputs.js'

import { DELETE, GET, POST } from '../utils/api'

export default class EditRow extends React.Component {
  constructor(props, context) {
    super(props, context)
    this.hideForm = this.hideForm.bind(this)
    this.submitForm = this.submitForm.bind(this)
    this.handleInputChange = this.handleInputChange.bind(this)
    var initialState = this.props.definition.map(field => {
      if (field.name !== 'id' ) {
        var enrField = field
        enrField.editValue = this.props.data !== undefined ? this.props.data[field.name] : null
        enrField.inputId = this.props.objectId + '_' + field.id
        enrField.errForm = false
        return enrField
      }
    })
    this.state = {
      fields: initialState,
      displayRow: true
    }
  }

  hideForm() {
    if(this.props.mode === 'new') {
      this.props.hideForm()
    }
    else {
      this.props.hideForm(this.props.data.id)
    }
  }

  submitForm() {
    var validateForm = true
    var fields = this.state.fields
    var formData = {}
    for (const field of fields) {
      if (field !== undefined) {
        if (field.editValue === null) {
          field.errForm = true
          validateForm = false
        }
        else {
          field.errForm = false
          formData[field.name] = field.editValue
        }
      }
    }
    if (!validateForm) {
      this.setState({ fields: fields })
    }
    else {
      if (this.props.mode === 'new') {
        POST('/api/create' + this.props.apiUrl, formData)
          .then(data => {
            if(data.msg === 'OK') {
              this.props.hideForm()
              this.props.refreshView()
            }
            else {
              this.props.updateMessage('err', data.err.toString())
              console.error(data)
            }
          })
          .catch(err => {
            this.props.updateMessage('err', err.toString())
            console.error(err)
          })
      }
      else {
        POST('/api/modify' + this.props.apiUrl + '/' + this.props.data.id, formData)
          .then(data => {
            if(data.msg === 'OK') {
              this.props.hideForm()
              this.props.refreshView()
            }
            else {
              this.props.updateMessage('err', data.err.toString())
              console.error(data)
            }
          })
          .catch(err => {
            this.props.updateMessage('err', err.toString())
            console.error(err)
          })
      }
    }
  }

  handleInputChange(id, value) {
    const fields = this.state.fields
    for (const field of fields) {
      if (field !== undefined && field.id === id) {
        field.editValue = value
      }
    }
    this.setState({ fields: fields })
  }

  render() {
    const row = this.props.definition.map(field => {
      const baseValue = this.props.mode === 'edit' ? this.props.data[field.name] : ''
      const inputId = this.props.objectId + '-' + field.id
      if (['id', 'valid'].indexOf(field.name) === -1 && !(field.name.indexOf('id_') === 0 && !field.foreign)) {
        if(field.foreign) {
          return (
            <DropdownInputCell
              key={inputId}
              field={field}
              handleChange={this.handleInputChange}
              data={baseValue}
            />
          )
        }
        else if (field.type === 'Date') {
          return (
            <DateInputCell
              key={inputId}
              field={field}
              handleChange={this.handleInputChange}
              data={baseValue}
            />
          )
        }
        else if (field.type === 'File') {
          return (
            <FileInputCell key={inputId} />
          )
        }
        else if (field.type === 'Html') {
          return (
            <HtmlInputCell
              key={inputId}
              field={field}
              handleChange={this.handleInputChange}
              data={baseValue}
            />
          )
        }
        else if (field.type === 'Boolean') {
          return (
            <BooleanInputCell
              key={inputId}
              field={field}
              handleChange={this.handleInputChange}
              data={baseValue === '' ? false : baseValue}
            />
          )
        }
        else {
          return (
            <TextInputCell
              key={inputId}
              field={field}
              handleChange={this.handleInputChange}
              data={baseValue}
            />
          )
        }
      }
      else {
        return null
      }
    })
    return (
      <tr>
        {row}
        <td>
          <ButtonGroup>
            <Button bsStyle="success">
              <span className="glyphicon glyphicon-ok" onClick={this.submitForm} aria-hidden="true"></span>
            </Button>
            <Button bsStyle="danger" onClick={this.hideForm}>
              <span className="glyphicon glyphicon-remove" aria-hidden="true" ></span>
            </Button>
          </ButtonGroup>
        </td>
      </tr>
    )
  }
}
