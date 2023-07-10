// pages/signlog/signlog.js
const app = getApp()
var utils = require('../../utils/util.js')
var commonConfig = require('../../config.js')
var MyRequest = require('../../myRequest.js')
const crypto = require('../../utils/crypto.js')

// 在页面中定义激励视频广告
let videoAd = null
Page({
    data: {
        daysColor: [],
        info: '你的总积分0',
        btn_text: '签到',
        today_signed: false,
        adLoadSuccess: false
    },

    // 初始化广告
    onAdInit() {
        var that = this
        // 在页面onLoad回调事件中创建激励视频广告实例
        if (wx.createRewardedVideoAd) {
            videoAd = wx.createRewardedVideoAd({
                adUnitId: 'adunit-179eddf0e41454cd'
            })
            videoAd.onLoad(() => {
                console.log('激励视频 广告加载成功')
                that.setData({
                    adLoadSuccess: true
                })
            })
            videoAd.onError((err) => {})
            videoAd.onClose((res) => {
                // 用户点击了【关闭广告】按钮
                if (res && res.isEnded) {
                    // 正常播放结束，可以下发奖励
                    that.onViewAdComplete()
                } else {
                    // 播放中途退出，不下发游戏奖励
                    // wx.showToast({
                    //   title: '取消观看',
                    //   icon:"error"
                    // })
                }
            })
        }
    },
    onLoad(options) {
        this.onAdInit()
        this.setData({
            contentWidth: wx.getSystemInfoSync().windowWidth,
            contentHeight: wx.getSystemInfoSync().windowHeight - app.globalData.navBarHeight,
            contentTop: app.globalData.navBarHeight,
        })
        this.onGetSignHistory()
    },
    onGetSignHistory() {
        var userInfo = wx.getStorageSync('userInfo')
        // console.log(userInfo)
        if (!userInfo) {
            wx.showToast({
                title: '未绑定微信',
                icon: "none"
            })
            return
        }
        this.setData({
            info: "你的总积分:" + userInfo.point
        })
        wx.showLoading({
            title: '请稍后..',
        })
        var that = this
        var params = {
            openid: crypto.encrypted(userInfo.openid)
        }
        MyRequest.GetServer(commonConfig.server.sign_history, function (result) {
            that.setData({
                triggered: false
            })
            wx.hideLoading()
            // console.log(result.data)
            if (result.success && result.data != "error" && result.data != "[]") {
                var data = JSON.parse(result.data)
                that.loadHistoryData(data)
            } else {
                wx.showToast({
                    title: "未获取到签到记录",
                    icon: "none",
                    duration:3000
                })
            }
        }, params)
    },

    loadHistoryData(data) {
        var month = new Date().getMonth() + 1
        if (month < 10) month = "0" + month
        var day = new Date().getDate()
        if (day < 10) day = "0" + day
        var today = new Date().getFullYear() + "-" + month + "-" + day
        var daysColor = [{
            date: today,
            color: "#ddd",
            background: "#1f7769"
        }]
        for (var i = 0; i < data.length; i++) {
            var time = data[i].time
            time = time.split(" ")[0]
            var badgeColor = '#1f7769'
            if (time == today) {
                badgeColor = "#ddd"
                this.setData({
                    btn_text: '今日已签',
                    today_signed: true
                })
            }
            daysColor.push({
                date: time,
                badgeColor: badgeColor
            })
        }
        this.setData({
            triggered: false,
            daysColor: daysColor
        })
    },

    onBack() {
        wx.navigateBack()
    },
    onSignIn() {
        var userInfo = wx.getStorageSync('userInfo')
        // console.log(userInfo)
        if (!userInfo) {
            wx.showToast({
                title: '未绑定微信',
                icon: "none"
            })
            return
        }
        if (this.data.today_signed) {
            if (this.data.adLoadSuccess) {
                wx.showModal({
                    title: "今天已签到",
                    content: '观看广告获取更多积分？',
                    confirmText: '看看',
                    success(res) {
                        if (res.confirm) {
                            // 用户触发广告后，显示激励视频广告
                            if (videoAd) {
                                videoAd.show().catch(() => {
                                    // 失败重试
                                    videoAd.load()
                                        .then(() => videoAd.show())
                                        .catch(err => {
                                            console.log('激励视频 广告显示失败')
                                        })
                                })
                            }
                        }
                    }
                })
            }else{
                wx.showToast({
                  title: '今日已签过',
                  icon:"none",
                  duration:3000
                })
            }
        } else {
            wx.showLoading({
                title: '签到中',
                mask: true
            })
            var that = this
            var params = {
                openid: crypto.encrypted(userInfo.openid)
            }
            MyRequest.GetServer(commonConfig.server.sign_today, function (result) {
                wx.hideLoading()
                // console.log(result)
                var title = "签到成功！"
                var iconText = "success"
                if (result.success) {
                    if (result.data == "fail") {
                        iconText = "error"
                        title = "签到失败"
                    } else {
                        wx.vibrateShort({
                            type: 'light',
                        })
                        title = title + "+" + result.data.point
                        //更新积分
                        userInfo.point = userInfo.point + result.data.point
                        wx.setStorageSync('userInfo', userInfo)
                        that.onGetSignHistory()
                    }
                } else {
                    iconText = "error"
                    title = "请求失败"
                }
                wx.showToast({
                    title: title,
                    icon: iconText
                })
            }, params)
        }
    },
    //奖励观看广告的积分
    onViewAdComplete(){
        var userInfo = wx.getStorageSync('userInfo')
        var params = {
            openid: crypto.encrypted(userInfo.openid)
        }
        var that = this
        MyRequest.GetServer(commonConfig.server.view_ad, function (result) {
            var title = "已获得"
            var iconText = "success"
            if (result.success) {
                if (result.data == "fail") {
                    iconText = "error"
                    title = "获取积分失败"
                } else {
                    title = title + "+" + result.data.point
                    //更新积分
                    userInfo.point = userInfo.point + result.data.point
                    wx.setStorageSync('userInfo', userInfo)
                    that.setData({
                        info: "你的总积分:" + userInfo.point
                    })
                }
            } else {
                iconText = "error"
                title = "请求失败"
            }
            wx.showToast({
                title: title,
                icon: iconText
            })
        }, params)
    },
    onShareAppMessage() {
        return app.onShareCommon()
    }
})