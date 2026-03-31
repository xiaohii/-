const app = getApp()

const DEFAULT_AVATAR = '../../images/index/icon/defaulticon.png'

function normalizeCommentList(list) {
  return (list || []).map((item, index) => ({
    itemKey: 'comment_' + (item.comment_id || index),
    id: item.comment_id || '',
    userId: item.user_id || '',
    nickName: item.nickName || '匿名用户',
    avatarUrl: item.avatarUrl || DEFAULT_AVATAR,
    content: item.content || '',
    time: item.submission_time || ''
  }))
}

Page({
  data: {
    publishId: '',
    username: '',
    userid: '',
    usericon: DEFAULT_AVATAR,
    text: '',
    claimPoint: '',
    comments: 0,
    likes: 0,
    image: '',
    time: '',
    imagelist: [],
    commentList: [],
    commentValue: '',
    liked: false,
    likeLoading: false,
    commentsLoading: false,
    submittingComment: false
  },

  onLoad: function (options) {
    const publishId = options.publishId || options.publishid || ''

    this.setData({
      publishId: publishId,
      username: options.username || '匿名用户',
      userid: options.userid || '',
      text: options.text || '',
      claimPoint: options.claimPoint || '',
      comments: Number(options.comments || 0),
      likes: Number(options.likes || 0),
      image: options.image || '',
      usericon: options.usericon || DEFAULT_AVATAR,
      time: options.time || '',
      imagelist: options.imagelist ? String(options.imagelist).split(',').filter(Boolean) : []
    })

    if (publishId) {
      this.loadComments()
      this.loadLikeStatus()
    }
  },

  showToast: function (title) {
    wx.showToast({
      title: title,
      icon: 'none',
      duration: 2000
    })
  },

  markFeedForRefresh: function () {
    wx.setStorageSync('feed_should_refresh', true)
  },

  photopreview: function (event) {
    const src = event.currentTarget.dataset.src
    const imgList = event.currentTarget.dataset.list
    wx.previewImage({
      current: src,
      urls: imgList
    })
  },

  bindCommentInput: function (e) {
    this.setData({
      commentValue: e.detail.value || ''
    })
  },

  loadComments: function () {
    if (!this.data.publishId) {
      return
    }

    this.setData({
      commentsLoading: true
    })

    wx.request({
      url: app.globalData.serverName + '/comments/list.php',
      data: {
        publish_id: this.data.publishId
      },
      method: 'GET',
      header: {
        'content-type': 'application/json'
      },
      success: res => {
        const response = res.data || {}
        const data = response.data || {}
        const list = normalizeCommentList(data.list)

        if (response.code !== 0) {
          this.showToast(response.msg || '评论加载失败')
          return
        }

        this.setData({
          commentList: list,
          comments: Number(data.count || list.length || 0)
        })
      },
      fail: err => {
        console.log(err)
        this.showToast('后端连接失败')
      },
      complete: () => {
        this.setData({
          commentsLoading: false
        })
      }
    })
  },

  loadLikeStatus: function () {
    if (!this.data.publishId) {
      return
    }

    const requestData = {
      publish_id: this.data.publishId
    }
    const userId = wx.getStorageSync('user_id')

    if (userId) {
      requestData.user_id = userId
    }

    wx.request({
      url: app.globalData.serverName + '/likes/status.php',
      data: requestData,
      method: 'GET',
      header: {
        'content-type': 'application/json'
      },
      success: res => {
        const response = res.data || {}
        const data = response.data || {}

        if (response.code !== 0) {
          return
        }

        this.setData({
          liked: !!data.liked,
          likes: Number(data.count || 0)
        })
      },
      fail: err => {
        console.log(err)
      }
    })
  },

  toggleLike: function () {
    const publishId = this.data.publishId
    const userId = wx.getStorageSync('user_id')

    if (!publishId) {
      this.showToast('帖子信息缺失，暂时无法点赞')
      return
    }

    if (!userId) {
      this.showToast('请先登录后再点赞')
      setTimeout(() => {
        wx.navigateTo({
          url: '../../login/login'
        })
      }, 500)
      return
    }

    if (this.data.likeLoading) {
      return
    }

    this.setData({
      likeLoading: true
    })

    wx.request({
      url: app.globalData.serverName + '/likes/toggle.php',
      data: {
        publish_id: publishId,
        user_id: userId
      },
      method: 'POST',
      header: {
        'content-type': 'application/x-www-form-urlencoded'
      },
      success: res => {
        const response = res.data || {}
        const data = response.data || {}

        if (response.code !== 0) {
          this.showToast(response.msg || '点赞失败')
          return
        }

        this.setData({
          liked: !!data.liked,
          likes: Number(data.count || 0)
        })
        this.markFeedForRefresh()
        this.showToast(data.liked ? '已点赞' : '已取消点赞')
      },
      fail: err => {
        console.log(err)
        this.showToast('后端连接失败')
      },
      complete: () => {
        this.setData({
          likeLoading: false
        })
      }
    })
  },

  submitComment: function () {
    const publishId = this.data.publishId
    const userId = wx.getStorageSync('user_id')
    const content = (this.data.commentValue || '').trim()

    if (!publishId) {
      this.showToast('帖子信息缺失，暂时无法评论')
      return
    }

    if (!userId) {
      this.showToast('请先登录后再评论')
      setTimeout(() => {
        wx.navigateTo({
          url: '../../login/login'
        })
      }, 500)
      return
    }

    if (!content) {
      this.showToast('请输入评论内容')
      return
    }

    if (this.data.submittingComment) {
      return
    }

    this.setData({
      submittingComment: true
    })

    wx.request({
      url: app.globalData.serverName + '/comments/add.php',
      data: {
        publish_id: publishId,
        user_id: userId,
        content: content
      },
      method: 'POST',
      header: {
        'content-type': 'application/x-www-form-urlencoded'
      },
      success: res => {
        const response = res.data || {}
        const data = response.data || {}

        if (response.code !== 0) {
          this.showToast(response.msg || '发表评论失败')
          return
        }

        this.setData({
          commentValue: '',
          comments: Number(data.count || (this.data.comments + 1))
        })
        this.markFeedForRefresh()
        this.showToast('评论成功')
        this.loadComments()
      },
      fail: err => {
        console.log(err)
        this.showToast('后端连接失败')
      },
      complete: () => {
        this.setData({
          submittingComment: false
        })
      }
    })
  }
})
