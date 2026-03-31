const app = getApp()

Page({
  data: {
    inputValue: '',
    pwd: '',
    userInfo: null,
    openid: '',
    loading: false
  },

  bindKeyInput: function (e) {
    this.setData({
      inputValue: (e.detail.value || '').trim()
    })
  },

  bindPwdInput: function (e) {
    this.setData({
      pwd: (e.detail.value || '').trim()
    })
  },

  showToast: function (title) {
    wx.showToast({
      title: title,
      icon: 'none',
      duration: 2200
    })
  },

  showBackendError: function (err) {
    console.log(err)
    this.showToast('后端未启动或不可用')
  },

  goRegister: function () {
    wx.navigateTo({
      url: '../register/register'
    })
  },

  goHome: function () {
    wx.switchTab({
      url: '../index/index'
    })
  },

  handleAuthLogin: function () {
    if (!this.data.inputValue) {
      this.showToast('请输入学工号')
      return
    }

    if (!this.data.pwd) {
      this.showToast('请输入密码')
      return
    }

    this.setData({
      loading: true
    })

    wx.getUserProfile({
      desc: '用于完善校园失物招领资料',
      success: res => {
        app.globalData.userInfo = res.userInfo
        this.wxLogin(res.userInfo)
      },
      fail: () => {
        this.setData({
          loading: false
        })
        this.showToast('需要授权头像昵称后才能继续')
      }
    })
  },

  wxLogin: function (userInfo) {
    wx.login({
      success: res => {
        if (!res.code) {
          this.setData({
            loading: false
          })
          this.showToast('微信登录失败，请稍后重试')
          return
        }

        wx.request({
          url: app.globalData.serverName + '/getopenid.php',
          data: {
            code: res.code
          },
          method: 'GET',
          header: {
            'content-type': 'application/json'
          },
          success: openidRes => {
            const openid = openidRes.data && openidRes.data.openid

            if (!openid) {
              this.setData({
                loading: false
              })
              this.showToast('未获取到 openid')
              return
            }

            this.setData({
              openid: openid
            })
            app.globalData.openid = openid
            wx.setStorageSync('openid', openid)
            this.submitLogin(openid, userInfo)
          },
          fail: err => {
            this.setData({
              loading: false
            })
            this.showBackendError(err)
          }
        })
      },
      fail: err => {
        this.setData({
          loading: false
        })
        console.log(err)
        this.showToast('微信登录失败，请稍后重试')
      }
    })
  },

  submitLogin: function (openid, userInfo) {
    const userId = this.data.inputValue
    const password = this.data.pwd

    wx.request({
      url: app.globalData.serverName + '/login/login.php',
      data: {
        user_id: userId,
        user_password: password,
        openid: openid,
        nickName: userInfo.nickName,
        avatarUrl: userInfo.avatarUrl
      },
      method: 'GET',
      header: {
        'content-type': 'application/json'
      },
      success: res => {
        this.setData({
          loading: false
        })

        const response = res.data || {}
        const data = response.data || {}
        const effectiveUserId = data.user_id || userId

        if (response.code !== 0) {
          this.showToast(response.msg || '登录失败，请稍后重试')
          return
        }

        wx.setStorageSync('user_id', effectiveUserId)

        wx.switchTab({
          url: '../index/index'
        })
        wx.showToast({
          title: '登录成功',
          icon: 'success',
          duration: 1800
        })
      },
      fail: err => {
        this.setData({
          loading: false
        })
        this.showBackendError(err)
      }
    })
  },

  onLoad: function () {
    const openid = wx.getStorageSync('openid')

    this.setData({
      userInfo: app.globalData.userInfo
    })

    if (!openid) {
      return
    }

    this.setData({
      openid: openid
    })

    wx.request({
      url: app.globalData.serverName + '/login/auto_login.php',
      data: {
        openid: openid
      },
      method: 'GET',
      header: {
        'content-type': 'application/json'
      },
      success: res => {
        if (res.data && res.data.user_id) {
          wx.setStorageSync('user_id', res.data.user_id)
          wx.switchTab({
            url: '../index/index'
          })
        }
      },
      fail: err => {
        this.showBackendError(err)
      }
    })
  }
})
