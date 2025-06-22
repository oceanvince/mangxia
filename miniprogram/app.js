App({
  globalData: {
    baseUrl: 'http://127.0.0.1:3001',
    isLoggedIn: false,
    token: null,
    wechatId: null,
    accountId: null,
    needRegister: false,
    isNavigating: false
  },

  onLaunch() {
    this.checkLoginState()
  },

  // Utility function for making API requests with logging
  async request(options) {
    // Log user info before making the request
    console.log('API Request:', {
      endpoint: options.url,
      method: options.method,
      userInfo: {
        wechatId: this.globalData.wechatId,
        accountId: this.globalData.accountId,
        needRegister: this.globalData.needRegister
      }
    })

    // Add authorization header if token exists
    const headers = {
      ...options.header,
      'Authorization': this.globalData.token ? `Bearer ${this.globalData.token}` : undefined
    }

    try {
      const res = await new Promise((resolve, reject) => {
        wx.request({
          ...options,
          url: `${this.globalData.baseUrl}${options.url}`,
          header: headers,
          success: resolve,
          fail: reject
        })
      })

      console.log('API Response:', {
        endpoint: options.url,
        status: res.statusCode,
        data: res.data
      })

      // Handle HTTP errors
      if (res.statusCode === 401) {
        // Token expired or invalid, trigger login check
        this.checkLoginState()
        throw new Error('未登录或登录已过期')
      }

      if (res.statusCode === 404) {
        throw new Error('请求的资源不存在')
      }

      if (res.statusCode >= 500) {
        throw new Error('服务器内部错误')
      }

      if (res.statusCode >= 400) {
        throw new Error(res.data?.error || '请求失败')
      }

      return res.data
    } catch (error) {
      console.error('API Request Failed:', {
        endpoint: options.url,
        error: error.message || error
      })
      throw error
    }
  },

  // Check if current page needs auth protection
  isProtectedPage(route) {
    const publicPages = ['pages/login/index']
    return !publicPages.includes(route)
  },

  // Check if current page is bind page
  isBindPage(route) {
    return route === 'pages/bind/index'
  },

  // Check if current page is home page
  isHomePage(route) {
    return route === 'pages/home/index'
  },

  // Get current page route
  getCurrentPageRoute() {
    const pages = getCurrentPages()
    if (pages.length > 0) {
      return pages[pages.length - 1].route
    }
    return null
  },

  // Handle navigation based on auth state and current page
  async handleNavigation(needRegister) {
    const currentRoute = this.getCurrentPageRoute()
    if (!currentRoute) return

    // If we're already navigating, skip
    if (this.globalData.isNavigating) {
      console.log('Navigation already in progress, skipping')
      return
    }

    // Not logged in - go to login page
    if (!this.globalData.isLoggedIn) {
      if (currentRoute !== 'pages/login/index') {
        console.log('Not logged in, redirecting to login')
        await this.safeNavigate('/pages/login/index')
      }
      return
    }

    // Needs registration - go to bind page
    if (needRegister) {
      if (!this.isBindPage(currentRoute)) {
        console.log('Need register, redirecting to bind page')
        await this.safeNavigate('/pages/bind/index')
      }
      return
    }

    // Logged in and registered - go to home page
    if (this.isBindPage(currentRoute) || currentRoute === 'pages/login/index') {
      console.log('Logged in and registered, going to home')
      await this.safeNavigate('/pages/home/index', true)
    }
  },

  async checkLoginState() {
    if (this.globalData.isNavigating) {
      console.log('Navigation already in progress, skipping check')
      return
    }

    const token = wx.getStorageSync('token')
    
    if (!token) {
      console.log('No token found, redirecting to login')
      this.clearLoginState()
      await this.handleNavigation(false)
      return
    }

    try {
      // Validate token
      const tokenData = JSON.parse(atob(token.split('.')[1]))
      if (tokenData.exp * 1000 <= Date.now()) {
        console.log('Token expired, redirecting to login')
        this.clearLoginState()
        await this.handleNavigation(false)
        return
      }

      // Update global state
      this.globalData.token = token
      this.globalData.wechatId = tokenData.wechatId
      this.globalData.accountId = tokenData.accountId
      this.globalData.isLoggedIn = true

      // Check if account has a profile using the new API
      const profileResponse = await this.request({
        url: `/api/auth/check-profile/${tokenData.accountId}`,
        method: 'GET'
      })

      // Log the profile check response
      console.log('Profile check response:', {
        accountId: tokenData.accountId,
        response: profileResponse
      })

      // Check API success flag and hasProfile
      if (profileResponse && profileResponse.success && profileResponse.data.hasProfile) {
        // Account has a profile, update token and go to home
        console.log('Account has a profile, going to home')
        this.globalData.needRegister = false
        
        // Generate new token with updated needRegister value
        const tokenResponse = await this.request({
          url: '/api/auth/refresh-token',
          method: 'POST',
          data: {
            accountId: tokenData.accountId,
            needRegister: false
          }
        })

        if (tokenResponse && tokenResponse.success && tokenResponse.token) {
          // Update token in storage and global state
          wx.setStorageSync('token', tokenResponse.token)
          this.globalData.token = tokenResponse.token
        }

        await this.handleNavigation(false)
      } else {
        // No profile or error, update token and go to bind
        console.log('Account needs profile binding, going to bind')
        
        this.globalData.needRegister = true

        // Generate new token with updated needRegister value
        const response = await this.request({
          url: '/api/auth/refresh-token',
          method: 'POST',
          data: {
            accountId: tokenData.accountId,
            needRegister: true
          }
        })

        if (response.data && response.data.success && response.data.token) {
          // Update token in storage and global state
          wx.setStorageSync('token', response.data.token)
          this.globalData.token = response.data.token
        }

        await this.handleNavigation(true)
      }
    } catch (error) {
      console.error('Error checking login state:', error)
      this.clearLoginState()
      await this.handleNavigation(false)
    }
  },

  clearLoginState() {
    this.globalData.token = null
    this.globalData.isLoggedIn = false
    this.globalData.wechatId = null
    this.globalData.accountId = null
    this.globalData.needRegister = false
    wx.removeStorageSync('token')
  },

  async safeNavigate(url, isTabPage = false) {
    if (this.globalData.isNavigating) {
      console.log('Navigation already in progress, skipping:', url)
      return
    }

    this.globalData.isNavigating = true
    
    try {
      if (isTabPage) {
        await new Promise((resolve, reject) => {
          wx.switchTab({
            url,
            success: resolve,
            fail: (error) => {
              console.error('Tab navigation failed:', error)
              wx.redirectTo({
                url,
                success: resolve,
                fail: reject
              })
            }
          })
        })
      } else if (url === '/pages/bind/index') {
        // Use navigateTo for bind page to keep login page in stack
        await new Promise((resolve, reject) => {
          wx.navigateTo({
            url,
            success: resolve,
            fail: (error) => {
              console.error('Navigation to bind failed:', error)
              // Fallback to redirectTo if navigateTo fails
              wx.redirectTo({
                url,
                success: resolve,
                fail: reject
              })
            }
          })
        })
      } else {
        await new Promise((resolve, reject) => {
          wx.redirectTo({
            url,
            success: resolve,
            fail: reject
          })
        })
      }
    } catch (error) {
      console.error('Navigation failed:', error)
    } finally {
      setTimeout(() => {
        this.globalData.isNavigating = false
      }, 1000)
    }
  }
}) 