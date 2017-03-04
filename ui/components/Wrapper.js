import React from 'react'
import NavbarResp from './NavbarResp'
import Sidebar from './Sidebar'
import View from './View'
import { GET } from '../utils/api'

export class Wrapper extends React.Component {
  constructor(props) {
    super(props)
    this.updateView = this.updateView.bind(this)
    this.state = {
      activeObject: 0,
      menuData: [],
      objectIds: [],
      viewObjects: [],
      handlers: {
        updateView: this.updateView
      }
    }
  }

  getViewObjects() {
    GET('/init')
      .then((data) => {
        if(data.msg === 'OK') {
          let activeObject = null
          data.obj.forEach((object) => {
            if(object.default === true) {
              activeObject = object.id
            }
          })
          this.setState({
            activeObject: activeObject,
            viewObjects: data.obj
          })
        }
        else {
          console.error(data.obj)
        }
      })
      .catch((err) => {
        console.error(err)
      })
  }

  updateView(id, refresh = false) {
    if (refresh) {
      //fetch new definition
    }
    else {
      this.setState({
        activeObject: id
      })
    }
  }

  componentDidMount() {
    this.getViewObjects()
  }

  render() {
    var views = this.state.viewObjects.map((object) => {
      if (object.id === this.state.activeObject) {
        return (
          <View key={object.viewId} definition={object}/>
        )
      }
    })
    return (
      <div id="page">
        <nav className="navbar navbar-default navbar-static-top" role="navigation">
          <NavbarResp />
          <Sidebar activeObject={this.state.activeObject} data={this.state.viewObjects} handlers={this.state.handlers} />
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

export default Wrapper
