import React from 'react'
import {
  FormControl,
  FormGroup
} from 'react-bootstrap'
import Datetime from 'react-datetime'
import moment from 'moment'

import ModalEditor from './ModalEditor'
import { GET } from '../utils/api'

export class TextInputCell extends React.Component {
  constructor(props) {
    super(props)
    this.handleChange = this.handleChange.bind(this)
    this.state = { value: null }
  }

  handleChange(event) {
    this.setState({ value: event.target.value })
    this.props.handleChange(this.props.field.id, event.target.value)
  }

  componentDidMount() {
    this.setState({ value: this.props.data })
  }

  render() {
    return (
      <td>
        <FormGroup
          validationState={this.props.field.errForm ? 'error' : null}
          style={{ margin: '0px' }}
        >
          <FormControl type="text" onChange={this.handleChange} value={this.state.value} />
          {this.props.field.errForm ? <FormControl.Feedback /> : null}
        </FormGroup>
      </td>
    )
  }
}

export class HtmlInputCell extends React.Component {
  constructor(props) {
    super(props)
    this.handleChange = this.handleChange.bind(this)
  }

  handleChange(value) {
    this.props.handleChange(this.props.field.id, value)
  }

  render() {
    return (
      <td>
        <ModalEditor
          title={this.props.field.label}
          readOnly={false}
          value={this.props.data}
          handleChange={this.handleChange}/>
      </td>
    )
  }
}

export class DateInputCell extends React.Component {
  constructor(props) {
    super(props)
    this.handleChange = this.handleChange.bind(this)
    this.state = {
      displayModal: false,
      value: moment()
    }
  }

  handleChange(date) {
    this.setState({ value: date })
    var newDate = date !== undefined ? date.format('YYYY-MM-DD HH:mm') : null
    this.props.handleChange(this.props.field.id, newDate)
  }

  componentDidMount() {
    this.setState({ value: moment(this.props.data, 'YYYY/MM/DD HH:mm') })
    this.props.handleChange(this.props.field.id, moment(this.props.data, 'YYYY/MM/DD HH:mm'))
  }

  render() {
    return (
      <td>
        <FormGroup
          validationState={this.props.field.errForm ? 'error' : null}
          style={{ margin: '0px' }}
        >
          <Datetime
            onChange={this.handleChange}
            locale='fr'
            value={this.state.value} />
          {this.props.field.errForm ? <FormControl.Feedback /> : null}
        </FormGroup>
      </td>
    )
  }
}

export class BooleanInputCell extends React.Component {
  constructor(props) {
    super(props)
    this.handleChange = this.handleChange.bind(this)
    this.state = { value: false }
  }

  handleChange() {
    this.setState({ value: !this.state.value })
    this.props.handleChange(this.props.field.id, !this.state.value)
  }

  componentWillMount() {
    this.setState({ value: this.props.data })
  }

  render() {
    return (
      <td style={{ textAlign: 'center', verticalAlign: 'middle' }}>
        <div className="togglebutton">
          <label>
            <input
              type="checkbox"
              checked={this.state.value}
              onChange={this.handleChange}
            />
            <span className="toggle" />
          </label>
        </div>
      </td>
    )
  }
}

export class FileInputCell extends React.Component {
  constructor(props) {
    super(props)
  }

  render() {
    return (
      <td></td>
    )
  }
}

export class DropdownInputCell extends React.Component {
  constructor(props) {
    super(props)
    this.getReferencedObjectDefinition = this.getReferencedObjectDefinition.bind(this)
    this.handleChange = this.handleChange.bind(this)
    this.getOptions = this.getOptions.bind(this)
    this.state = {
      cols: [],
      referencedObjectApiUrl: null,
      referencedField : null
    }
  }

  getReferencedObjectDefinition() {
    GET('/api/init/view/' + this.props.field.referencedObject)
      .then(data => {
        if(data.msg === 'OK') {
          let referencedField = {}
          Object.keys(data.obj[0].fields).forEach(key => {
            const field = data.obj[0].fields[key]
            if(this.props.field.referencedField === field.id) {
              referencedField = field
            }
          })
          return {
            referencedObjectApiUrl: data.obj[0].apiUrl,
            referencedField: referencedField
          }
        }
        else {
          console.error(data.obj)
        }
      })
      .then(data => {
        this.getOptions(data.referencedObjectApiUrl, data.referencedField)
      })
      .catch(err => {
        console.error(err)
      })
  }

  getOptions(referencedObjectApiUrl, referencedField) {
    GET('/api/get' + referencedObjectApiUrl)
      .then(data => {
        this.props.handleChange(this.props.field.id, data[0].id)
        const cols = data.map(col =>
          ({
            selected: this.props.selected === col.id,
            value: col[referencedField.name],
            colId: col.id
          })
        )
        this.setState({
          cols: cols,
          referencedObjectApiUrl: referencedObjectApiUrl,
          referencedField: referencedField
        })
      })
      .catch(err => {
        console.error(err)
      })
  }

  handleChange(event) {
    this.props.handleChange(this.props.field.id, event.target.value)
  }

  componentWillMount() {
    this.getReferencedObjectDefinition()
  }

  render() {
    const row = this.state.cols.map(col => {
      return <option
        value={col.colId}
        key={'option' + col.colId + '_' + this.state.referencedField.id}
        id={'option' + col.colId + '_' + this.state.referencedField.id}
        selected={this.props.data === col.value ? true : false}
      >
        {col.value}
      </option>
    })
    return (
      <td>
        <FormControl onChange={this.handleChange} componentClass="select">
          {row}
        </FormControl>
      </td>
    )
  }
}
