import React from 'react'
import {
  Nav,
  Navbar,
  NavItem
} from 'react-bootstrap'

import { GET } from '../utils/api'

export default class NavbarResp extends React.Component {
  constructor(props) {
    super(props)
    this.getName = this.getName.bind(this)
    this.state = {
      appName: ''
    }
  }

  getName () {
    GET('/api/maintenance/appName')
      .then(data => {
        if (data.msg === 'OK') {
          this.setState({appName: data.obj})
        }
        else {
          console.error(data.obj)
        }
      })
  }

  logout() {
    GET('/logout')
      .then(_ => {
        location.reload()
        console.error('Logging out...')
      })
      .catch(err => {
        console.error(err)
      })
  }

  componentDidMount() {
    this.getName()
  }

  render() {
    document.title = this.state.appName
    return (
      <Navbar>
        <Navbar.Header>
          <Navbar.Brand>
            <a className="navbar-brand" href="#">{this.state.appName} - DEV</a>
          </Navbar.Brand>
          <Navbar.Toggle />
        </Navbar.Header>
        <Navbar.Collapse>
          <Nav pullRight>
            <NavItem href="#" onClick={this.refreshView}>
              <span className="glyphicon glyphicon-refresh" aria-hidden="true"></span> Refresh
            </NavItem>
            <NavItem href="#" onClick={this.logout}>
              <span className="glyphicon glyphicon-off" aria-hidden="true"></span> Logout
            </NavItem>
          </Nav>
        </Navbar.Collapse>
      </Navbar>
    )
  }
}
