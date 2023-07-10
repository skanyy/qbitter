// pages/sitecookie/getcookie.js
var app = getApp()
var config = require('../../config.js')
var crypto = require('../../utils/crypto.js')
var MyRequest = require('../../myRequest.js')
Page({
    data: {
        siteName: '',
        codeimgsrc: '',
        username: '',
        password: '',
        needcode: false,
        imagecode: '',
        imagehash: '',
        trysay: ''
    },
    onBack() {
        wx.navigateBack()
    },
    onUserNameInput(e) {
        this.setData({
            username: e.detail.value
        })
    },
    onPassWordInput(e) {
        this.setData({
            password: e.detail.value
        })
    },
    onImageCodeInput(e) {
        this.setData({
            imagecode: e.detail.value
        })
    },
    getSiteCookie() {
        if (!this.data.imagehash && this.data.needcode) {
            wx.showToast({
                title: '请等待验证码',
                icon: 'none'
            })
            return
        }
        wx.showLoading({
            title: '请求中..',
        })
        var codecheck = this.data.needcode ? this.data.imagecode : true
        if (this.data.username && this.data.password && codecheck) {
            var params = {
                username: this.data.username,
                password: this.data.password,
                imagestring: this.data.imagecode,
                imagehash: this.data.imagehash,
                config: this.data.siteconfig
            }
            var data = {
                params: crypto.encrypted(JSON.stringify(params))
            }
            var that = this
            MyRequest.GetServer(config.server.site_getcookie, function (res) {
                wx.hideLoading()
                if (res.success && res.data) {
                    var pages = getCurrentPages();
                    var prevPage = pages[pages.length - 2];
                    var result = "";
                    for (var key of Object.keys(res.data)) {
                        result += key + '=' + res.data[key] + ';'
                    }
                    prevPage.setData({
                        inputData: {
                            key: 'cookie',
                            value: result
                        }
                    });
                    wx.navigateBack({
                        delta: 1,
                    })
                } else {
                    wx.showModal({
                        title: '验证失败',
                        content: '验证失败，尝试过多将导致您的ip被封',
                        confirmText:'知道了',
                        showCancel:false,
                        success (res) {
                            if (res.confirm) {
                              that.getPageInfo()
                            }
                          }
                    })
                }
            }, data)
        } else {
            wx.showToast({
                title: '填写有误',
                icon: 'error'
            })
        }
    },
    getPageInfo() {
        wx.showLoading({
            title: '请稍后',
        })
        // console.log(this.data.siteconfig)
        var params = {
            config: crypto.encrypted(JSON.stringify(this.data.siteconfig))
        }
        var that = this
        MyRequest.GetServer(config.server.site_getloginpage, function (res) {
            // console.log(res)
            wx.hideLoading()
            if (res.success && res.data!="error") {
                that.setData({
                    codeimgsrc: that.data.siteconfig.host + '/' + res.data.src,
                    imagehash: res.data.hash,
                    trysay: res.data.trysay
                })
            } else {
                wx.showToast({
                    title: '登录页面获取失败',
                    icon: 'none'
                })
            }
        }, params)
    },
    onLoad(options) {
        var config = JSON.parse(decodeURIComponent(options.data))
        // console.log(config)
        this.setData({
            contentHeight: wx.getSystemInfoSync().windowHeight - app.globalData.navBarHeight,
            screenWidth: app.globalData.screenWidth,
            contentTop: app.globalData.navBarHeight,
            siteconfig: config,
            siteName: config.name,
            needcode: config.needcode == "true" || config.needcode == true
        })
        this.getPageInfo()
    },
    onShow() {

    }
})