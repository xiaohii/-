const app = getApp()
const DEFAULT_AVATAR = '../../images/index/icon/defaulticon.png'

function normalizePosts(data) {
  return (data || []).map(item => ({
    username: item.nickName || '匿名用户',
    text: item.msg || '',
    claimPoint: item.claim_point || '',
    image:
      item.image_exist === '1' && item.image_url && item.image_url.length > 0
        ? item.image_url[0]
        : '',
    imagelist: item.image_url || [],
    usericon: item.avatarUrl || DEFAULT_AVATAR,
    sub_time: item.submission_time
      ? item.submission_time.substring(5, item.submission_time.length - 3)
      : '',
    publish_id: item.publish_id
  }))
}

Page({
  data: {
    userId: '',
    isGuest: false,
    nickName: '未登录用户',
    avatarUrl: DEFAULT_AVATAR,
    isAvatarSaving: false,
    isAdmin: false,
    contact_type: '联系方式',
    contact_value: '未设置',
    contactStatus: '待完善',
    avatarStatus: '默认头像',
    listofitem: [],
    profileCompletion: 40,
    archiveBadge: '新手档案',
    statsCards: [
      { label: '发布总数', value: '0' },
      { label: '含图线索', value: '0' },
      { label: '最近更新', value: '暂无' }
    ],
    quickActions: [
      {
        id: 'contact',
        title: '修改联系方式',
        desc: '更新手机号、QQ 或微信号'
      },
      {
        id: 'avatar',
        title: '修改头像',
        desc: '从相册或相机选择一张新的头像图片'
      },
      {
        id: 'admin',
        title: '后台管理',
        desc: '查看帖子和用户，支持简易删除'
      },
      {
        id: 'refresh',
        title: '刷新档案',
        desc: '重新拉取个人资料与发布记录'
      },
      {
        id: 'guide',
        title: '使用提示',
        desc: '查看档案维护和发布建议'
      }
    ],
    archiveTips: [
      '联系方式保持最新，别人找到物品后才能第一时间联系你。',
      '发布内容尽量写清地点、时间和物品特征，认领效率会更高。',
      '带图线索通常更容易被认出，建议上传 1 到 3 张清晰图片。'
    ]
  },

  showToast: function (title) {
    wx.showToast({
      title: title,
      icon: 'none',
      duration: 2000
    })
  },

  onPullDownRefresh: function () {
    this.loadData(() => {
      wx.stopPullDownRefresh()
    })
  },

  photopreview: function (event) {
    const src = event.currentTarget.dataset.src
    const imgList = event.currentTarget.dataset.list

    wx.previewImage({
      current: src,
      urls: imgList
    })
  },

  handleQuickAction: function (e) {
    const action = e.currentTarget.dataset.action

    if (action === 'login') {
      this.goLogin()
      return
    }

    if (action === 'name') {
      this.goModifyName()
      return
    }

    if (action === 'contact') {
      this.goModifyContact()
      return
    }

    if (action === 'password') {
      this.goChangePassword()
      return
    }

    if (action === 'avatar') {
      this.changeAvatar()
      return
    }

    if (action === 'admin') {
      this.goAdminConsole()
      return
    }

    if (action === 'refresh') {
      this.loadData()
      this.showToast('档案已刷新')
      return
    }

    this.showArchiveGuide()
  },

  goModifyContact: function () {
    wx.navigateTo({
      url: '../modifyinfo/modifyinfo'
    })
  },

  goModifyName: function () {
    wx.navigateTo({
      url: '../modifyname/modifyname'
    })
  },

  goChangePassword: function () {
    wx.navigateTo({
      url: '../changepwd/changepwd'
    })
  },

  goLogin: function () {
    wx.navigateTo({
      url: '../login/login'
    })
  },

  buildQuickActions: function (isAdmin, isGuest) {
    if (isGuest) {
      return [
        {
          id: 'login',
          title: '立即登录',
          desc: '登录后查看档案、发布记录和联系方式'
        },
        {
          id: 'guide',
          title: '使用提示',
          desc: '先浏览首页内容，需要时再登录或注册'
        }
      ]
    }

    const quickActions = [
      {
        id: 'name',
        title: '修改名字',
        desc: '更新昵称，并同步到数据库和帖子展示'
      },
      {
        id: 'contact',
        title: '修改联系方式',
        desc: '更新手机号、QQ 或微信号'
      },
      {
        id: 'password',
        title: '修改密码',
        desc: '更新登录密码，并同步到数据库'
      },
      {
        id: 'avatar',
        title: '修改头像',
        desc: '从相册或相机选择一张新的头像图片'
      }
    ]

    if (isAdmin) {
      quickActions.push({
        id: 'admin',
        title: '后台管理',
        desc: '仅限管理员查看和处理帖子、用户'
      })
    }

    quickActions.push(
      {
        id: 'refresh',
        title: '刷新档案',
        desc: '重新拉取个人资料与发布记录'
      },
      {
        id: 'guide',
        title: '使用提示',
        desc: '查看档案维护和发布建议'
      }
    )

    return quickActions
  },

  ensurePasswordQuickAction: function () {
    const quickActions = (this.data.quickActions || []).slice()
    const hasPasswordAction = quickActions.some(item => item && item.id === 'password')

    if (hasPasswordAction) {
      return
    }

    const passwordAction = {
      id: 'password',
      title: '修改密码',
      desc: '更新登录密码，并同步到数据库'
    }
    const contactIndex = quickActions.findIndex(item => item && item.id === 'contact')

    if (contactIndex === -1) {
      quickActions.unshift(passwordAction)
    } else {
      quickActions.splice(contactIndex + 1, 0, passwordAction)
    }

    this.setData({
      quickActions: quickActions
    })
  },

  goAdminConsole: function () {
    wx.navigateTo({
      url: '../test/index'
    })
  },

  showArchiveGuide: function () {
    wx.showModal({
      title: '档案小贴士',
      content:
        '建议优先完善联系方式、补充清晰图片，并定期刷新档案，方便失主或拾到者快速联系你。',
      showCancel: false
    })
  },

  changeAvatar: function () {
    if (this.data.isAvatarSaving) {
      return
    }

    wx.showActionSheet({
      itemList: ['从相册选择', '拍一张'],
      success: res => {
        if (res.tapIndex === 0) {
          this.pickAvatar('album')
          return
        }

        if (res.tapIndex === 1) {
          this.pickAvatar('camera')
        }
      }
    })
  },

  pickAvatar: function (sourceType) {
    wx.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: [sourceType],
      success: res => {
        const filePath = res.tempFilePaths && res.tempFilePaths[0]

        if (!filePath) {
          this.showToast('没有拿到头像图片')
          return
        }

        this.uploadAvatar(filePath)
      },
      fail: err => {
        if (err && err.errMsg && err.errMsg.indexOf('cancel') !== -1) {
          return
        }

        console.log(err)
        this.showToast('选择头像失败')
      }
    })
  },

  uploadAvatar: function (filePath) {
    const userId = wx.getStorageSync('user_id')

    if (!userId) {
      this.showToast('请先登录后再修改头像')
      return
    }

    this.setData({
      isAvatarSaving: true
    })

    wx.showLoading({
      title: '上传头像中'
    })

    wx.uploadFile({
      url: app.globalData.serverName + '/edit/upload.php',
      filePath: filePath,
      name: 'file',
      success: res => {
        let response = {}

        try {
          response = JSON.parse(res.data || '{}')
        } catch (error) {
          console.log(error)
        }

        if (response.code !== 0 || !response.url) {
          this.finishAvatarSaving()
          this.showToast('头像上传失败')
          return
        }

        this.persistAvatar(userId, response.url)
      },
      fail: err => {
        console.log(err)
        this.finishAvatarSaving()
        this.showToast('头像上传失败')
      }
    })
  },

  persistAvatar: function (userId, avatarUrl) {
    wx.request({
      url: app.globalData.serverName + '/myinfo/set_avatar.php',
      data: {
        user_id: userId,
        avatar_url: avatarUrl
      },
      method: 'GET',
      header: {
        'content-type': 'application/json'
      },
      success: res => {
        if (!res.data || res.data.code !== 0) {
          this.showToast((res.data && res.data.msg) || '头像保存失败')
          return
        }

        const updatedPosts = (this.data.listofitem || []).map(item =>
          Object.assign({}, item, {
            usericon: avatarUrl
          })
        )

        this.setData({
          avatarUrl: avatarUrl,
          avatarStatus: '已设置',
          listofitem: updatedPosts,
          profileCompletion: this.getProfileCompletion(
            this.data.nickName,
            avatarUrl,
            this.data.contact_value
          )
        })

        this.showToast('头像已更新')
      },
      fail: err => {
        console.log(err)
        this.showToast('头像保存失败')
      },
      complete: () => {
        this.finishAvatarSaving()
      }
    })
  },

  finishAvatarSaving: function () {
    wx.hideLoading()
    this.setData({
      isAvatarSaving: false
    })
  },

  Setting: function () {
    wx.showActionSheet({
      itemList: ['修改头像', '修改密码', '修改联系方式', '后台管理', '刷新档案', '查看提示', '退出登录'],
      success: res => {
        if (res.tapIndex === 0) {
          this.changeAvatar()
          return
        }

        if (res.tapIndex === 1) {
          this.goChangePassword()
          return
        }

        if (res.tapIndex === 2) {
          this.goModifyContact()
          return
        }

        if (res.tapIndex === 3) {
          this.goAdminConsole()
          this.showToast('档案已刷新')
          return
        }

        if (res.tapIndex === 4) {
          this.showArchiveGuide()
          return
        }

        this.Logout()
      }
    })
  },

  Setting: function () {
    wx.showActionSheet({
      itemList: ['修改头像', '修改密码', '修改联系方式', '后台管理', '刷新档案', '查看提示', '退出登录'],
      success: res => {
        if (res.tapIndex === 0) {
          this.changeAvatar()
          return
        }

        if (res.tapIndex === 1) {
          this.goChangePassword()
          return
        }

        if (res.tapIndex === 2) {
          this.goModifyContact()
          return
        }

        if (res.tapIndex === 3) {
          this.goAdminConsole()
          return
        }

        if (res.tapIndex === 4) {
          this.loadData()
          this.showToast('档案已刷新')
          return
        }

        if (res.tapIndex === 5) {
          this.showArchiveGuide()
          return
        }

        this.Logout()
      }
    })
  },

  Logout: function () {
    wx.request({
      url: app.globalData.serverName + '/logout.php',
      data: {
        openid: wx.getStorageSync('openid')
      },
      method: 'GET',
      header: {
        'content-type': 'application/json'
      },
      complete: () => {
        wx.removeStorageSync('openid')
        wx.removeStorageSync('user_id')
        wx.reLaunch({
          url: '../login/login'
        })
      }
    })
  },

  onLoad: function () {
    this.ensurePasswordQuickAction()
    this.loadData()
    this.showToast('下拉可以刷新个人档案')
  },

  loadData: function (done) {
    const userId = wx.getStorageSync('user_id')

    if (!userId) {
      wx.removeStorageSync('is_admin')
      this.setData({
        userId: '',
        isGuest: true,
        isAdmin: false,
        nickName: '未登录用户',
        avatarUrl: DEFAULT_AVATAR,
        contact_type: '联系方式',
        contact_value: '登录后可查看',
        contactStatus: '待登录',
        avatarStatus: '默认头像',
        listofitem: [],
        profileCompletion: 0,
        archiveBadge: '访客模式',
        statsCards: this.getStatsCards([]),
        quickActions: this.buildQuickActions(false, true)
      })
      if (done) {
        done()
      }
      return
    }

    this.setData({
      userId: String(userId),
      isGuest: false,
      quickActions: this.buildQuickActions(false, false)
    })

    this.getCurrentUserInfo(userId, done)
    this.getPublishOfMine(userId)
  },

  messageDelete: function (e) {
    const publishId = e.currentTarget.dataset.publishId

    wx.showActionSheet({
      itemList: ['确认删除'],
      success: res => {
        if (res.tapIndex === 0) {
          this.deleteSingleMessageById(publishId)
        }
      }
    })
  },

  deleteSingleMessageById: function (publishId) {
    wx.request({
      url: app.globalData.serverName + '/myinfo/delete_publish.php',
      data: {
        publish_id: publishId
      },
      method: 'GET',
      header: {
        'content-type': 'application/json'
      },
      success: res => {
        if (res.data === 'true') {
          this.loadData()
          return
        }

        this.showToast('删除失败，请稍后重试')
      },
      fail: err => {
        console.log(err)
        this.showToast('后端连接失败')
      }
    })
  },

  onShow: function () {
    this.loadData()
  },

  getCurrentUserInfo: function (userId, done) {
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
        const nickName = res.data.nickName || '未设置昵称'
        const avatarUrl = res.data.avatarUrl || DEFAULT_AVATAR
        const contactType = res.data.contact_type || '联系方式'
        const contactValue = res.data.contact_value || '未设置'

        this.setData({
          nickName: nickName,
          avatarUrl: avatarUrl,
          contact_type: contactType,
          contact_value: contactValue,
          contactStatus: contactValue === '未设置' ? '待完善' : '已完善',
          avatarStatus: avatarUrl === DEFAULT_AVATAR ? '默认头像' : '已设置',
          profileCompletion: this.getProfileCompletion(
            nickName,
            avatarUrl,
            contactValue
          )
        })
      },
      complete: () => {
        if (done) {
          done()
        }
      }
    })
  },

  ensurePasswordQuickAction: function (isAdmin) {
    const adminEnabled = typeof isAdmin === 'boolean' ? isAdmin : !!this.data.isAdmin
    const quickActions = (this.data.quickActions || []).filter(item => {
      return item && item.id !== 'password' && item.id !== 'admin'
    })

    const passwordAction = {
      id: 'password',
      title: '修改密码',
      desc: '更新登录密码，并同步到数据库'
    }
    const adminAction = {
      id: 'admin',
      title: '后台管理',
      desc: '仅限管理员查看和处理帖子、用户'
    }
    const contactIndex = quickActions.findIndex(item => item && item.id === 'contact')
    const avatarIndex = quickActions.findIndex(item => item && item.id === 'avatar')

    if (contactIndex === -1) {
      quickActions.unshift(passwordAction)
    } else {
      quickActions.splice(contactIndex + 1, 0, passwordAction)
    }

    if (adminEnabled) {
      if (avatarIndex === -1) {
        quickActions.unshift(adminAction)
      } else {
        quickActions.splice(avatarIndex + 1, 0, adminAction)
      }
    }

    this.setData({
      quickActions: quickActions
    })
  },

  goAdminConsole: function () {
    const isAdmin = !!this.data.isAdmin || !!wx.getStorageSync('is_admin')

    if (!isAdmin) {
      this.showToast('仅管理员可进入后台管理')
      return
    }

    wx.navigateTo({
      url: '../test/index'
    })
  },

  buildSettingsActions: function () {
    if (this.data.isGuest) {
      return [
        { id: 'login', label: '立即登录' },
        { id: 'guide', label: '查看提示' }
      ]
    }
    const actions = [
      { id: 'name', label: '修改名字' },
      { id: 'avatar', label: '修改头像' },
      { id: 'password', label: '修改密码' },
      { id: 'contact', label: '修改联系方式' }
    ]

    if (this.data.isAdmin) {
      actions.push({ id: 'admin', label: '后台管理' })
    }

    actions.push(
      { id: 'refresh', label: '刷新档案' },
      { id: 'guide', label: '查看提示' },
      { id: 'logout', label: '退出登录' }
    )

    return actions
  },

  handleSettingAction: function (actionId) {
    if (actionId === 'login') {
      this.goLogin()
      return
    }

    if (actionId === 'name') {
      this.goModifyName()
      return
    }

    if (actionId === 'avatar') {
      this.changeAvatar()
      return
    }

    if (actionId === 'password') {
      this.goChangePassword()
      return
    }

    if (actionId === 'contact') {
      this.goModifyContact()
      return
    }

    if (actionId === 'admin') {
      this.goAdminConsole()
      return
    }

    if (actionId === 'refresh') {
      this.loadData()
      this.showToast('档案已刷新')
      return
    }

    if (actionId === 'guide') {
      this.showArchiveGuide()
      return
    }

    this.Logout()
  },

  Setting: function () {
    const actions = this.buildSettingsActions()

    wx.showActionSheet({
      itemList: actions.map(item => item.label),
      success: res => {
        const action = actions[res.tapIndex]

        if (!action) {
          return
        }

        this.handleSettingAction(action.id)
      }
    })
  },

  Logout: function () {
    wx.request({
      url: app.globalData.serverName + '/logout.php',
      data: {
        openid: wx.getStorageSync('openid')
      },
      method: 'GET',
      header: {
        'content-type': 'application/json'
      },
      complete: () => {
        wx.removeStorageSync('openid')
        wx.removeStorageSync('user_id')
        wx.removeStorageSync('is_admin')
        wx.reLaunch({
          url: '../login/login'
        })
      }
    })
  },

  onLoad: function () {
    const isGuest = !wx.getStorageSync('user_id')

    this.setData({
      isGuest: isGuest,
      quickActions: this.buildQuickActions(false, isGuest)
    })
    this.showToast('下拉可以刷新个人档案')
  },

  getCurrentUserInfo: function (userId, done) {
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
        const profile = res.data || {}
        const nickName = profile.nickName || '未设置昵称'
        const avatarUrl = profile.avatarUrl || DEFAULT_AVATAR
        const contactType = profile.contact_type || '联系方式'
        const contactValue = profile.contact_value || '未设置'
        const isAdmin = !!profile.is_admin

        wx.setStorageSync('is_admin', isAdmin)

        this.setData({
          nickName: nickName,
          avatarUrl: avatarUrl,
          isAdmin: isAdmin,
          contact_type: contactType,
          contact_value: contactValue,
          contactStatus: contactValue === '未设置' ? '待完善' : '已完善',
          avatarStatus: avatarUrl === DEFAULT_AVATAR ? '默认头像' : '已设置',
          profileCompletion: this.getProfileCompletion(
            nickName,
            avatarUrl,
            contactValue
          )
        })

        this.ensurePasswordQuickAction(isAdmin)
      },
      complete: () => {
        if (done) {
          done()
        }
      }
    })
  },

  getProfileCompletion: function (nickName, avatarUrl, contactValue) {
    let score = 35

    if (nickName && nickName !== '未设置昵称') {
      score += 20
    }

    if (avatarUrl && avatarUrl !== DEFAULT_AVATAR) {
      score += 20
    }

    if (contactValue && contactValue !== '未设置') {
      score += 25
    }

    return score
  },

  getArchiveBadge: function (posts) {
    const total = posts.length

    if (total >= 6) {
      return '校园热心达人'
    }

    if (total >= 3) {
      return '线索活跃用户'
    }

    if (total >= 1) {
      return '正在积累记录'
    }

    return '新手档案'
  },

  getStatsCards: function (posts) {
    const imagePosts = posts.filter(item => item.image).length
    const latestTime = posts.length ? posts[0].sub_time : '暂无'

    return [
      { label: '发布总数', value: String(posts.length) },
      { label: '含图线索', value: String(imagePosts) },
      { label: '最近更新', value: latestTime }
    ]
  },

  getPublishOfMine: function (userId) {
    wx.request({
      url: app.globalData.serverName + '/myinfo/show_user_publishing.php',
      data: {
        user_id: userId
      },
      method: 'GET',
      header: {
        'content-type': 'application/json'
      },
      success: res => {
        const posts = normalizePosts(res.data)

        this.setData({
          listofitem: posts,
          archiveBadge: this.getArchiveBadge(posts),
          statsCards: this.getStatsCards(posts)
        })
      }
    })
  }
})
