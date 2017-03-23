import React from 'react'
import { Button } from 'react-bootstrap'
import {
  TextInputCell,
  DateInputCell,
  FileInputCell,
  HtmlInputCell,
  DropdownInputCell
} from './CellInputs.js'

export class EditRow extends React.Component {
  constructor(props, context) {
    super(props, context)
    this.hideForm = this.hideForm.bind(this)
    this.submitForm = this.submitForm.bind(this)
    this.handleInputChange = this.handleInputChange.bind(this)
    var self = this
    var initialState = this.props.definition.map(function (field) {
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
      this.setState({
        fields: fields
      })
    }
    else {
      if (this.props.mode === 'new') {
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
          .then(res => {
            return res.json()
          })
          .then(data => {
            if(data.msg === 'OK') {
              self.props.hideForm()
              self.props.refreshView()
            }
            else {
              self.props.updateMessage('err', data.err.toString())
              console.error(data)
            }
          })
          .catch(err => {
            self.props.updateMessage('err', err.toString())
            console.error(err)
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

        fetch('/api/modify' + this.props.apiUrl + '/' + this.props.data.id, req)
          .then(function (res) {
            return res.json()
          })
          .then(function (data) {
            if(data.msg === 'OK') {
              this.props.hideForm()
              this.props.refreshView()
            }
            else {
              console.error(data);
              this.props.updateMessage('err', data.err.toString())
            }
          }.bind(this))
          .catch(function (err) {
            console.error(err);
            this.props.updateMessage('err', err.toString())
          }.bind(this))
      }
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

  render() {
    var row = this.props.definition.map(function (field) {
      const baseValue = this.props.mode === 'edit' ? this.props.data[field.name] : ''
      var inputId = this.props.objectId + '_' + field.id
      if (['id', 'valid'].indexOf(field.name) === -1) {
        if(field.foreign === 1) {
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
    }.bind(this))
    return (
      <tr>
        {row}
        <td>
          <Button bsStyle="success">
            <span className="glyphicon glyphicon-ok" onClick={this.submitForm} aria-hidden="true"></span>
          </Button>
          <Button bsStyle="danger" onClick={this.hideForm}>
            <span className="glyphicon glyphicon-remove" aria-hidden="true" ></span>
          </Button>
        </td>
      </tr>
    )
  }
}

export default EditRow
