const app = getApp()

const DEFAULT_CATEGORIES = ['全部', '校园卡', '雨伞', '钱包']
const DEFAULT_CLAIM_POINTS = [
  '暂不指定',
  '天章楼（A楼）',
  '天铎楼（B楼）',
  '天工楼',
  '天巧楼广场',
  '天枢楼',
  '数字化校园与图文信息中心',
  '学生事务与发展中心',
  '一站式学生社区',
  '学生公寓',
  '学生餐厅',
  '6号门（瑶泉路）',
  '7号门',
  '自定义认领点'
]

Page({
  data: {
    array: app.globalData.categories && app.globalData.categories.length
      ? app.globalData.categories
      : DEFAULT_CATEGORIES,
    category_index: 0,
    category: '',
    type_array: ['lost', 'found'],
    navbar: ['寻物启事', '失物招领'],
    currentTab: 0,
    imageList: [],
    filep: [],
    claimPointOptions: DEFAULT_CLAIM_POINTS,
    claimPointIndex: 0,
    claimPointCustom: '',
    editorTitles: ['发布寻物启事', '发布失物招领'],
    editorDescriptions: [
      '请尽量写清遗失时间、地点、物品特征与联系方式。',
      '请写清拾取地点、时间与认领方式，帮助失主快速确认。'
    ],
    editorPlaceholders: [
      '例如：今天中午在第二食堂附近遗失了一张校园卡，卡套是深绿色的。',
      '例如：在图书馆门口拾到一把黑色折叠伞，可描述伞柄细节后认领。'
    ],
    claimPointTitles: ['希望交接点', '认领点设置'],
    claimPointHints: [
      '如果希望在固定地点交接，可以提前写明，方便热心同学联系你。',
      '可选择常见认领点，或填写自定义地点，方便失主前往确认。'
    ]
  },

  onLoad: function () {
    const categories = this.data.array
    this.setData({
      category: categories[0] || DEFAULT_CATEGORIES[0]
    })
  },

  navbarTap: function (e) {
    this.setData({
      currentTab: Number(e.currentTarget.dataset.idx || 0)
    })
  },

  resetFormState: function () {
    this.setData({
      imageList: [],
      filep: [],
      category_index: 0,
      category: this.data.array[0] || DEFAULT_CATEGORIES[0],
      claimPointIndex: 0,
      claimPointCustom: ''
    })
  },

  chooseImage: function () {
    const remainCount = 3 - this.data.imageList.length

    if (remainCount <= 0) {
      wx.showToast({
        title: '最多上传 3 张图片',
        icon: 'none'
      })
      return
    }

    wx.chooseImage({
      count: remainCount,
      success: res => {
        const merged = this.data.imageList.concat(res.tempFilePaths || []).slice(0, 3)
        this.setData({
          imageList: merged,
          filep: merged
        })
      }
    })
  },

  previewImage: function (e) {
    const current = e.target.dataset.src
    wx.previewImage({
      current: current,
      urls: this.data.imageList
    })
  },

  bindPickerChange: function (e) {
    const index = Number(e.detail.value || 0)
    this.setData({
      category_index: index,
      category: this.data.array[index]
    })
  },

  bindClaimPointChange: function (e) {
    const index = Number(e.detail.value || 0)
    this.setData({
      claimPointIndex: index
    })
  },

  bindClaimPointInput: function (e) {
    this.setData({
      claimPointCustom: (e.detail.value || '').trim()
    })
  },

  getResolvedClaimPoint: function () {
    const options = this.data.claimPointOptions || DEFAULT_CLAIM_POINTS
    const selected = options[this.data.claimPointIndex] || options[0]

    if (selected === '暂不指定') {
      return ''
    }

    if (selected === '自定义认领点') {
      return (this.data.claimPointCustom || '').trim()
    }

    return selected
  },

  formReset: function () {
    this.resetFormState()
  },

  formSubmit: function (e) {
    const userId = wx.getStorageSync('user_id')
    const type = this.data.type_array[this.data.currentTab]
    const category = this.data.category || this.data.array[0] || DEFAULT_CATEGORIES[0]
    const msg = (e.detail.value.input || '').trim()
    const imagesPaths = this.data.filep || []
    const claimPoint = this.getResolvedClaimPoint()

    if (!userId) {
      wx.showToast({
        title: '请先登录后再发布',
        icon: 'none',
        duration: 2000
      })
      return
    }

    if (!msg) {
      wx.showToast({
        title: '请先填写内容',
        icon: 'none',
        duration: 2000
      })
      return
    }

    if (
      (this.data.claimPointOptions[this.data.claimPointIndex] || '') === '自定义认领点' &&
      !claimPoint
    ) {
      wx.showToast({
        title: '请填写自定义认领点',
        icon: 'none',
        duration: 2000
      })
      return
    }

    this.uploadAll(userId, type, category, msg, imagesPaths, claimPoint)
  },

  uploadAll: function (userId, type, category, msg, imagesPaths, claimPoint) {
    wx.request({
      url: app.globalData.serverName + '/edit/edit.php',
      data: {
        user_id: userId,
        type_t: type,
        category: category,
        title: '',
        msg: msg,
        claim_point: claimPoint,
        image_exist: 0
      },
      method: 'GET',
      header: {
        'content-type': 'application/json'
      },
      success: res => {
        const response = res.data || {}

        if (response.code === -2) {
          wx.showToast({
            title: '内容包含敏感信息，请修改后重试',
            icon: 'none'
          })
          return
        }

        if (response.code !== 0 || !response.data || response.data.publish_id == null) {
          wx.showToast({
            title: response.msg || '发布失败，请稍后重试',
            icon: 'none',
            duration: 2000
          })
          return
        }

        const publishId = response.data.publish_id

        if (imagesPaths && imagesPaths.length > 0) {
          for (let i = 0; i < imagesPaths.length; i++) {
            wx.uploadFile({
              url: app.globalData.serverName + '/edit/upload.php',
              filePath: imagesPaths[i],
              name: 'file',
              formData: {
                publish_id: publishId
              }
            })
          }
        }

        wx.showToast({
          title: '发布成功',
          icon: 'success',
          duration: 1600
        })

        wx.switchTab({
          url: '../index/index'
        })
      },
      fail: err => {
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
