const app = getApp()

Page({
  data: {
    scanning: false,
    loading: false
  },

  onLoad() {
    // Check if we're logged in and need binding
    if (!app.globalData.isLoggedIn) {
      app.checkLoginState()
      return
    }
    this.checkBindingStatus()
  },

  onShow() {
    // Check if we're logged in and need binding
    if (!app.globalData.isLoggedIn) {
      app.checkLoginState()
      return
    }
    this.checkBindingStatus()
  },

  async checkBindingStatus() {
    // If user already has a profile, redirect to home
    if (!app.globalData.needRegister) {
      wx.switchTab({
        url: '/pages/home/index'
      })
    }
  },

  async handleScan() {
    if (this.data.scanning || this.data.loading) return

    // Check auth state before scanning
    if (!app.globalData.isLoggedIn) {
      app.checkLoginState()
      return
    }

    this.setData({ scanning: true })

    try {
      const scanResult = await wx.scanCode({
        onlyFromCamera: true,
        scanType: ['qrCode']
      })

      console.log('Scan result:', scanResult)

      try {
        // Parse QR code data
        const qrData = JSON.parse(scanResult.result)
        
        if (!qrData.patientId) {
          throw new Error('Invalid QR code: missing patient ID')
        }

        await this.bindAccount(qrData.patientId)

      } catch (parseError) {
        console.error('Invalid QR code data:', parseError)
        wx.showToast({
          title: '无效的二维码',
          icon: 'error'
        })
      }

    } catch (error) {
      console.error('Scan failed:', error)
      wx.showToast({
        title: '扫描失败',
        icon: 'error'
      })
    } finally {
      this.setData({ scanning: false })
    }
  },

  async bindAccount(patientId) {
    if (this.data.loading) return
    
    // Check auth state before binding
    if (!app.globalData.isLoggedIn) {
      app.checkLoginState()
      return
    }

    this.setData({ loading: true })

    try {
      const accountId = app.globalData.accountId
      if (!accountId) {
        throw new Error('请先登录')
      }

      const response = await app.request({
        url: '/api/patients/bind-account',
        method: 'POST',
        data: {
          accountId,
          patientId
        }
      })

      console.log('Bind response:', response)

      // Check if response has data property
      if (!response.data) {
        throw new Error('服务器响应异常')
      }

      // If response indicates success
      if (response.data.success) {
        wx.showToast({
          title: '绑定成功',
          icon: 'success'
        })

        // Update global state
        app.globalData.needRegister = false

        // Generate new token with updated needRegister value
        const tokenResponse = await app.request({
          url: '/api/auth/refresh-token',
          method: 'POST',
          data: {
            accountId,
            needRegister: false
          }
        })

        if (tokenResponse.data && tokenResponse.data.success && tokenResponse.data.token) {
          // Update token in storage and global state
          wx.setStorageSync('token', tokenResponse.data.token)
          app.globalData.token = tokenResponse.data.token
        }

        // Redirect to home page
        setTimeout(() => {
          wx.switchTab({
            url: '/pages/home/index'
          })
        }, 1500)
      } else {
        // Handle error from backend
        throw new Error(response.data.error || '绑定失败')
      }

    } catch (error) {
      console.error('Bind failed:', error)
      if (error.statusCode === 401) {
        // Token expired or invalid, trigger login check
        app.checkLoginState()
      } else {
        wx.showToast({
          title: error.message || '绑定失败',
          icon: 'error',
          duration: 2000
        })
      }
    } finally {
      this.setData({ loading: false })
    }
  }
}) 