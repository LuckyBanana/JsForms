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

const POST_REQ = (formData, toJson) => {
  const headers = toJson ?
    {
      'Accept': 'application/json',
      'Content-Type': toJson ? 'application/json' : '',
      // 'Authorization': 'Bearer ' + auth.getToken()
    } :
    {
      'Accept': 'application/json',
      // 'Authorization': 'Bearer ' + auth.getToken()
    }
  return {
      headers: headers,
      method: 'POST',
      mode: 'cors',
      cache: 'default',
      body: toJson ? JSON.stringify(formData) : formData
    }
}

const DELETE_REQ = () => ({
  method: 'DELETE',
  mode: 'cors',
  cache: 'default'
})

module.exports = {
  GET(url) {
    return fetch(url, GET_REQ())
      .then(res => {
        if(res.ok) {
          return res.json()
        }
        else {
          console.error(res.status)
        }
      })
  },
  POST(url, formData) {
    return fetch(url, POST_REQ(formData, true))
      .then(res => {
        if(res.ok) {
          return res.json()
        }
        else {
          console.error(res.status)
        }
      })
  },
  DELETE(url) {
    return fetch(url, DELETE_REQ())
      .then(req => {
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
