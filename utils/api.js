/** API RESPONSE WRAPPER **/

exports.success = (data, code = 200) => {
  return {
    code: code,
    data: {
      status: 'success',
      data: data
    }
  }
}

exports.error = (data, code = 500) => {
  return {
    code: code,
    data: {
      status: 'error',
      message: data
    }
  }
}
