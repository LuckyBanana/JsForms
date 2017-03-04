import React from 'react'
import {
  Button,
  ButtonGroup
} from 'react-bootstrap'
import {
  FormTextInput,
  FormBooleanInput
} from './FormInputs'

export class FormPanel extends React.Component {
  constructor(props) {
    super(props)
    this.submitForm = this.submitForm.bind(this)
    this.resetForm = this.resetForm.bind(this)
    this.handleInputChange = this.handleInputChange.bind(this)
    var self = this
    var initialState = this.props.definition.fields.map(function (field) {
      if (field.name !== 'id' ) {
        var enrField = field
        enrField.editValue = self.props.data !== undefined ? self.props.data[field.name] : null
        enrField.inputId = self.props.objectId + '_' + field.id
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
    this.setState({
      fields: fields
    })
  }

  submitForm() {
    var validateForm = true
    var fields = this.state.fields
    var formData = {}
    for (const field of fields) {
      if (field !== undefined) {
        if (field.required !== 1 && field.editValue === null) {
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
      this.setState({
        fields: fields
      })
    }
    else {
      var req = {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        method: 'POST',
        mode: 'cors',
        cache: 'default',
        body: JSON.stringify(formData)
      }
      var self = this
      fetch('/api/create' + this.props.apiUrl, req)
        .then(function (res) {
          return res.json()
        })
        .then(function (data) {
          if(data.msg === 'OK') {
            self.props.hideForm()
            self.props.refreshView()
          }
          else {
            console.error(data);
            self.props.updateMessage('err', data.err.toString())
          }
        })
        .catch(function (err) {
          console.error(err);
          self.props.updateMessage('err', err.toString())
        })
    }
  }

  resetForm() {

  }

  render () {
    var inputs = this.state.fields.map(function (field) {
      if(field.type === 'String') {
        return <FormTextInput key={this.props.definition.name + field.id} field={field} handleChange={this.handleInputChange}/>
      }
      if(field.type === 'Boolean') {
        return <FormBooleanInput key={this.props.definition.name + field.id} field={field} handleChange={this.handleInputChange} />
      }
    }.bind(this))
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

export default FormPanel
