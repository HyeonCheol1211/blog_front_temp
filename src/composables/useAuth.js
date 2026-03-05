import { ref, computed } from 'vue'

const token = ref(localStorage.getItem('token'))
const user = ref(
  (() => {
    try {
      const u = localStorage.getItem('user')
      return u ? JSON.parse(u) : null
    } catch {
      return null
    }
  })()
)

export function useAuth() {
  const isLoggedIn = computed(() => !!token.value)

  function setAuth(authToken, userData) {
    token.value = authToken
    user.value = userData
    localStorage.setItem('token', authToken)
    localStorage.setItem('user', JSON.stringify(userData || {}))
  }

  function logout() {
    token.value = null
    user.value = null
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  }

  if (typeof window !== 'undefined') {
    window.addEventListener('auth-logout', logout)
  }

  return {
    token,
    user,
    isLoggedIn,
    setAuth,
    logout,
  }
}
