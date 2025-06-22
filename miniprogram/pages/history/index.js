Page({
  data: {
    historyList: []
  },

  onLoad() {
    this.fetchHistoryList()
  },

  onShow() {
    this.fetchHistoryList()
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

  fetchHistoryList() {
    const patientId = 'b36dd2d8-a2c8-45b2-862c-37cfadcc655e'  // 新患者ID - 肖亚文
    
    const baseUrl = 'http://localhost:3001'  // 使用统一的baseUrl
    const url = `${baseUrl}/api/patients/${patientId}/latest-active-plans`
    console.log('发起请求:', url)

    wx.request({
      url: url,
      method: 'GET',
      success: (res) => {
        console.log('请求成功，状态码:', res.statusCode)
        console.log('获取历史记录成功:', res.data)
        if (res.statusCode === 200 && res.data.success) {
          // 格式化时间
          const formattedData = res.data.data.map(item => ({
            ...item,
            metric_measured_at: this.formatDateTime(item.metric_measured_at),
            metric_created_at: this.formatDateTime(item.metric_created_at),
            plan_updated_at: this.formatDateTime(item.plan_updated_at),
            plan_created_at: this.formatDateTime(item.plan_created_at)
          }));
          
          this.setData({
            historyList: formattedData
          })
        } else {
          wx.showToast({
            title: res.data.message || '获取历史记录失败',
            icon: 'error'
          })
        }
      },
      fail: (err) => {
        console.error('获取历史记录失败:', err)
        if (err.errMsg.includes('url not in domain list')) {
          console.warn('请在开发者工具中开启"不校验合法域名"选项')
        }
        wx.showToast({
          title: '获取历史记录失败',
          icon: 'error'
        })
      }
    })
  }
}) 