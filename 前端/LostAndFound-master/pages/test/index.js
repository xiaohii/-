const app = getApp()

const DEFAULT_AVATAR = '../../images/index/icon/defaulticon.png'
const PAGE_SIZE = 20

function request(options) {
  return new Promise((resolve, reject) => {
    wx.request({
      ...options,
      success: res => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(res)
          return
        }

        reject(new Error('HTTP ' + res.statusCode))
      },
      fail: reject
    })
  })
}

function safeText(value, fallback) {
  if (value === undefined || value === null || value === '') {
    return fallback
  }

  return String(value)
}

function formatDate(value) {
  if (!value) {
    return '暂无'
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return String(value).replace('T', ' ').slice(0, 16)
  }

  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hour = String(date.getHours()).padStart(2, '0')
  const minute = String(date.getMinutes()).padStart(2, '0')

  return year + '-' + month + '-' + day + ' ' + hour + ':' + minute
}

function getPostStatusMeta(status) {
  const meta = {
    1: { label: '正常', tone: 'is-success' },
    2: { label: '待审核', tone: 'is-warning' },
    3: { label: '已删除', tone: 'is-muted' },
    4: { label: '已禁用', tone: 'is-danger' },
    5: { label: '已完成', tone: 'is-info' }
  }

  return meta[status] || { label: '未知状态', tone: 'is-muted' }
}

function getUserStatusMeta(status) {
  const meta = {
    1: { label: '正常', tone: 'is-success' },
    2: { label: '封禁', tone: 'is-danger' }
  }

  return meta[status] || { label: '未知状态', tone: 'is-muted' }
}

function getPostTypeLabel(type) {
  const map = {
    1: '失物',
    2: '招领',
    3: '普通'
  }

  return map[type] || '未分类'
}

function splitTags(tags) {
  if (!tags) {
    return []
  }

  return String(tags)
    .split(/[,\s，]+/)
    .filter(Boolean)
    .slice(0, 4)
}

function normalizePost(item) {
  const statusMeta = getPostStatusMeta(item.status)

  return {
    id: item.id,
    title: safeText(item.title, '未命名线索'),
    content: safeText(item.content, '暂无内容描述'),
    userNickname: safeText(item.userNickname, '匿名用户'),
    typeLabel: getPostTypeLabel(item.type),
    statusLabel: statusMeta.label,
    statusTone: statusMeta.tone,
    createdTime: formatDate(item.createdTime || item.updatedTime),
    heat: item.count || 0,
    comments: item.commentNum || 0,
    likes: item.likesNum || 0,
    tags: splitTags(item.tags)
  }
}

function normalizeUser(item) {
  const statusMeta = getUserStatusMeta(item.status)
  const contactParts = [
    item.phoneNumber,
    item.email,
    item.QQ,
    item.otherContacts
  ].filter(Boolean)

  return {
    id: item.id,
    nickname: safeText(item.nickname, '未设置昵称'),
    realName: safeText(item.realName, '未填写'),
    header: item.header || DEFAULT_AVATAR,
    clazz: safeText(item.clazz, '未填写班级'),
    contact: contactParts.length ? contactParts.join(' / ') : '未填写联系方式',
    integral: item.integral || 0,
    findNum: item.findNum || 0,
    lostNum: item.lostNum || 0,
    statusLabel: statusMeta.label,
    statusTone: statusMeta.tone,
    createdTime: formatDate(item.createdTime || item.updatedTime)
  }
}

function buildSummaryCards(postTotal, userTotal, activeCount, currentTab, lastUpdated) {
  return [
    {
      label: '线索总量',
      value: String(postTotal)
    },
    {
      label: '用户总量',
      value: String(userTotal)
    },
    {
      label: currentTab === 'post' ? '当前帖子' : '当前用户',
      value: String(activeCount)
    },
    {
      label: '最近刷新',
      value: lastUpdated || '--'
    }
  ]
}

Page({
  data: {
    loading: false,
    isAdmin: false,
    errorMessage: '',
    currentTab: 'post',
    searchKeyword: '',
    posts: [],
    users: [],
    filteredPosts: [],
    filteredUsers: [],
    postTotal: 0,
    userTotal: 0,
    lastUpdated: '--',
    summaryCards: buildSummaryCards(0, 0, 0, 'post', '--')
  },

  onLoad: function () {
    this.verifyAdminAccess()
  },

  onPullDownRefresh: function () {
    this.verifyAdminAccess(() => {
      wx.stopPullDownRefresh()
    })
  },

  showToast: function (title) {
    wx.showToast({
      title: title,
      icon: 'none',
      duration: 1800
    })
  },

  verifyAdminAccess: function (done) {
    const userId = wx.getStorageSync('user_id')

    if (!userId) {
      wx.redirectTo({
        url: '../login/login'
      })

      if (done) {
        done()
      }
      return
    }

    request({
      url: app.globalData.serverName + '/myinfo/get_user_info.php',
      method: 'GET',
      data: {
        user_id: userId
      },
      header: {
        'content-type': 'application/json'
      }
    })
      .then(res => {
        const isAdmin = !!(res.data && res.data.is_admin)

        wx.setStorageSync('is_admin', isAdmin)

        if (!isAdmin) {
          this.setData({
            isAdmin: false,
            errorMessage: '仅管理员可访问后台管理'
          })

          if (done) {
            done()
          }

          wx.showModal({
            title: '访问受限',
            content: '后台管理仅对管理员开放。',
            showCancel: false,
            success: () => {
              wx.redirectTo({
                url: '../myinfo/myinfo'
              })
            }
          })
          return
        }

        this.setData({
          isAdmin: true,
          errorMessage: ''
        })

        this.loadDashboard(done)
      })
      .catch(error => {
        console.log(error)
        this.setData({
          errorMessage: '管理员身份校验失败，请稍后重试'
        })

        if (done) {
          done()
        }
      })
  },

  fetchPosts: function () {
    return request({
      url: app.globalData.serverName + '/lostandfound/post/pagePost/1/' + PAGE_SIZE,
      method: 'GET',
      header: {
        'content-type': 'application/json'
      }
    }).then(res => {
      const page = res.data && res.data.data && res.data.data.list ? res.data.data.list : {}
      const records = page.records || []

      return {
        total: Number(page.total || records.length || 0),
        list: records.map(normalizePost)
      }
    })
  },

  fetchUsers: function () {
    return request({
      url: app.globalData.serverName + '/lostandfound/user/pageUser/1/' + PAGE_SIZE,
      method: 'GET',
      header: {
        'content-type': 'application/json'
      }
    }).then(res => {
      const page = res.data && res.data.data && res.data.data.list ? res.data.data.list : {}
      const records = page.records || []

      return {
        total: Number(page.total || records.length || 0),
        list: records.map(normalizeUser)
      }
    })
  },

  loadDashboard: function (done) {
    this.setData({
      loading: true,
      errorMessage: ''
    })

    Promise.all([this.fetchPosts(), this.fetchUsers()])
      .then(results => {
        const postsState = results[0]
        const usersState = results[1]
        const lastUpdated = formatDate(Date.now())

        this.setData({
          posts: postsState.list,
          users: usersState.list,
          postTotal: postsState.total,
          userTotal: usersState.total,
          lastUpdated: lastUpdated
        })

        this.applyFilters(this.data.searchKeyword, this.data.currentTab)
      })
      .catch(error => {
        console.log(error)
        this.setData({
          errorMessage: '管理数据加载失败，请确认后端服务已经启动。'
        })
      })
      .finally(() => {
        this.setData({
          loading: false
        })

        if (done) {
          done()
        }
      })
  },

  applyFilters: function (keyword, currentTab) {
    const searchText = (keyword || '').trim().toLowerCase()
    const posts = this.data.posts || []
    const users = this.data.users || []

    const filteredPosts = searchText
      ? posts.filter(item => {
          const haystack = [
            item.title,
            item.content,
            item.userNickname,
            item.tags.join(' ')
          ].join(' ').toLowerCase()

          return haystack.indexOf(searchText) !== -1
        })
      : posts

    const filteredUsers = searchText
      ? users.filter(item => {
          const haystack = [
            item.nickname,
            item.realName,
            item.clazz,
            item.contact
          ].join(' ').toLowerCase()

          return haystack.indexOf(searchText) !== -1
        })
      : users

    const activeCount = currentTab === 'post' ? filteredPosts.length : filteredUsers.length

    this.setData({
      filteredPosts: filteredPosts,
      filteredUsers: filteredUsers,
      summaryCards: buildSummaryCards(
        this.data.postTotal,
        this.data.userTotal,
        activeCount,
        currentTab,
        this.data.lastUpdated
      )
    })
  },

  switchTab: function (e) {
    const currentTab = e.currentTarget.dataset.tab || 'post'

    this.setData({
      currentTab: currentTab
    })

    this.applyFilters(this.data.searchKeyword, currentTab)
  },

  onSearchInput: function (e) {
    const keyword = e.detail.value || ''

    this.setData({
      searchKeyword: keyword
    })

    this.applyFilters(keyword, this.data.currentTab)
  },

  clearSearch: function () {
    this.setData({
      searchKeyword: ''
    })

    this.applyFilters('', this.data.currentTab)
  },

  handleToolTap: function (e) {
    const action = e.currentTarget.dataset.action

    if (action === 'refresh') {
      this.loadDashboard()
      this.showToast('管理数据已刷新')
      return
    }

    const target =
      action === 'copySwagger'
        ? app.globalData.serverName + '/test'
        : app.globalData.serverName + '/api-docs'

    wx.setClipboardData({
      data: target,
      success: () => {
        this.showToast('链接已复制')
      }
    })
  },

  confirmDeletePost: function (e) {
    const id = e.currentTarget.dataset.id

    wx.showModal({
      title: '删除帖子',
      content: '删除后将无法恢复，确认继续吗？',
      success: res => {
        if (res.confirm) {
          this.deleteRecord('post', id)
        }
      }
    })
  },

  confirmDeleteUser: function (e) {
    const id = e.currentTarget.dataset.id

    wx.showModal({
      title: '删除用户',
      content: '删除用户会一并清理其相关数据，确认继续吗？',
      success: res => {
        if (res.confirm) {
          this.deleteRecord('user', id)
        }
      }
    })
  },

  deleteRecord: function (type, id) {
    const label = type === 'post' ? '帖子' : '用户'
    const endpoint =
      type === 'post'
        ? app.globalData.serverName + '/lostandfound/post/' + id
        : app.globalData.serverName + '/lostandfound/user/' + id

    wx.showLoading({
      title: '处理中'
    })

    request({
      url: endpoint,
      method: 'DELETE',
      header: {
        'content-type': 'application/json'
      }
    })
      .then(res => {
        if (!res.data || !res.data.success) {
          throw new Error(label + '删除失败')
        }

        this.showToast(label + '已删除')
        this.loadDashboard()
      })
      .catch(error => {
        console.log(error)
        this.showToast(label + '删除失败，请稍后重试')
      })
      .finally(() => {
        wx.hideLoading()
      })
  }
})
