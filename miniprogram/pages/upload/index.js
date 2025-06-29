const app = getApp()

Page({
  data: {
    measureDate: '',
    displayDate: '',
    inrValue: '',
    imageUrl: '',
    isSubmitting: false
  },

  onLoad() {
    // 设置默认日期为今天
    const today = new Date()
    const dateStr = today.getFullYear() + '-' + 
                   String(today.getMonth() + 1).padStart(2, '0') + '-' + 
                   String(today.getDate()).padStart(2, '0')
    this.setData({
      measureDate: dateStr,
      displayDate: this.formatDisplayDate(dateStr)
    })
  },

  // 格式化显示日期
  formatDisplayDate(dateStr) {
    if (!dateStr) return ''
    const date = new Date(dateStr)
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}/${month}/${day}`
  },

  // 日期选择
  onDateChange(e) {
    const dateStr = e.detail.value
    this.setData({
      measureDate: dateStr,
      displayDate: this.formatDisplayDate(dateStr)
    })
  },

  // INR值输入
  onInrInput(e) {
    this.setData({
      inrValue: e.detail.value
    })
  },

  // 选择图片
  onChooseImage() {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const tempFilePath = res.tempFiles[0].tempFilePath
        this.setData({
          imageUrl: tempFilePath
        })
      },
      fail: (err) => {
        console.error('选择图片失败:', err)
        wx.showToast({
          title: '选择图片失败',
          icon: 'error'
        })
      }
    })
  },

  // 提交按钮点击
  onSubmitTap() {
    // 验证输入
    if (!this.validateInput()) {
      return
    }

    // 显示确认弹窗
    wx.showModal({
      title: '确认提交',
      content: `化验时间：${this.data.displayDate}\nINR值：${this.data.inrValue}\n\n结果上传后不可更改，确认继续吗？`,
      confirmText: '确认提交',
      cancelText: '返回',
      success: (res) => {
        if (res.confirm) {
          this.submitData()
        }
        // 如果点击返回(cancel)，什么都不做，弹窗会自动关闭
      }
    })
  },

  // 验证输入
  validateInput() {
    const { measureDate, inrValue } = this.data

    if (!measureDate) {
      wx.showToast({
        title: '请选择化验时间',
        icon: 'error'
      })
      return false
    }

    if (!inrValue) {
      wx.showToast({
        title: '请输入INR值',
        icon: 'error'
      })
      return false
    }

    const inrNum = parseFloat(inrValue)
    if (isNaN(inrNum) || inrNum <= 0 || inrNum > 10) {
      wx.showToast({
        title: 'INR值应在0-10之间',
        icon: 'error'
      })
      return false
    }

    // 验证日期不能是未来
    const selectedDate = new Date(measureDate)
    const today = new Date()
    today.setHours(23, 59, 59, 999) // 设置为今天的最后一刻
    
    if (selectedDate > today) {
      wx.showToast({
        title: '化验时间不能是未来',
        icon: 'error'
      })
      return false
    }

    return true
  },

  // 提交数据到后端
  async submitData() {
    if (this.data.isSubmitting) {
      return
    }

    this.setData({ isSubmitting: true })

    try {
      // 检查登录状态
      if (!app.globalData.isLoggedIn || app.globalData.needRegister) {
        app.checkLoginState()
        return
      }

      // 获取患者ID
      const profileRes = await app.request({
        url: `/api/auth/check-profile/${app.globalData.accountId}`,
        method: 'GET'
      })

      if (!profileRes.success || !profileRes.data.hasProfile || !profileRes.data.profileId) {
        wx.showToast({
          title: '未绑定患者信息',
          icon: 'error'
        })
        return
      }

      const patientId = profileRes.data.profileId

      // 根据是否有图片选择不同的上传方式
      if (this.data.imageUrl) {
        // 有图片时使用wx.uploadFile
        const uploadTask = wx.uploadFile({
          url: `${app.globalData.baseUrl}/api/patients/${patientId}/metrics`,
          filePath: this.data.imageUrl,
          name: 'image', // 对应后端的字段名
          formData: {
            metric_type: 'INR',
            metric_value: parseFloat(this.data.inrValue),
            measured_at: this.data.measureDate + ' 12:00:00'
          },
          success: (uploadRes) => {
            this.handleUploadSuccess(uploadRes)
          },
          fail: (error) => {
            this.handleUploadFail(error)
          },
          complete: () => {
            this.setData({ isSubmitting: false })
          }
        })
      } else {
        // 没有图片时使用普通的request
        const result = await app.request({
          url: `/api/patients/${patientId}/metrics`,
          method: 'POST',
          data: {
            metric_type: 'INR',
            metric_value: parseFloat(this.data.inrValue),
            measured_at: this.data.measureDate + ' 12:00:00'
          }
        })
        
        this.setData({ isSubmitting: false })
        
        if (result.success) {
          this.showSuccessModal()
        } else {
          wx.showToast({
            title: result.error || '提交失败',
            icon: 'error',
            duration: 3000
          })
        }
      }
    } catch (error) {
      console.error('提交失败:', error)
      wx.showToast({
        title: error.message || '网络错误',
        icon: 'error',
        duration: 3000
      })
      this.setData({ isSubmitting: false })
    }
  },

  // 处理上传成功
  handleUploadSuccess(uploadRes) {
    console.log('上传响应:', uploadRes)
    
    let result
    try {
      result = JSON.parse(uploadRes.data)
    } catch (error) {
      console.error('解析响应失败:', error)
      wx.showToast({
        title: '服务器响应格式错误',
        icon: 'error',
        duration: 3000
      })
      return
    }

    if (result.success) {
      this.showSuccessModal()
    } else {
      wx.showToast({
        title: result.error || '提交失败',
        icon: 'error',
        duration: 3000
      })
    }
  },

  // 处理上传失败
  handleUploadFail(error) {
    console.error('上传失败:', error)
    wx.showToast({
      title: error.errMsg || '上传失败',
      icon: 'error',
      duration: 3000
    })
  },

  // 显示成功弹窗
  showSuccessModal() {
    wx.showModal({
      title: '提交成功',
      content: `INR值：${this.data.inrValue}\n\n已提交化验结果，请等待医生确认新的用药剂量`,
      showCancel: false,
      confirmText: '知道了',
      success: () => {
        // 返回首页并刷新数据
        wx.navigateBack({
          success: () => {
            // 通知首页刷新数据
            const pages = getCurrentPages()
            const prevPage = pages[pages.length - 2]
            if (prevPage && prevPage.fetchCurrentStatus) {
              prevPage.fetchCurrentStatus()
            }
          }
        })
      }
    })
  }
}) 