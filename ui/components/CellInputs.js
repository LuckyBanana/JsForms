import React from 'react'
import {
  FormControl,
  FormGroup
} from 'react-bootstrap'
import Datetime from 'react-datetime'
import {
  ModalEditor
} from './QuillEditor'
import moment from 'moment'

export class TextInputCell extends React.Component {
  constructor(props) {
    super(props)
    this.handleChange = this.handleChange.bind(this)
    this.state = {
      value: null
    }
  }

  handleChange(event) {
    this.setState({
      value: event.target.value
    })
    this.props.handleChange(this.props.field.id, event.target.value)
  }

  componentDidMount() {
    this.setState({
      value: this.props.data
    })
  }

  render() {
    var validationState = this.props.field.errForm ? 'error' : null
    return (
      <td>
        <FormGroup validationState={validationState} >
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
    this.setState({
      value: date
    })
    var newDate = date !== undefined ? date.format('YYYY-MM-DD HH:mm') : null
    this.props.handleChange(this.props.field.id, newDate)
  }

  componentDidMount() {
    // const date = this.props.data !== undefined ? this.props.data.format('YYYY-MM-DD HH:mm') : null
    this.setState({
      value: moment(this.props.data, 'YYYY/MM/DD HH:mm')
    })
    this.props.handleChange(this.props.field.id, moment(this.props.data, 'YYYY/MM/DD HH:mm'))
  }

  render() {
    var validationState = this.props.field.errForm ? 'error' : null
    return (
      <td>
        <FormGroup validationState={validationState} >
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
    this.handleChange = this.handleChange.bind(this)
    this.state = {
      cols: [],
      referencedObjectApiUrl: null,
      referencedField : null
    }
  }

  getReferencedObjectDefinition() {
    var self = this;
    var req = {
      method: 'GET',
      mode: 'cors',
      cache: 'default'
    }
    fetch('/api/init/view/' + this.props.field.referencedObject)
      .then(function (res) {
        return res.json()
      })
      .then(function (data) {
        if(data.msg === 'OK') {
          var referencedField;
          Object.keys(data.obj[0].fields).forEach(function (key) {
            var field = data.obj[0].fields[key];
            if(self.props.field.referencedField === field.id) {
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
      .then(function (data) {
        self.getOptions(data.referencedObjectApiUrl, data.referencedField)
      })
      .catch(function (err) {
        console.error(err)
      })
  }

  getOptions(referencedObjectApiUrl, referencedField) {
    var self = this;
    var req = {
      method: 'GET',
      mode: 'cors',
      cache: 'default'
    }
    fetch('/api/get' + referencedObjectApiUrl, req)
      .then(function (res) {
        return res.json()
      })
      .then(function (data) {
        this.props.handleChange(this.props.field.id, data[0].id)
        var cols = data.map(function (col) {
          return ({
            selected: self.props.selected === col.id,
            value: col[referencedField.name],
            colId: col.id
          })
        })
        this.setState({
          cols: cols,
          referencedObjectApiUrl: referencedObjectApiUrl,
          referencedField: referencedField
        })
      }.bind(this))
      .catch(function (err) {
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
    var self = this;
    var row = this.state.cols.map(function (col) {
      return <option
        value={col.colId}
        key={'option' + col.colId + '_' + self.state.referencedField.id}
        id={'option' + col.colId + '_' + self.state.referencedField.id}
        selected={this.props.data === col.value ? true : false}
      >{col.value}</option>
    }.bind(this))
    return (
      <td>
        <FormControl onChange={this.handleChange} componentClass="select">
          {row}
        </FormControl>
      </td>
    )
  }
}
