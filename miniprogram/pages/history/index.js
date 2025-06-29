const app = getApp()

Page({
  data: {
    historyData: [],
    isLoading: false
  },

  onLoad() {
    // Check auth state before loading data
    if (!app.globalData.isLoggedIn || app.globalData.needRegister) {
      app.checkLoginState()
      return
    }
    this.fetchHistoryData()
  },

  onShow() {
    // Check auth state when page becomes visible
    if (!app.globalData.isLoggedIn || app.globalData.needRegister) {
      app.checkLoginState()
      return
    }
    this.fetchHistoryData()
  },

  onPullDownRefresh() {
    this.fetchHistoryData()
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

  async fetchHistoryData() {
    // Prevent multiple concurrent requests
    if (this.data.isLoading) {
      return
    }

    // Check auth state before making API request
    if (!app.globalData.isLoggedIn || app.globalData.needRegister) {
      app.checkLoginState()
      return
    }

    this.setData({ isLoading: true })

    try {
      // Get patient ID from account profile
      const profileRes = await app.request({
        url: `/api/auth/check-profile/${app.globalData.accountId}`,
        method: 'GET'
      })
      
      if (profileRes.success && profileRes.data.hasProfile && profileRes.data.profileId) {
        await this.fetchLatestPlans(profileRes.data.profileId)
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
        title: err.message || '获取账号信息失败',
        icon: 'error',
        duration: 2000
      })
    } finally {
      this.setData({ isLoading: false })
      wx.stopPullDownRefresh()
    }
  },

  async fetchLatestPlans(patientId) {
    try {
      const url = `/api/patients/${patientId}/latest-active-plans`
      console.log('发起请求:', url)

      const res = await app.request({
        url: url,
        method: 'GET'
      })
      
      if (res.success) {
        // 格式化时间和处理剂量显示
        const formattedData = res.data.map(plan => {
          // 只显示医生确认的剂量
          let dosage = '-';
          
          if (plan.status === 'pending') {
            dosage = '待医生确认';
          } else if (plan.status === 'active' && plan.doctor_suggested_dosage) {
            dosage = plan.doctor_suggested_dosage;
          }
          
          return {
            plan_id: plan.plan_id,
            metric_value: plan.metric_value,
            metric_measured_at: this.formatDateTime(plan.metric_measured_at),
            metric_created_at: this.formatDateTime(plan.metric_created_at),
            suggested_dosage: dosage,
            plan_updated_at: this.formatDateTime(plan.plan_updated_at),
            plan_created_at: this.formatDateTime(plan.plan_created_at),
            status: plan.status
          };
        });
        
        this.setData({
          historyData: formattedData
        })
      } else {
        console.error('获取历史记录失败:', res.error)
        wx.showToast({
          title: res.error || '获取历史记录失败',
          icon: 'error',
          duration: 2000
        })
      }
    } catch (err) {
      console.error('请求失败:', err)
      wx.showToast({
        title: err.message || '网络错误',
        icon: 'error',
        duration: 2000
      })
    }
  }
}) 