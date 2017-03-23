import React from 'react'
import { Alert } from 'react-bootstrap'

export class MessagesPanel extends React.Component {
  constructor(props) {
    super(props)
  }

  render() {
    if (!this.props.definition.display) {
      return (
        <div className="col-xs-12"></div>
      )
    }
    else {
      var divTitle = { err: 'Error', info: 'Message', warn: 'Warning' }[this.props.definition.level]
      var divStyle = { err: 'danger', ok: 'success', info: 'info', warn: 'warn'}[this.props.definition.level]
      return (
        <div className="col-xs-12">
          <Alert bsStyle={divStyle || "info"} onDismiss={this.props.dismiss}>
            <h4>{ divTitle || "Message" }</h4>
            <p>{ this.props.definition.text }</p>
          </Alert>
        </div>
      )
    }
  }
}

export default MessagesPanel
