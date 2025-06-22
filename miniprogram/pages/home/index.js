const app = getApp()

Page({
  data: {
    currentStatus: {}
  },

  onLoad() {
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

  fetchCurrentStatus() {
    const patientId = 'b36dd2d8-a2c8-45b2-862c-37cfadcc655e'  // 新患者ID - 肖亚文
    
    if (!patientId) {
      wx.showToast({
        title: '未获取到患者ID',
        icon: 'error',
        duration: 2000
      })
      return
    }

    const url = `${app.globalData.baseUrl}/api/patients/${patientId}/current-status`
    console.log('发起请求:', url)

    wx.request({
      url: url,
      method: 'GET',
      success: (res) => {
        console.log('请求成功，状态码:', res.statusCode)
        console.log('获取当前状态成功:', res.data)
        if (res.data.success) {
          const planData = res.data.data;
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
          console.error('获取当前状态失败:', res.data.error)
          wx.showToast({
            title: res.data.error || '获取状态失败',
            icon: 'error',
            duration: 2000
          })
        }
      },
      fail: (err) => {
        console.error('请求失败:', err)
        wx.showToast({
          title: '网络错误',
          icon: 'error',
          duration: 2000
        })
      },
      complete: () => {
        wx.stopPullDownRefresh()
      }
    })
  },

  onUploadTap() {
    // TODO: 实现跳转到上传页面的逻辑
    console.log('点击了上传按钮')
  }
}) 