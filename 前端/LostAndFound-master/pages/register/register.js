const app = getApp()

Page({
  data: {
    inputValue: '',
    pwd: '',
    confirmPwd: '',
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

  bindConfirmPwdInput: function (e) {
    this.setData({
      confirmPwd: (e.detail.value || '').trim()
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

  goLogin: function () {
    wx.navigateBack({
      delta: 1
    })
  },

  handleRegister: function () {
    if (!this.data.inputValue) {
      this.showToast('请输入学工号')
      return
    }

    if (!this.data.pwd) {
      this.showToast('请输入密码')
      return
    }

    if (this.data.pwd.length < 6) {
      this.showToast('密码至少需要 6 位')
      return
    }

    if (this.data.pwd !== this.data.confirmPwd) {
      this.showToast('两次输入的密码不一致')
      return
    }

    this.setData({
      loading: true
    })

    wx.getUserProfile({
      desc: '用于创建校园失物招领资料',
      success: res => {
        app.globalData.userInfo = res.userInfo
        this.requestOpenId(res.userInfo)
      },
      fail: () => {
        this.setData({
          loading: false
        })
        this.showToast('需要授权头像昵称后才能继续')
      }
    })
  },

  requestOpenId: function (userInfo) {
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
            this.submitRegister(openid, userInfo)
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

  submitRegister: function (openid, userInfo) {
    const userId = this.data.inputValue

    wx.request({
      url: app.globalData.serverName + '/login/register.php',
      data: {
        user_id: userId,
        user_password: this.data.pwd,
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
          if (data.tag === 'registered' || response.msg === 'account already exists') {
            wx.showModal({
              title: '账号已存在',
              content: '这个学工号已经注册过了，请直接回到登录页登录。',
              showCancel: false,
              success: () => {
                this.goLogin()
              }
            })
            return
          }

          this.showToast(response.msg || '注册失败，请稍后重试')
          return
        }

        wx.setStorageSync('user_id', effectiveUserId)
        wx.showToast({
          title: '注册成功，继续完善资料',
          icon: 'none',
          duration: 1800
        })

        setTimeout(() => {
          wx.redirectTo({
            url: '../initinfo/initinfo'
          })
        }, 800)
      },
      fail: err => {
        this.setData({
          loading: false
        })
        this.showBackendError(err)
      }
    })
  }
})
