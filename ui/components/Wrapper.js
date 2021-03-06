import React from 'react'
import NavbarResp from './NavbarResp'
import Sidebar from './Sidebar'
import View from './View'
import { GET } from '../utils/api'

export default class Wrapper extends React.Component {
  constructor(props) {
    super(props)
    this.updateView = this.updateView.bind(this)
    this.getUsedGroups = this.getUsedGroups.bind(this)
    this.updateView = this.updateView.bind(this)
    this.state = {
      activeObject: 0,
      menuData: [],
      objectIds: [],
      viewObjects: [],
      groups: [],
      handlers: {
        updateView: this.updateView
      }
    }
  }

  getViewObjects() {
    GET('/api/init')
      .then(res => {
          let activeObject = null
          res.data.forEach(object => {
            if(object.default === true) {
              activeObject = object.id
            }
          })
          this.setState({
            activeObject: activeObject,
            viewObjects: res.data
          })
        })
      .catch((err) => {
        console.error(err)
      })
  }

  getUsedGroups() {
    GET('/api/groups')
      .then(res => {
        const groups = {}
        for (let i in res.data) {
          const gpData = res.data[i]
          const gp = {
            definition: gpData,
            items: []
          }
          groups[gpData.id] = gp
        }
        this.setState({ groups: groups })
      })
  }

  updateView(id, refresh = false) {
    if (refresh) {
      //fetch new definition
    }
    else {
      this.setState({ activeObject: id })
    }
  }

  componentDidMount() {
    this.getViewObjects()
    this.getUsedGroups()
  }

  render() {
    const views = this.state.viewObjects.map(object => {
      if (object.id === this.state.activeObject) {
        return (
          <View key={object.viewId} definition={object} />
        )
      }
    })
    return (
      <div id="page">
        <nav className="navbar navbar-default navbar-static-top" role="navigation">
          <NavbarResp />
          <Sidebar
            groups={this.state.groups}
            activeObject={this.state.activeObject}
            data={this.state.viewObjects}
            handlers={this.state.handlers}
          />
        </nav>
        <div id="page-wrapper" className="container-fluid">
          <div id="main" className="row">
            {views}
          </div>
        </div>
      </div>
    )
  }
}
