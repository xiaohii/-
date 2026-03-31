const app = getApp()

Page({
  data: {
    array: ['手机号', 'QQ', '微信号'],
    index: 0
  },

  bindPickerChange: function (e) {
    this.setData({
      index: Number(e.detail.value || 0)
    })
  },

  showToast: function (title) {
    wx.showToast({
      title: title,
      icon: 'none',
      duration: 2000
    })
  },

  formSubmit: function (e) {
    const userId = wx.getStorageSync('user_id')
    const contactType = this.data.array[this.data.index]
    const contactValue = (e.detail.value.contact_value || '').trim()

    if (!contactValue) {
      this.showToast('请填写新的联系方式')
      return
    }

    wx.request({
      url: app.globalData.serverName + '/login/setcontact.php',
      data: {
        user_id: userId,
        contact_type: contactType,
        contact_value: contactValue
      },
      method: 'GET',
      header: {
        'content-type': 'application/json'
      },
      success: res => {
        if (res.data && res.data.code === 0) {
          wx.switchTab({
            url: '../myinfo/myinfo'
          })
          return
        }

        this.showToast((res.data && res.data.msg) || '修改失败，请稍后重试')
      },
      fail: err => {
        console.log(err)
        this.showToast('后端连接失败')
      }
    })
  }
})
