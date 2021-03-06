import React from 'react'

export default class MenuEntry extends React.Component {
  constructor(props) {
    super(props)
    this.handleClick = this.handleClick.bind(this)
  }

  handleClick(event) {
    this.props.updateView(this.props.objectId)
  }

  render() {
    if (this.props.insideGroup) {
      return (
        <a className={'list-group-item ' + this.props.active} onClick={this.handleClick}>
          {this.props.label}
        </a>
      )
    }
    else {
      return (
        <li className={this.props.active}>
          <a href="#" onClick={this.handleClick}>
            {this.props.label}
          </a>
        </li>
      )
    }
  }
}
