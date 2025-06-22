const app = getApp()

Page({
  data: {
    loading: false,
    error: '',
    loginFailed: false,
    debugInfo: null
  },

  lastLoginAttempt: 0, // Track last login attempt time
  loginDebounceMs: 2000, // Minimum time between login attempts

  async handleWechatLogin() {
    const now = Date.now()
    if (now - this.lastLoginAttempt < this.loginDebounceMs) {
      console.log('Login attempt too soon, ignoring')
      return
    }
    this.lastLoginAttempt = now

    if (this.data.loading || app.globalData.isNavigating) {
      console.log('Already loading or navigating, ignoring click')
      return
    }

    this.setData({ 
      loading: true,
      error: '',
      loginFailed: false,
      debugInfo: null
    })

    try {
      // Get WeChat login code
      const loginResult = await wx.login()
      
      if (!loginResult.code) {
        this.setData({
          error: '获取微信授权失败',
          loginFailed: true,
          loading: false
        })
        return
      }

      // Exchange code for token using Promise wrapper
      const loginResponse = await new Promise((resolve, reject) => {
        wx.request({
          url: `${app.globalData.baseUrl}/api/auth/wechat-login`,
          method: 'POST',
          data: { code: loginResult.code },
          success: (res) => resolve(res),
          fail: (error) => reject(error)
        })
      })

      console.log('Login response:', loginResponse.data)

      // Check if page is still mounted before updating state
      if (!this.pageActive) {
        console.log('Page unmounted, stopping login process')
        return
      }

      if (!loginResponse || loginResponse.statusCode !== 200 || !loginResponse.data || !loginResponse.data.success || !loginResponse.data.token) {
        this.setData({
          error: (loginResponse.data && loginResponse.data.message) || '登录失败，请重试',
          loginFailed: true,
          loading: false,
          debugInfo: {
            statusCode: loginResponse.statusCode,
            responseData: loginResponse.data ? JSON.stringify(loginResponse.data) : 'No response data'
          }
        })
        return
      }

      // Save token and update global state
      const token = loginResponse.data.token
      wx.setStorageSync('token', token)
      app.globalData.token = token
      app.globalData.wechatId = loginResponse.data.wechatId
      app.globalData.accountId = loginResponse.data.accountId
      app.globalData.needRegister = loginResponse.data.needRegister
      app.globalData.isLoggedIn = true

      // Let app handle navigation after successful login
      await app.checkLoginState()
      
      // Only set loading to false if we're still on this page
      if (this.pageActive) {
        this.setData({ loading: false })
      }

    } catch (error) {
      if (!this.pageActive) return
      console.error('Login failed:', error)
      this.setData({
        error: '登录失败，请重试',
        loginFailed: true,
        loading: false,
        debugInfo: { 
          error: error.message || error.errMsg || '未知错误',
          details: JSON.stringify(error)
        }
      })
    }
  },

  onLoad() {
    this.pageActive = true
    // Check if we already have a valid token
    const token = wx.getStorageSync('token')
    if (token) {
      try {
        const tokenData = JSON.parse(atob(token.split('.')[1]))
        if (tokenData.exp * 1000 > Date.now()) {
          // Token is valid, let app handle navigation
          app.checkLoginState()
        }
      } catch (error) {
        console.error('Error parsing token:', error)
        wx.removeStorageSync('token')
      }
    }
  },

  onUnload() {
    // Cleanup when page is unloaded
    this.pageActive = false
    this.setData({ loading: false })
  },

  retryLogin() {
    this.setData({
      error: '',
      loginFailed: false,
      debugInfo: null
    })
    this.handleWechatLogin()
  }
}) 