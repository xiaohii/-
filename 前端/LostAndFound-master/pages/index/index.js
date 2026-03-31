const app = getApp()

const DEFAULT_HEADER = {
  header: ' ',
  itemKey: 'header'
}

const DEFAULT_CATEGORIES = ['全部', '校园卡', '雨伞', '钱包']

Page({
  data: {
    check: true,
    type_t: 'found',
    swiper_url: [
      '../../images/index/swiper/1.jpg',
      '../../images/index/swiper/2p.jpg',
      '../../images/index/swiper/3.jpeg',
      '../../images/index/swiper/4.jpg'
    ],
    listofitem: [DEFAULT_HEADER],
    listfound: [DEFAULT_HEADER],
    listlost: [DEFAULT_HEADER],
    cur_type: DEFAULT_CATEGORIES[0],
    activeIndex: 1,
    duration: 2000,
    indicatorDots: true,
    autoplay: true,
    interval: 3000,
    actionSheetHidden: true,
    actionSheetItems: DEFAULT_CATEGORIES,
    publish_data: []
  },

  search: function () {
    wx.navigateTo({
      url: '../search/search'
    })
  },

  selectCategory: function (e) {
    const category = e.currentTarget.dataset.category
    this.setData({
      actionSheetHidden: true,
      cur_type: category,
      listofitem: []
    })
    this.showPublishInfos(this.data.type_t, category, this)
  },

  actionSheetTap: function () {
    this.setData({
      actionSheetHidden: !this.data.actionSheetHidden
    })
  },

  actionSheetChange: function () {
    this.setData({
      actionSheetHidden: !this.data.actionSheetHidden
    })
  },

  refresh: function () {
    this.resetLists()
    this.setData({
      listofitem: this.data.activeIndex === 1 ? this.data.listfound : this.data.listlost,
      cur_type: this.data.actionSheetItems[0]
    })
    this.showPublishInfos(this.data.type_t, this.data.actionSheetItems[0], this)
  },

  stateswitch: function (e) {
    const typeIndex = Number(e.currentTarget.dataset.index || 0)
    const typeText = typeIndex === 0 ? 'lost' : 'found'
    this.setData({
      listofitem: typeIndex === 0 ? this.data.listlost : this.data.listfound,
      activeIndex: typeIndex,
      type_t: typeText,
      cur_type: this.data.actionSheetItems[0]
    })
    this.showPublishInfos(typeText, this.data.actionSheetItems[0], this)
  },

  bindViewTap: function () {},

  resetLists: function () {
    this.setData({
      listfound: [Object.assign({}, DEFAULT_HEADER)],
      listlost: [Object.assign({}, DEFAULT_HEADER)]
    })
  },

  Loadmsg: function () {
    const listfound = [Object.assign({}, DEFAULT_HEADER)]
    const listlost = [Object.assign({}, DEFAULT_HEADER)]
    const publishData = this.data.publish_data || []

    for (let i = 0; i < publishData.length; i++) {
      const item = publishData[i]
      const entry = {
        itemKey: 'publish_' + (item.publish_id || i),
        publishId: item.publish_id,
        userid: item.user_id,
        username: item.nickName || '匿名用户',
        text: item.msg || '',
        claimPoint: item.claim_point || '',
        comments: Number(item.comment_num || 0),
        likes: Number(item.likes_num || 0),
        imagelist: item.image_url || [],
        image: item.image_exist === '1' && item.image_url && item.image_url.length > 0 ? item.image_url[0] : '',
        usericon: item.avatarUrl || '../../images/index/icon/defaulticon.png',
        sub_time: item.submission_time ? item.submission_time.substring(5, item.submission_time.length - 3) : ''
      }

      if (item.type === 'found') {
        listfound.push(entry)
      } else {
        listlost.push(entry)
      }
    }

    this.setData({
      listfound: listfound,
      listlost: listlost,
      listofitem: this.data.activeIndex === 1 ? listfound : listlost
    })
  },

  onPullDownRefresh: function () {
    this.refresh()
    wx.stopPullDownRefresh()
  },

  photopreview: function (event) {
    const src = event.currentTarget.dataset.src
    const imgList = event.currentTarget.dataset.list
    wx.previewImage({
      current: src,
      urls: imgList
    })
  },

  syncPublishPermission: function (userId) {
    if (!userId) {
      this.setData({
        check: true
      })
      return
    }

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
        const canPublish = profile.can_publish !== false

        this.setData({
          check: canPublish
        })

        if (!canPublish) {
          wx.showToast({
            title: '当前账号状态不可发布信息',
            icon: 'none',
            duration: 2000
          })
        }
      },
      fail: err => {
        console.log(err)
        this.setData({
          check: true
        })
      }
    })
  },

  onLoad: function () {
    const userId = wx.getStorageSync('user_id')
    const categories = app.globalData.categories && app.globalData.categories.length
      ? app.globalData.categories
      : DEFAULT_CATEGORIES

    this.resetLists()
    this.setData({
      actionSheetItems: categories,
      cur_type: categories[0],
      listofitem: this.data.activeIndex === 1 ? this.data.listfound : this.data.listlost
    })

    this.syncPublishPermission(userId)
    this.showPublishInfos('found', categories[0], this)
  },

  onShow: function () {
    const shouldRefresh = wx.getStorageSync('feed_should_refresh')
    const userId = wx.getStorageSync('user_id')

    this.syncPublishPermission(userId)

    if (!shouldRefresh) {
      return
    }

    wx.removeStorageSync('feed_should_refresh')
    this.showPublishInfos(this.data.type_t, this.data.cur_type, this)
  },

  isAllCategory: function (category, obj) {
    const allCategory = obj && obj.data && obj.data.actionSheetItems && obj.data.actionSheetItems.length > 0
      ? obj.data.actionSheetItems[0]
      : DEFAULT_CATEGORIES[0]
    return !category || category === allCategory || category === 'all' || category === 'ALL'
  },

  showPublishInfos: function (type_t, category, obj) {
    const requestData = {
      type: type_t
    }

    if (!this.isAllCategory(category, obj)) {
      requestData.category = category
    }

    wx.request({
      url: app.globalData.serverName + '/index/show.php',
      data: requestData,
      method: 'GET',
      header: {
        'content-type': 'application/json'
      },
      success: function (res) {
        obj.setData({
          publish_data: (res.data && res.data.data) || []
        })
        obj.Loadmsg()
      },
      fail: function (err) {
        console.log(err)
        wx.showToast({
          title: '后端连接失败',
          icon: 'none',
          duration: 2000
        })
      }
    })
  }
})
