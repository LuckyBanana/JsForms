import React from 'react'
import { Button } from 'react-bootstrap'
import MessagesPanel from './MessagesPanel'
import TablePanel from './TablePanel'

export class View extends React.Component {
  constructor(props) {
    super(props)
    this.displayCreationForm = this.displayCreationForm.bind(this)
    this.hideCreationForm = this.hideCreationForm.bind(this)
    this.dismissMessage = this.dismissMessage.bind(this)
    this.updateMessage = this.updateMessage.bind(this)
    this.state = {
      message: {
        display: false
      },
      handlers: {
        updateMessage: this.updateMessage,
        displayCreationForm: this.displayCreationForm,
        hideCreationForm: this.hideCreationForm
      },
      creationForm: {
        display: false
      }
    }
  }

  dismissMessage() {
    this.setState({
      message: {
        display: false
      }
    })
  }

  updateMessage(level, msg) {
    this.setState({
      message: {
        display: true,
        level: level,
        text: msg
      }
    })
  }

  hideCreationForm() {
    this.setState({
      creationForm: {
        display: false
      }
    })
  }

  displayCreationForm() {
    this.setState({
      creationForm: {
        display: true
      }
    })
  }

  render() {
    return (
      <div className="col-lg-12 panel" >
        <div className="page-header" role="group">
          <div className="btn-group pull-right" role="group">
            <Button bsStyle="success" onClick={this.displayCreationForm}>{ 'New ' + this.props.definition.label }</Button>
          </div>
          <h1>{this.props.definition.label}</h1>
        </div>
        <div className="row">
          <MessagesPanel
            key={this.props.definition.name + '_messages'}
            definition={this.state.message}
            dismiss={this.dismissMessage} />
        </div>
        {this.props.definition.isform ?
          (
            <FormPanel
              definition={this.props.definition}
              key={this.props.definition.name + '_table'}
              handlers={{updateMessage: this.updateMessage}} />
          ) : (
            <TablePanel
              definition={this.props.definition}
              key={this.props.definition.name + '_table'}
              displayForm={this.state.creationForm.display}
              handlers={this.state.handlers}
           />)}
      </div>
    )
  }
}

export default View
