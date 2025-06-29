const app = getApp()

Page({
  data: {
    currentStatus: {},
    statusBanner: {
      show: false,
      type: '', // 'pending' or 'approved'
      text: ''
    },
    hasPendingRecord: false
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
        
        // 检查是否有pending状态的记录
        await this.checkPendingStatus(patientId)
        
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

  // 检查是否有pending状态的记录或新确认的记录
  async checkPendingStatus(patientId) {
    try {
      const res = await app.request({
        url: `/api/patients/${patientId}/metrics`,
        method: 'GET'
      })
      
      if (res.success && res.data && res.data.length > 0) {
        // 检查最新的记录是否为pending状态
        const latestMetric = res.data[0] // 假设返回的数据按时间倒序排列
        const hasPending = latestMetric.status === 'pending'
        
        // 检查是否有最近确认的记录（24小时内确认的active记录）
        const recentlyConfirmed = this.checkRecentlyConfirmed(res.data)
        
        if (hasPending) {
          this.setData({
            hasPendingRecord: true,
            statusBanner: {
              show: true,
              type: 'pending',
              text: '最新化验结果已提交，待医生审核中'
            }
          })
        } else if (recentlyConfirmed) {
          this.setData({
            hasPendingRecord: false,
            statusBanner: {
              show: true,
              type: 'approved',
              text: '最新医嘱已生效，请按最新用量服药'
            }
          })
          // 3秒后自动隐藏已确认的banner
          setTimeout(() => {
            this.setData({
              statusBanner: {
                show: false,
                type: '',
                text: ''
              }
            })
          }, 5000)
        } else {
          this.setData({
            hasPendingRecord: false,
            statusBanner: {
              show: false,
              type: '',
              text: ''
            }
          })
        }
      } else {
        this.setData({
          hasPendingRecord: false,
          statusBanner: {
            show: false,
            type: '',
            text: ''
          }
        })
      }
    } catch (err) {
      console.error('检查pending状态失败:', err)
      // 如果检查失败，默认允许上传
      this.setData({
        hasPendingRecord: false,
        statusBanner: {
          show: false,
          type: '',
          text: ''
        }
      })
    }
  },

  // 检查是否有最近确认的记录
  checkRecentlyConfirmed(metrics) {
    if (!metrics || metrics.length === 0) return false
    
    // 查找最新的active记录
    const latestActiveMetric = metrics.find(m => m.status === 'active')
    if (!latestActiveMetric || !latestActiveMetric.plan_updated_at) return false
    
    // 检查这个active记录是否是最近确认的（通过plan的更新时间判断）
    const now = new Date()
    const planUpdatedAt = new Date(latestActiveMetric.plan_updated_at)
    const timeDiff = now - planUpdatedAt
    const minutesDiff = timeDiff / (1000 * 60)
    
    // 如果在最近10分钟内更新，认为是新确认的
    console.log('检查最近确认记录:', {
      planUpdatedAt: latestActiveMetric.plan_updated_at,
      minutesDiff: minutesDiff,
      isRecentlyConfirmed: minutesDiff <= 10
    })
    
    return minutesDiff <= 10 && minutesDiff >= 0
  },

  onUploadTap() {
    // Check auth state before navigation
    if (!app.globalData.isLoggedIn || app.globalData.needRegister) {
      app.checkLoginState()
      return
    }
    
    // 检查是否有pending记录
    if (this.data.hasPendingRecord) {
      wx.showToast({
        title: '请等待医生审核',
        icon: 'none',
        duration: 2000
      })
      return
    }
    
    // 跳转到上传页面
    wx.navigateTo({
      url: '/pages/upload/index'
    })
  }
}) 