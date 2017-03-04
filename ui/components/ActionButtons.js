import React from 'react'
import {
  DropdownButton,
  MenuItem
} from 'react-bootstrap'

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
    var req = {
      method: 'POST',
      mode: 'cors',
      cache: 'default'
    }
    fetch(url, req)
      .then(function (res) {
        return res.json()
      })
      .then(function (data) {
        if(data.msg === 'OK') {
          this.props.handlers.activate()
        }
        else {
          this.props.handler.updateMessage('alert', data.obj)
        }
      }.bind(this))
      .catch(function (err) {
        this.props.handlers.updateMessage('alert', err.toString())
      }.bind(this))
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
    var url = '/api' + this.props.apiUrl + '/' + this.props.id
    var req = {
      method: 'DELETE',
      mode: 'cors',
      cache: 'default'
    }
    fetch(url, req)
      .then(function (res) {
        return res.json()
      })
      .then(function (data) {
        if(data.msg === 'OK') {
          this.props.handlers.delete()
          this.props.handlers.updateMessage('info', data.obj)
        }
        else {
          this.props.handlers.updateMessage('alert', data.obj)
        }
      }.bind(this))
      .catch(function (err) {
        this.props.handlers.updateMessage('alert', err)
      }.bind(this))
  }

  render() {
    return (
      <MenuItem onClick={this.remove}>Supprimer</MenuItem>
    )
  }
}

export class ActionButton extends React.Component {
  constructor(props) {
    super(props)
  }

  render() {
    var activateButton = this.props.activable ? <ActionButtonActivate id={this.props.id} key={this.props.alias + 'a' + this.props.id} apiUrl={this.props.apiUrl} handlers={this.props.handlers} valid={this.props.valid}/> : null
    return (
      <td>
        <div className="btn-group">
          <DropdownButton id={this.props.id} bsStyle='default' title='Action'>
            <ActionButtonModify key={this.props.alias + 'm' + this.props.id} apiUrl={this.props.apiUrl} id={this.props.id} handlers={this.props.handlers} />
            {activateButton}
            <ActionButtonRemove key={this.props.alias + 'd' + this.props.id} apiUrl={this.props.apiUrl} id={this.props.id} handlers={this.props.handlers} />
          </DropdownButton>
        </div>
      </td>
    )
  }
}

export default ActionButton
