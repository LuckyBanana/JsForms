import React from 'react'
import {
  DropdownButton,
  MenuItem
} from 'react-bootstrap'
import { DELETE, POST } from '../utils/api'

export class ActionButtonModify extends React.Component {
  constructor(props) {
    super(props)
    this.modify = this.modify.bind(this)
  }

  modify() {
    this.props.handlers.modify(this.props.id)
  }

  render() {
    return (
      <MenuItem onClick={this.modify}>Modifier</MenuItem>
    )
  }
}

export class ActionButtonActivate extends React.Component {
  constructor(props) {
    super(props)
    this.activate = this.activate.bind(this)
  }

  activate() {
    const url = '/api/activate' + this.props.apiUrl + '/' + this.props.id
    POST(url)
      .then(data => {
        if(data.msg === 'OK') {
          this.props.handlers.activate()
        }
        else {
          this.props.handler.updateMessage('alert', data.obj)
        }
      })
      .catch(err => {
        this.props.handlers.updateMessage('alert', err.toString())
      })
  }

  render () {
    return (
      <MenuItem onClick={this.activate}>{this.props.valid ? 'Désactiver' : 'Activer'}</MenuItem>
    )
  }
}

export class ActionButtonRemove extends React.Component {
  constructor(props) {
    super(props)
    this.remove = this.remove.bind(this)
  }

  remove() {
    const url = '/api' + this.props.apiUrl + '/' + this.props.id
    DELETE(url)
      .then(data => {
        if(data.msg === 'OK') {
          this.props.handlers.delete()
          this.props.handlers.updateMessage('info', data.obj)
        }
        else {
          this.props.handlers.updateMessage('alert', data.obj)
        }
      })
      .catch(err => {
        this.props.handlers.updateMessage('alert', err)
      })
  }

  render() {
    return (
      <MenuItem onClick={this.remove}>Supprimer</MenuItem>
    )
  }
}

export default class ActionButton extends React.Component {
  constructor(props) {
    super(props)
  }

  render() {
    const activateButton = this.props.activable ?
      <ActionButtonActivate
        id={this.props.id}
        key={this.props.alias + '-a-' + this.props.id}
        apiUrl={this.props.apiUrl}
        handlers={this.props.handlers}
        valid={this.props.valid}
      /> :
      null
    return (
      <td>
        <div className="btn-group" style={{ margin: '0px' }}>
          <DropdownButton id={this.props.id} bsStyle='default' title='Action'>
            <ActionButtonModify
                key={this.props.alias + '-m-' + this.props.id}
                apiUrl={this.props.apiUrl}
                id={this.props.id}
                handlers={this.props.handlers}
            />
            {activateButton}
            <ActionButtonRemove
              key={this.props.alias + '-d-' + this.props.id}
              apiUrl={this.props.apiUrl}
              id={this.props.id}
              handlers={this.props.handlers}
            />
          </DropdownButton>
        </div>
      </td>
    )
  }
}
