import React from 'react'
import {
  Nav,
  Navbar,
  NavItem
  } from 'react-bootstrap'

export class NavbarResp extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      appName: ''
    }
  }

  getName () {
    var req = {
      method: 'GET',
      mode: 'cors',
      cache: 'default'
    }
    fetch('/api/maintenance/appname', req)
      .then(function (res) {
        return res.json()
      })
      .then(function (data) {
        if (data.msg === 'OK') {
          this.setState({appName: data.obj})
        }
        else {
          console.error(data.obj)
        }
      }.bind(this))
  }

  logout() {
    var req = {
      method: 'GET',
      mode: 'cors',
      cache: 'default'
    }
    fetch('/logout', req)
      .then(function () {
        console.error('Logging out...')
        location.reload()
      })
      .catch(function (err) {
        console.error(err)
      })
  }

  refreshView() {

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

export default NavbarResp
