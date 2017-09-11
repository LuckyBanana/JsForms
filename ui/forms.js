import React from 'react'
import ReactDOM from 'react-dom'
import { Route, BrowserRouter as Router } from 'react-router-dom'
import Wrapper from './components/Wrapper'

// ReactDOM.render(
//   <Wrapper />,
//   document.getElementById('wrapper')
// );

ReactDOM.render((
  <Router>
    <Route path="/" component={Wrapper} />
  </Router>
), document.getElementById('wrapper'))
