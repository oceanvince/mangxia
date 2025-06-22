const app = getApp()

Page({
  data: {
    userInfo: null
  },

  onLoad: function() {
    // Check auth state before loading data
    if (!app.globalData.isLoggedIn || app.globalData.needRegister) {
      app.checkLoginState()
      return
    }
    this.fetchProfileData()
  },

  onShow: function() {
    // Check auth state when page becomes visible
    if (!app.globalData.isLoggedIn || app.globalData.needRegister) {
      app.checkLoginState()
      return
    }
    this.fetchProfileData()
  },

  onPullDownRefresh: function() {
    this.fetchProfileData()
  },

  async fetchProfileData() {
    // Check auth state before making API request
    if (!app.globalData.isLoggedIn || app.globalData.needRegister) {
      app.checkLoginState()
      return
    }

    try {
      // Get patient ID from account profile
      const profileRes = await app.request({
        url: `/api/auth/check-profile/${app.globalData.accountId}`,
        method: 'GET'
      })
      
      if (profileRes.success && profileRes.data.hasProfile && profileRes.data.profileId) {
        await this.fetchPatientProfile(profileRes.data.profileId)
      } else {
        wx.showToast({
          title: '未绑定患者信息',
          icon: 'error',
          duration: 2000
        })
        // Clear userInfo when not bound
        this.setData({
          userInfo: null
        })
      }
    } catch (err) {
      console.error('获取账号信息失败:', err)
      wx.showToast({
        title: '获取账号信息失败',
        icon: 'error',
        duration: 2000
      })
      // Clear userInfo on error
      this.setData({
        userInfo: null
      })
    }
  },

  async fetchPatientProfile(patientId) {
    const url = `/api/patients/${patientId}/profile`
    console.log('发起请求:', url)

    try {
      const res = await app.request({
        url: url,
        method: 'GET'
      })
      
      console.log('获取个人信息成功:', res)
      if (res.success && res.data) {
        this.setData({
          userInfo: res.data
        })
      } else {
        console.error('获取个人信息失败:', res.error)
        wx.showToast({
          title: res.error || '获取个人信息失败',
          icon: 'error',
          duration: 2000
        })
        // Clear userInfo on error
        this.setData({
          userInfo: null
        })
      }
    } catch (err) {
      console.error('请求失败:', err)
      if (err.statusCode === 401) {
        // Token expired or invalid, trigger login check
        app.checkLoginState()
      } else {
        wx.showToast({
          title: '网络错误',
          icon: 'error',
          duration: 2000
        })
      }
      // Clear userInfo on error
      this.setData({
        userInfo: null
      })
    } finally {
      wx.stopPullDownRefresh()
    }
  }
}) 