// pages/clientlist/clients.js
var utils = require('../../utils/util.js')
const app = getApp()
Page({
    data: {
        sub_title:'',
        main_title: 'Qbiter',
        list: [],
        triggered: false
    },
    onAddServerEvent() {
        wx.navigateTo({
            url: '/pages/qblogin/qblogin',
        })
    },
    onLoad: function (options) {
        this.setData({
            contentHeight: wx.getSystemInfoSync().windowHeight - app.globalData.navBarHeight,
            contentTop: app.globalData.navBarHeight,
        })
    },
    onShow: function () {
        this.getServerList()
    },
    onRefresh() {
        this.getServerList()
    },

    getServerList() {
        if (this._freshing) return
        this._freshing = true

        var list = wx.getStorageSync('serverlist')
        //从旧版本升级过来，需把旧数据匹配到新版本，内网，外网字段
        for (var i = 0; i < list.length; i++) {
            if (list[i].host != "") {
                if (list[i].islocal == true) {
                    list[i].innerhost = list[i].host
                    list[i].outerhost = ""
                } else {
                    list[i].outerhost = list[i].host
                    list[i].innerhost = ""
                }
            }
        }
        this.setData({
            list: list,
            triggered: false
        })
        this._freshing = false
    },
    onLongPress(e) {
        var item = e.currentTarget.dataset.item
        var that = this;
        wx.showActionSheet({
            alertText: "提示",
            itemList: ['设为默认', '编辑', '移除'],
            success(res) {
                var list = wx.getStorageSync('serverlist')
                var index = app.getIndexFromListByName(list, item.name)
                // console.log(index)
                if (res.tapIndex == 0) {
                    for (var i = 0; i < list.length; i++) {
                        if (index == i) {
                            list[i].isdefault = true
                        } else {
                            list[i].isdefault = false
                        }
                    }
                    wx.setStorageSync('serverlist', list)
                    that.getServerList()
                } else if (res.tapIndex == 1) {
                    wx.navigateTo({
                        url: '/pages/qblogin/qblogin?index=' + index
                    })
                } else if (res.tapIndex == 2) {
                    wx.showModal({
                        title: '注意',
                        content: '确认移除客户端[' + item.name + ']?',
                        success(res) {
                            if (res.confirm) {
                                list.splice(index, 1)
                                if (list.length <= 0) {
                                    wx.removeStorageSync('serverlist')
                                } else {
                                    wx.setStorageSync('serverlist', list)
                                }
                                that.getServerList()
                            }
                        }
                    })
                }
            },
        })
    },
    gotoTorrentsDetail(e) {
        var item = e.currentTarget.dataset.item
        var list = wx.getStorageSync('serverlist')
        var index = app.getIndexFromListByName(list, item.name)
        wx.navigateTo({
            url: '/pages/main/main?index=' + index,
        })
    },
    gotoClientDetail(e) {
        var item = e.currentTarget.dataset.item
        var list = wx.getStorageSync('serverlist')
        var index = app.getIndexFromListByName(list, item.name)
        wx.navigateTo({
            url: '/pages/clientdetail/clientdetail?index=' + index,
        })
    },
    onShareAppMessage: function () {
        return app.onShareCommon()
    }
})