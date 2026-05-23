const API_URL = 'https://curly-glade-0d00.perpleepel19.workers.dev/api/v1'

export const apiRequest = async (method, path, body = null, token = null) => {
  const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  }
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const options = {
    method: method.toUpperCase(),
    headers,
  }

  if (body) {
    options.body = JSON.stringify(body)
  }

  const response = await fetch(`${API_URL}${path}`, options)
  const data = await response.json()
  
  return { ok: response.ok, status: response.status, data }
}

export default API_URL