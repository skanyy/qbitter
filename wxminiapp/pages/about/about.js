// pages/about/about.js
const app = getApp()
var config = require('../../config.js')
var MyRequest = require('../../myRequest.js')
Page({
    data: {
        maintitle: "关于",
        info: "",
        imageList: [],
        qbInfo: "",
        apiInfo: "",
        triggered: false,
        refresher_style: 'black',
    },
    onBack() {
        wx.navigateBack({
            delta: 0,
        })
    },
    onLoad: function (options) {
        var maintitle = "关于"
        if (options.type == "help") {
            maintitle = "帮助"
        } else if (options.type == "closead") {
            maintitle = "移除广告"
        }
        this.setData({
            contentHeight: wx.getSystemInfoSync().windowHeight - app.globalData.navBarHeight,
            contentTop: app.globalData.navBarHeight,
            pagetype: options.type,
            maintitle: maintitle,
            triggered: true
        })
        this.onRefresh()
    },
    onShow() {
        // 监听主题变化
        this.onMyThemeChange(wx.getSystemInfoSync().theme)
        wx.onThemeChange((result) => {
            this.onMyThemeChange(result.theme)
        })
    },
    onMyThemeChange(result) {
        this.setData({
            refresher_style: result == "dark" ? "white" : "black"
        })
    },
    onRefresh() {
        if (this._freshing) return
        this._freshing = true
        var that = this;
        var url = config.client.Get_about_me
        if (this.data.pagetype == "help") {
            url = config.client.Get_help_info
        } else if (this.data.pagetype == "closead") {
            url = config.client.Get_close_ad_info
        }
        MyRequest.GetServer(url, function (res) {
            that._freshing = false
            that.setData({
                triggered: false
            })
            if (res.success) {
                // console.log(res)
                that.setData({
                    info: config.version_info + res.data.info,
                    imageList: res.data.image
                })
            }
        }, null, 'POST')
    },
    onImageTap(e) {
        var src = "data:image/jpg;base64," + e.currentTarget.dataset.item
        wx.previewImage({
            urls: [src],
        })
    },
    onShareAppMessage: function () {
        return app.onShareCommon()
    }
})