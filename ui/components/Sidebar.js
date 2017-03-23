import React from 'react'
import MenuEntry from './MenuEntry'
import MenuGroup from './MenuGroup'

export default class Sidebar extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      data: [],
      groups: [],
      items: []
    }
  }

  render() {
    const { groups } = this.props
    const menuEntries = this.props.data.map(object => {
      if (object.groupId === '') {
        return (
          <MenuEntry
            objectId={object.id}
            active={object.id === this.props.activeObject ? 'active' : ''} key={object.id + '-link'}
            label={object.label}
            updateView={this.props.handlers.updateView}
            insideGroup={false}
          />
        )
      }
      else {
        if (Object.keys(groups).length > 0) {
          groups[object.groupId].items.push(object)
        }
      }
    })
    // Transformation de l'objet "groups" en tableau puis tri par position
    console.log('g', groups);
    const groupEntries = Object
      .keys(groups).map((i) => groups[i])
      .sort((a, b) => a.definition.pos - b.definition.pos)
      .map((group) => {
        return (
          <MenuGroup
            group={group}
            activeObject={this.props.activeObject}
            key={group.definition.id + '_grouplink'}
            updateView={this.props.handlers.updateView}
          />
        )
      })
    return (
      <div className="navbar-default sidebar" role="navigation" id="sidebar">
        <div className="sidebar-nav navbar-collapse">
          <ul className="nav">
            {menuEntries}
            {groupEntries}
          </ul>
        </div>
      </div>
    )
  }
}
