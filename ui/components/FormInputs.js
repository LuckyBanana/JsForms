import React from 'react'
import {
  Checkbox,
  ControlLabel,
  FormControl,
  FormGroup
} from 'react-bootstrap'

export class FormTextInput extends React.Component{
  constructor(props) {
    super(props)
    this.handleChange = this.handleChange.bind(this)
  }

  handleChange(event) {
    this.props.handleChange(this.props.field.id, event.target.value)
  }

  render () {
    return (
      <FormGroup>
        <ControlLabel>{this.props.field.label}</ControlLabel>
        <FormControl type="text" onChange={this.handleChange} />
      </FormGroup>
    )
  }
}

export class FormBooleanInput extends React.Component {
  constructor(props) {
    super(props)
    this.handleChange = this.handleChange.bind(this)
  }

  handleChange(event) {
    this.props.handleChange(this.props.field.id, event.target.checked)
  }

  render() {
    return (
      <Checkbox onChange={this.handleChange}>
        {this.props.field.label}
      </Checkbox>
    )
  }
}

export default FormInputs
