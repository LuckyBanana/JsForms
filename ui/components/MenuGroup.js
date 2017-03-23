import React from 'react'
import MenuEntry from './MenuEntry'

export default class MenuGroup extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      group: {
        items: [],
        definition: {}
      },
      dislplayOptions: false
    }
    this.showOptions = this.showOptions.bind(this)
  }

  showOptions() {
    this.setState({
      dislplayOptions: !this.state.dislplayOptions
    })
  }

  render() {
    const menuEntries = this.props.group.items.map((object, index) => {
      return (
        <MenuEntry
          objectId={object.id}
          active={object.id === this.props.activeObject ? 'active' : ''}
          key={object.id + '-link-' + index}
          label={object.label}
          updateView={this.props.updateView}
          insideGroup={true}
        />
      )
    })
    var divClassName = this.state.dislplayOptions ? 'collapse in' : 'collapse'
    return (
      <li>
        <a data-toggle="collapse" onClick={this.showOptions}>
          {this.props.group.definition.name}
          <span className="caret pull-right"></span>
        </a>
        <div
          id={this.props.group.definition.name + 'Group'}
          className={divClassName}
        >
          {menuEntries}
        </div>
      </li>
    )
  }
}
