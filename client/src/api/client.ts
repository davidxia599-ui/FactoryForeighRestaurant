import axios from 'axios'
import { ElMessage } from 'element-plus'

const client = axios.create({
  baseURL: '/api',
  timeout: 30000
})

client.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      const { status, data } = error.response
      if (status === 401) {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        window.location.href = '/login'
      } else if (status === 403) {
        ElMessage.error(data.error || 'Access denied')
      } else if (status >= 500) {
        ElMessage.error(data.error || 'Server error')
      } else {
        ElMessage.error(data.error || 'Request failed')
      }
    } else if (error.request) {
      ElMessage.error('Network error')
    } else {
      ElMessage.error('Request error')
    }
    return Promise.reject(error)
  }
)

export default client
