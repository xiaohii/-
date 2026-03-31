Page({
  data: {
    list: [
      {
        id: 'location1',
        name: '教学实训楼',
        open: true,
        pages: [
          { zh: '天章楼（A楼）' },
          { zh: '天铎楼（B楼）' },
          { zh: '天工楼' },
          { zh: '天巧楼广场' },
          { zh: '天枢楼' }
        ]
      },
      {
        id: 'location2',
        name: '图文与办事点',
        open: false,
        pages: [
          { zh: '数字化校园与图文信息中心' },
          { zh: '学生事务与发展中心' },
          { zh: '一站式学生社区' },
          { zh: '图书馆' }
        ]
      },
      {
        id: 'location3',
        name: '学生生活区',
        open: false,
        pages: [
          { zh: '学生公寓' },
          { zh: '一站式学生社区' },
          { zh: '学生事务与发展中心' },
          { zh: '学生餐厅' }
        ]
      },
      {
        id: 'location4',
        name: '校门周边',
        open: false,
        pages: [
          { zh: '6号门（瑶泉路）' },
          { zh: '7号门' },
          { zh: '10号门' },
          { zh: '12号门' }
        ]
      }
    ]
  },

  kindToggle: function (e) {
    const id = e.currentTarget.id
    const list = this.data.list.map(item => {
      if (item.id === id) {
        return Object.assign({}, item, { open: !item.open })
      }
      return Object.assign({}, item, { open: false })
    })

    this.setData({
      list: list
    })
  }
})
