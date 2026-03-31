const app = getApp()
const DEFAULT_AVATAR = '../../images/index/icon/defaulticon.png'

function normalizePosts(data) {
  return (data || []).map(item => ({
    username: item.nickName || '匿名用户',
    text: item.msg || '',
    claimPoint: item.claim_point || '',
    image: item.image_exist === '1' && item.image_url && item.image_url.length > 0 ? item.image_url[0] : '',
    imagelist: item.image_url || [],
    usericon: item.avatarUrl || DEFAULT_AVATAR,
    sub_time: item.submission_time ? item.submission_time.substring(5, item.submission_time.length - 3) : '',
    publish_id: item.publish_id
  }))
}

Page({
  data: {
    userid: '',
    nickName: '用户',
    avatarUrl: DEFAULT_AVATAR,
    contact_type: '联系方式',
    contact_value: '未设置',
    listofitem: []
  },

  onLoad: function (options) {
    const userId = options.userid
    this.setData({
      userid: userId
    })
    this.getCurrentUserInfo(userId)
    this.getPublishOfUser(userId)
  },

  photopreview: function (event) {
    const src = event.currentTarget.dataset.src
    const imgList = event.currentTarget.dataset.list
    wx.previewImage({
      current: src,
      urls: imgList
    })
  },

  getCurrentUserInfo: function (userId) {
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
        this.setData({
          nickName: res.data.nickName || '用户',
          avatarUrl: res.data.avatarUrl || DEFAULT_AVATAR,
          contact_type: res.data.contact_type || '联系方式',
          contact_value: res.data.contact_value || '未设置'
        })
      }
    })
  },

  getPublishOfUser: function (userId) {
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
        this.setData({
          listofitem: normalizePosts(res.data)
        })
      }
    })
  }
})
