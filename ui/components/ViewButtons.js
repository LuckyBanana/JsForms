import React from 'react'
import { Button } from 'react-bootstrap'

export class CreateButton extends React.Component {
  constructor(props) {
    super(props)
  }

  createEntry() {

  }

  render () {
    var buttonLabel = 'New ' + this.props.label
    // return <Button bsStyle="success" onClick={this.props.displayForm}>{ 'New ' + this.props.label }</Button>
    return 'salut'
  }
}

export class SetDefaultViewButton extends React.Component {
  constructor(props) {
    super(props)
  }

  render() {
    return <Button />
  }
}

export class CreateFieldButton extends React.Component {
  constructor(props) {
    super(props)
  }

  render() {
    return (
      <Button />
    )
  }
}

export class EditFieldButton extends React.Component {
  constructor(props) {
    super(props)
  }

  render() {
    return (
      <Button />
    )
  }
}

export class DeleteViewButton extends React.Component {
  constructor(props) {
    super(props)
  }

  render() {
    return (
      <Button />
    )
  }
}

export default CreateButton
