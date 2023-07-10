// pages/setting/setting.js
const app = getApp()
var MyRequest = require('../../myRequest.js')
const crypto = require('../../utils/crypto.js')
const config = require('../../config.js')
Page({

    /**
     * 页面的初始数据
     */
    data: {
        contentHeight: 0,
        contentTop: 120,
        main_title: '设置',
        // canIUseOpenData:wx.canIUse('open-data.type.userAvatarUrl') && wx.canIUse('open-data.type.userNickName'),
        canIuseOpenData: false,
        user_avatar_src: '/icons/unlogin.svg',
        usernick: '微信绑定',
        userinfotip: "正在获取绑定状态",
        userInfo: {},
        my_nav_height: 0,
        list: [],
        triggered: false,
        isChecking: false,
        myRequest: "",
        close_ad_detail:'未生效'
    },
    gotoSysSet() {
        wx.navigateTo({
            url: '/pages/sysset/set',
        })
    },
    gotoHelp() {
        wx.navigateTo({
            url: '/pages/about/about?type=help',
        })
    },
    gotoAbout() {
        wx.navigateTo({
            url: '/pages/about/about',
        })
    },
    closeAd() {
        wx.navigateTo({
            url: '/pages/about/about?type=closead',
        })
    },

    downFromServer(userInfo) {
        wx.showLoading({
            title: '请稍后',
            mask: true
        })
        MyRequest.GetServer(config.server.wx_down_config, function (result) {
            wx.hideLoading()
            if (result.success && result.data != 'error') {
                try {
                    var config = JSON.parse(result.data)
                    config = crypto.decrypted(config[0])
                    config = JSON.parse(config)
                    wx.setStorageSync('serverlist', config.serverlist)
                    wx.setStorageSync('sitelist', config.sitelist)
                    wx.showToast({
                        title: '还原成功',
                        icon: 'success'
                    })
                } catch (e) {
                    wx.showToast({
                        title: '还原失败',
                        icon: 'error'
                    })
                }
            } else {
                wx.showToast({
                    title: '还原失败',
                    icon: 'error'
                })
            }
        }, {
            openid: crypto.encrypted(userInfo.openid)
        })
    },

    backToServer(userInfo, callBack) {
        var userInfo = wx.getStorageSync('userInfo')
        var userServerList = wx.getStorageSync('serverlist')
        var userSiteList = wx.getStorageSync("sitelist")
        var data = {
            openid: userInfo.openid,
            serverlist: userServerList,
            sitelist: userSiteList
        }
        wx.showLoading({
            title: '正在备份',
            mask: true
        })
        MyRequest.GetServer(config.server.wx_save_config, function (result) {
            wx.hideLoading()
            if (result.success && result.data != "error") {
                wx.showToast({
                    title: '备份成功',
                    icon: "success"
                })
            } else {
                wx.showToast({
                    title: '备份失败',
                    icon: "error"
                })
            }
        }, {
            data: crypto.encrypted(JSON.stringify(data))
        })
    },

    syncConfig() {
        var that = this
        var userInfo = wx.getStorageSync('userInfo')
        if (userInfo) {
            wx.showActionSheet({
                itemList: ['↑备份配置到服务器', '↓从服务器还原配置'],
                success(res) {
                    if (res.tapIndex == 0) {
                        wx.showModal({
                            title:'提示',
                            content:'将覆盖服务器上次的备份，是否继续？',
                            confirmText:'继续',
                            success(res){
                                if(res.confirm){
                                    that.backToServer(userInfo)
                                }
                            }
                        })
                    } else if (res.tapIndex == 1) {
                        wx.showModal({
                            title:'确定还原？',
                            content:'从服务器还原则会覆盖当前配置，是否继续？',
                            confirmText:'继续',
                            success(res){
                                if(res.confirm){
                                    that.downFromServer(userInfo)
                                }
                            }
                        })
                    }
                }
            })
        } else {
            wx.showModal({
                title: '请先绑定微信',
                content: '该功能需要您绑定微信后使用',
                confirmText: '现在绑定',
                success(res) {
                    if (res.confirm) {
                        that.OnUserInfoTap(null)
                    }
                }
            })
        }

    },
    OnUserInfoTap(e) {
        if (this._isChecking) {
            this.setData({
                userinfotip: '请稍后...'
            })
            return
        }
        var userinfo = wx.getStorageSync('userInfo')
        if (userinfo) {
            var that = this
            wx.showActionSheet({
                alertText: '已绑定',
                itemList: ['解绑'],
                success(res) {
                    if (res.tapIndex == 0) {
                        wx.showModal({
                            title: '提示',
                            content: '确定解绑吗？',
                            success(result) {
                                if (result.confirm) {
                                    //更新服务器数据
                                    MyRequest.GetServer(config.server.wx_unregist, function (result) {
                                        if (result.success && result.data != 'error') {
                                            //解绑后清空本地保存的数据
                                            wx.setStorageSync('userInfo', "")
                                            that.setData({
                                                user_avatar_src: '/icons/unlogin.svg',
                                                usernick: '微信绑定',
                                                userinfotip: "绑定体验更多功能",
                                            })
                                        } else {
                                            wx.showToast({
                                                title: '解绑失败',
                                                icon: 'error',
                                                duration: 2000
                                            })
                                        }
                                    }, {
                                        userinfo: crypto.encrypted(JSON.stringify(userinfo))
                                    })
                                }
                            }
                        })
                    }
                }
            })
        } else {
            var that = this
            wx.getUserProfile({
                desc: '绑定微信享受更多', // 声明获取用户个人信息后的用途，后续会展示在弹窗中，请谨慎填写
                success: (res) => {
                    
                    //这里不包含openid
                    var userInfo = res.userInfo
                    //绑定个人信息
                    wx.login({
                        success(res) {
                            // console.log(res)
                            if (res.code) {
                                //这里服务器返回openid
                                app.registWxUser(res.code, userInfo, function (result) {
                                    if (result) {
                                        // console.log(result)
                                        //匹配一下大小写的问题
                                        userInfo.nickname = userInfo.nickName
                                        userInfo.avatarurl = userInfo.avatarUrl
                                        that.setUserInfo(userInfo)
                                        that.checkUserRegistStatus()
                                    }
                                })
                            }
                        }
                    })
                }
            })
        }
    },
    /**
     * 生命周期函数--监听页面加载
     */
    onLoad: function (options) {
        this.setData({
            contentHeight: wx.getSystemInfoSync().windowHeight - 120,
            contentTop: 120,
        })
    },
    onShow:function(){
        this.checkUserRegistStatus()
    },
    checkUserRegistStatus() {
        if (this._isChecking) return
        this._isChecking = true
        var userInfo = wx.getStorageSync('userInfo')
        if (userInfo) {
            this.setUserInfo(userInfo)
            // this._isChecking = false
            // return
        }
        //没有缓存数据，则验证绑定状态数据
        var that = this
        app.checkUserWxRegist(function (result) {
            that._isChecking = false
            if (result.info == "registed") {
                that.setUserInfo(result.userInfo)
            } else if (result.info == "not_regist") {
                that.setData({
                    userinfotip: '绑定体验更多功能'
                })
            } else {
                that.setData({
                    userinfotip: '点击头像重新绑定'
                })
            }
        }, false)
    },
    setUserInfo(userInfo) {
        // console.log('setuserinfo:',userInfo)
        this.setData({
            userInfo: userInfo,
            usernick: userInfo.nickname,
            user_avatar_src: userInfo.avatarurl,
            userinfotip: "签到 | 积分:"+(userInfo.point?userInfo.point:'点击查看'),
            close_ad_detail:userInfo.closead?("有效期至"+userInfo.closead):'未生效'
        })
        wx.setStorageSync('userInfo', userInfo)
    },
    OnUserSignLog(){
        wx.navigateTo({
          url: '/pages/signlog/signlog',
        })
    },
    onShareAppMessage: function () {
        return app.onShareCommon()
    },
    //用户的免广告有效期
    onPersonalInfo(){
        var that = this
        app.checkUserWxRegist(function(result){
            that.setData({
                close_ad_detail:result.userInfo.closead?("有效期至"+result.userInfo.closead):'未生效'
            })
        },false)
    }
})