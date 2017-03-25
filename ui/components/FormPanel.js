import React from 'react'
import {
  Button,
  ButtonGroup
} from 'react-bootstrap'
import {
  FormTextInput,
  FormBooleanInput
} from './FormInputs'

import { POST } from '../utils/api'

export default class FormPanel extends React.Component {
  constructor(props) {
    super(props)
    this.submitForm = this.submitForm.bind(this)
    this.resetForm = this.resetForm.bind(this)
    this.handleInputChange = this.handleInputChange.bind(this)
    const initialState = this.props.definition.fields.map(field => {
      if (field.name !== 'id' ) {
        var enrField = field
        enrField.editValue = this.props.data !== undefined ? this.props.data[field.name] : null
        enrField.inputId = this.props.objectId + '-' + field.id
        enrField.errForm = false
        return enrField
      }
    })
    this.state = {
      fields: initialState,
      displayRow: true
    }
  }

  handleInputChange(id, value) {
    var fields = this.state.fields
    for (const field of fields) {
      if (field !== undefined && field.id === id) {
        field.editValue = value
      }
    }
    this.setState({ fields: fields })
  }

  submitForm() {
    var validateForm = true
    var fields = this.state.fields
    var formData = {}
    for (const field of fields) {
      if (field !== undefined) {
        if (!field.required && field.editValue === null) {
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
  }

  render () {
    const inputs = this.state.fields.map(field => {
      if(field.type === 'String') {
        return <FormTextInput key={this.props.definition.name + field.id} field={field} handleChange={this.handleInputChange}/>
      }
      if(field.type === 'Boolean') {
        return <FormBooleanInput key={this.props.definition.name + field.id} field={field} handleChange={this.handleInputChange} />
      }
    })
    return (
      <div>
        {inputs}
        <ButtonGroup className="pull-right">
          <Button onClick={this.submitForm}>Submit</Button>
          <Button onClick={this.resetForm}>Reset</Button>
        </ButtonGroup>
      </div>
    )
  }
}
