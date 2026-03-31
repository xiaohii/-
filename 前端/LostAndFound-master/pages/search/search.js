const app = getApp()

Page({
  data: {
    searchs: [],
    current: '',
    listofitem: [],
    inputVal: ''
  },

  onLoad: function () {
    this.loadHistory()
  },

  bindKeyInput: function (e) {
    const value = e.detail.value || ''
    this.setData({
      current: value,
      inputVal: value
    })
  },

  showToast: function (title) {
    wx.showToast({
      title: title,
      icon: 'none',
      duration: 1800
    })
  },

  loadHistory: function () {
    const history = wx.getStorageSync('search_keywords') || []
    this.setData({
      searchs: history.map(text => ({ key: text, text: text }))
    })
  },

  saveHistory: function (keyword) {
    let history = wx.getStorageSync('search_keywords') || []
    history = history.filter(item => item !== keyword)
    history.unshift(keyword)
    history = history.slice(0, 8)
    wx.setStorageSync('search_keywords', history)
    this.loadHistory()
  },

  clearHistory: function () {
    wx.removeStorageSync('search_keywords')
    this.setData({
      searchs: []
    })
  },

  deleteItem: function (e) {
    const keyword = e.currentTarget.dataset.key
    const history = (wx.getStorageSync('search_keywords') || []).filter(item => item !== keyword)
    wx.setStorageSync('search_keywords', history)
    this.loadHistory()
  },

  reuseKeyword: function (e) {
    const keyword = e.currentTarget.dataset.key
    this.setData({
      current: keyword,
      inputVal: keyword
    })
    this.addItem()
  },

  clearInput: function () {
    this.setData({
      current: '',
      inputVal: '',
      listofitem: []
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

  addItem: function () {
    const keyword = (this.data.current || this.data.inputVal || '').trim()

    if (!keyword) {
      this.showToast('请输入搜索关键词')
      return
    }

    this.saveHistory(keyword)
    this.searchDatabase(keyword)
  },

  Loadmsg: function (searchData) {
    const result = []

    for (let i = 0; i < searchData.length; i++) {
      const item = searchData[i]
      result.push({
        itemKey: 'search_' + i + '_' + (item.publish_id || item.user_id || 'item'),
        userid: item.user_id,
        username: item.nickName || '匿名用户',
        text: item.msg || '',
        claimPoint: item.claim_point || '',
        imagelist: item.image_url || [],
        image: item.image_exist === '1' && item.image_url && item.image_url.length > 0 ? item.image_url[0] : '',
        usericon: item.avatarUrl || '../../images/index/icon/defaulticon.png',
        sub_time: item.submission_time ? item.submission_time.substring(5, item.submission_time.length - 3) : ''
      })
    }

    this.setData({
      listofitem: result
    })

    if (result.length === 0) {
      this.showToast('没有找到相关信息')
    } else {
      this.showToast('找到 ' + result.length + ' 条结果')
    }
  },

  searchDatabase: function (key) {
    wx.request({
      url: app.globalData.serverName + '/index/search.php',
      data: {
        key: key
      },
      method: 'GET',
      header: {
        'content-type': 'application/json'
      },
      success: res => {
        const raw = Array.isArray(res.data) ? res.data : ((res.data && res.data.data) || [])
        this.Loadmsg(raw)
      },
      fail: err => {
        console.log(err)
        this.showToast('后端连接失败')
      }
    })
  }
})
