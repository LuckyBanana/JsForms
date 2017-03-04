// import auth from './auth'

const GET_REQ = () => {
  return {
    // headers: {
    //   'Authorization': 'Bearer ' + auth.getToken()
    // },
    method: 'GET',
    mode: 'cors',
    cache: 'default',
  }
}

const POST_REQ = () => ({
  method: 'GET',
  mode: 'cors',
  cache: 'defaut'
})

const DELETE_REQ = () => ({
  method: 'DELETE',
  mode: 'cors',
  cache: 'default'
})

module.exports = {
  GET(url) {
    return fetch(url, GET_REQ())
      .then((res) => {
        if(res.ok) {
          return res.json()
        }
        else {
          console.error(res.status)
        }
      })
  },
  POST(url) {
    return fetch(url, POST_REQ())
      .then((res) => {
        if(res.ok) {
          return res.json()
        }
        else {
          console.error(res.status)
        }
      })
  },
  getReq() {
    return reqObj()
  },
  getStatic(url) {
    return BASE + url
  }
}
