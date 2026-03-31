const app = getApp()

Page({
  data: {
    originPassword: '',
    newPassword: '',
    confirmPassword: '',
    loading: false
  },

  bindOriginInput: function (e) {
    this.setData({
      originPassword: (e.detail.value || '').trim()
    })
  },

  bindNewInput: function (e) {
    this.setData({
      newPassword: (e.detail.value || '').trim()
    })
  },

  bindConfirmInput: function (e) {
    this.setData({
      confirmPassword: (e.detail.value || '').trim()
    })
  },

  showToast: function (title) {
    wx.showToast({
      title: title,
      icon: 'none',
      duration: 2200
    })
  },

  formSubmit: function () {
    const userId = wx.getStorageSync('user_id')
    const originPassword = this.data.originPassword
    const newPassword = this.data.newPassword
    const confirmPassword = this.data.confirmPassword

    if (!userId) {
      this.showToast('请先登录后再修改密码')
      return
    }

    if (!originPassword) {
      this.showToast('请输入当前密码')
      return
    }

    if (!newPassword) {
      this.showToast('请输入新密码')
      return
    }

    if (newPassword.length < 6) {
      this.showToast('新密码至少需要 6 位')
      return
    }

    if (newPassword === originPassword) {
      this.showToast('新密码不能与旧密码相同')
      return
    }

    if (newPassword !== confirmPassword) {
      this.showToast('两次输入的新密码不一致')
      return
    }

    this.setData({
      loading: true
    })

    wx.request({
      url: app.globalData.serverName + '/myinfo/change_password.php',
      data: {
        user_id: userId,
        origin_password: originPassword,
        new_password: newPassword
      },
      method: 'GET',
      header: {
        'content-type': 'application/json'
      },
      success: res => {
        const response = res.data || {}

        if (response.code !== 0) {
          if (response.msg === 'origin password error') {
            this.showToast('当前密码不正确')
            return
          }

          if (response.msg === 'password too short') {
            this.showToast('新密码至少需要 6 位')
            return
          }

          this.showToast(response.msg || '修改失败，请稍后重试')
          return
        }

        wx.showModal({
          title: '修改成功',
          content: '密码已经同步更新到数据库，之后请使用新密码登录。',
          showCancel: false,
          success: () => {
            wx.navigateBack({
              delta: 1
            })
          }
        })
      },
      fail: err => {
        console.log(err)
        this.showToast('后端连接失败')
      },
      complete: () => {
        this.setData({
          loading: false
        })
      }
    })
  }
})
