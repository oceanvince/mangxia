Component({
  methods: {
    onTapHome() {
      const app = getApp()
      if (!app.globalData.isLoggedIn || app.globalData.needRegister) {
        app.checkLoginState()
        return
      }
      wx.switchTab({
        url: '/pages/home/index'
      })
    }
  }
}) 