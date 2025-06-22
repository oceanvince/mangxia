const app = getApp()

Page({
  data: {
    currentStatus: {}
  },

  onLoad() {
    // Check auth state before loading data
    if (!app.globalData.isLoggedIn || app.globalData.needRegister) {
      app.checkLoginState()
      return
    }
    this.fetchCurrentStatus()
  },

  onShow() {
    // Check auth state when page becomes visible
    if (!app.globalData.isLoggedIn || app.globalData.needRegister) {
      app.checkLoginState()
      return
    }
    this.fetchCurrentStatus()
  },

  onPullDownRefresh() {
    this.fetchCurrentStatus()
  },

  // 格式化UTC时间为北京时间
  formatDateTime(utcTime) {
    if (!utcTime) return '-';
    const date = new Date(utcTime);
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}`;
  },

  async fetchCurrentStatus() {
    // Check auth state before making API request
    if (!app.globalData.isLoggedIn || app.globalData.needRegister) {
      app.checkLoginState()
      return
    }

    try {
      // Get patient ID from account profile
      console.log('check-profile accountId', app.globalData.accountId)
      const profileRes = await app.request({
        url: `/api/auth/check-profile/${app.globalData.accountId}`,
        method: 'GET'
      })
      
      console.log('check-profile response', profileRes)
      if (profileRes.success && profileRes.data.hasProfile && profileRes.data.profileId) {
        await this.fetchPatientStatus(profileRes.data.profileId)
      } else {
        wx.showToast({
          title: '未绑定患者信息',
          icon: 'error',
          duration: 2000
        })
      }
    } catch (err) {
      console.error('获取账号信息失败:', err)
      wx.showToast({
        title: '获取账号信息失败',
        icon: 'error',
        duration: 2000
      })
    }
  },

  async fetchPatientStatus(patientId) {
    const url = `/api/patients/${patientId}/current-status`
    console.log('发起请求:', url)

    try {
      const res = await app.request({
        url: url,
        method: 'GET'
      })
      
      console.log('获取当前状态成功:', res)
      if (res.success) {
        const planData = res.data;
        // 格式化时间
        this.setData({
          currentStatus: {
            ...planData,
            metric: {
              ...planData.metric,
              measured_at: this.formatDateTime(planData.metric?.measured_at),
            },
            updated_at: this.formatDateTime(planData.updated_at)
          }
        })
      } else {
        console.error('获取当前状态失败:', res.error)
        wx.showToast({
          title: res.error || '获取状态失败',
          icon: 'error',
          duration: 2000
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
    } finally {
      wx.stopPullDownRefresh()
    }
  },

  onUploadTap() {
    // Check auth state before navigation
    if (!app.globalData.isLoggedIn || app.globalData.needRegister) {
      app.checkLoginState()
      return
    }
    // TODO: 实现跳转到上传页面的逻辑
    console.log('点击了上传按钮')
  }
}) 