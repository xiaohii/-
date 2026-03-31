const app = getApp()

Page({
  data: {
    currentName: '',
    nextName: '',
    loading: false
  },

  onLoad: function () {
    const userId = wx.getStorageSync('user_id')

    if (!userId) {
      this.showToast('请先登录后再修改名字')
      setTimeout(() => {
        wx.reLaunch({
          url: '../login/login'
        })
      }, 300)
      return
    }

    this.loadCurrentName(userId)
  },

  showToast: function (title) {
    wx.showToast({
      title: title,
      icon: 'none',
      duration: 2200
    })
  },

  bindNameInput: function (e) {
    this.setData({
      nextName: (e.detail.value || '').trim()
    })
  },

  loadCurrentName: function (userId) {
    wx.request({
      url: app.globalData.serverName + '/myinfo/get_user_info.php',
      data: {
        user_id: userId
      },
      method: 'GET',
      header: {
        'content-type': 'application/json'
      },
      success: res => {
        const currentName = (res.data && res.data.nickName) || ''

        this.setData({
          currentName: currentName,
          nextName: currentName
        })
      },
      fail: err => {
        console.log(err)
        this.showToast('后端连接失败')
      }
    })
  },

  formSubmit: function () {
    const userId = wx.getStorageSync('user_id')
    const nextName = (this.data.nextName || '').trim()
    const currentName = (this.data.currentName || '').trim()

    if (!userId) {
      this.showToast('请先登录后再修改名字')
      return
    }

    if (!nextName) {
      this.showToast('请输入新的名字')
      return
    }

    if (nextName.length < 2) {
      this.showToast('名字至少需要 2 个字')
      return
    }

    if (nextName.length > 16) {
      this.showToast('名字最多 16 个字')
      return
    }

    if (nextName === currentName) {
      this.showToast('名字没有变化')
      return
    }

    this.setData({
      loading: true
    })

    wx.request({
      url: app.globalData.serverName + '/myinfo/set_nickname.php',
      data: {
        user_id: userId,
        nick_name: nextName
      },
      method: 'GET',
      header: {
        'content-type': 'application/json'
      },
      success: res => {
        const response = res.data || {}

        if (response.code !== 0) {
          if (response.msg === 'nickname length invalid') {
            this.showToast('名字长度需要在 2 到 16 个字之间')
            return
          }

          this.showToast(response.msg || '修改失败，请稍后重试')
          return
        }

        this.setData({
          currentName: response.nickName || nextName,
          nextName: response.nickName || nextName
        })

        wx.showModal({
          title: '修改成功',
          content: '名字已经同步更新到数据库，首页和详情页会显示新的昵称。',
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
