/** API RESPONSE WRAPPER **/

exports.success = (data) => {
  return {
    status: 'success',
    data: data
  }
}

exports.error = (data) => {
  return {
    status: 'error',
    message: data
  }
}
