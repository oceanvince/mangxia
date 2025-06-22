App({
  onLaunch() {
    // 设置全局数据
    const patientId = wx.getStorageSync('patientId')
    if (patientId) {
      this.globalData.patientId = patientId
    }
  },

  globalData: {
    baseUrl: 'http://localhost:3001',  // 开发环境URL，生产环境需要修改
    patientId: null
  }
}) 