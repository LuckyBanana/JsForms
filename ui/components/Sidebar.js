import React from 'react'
import MenuEntry from './MenuEntry'
import MenuGroup from './MenuGroup'

export class Sidebar extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      data: [],
      groups: [],
      items: []
    }
  }

  getUsedGroups() {
    var req = {
      method: 'GET',
      mode: 'cors',
      cache: 'default'
    }
    fetch('/api/maintenance/usedgroups', req)
      .then((res) => res.json())
      .then((data) => {
        var groups = {}
        for (const i in data) {
          var gpData = data[i]
          var gp = {
            definition: gpData,
            items: []
          }
          groups[gpData.id] = gp
        }
        this.setState({groups: groups})
      })
  }

  componentWillMount() {
    this.getUsedGroups()
  }

  render() {
    const groups = this.state.groups
    const menuEntries = this.props.data.map((object) => {
      if (object.groupId === '') {
        return (
          <MenuEntry objectId={object.id} active={object.id === this.props.activeObject ? 'active' : ''} key={object.id + '_link'} label={object.label} updateView={this.props.handlers.updateView} insideGroup={false}/>
        )
      }
      else {
        groups[object.groupId].items.push(object)
      }
    })
    // Transformation de l'objet "groups" en tableau puis tri par position
    const groupEntries = Object
      .keys(groups).map((i) => groups[i])
      .sort((a, b) => a.definition.pos - b.definition.pos)
      .map((group) => {
        return (
          <MenuGroup group={group} activeObject={this.props.activeObject} key={group.definition.id + '_grouplink'} updateView={this.props.handlers.updateView} />
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

export default Sidebar
