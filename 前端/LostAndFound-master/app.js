const { serverName, goodsCategory } = require('./utils/constance/contance')

App({
  globalData: {
    userInfo: null,
    serverName: serverName,
    categories: goodsCategory,
    openid: null
  },

  onLaunch: function () {
    const logs = wx.getStorageSync('logs') || []
    logs.unshift(Date.now())
    wx.setStorageSync('logs', logs)

    wx.login({
      success: () => {}
    })

    wx.getSetting({
      success: res => {
        if (res.authSetting['scope.userInfo']) {
          wx.getUserInfo({
            success: userRes => {
              this.globalData.userInfo = userRes.userInfo
              if (this.userInfoReadyCallback) {
                this.userInfoReadyCallback(userRes)
              }
            }
          })
        }
      }
    })
  }
})
