const app = getApp()

Page({
  data: {
    userInfo: {}
  },

  onLoad: function() {
    this.fetchUserInfo()
  },

  onPullDownRefresh: function() {
    this.fetchUserInfo()
  },

  fetchUserInfo: function() {
    const patientId = 'b36dd2d8-a2c8-45b2-862c-37cfadcc655e'  // 新患者ID - 肖亚文
    
    if (!patientId) {
      wx.showToast({
        title: '未获取到患者ID',
        icon: 'error',
        duration: 2000
      })
      return
    }

    const url = `${app.globalData.baseUrl}/api/patients/${patientId}/profile`
    console.log('发起请求:', url)

    wx.request({
      url: url,
      method: 'GET',
      success: (res) => {
        console.log('请求成功，状态码:', res.statusCode)
        console.log('获取用户信息成功:', res.data)
        if (res.data.success) {
          this.setData({
            userInfo: res.data.data
          })
        } else {
          console.error('获取用户信息失败:', res.data.error)
          wx.showToast({
            title: res.data.error || '获取信息失败',
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
  }
}) 