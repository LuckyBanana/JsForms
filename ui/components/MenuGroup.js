import React from 'react'
import MenuEntry from './MenuEntry'

export class MenuGroup extends React.Component {
  constructor(props) {
    super(props)
    this.state = {dislplayOptions: false}
    this.showOptions = this.showOptions.bind(this)
  }

  showOptions() {
    this.setState({
      dislplayOptions: !this.state.dislplayOptions
    })
  }

  render() {
    var self = this
    var menuEntries = this.props.group.items.map(function (object) {
      return (
        <MenuEntry
          objectId={object.id}
          active={object.id === self.props.activeObject ? 'active' : ''}
          key={object.id + '_link'}
          label={object.label}
          updateView={self.props.updateView}
          insideGroup={true}
      />
      )
    })
    var divClassName = this.state.dislplayOptions ? 'collapse in' : 'collapse'
    return (
      <li>
        <a data-toggle="collapse" onClick={this.showOptions}>
          {this.props.group.definition.name}
          <span className="caret"></span>
        </a>
        <div
          id={this.props.group.definition.name + 'Group'}
          className={divClassName}>
            {menuEntries}
        </div>
      </li>
    )
  }
}

export default MenuGroup
