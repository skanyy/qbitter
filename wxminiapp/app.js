// app.js
var MyRequest = require('./myRequest.js')
var config = require('./config.js')
const crypto = require('./utils/crypto.js')

App({
    globalData: {
        startPageList: ["客户端列表", "种子列表"],
        speedViewType: ['区域', '曲线'],
        lineCharts: null,
        barCharts: null,
        pieCharts: null,
        statusBarHeight: 0,
        navBarHeight: 0, // 导航栏高度
        tabbarHeight: 0,
        menuRight: 0, // 胶囊距右方间距（方保持左、右间距一致）
        menuBottom: 0, // 胶囊距底部间距（保持底部间距一致）
        menuHeight: 0, // 胶囊高度（自定义内容可与胶囊高度保证一致）
        menuWidth: 0,
        screenWidth: 0,
        screenHeight: 0,
        contentWidth: 0,
        contentHeight: 0,
    },
    onLaunch() {
        this.initViewData()
        this.userloginLog()
        this.getRegistInfo()
        setTimeout(this.gotoDefaultPage, 300)
    },

    //获取用户注册信息
    getRegistInfo() {
        // wx.setStorageSync('userInfo', "")
        this.checkUserWxRegist(function (result) {
            // console.log(result)
            // 请求成功的话，保存最新的用户信息
            if (result.info == "registed") {
                wx.setStorageSync('userInfo', result.userInfo)
            }
        }, false)
    },

    // 检查是否显示广告
    hiddenAdView() {
        var userInfo = wx.getStorageSync('userInfo')
        if (userInfo) {
            //空则始终显示广告
            if (userInfo.closead == null) {
                return false
            } else {
                // 解决ios真机下时间显示未NaN的问题
                var close_time_to_str = userInfo.closead.replace(/-/g,'/')
                var close_time_to = new Date(close_time_to_str)
                // 小于当前时间，则视为过期，显示广告
                if (close_time_to.getTime() < new Date().getTime()) {
                    return false
                } else {
                    // 大于当前时间，说明还有效
                    return true
                }
            }
        }else{
            return false
        }

    },



    initViewData() {
        // 获取系统信息
        const systemInfo = wx.getSystemInfoSync();
        // 胶囊按钮位置信息
        const menuButtonInfo = wx.getMenuButtonBoundingClientRect();
        this.theme = systemInfo.theme //获取当前主题：light/dark
        // 导航栏高度 = 状态栏到胶囊的间距（胶囊距上距离-状态栏高度） * 2 + 胶囊高度 + 状态栏高度
        this.globalData.statusBarHeight = systemInfo.statusBarHeight;
        this.globalData.navBarHeight = (menuButtonInfo.top - systemInfo.statusBarHeight) * 2 + menuButtonInfo.height + systemInfo.statusBarHeight;
        this.globalData.menuRight = systemInfo.screenWidth - menuButtonInfo.right;
        this.globalData.menuBottom = menuButtonInfo.top - systemInfo.statusBarHeight;
        this.globalData.menuHeight = menuButtonInfo.height;
        this.globalData.menuWidth = menuButtonInfo.width;
        this.globalData.screenWidth = systemInfo.screenWidth;
        this.globalData.screenHeight = systemInfo.screenHeight;
        this.globalData.contentWidth = systemInfo.windowWidth;
        this.globalData.contentHeight = systemInfo.windowHeight;
        this.globalData.tabbarHeight = (systemInfo.screenHeight - systemInfo.windowHeight - systemInfo.statusBarHeight) * systemInfo.pixelRatio;
    },
    gotoDefaultPage() {
        //是否配置默认启动页
        var getDefaultPageIndex = wx.getStorageSync('defaultPage')
        // console.log(getDefaultPageIndex)
        if (getDefaultPageIndex) {
            var list = wx.getStorageSync('serverlist')
            var name = this.getDefaultserverConfig().name
            var index = this.getIndexFromListByName(list, name)
            // console.log("clientindex",index)
            wx.navigateTo({
                url: '/pages/main/main?index=' + index,
            })
        } else {
            wx.switchTab({
                url: '/pages/clientlist/clients',
                // url: '/pages/search/search',
            })
        }
    },
    onShareCommon() {
        return new Promise((resolve, reject) => {
            wx.showLoading({
                title: '请稍后',
            })
            var fail = {
                title: '--Qbiter--',
                desc: 'BT移动管理',
                imageUrl: '/icons/logo.png'
            }
            wx.request({
                url: config.server.host + config.client.Get_share_info,
                data: {},
                method: 'POST',
                success(e) {
                    wx.hideLoading()
                    if (e.statusCode == 200) {
                        var result = {
                            title: e.data.title,
                            desc: e.data.desc,
                            imageUrl: config.server.host + e.data.image
                            // imageUrl: '/icons/logo.png'
                        }
                        resolve(result)
                    } else {
                        reject(fail)
                    }
                },
                fail(e) {
                    wx.hideLoading()
                    reject(fail)
                },
            })
        }).catch((error) => {
            wx.hideLoading()
            console.log("onShareCommon error")
            return fail
        })
    },
    //登录日志
    userloginLog() {
        wx.login({
            success(res) {
                if (res.code) {
                    var data = {
                        jscode: res.code
                    }
                    MyRequest.GetServer(config.server.wx_log, function (e) {}, data, "GET", false);
                }
            }
        })
    },
    // 判断是否绑定了微信
    checkUserWxRegist(callBack, showloading = true) {
        wx.login({
            success(res) {
                if (res.code) {
                    if (showloading) {
                        wx.showLoading({
                            title: '绑定验证'
                        })
                    }
                    var data = {
                        jscode: res.code
                    }
                    MyRequest.GetServer(config.server.wx_registstatus, function (e) {
                        wx.hideLoading()
                        if (e.success && e.data != "error") {
                            var data = crypto.decrypted(e.data)
                            var result = JSON.parse(data)
                            if (result.length > 0) {
                                if (result[0].status == 0) {
                                    //已绑定微信的用户
                                    console.log("已绑定")
                                    //每次都更新userInfo
                                    wx.setStorageSync('userInfo', result[0])
                                    callBack({
                                        info: "registed",
                                        code: res.code,
                                        userInfo: result[0]
                                    })
                                } else if (result[0].status == 1) {
                                    //手动解绑的用户
                                    console.log("已取消了绑定")
                                    callBack({
                                        info: "cancel_regist",
                                        code: res.code
                                    })
                                }

                            } else {
                                console.log("未绑定")
                                //未绑定的用户
                                callBack({
                                    info: "not_regist",
                                    code: res.code
                                })
                            }
                        } else {
                            if (showloading) {
                                wx.showToast({
                                    title: '绑定验证失败',
                                    icon: 'none'
                                })
                            }
                            callBack({
                                info: "check_fail",
                                code: res.code
                            })
                        }
                    }, data, "GET", showloading)
                } else {
                    if (showloading) {
                        wx.showToast({
                            title: 'getcode失败',
                            icon: 'none'
                        })
                    }
                    callBack({
                        info: "get_login_code_fail"
                    })
                }
            },
            fail(e) {
                wx.hideLoading()
                if (showloading) {
                    wx.showToast({
                        title: 'wxlogin失败',
                        icon: 'none'
                    })
                }
                callBack({
                    info: "wxlogin_fail"
                })
            }
        })
    },
    //绑定微信，返回加密的openid赋值给userInfo
    registWxUser(jscode, userInfo, callBack) {
        wx.showLoading({
            title: '绑定中',
        })
        // 绑定微信信息
        MyRequest.GetServer(config.server.wx_regist, function (e) {
            wx.hideLoading()
            if (e.success && e.data != "error") {
                userInfo.openid = crypto.decrypted(e.data)
                wx.showToast({
                    title: '绑定成功',
                    icon: 'success'
                })
                callBack(true);
            } else {
                wx.showToast({
                    title: '绑定失败',
                    icon: 'error'
                })
                callBack(false);
            }
        }, {
            jscode: jscode,
            user: crypto.encrypted(JSON.stringify(userInfo))
        })
    },
    //获取默认的配置，没有默认则获取第一个
    getDefaultserverConfig() {
        var serverlist = wx.getStorageSync('serverlist')
        if (serverlist && serverlist.length > 0) {
            for (var i = 0; i < serverlist.length; i++) {
                if (serverlist[i].isdefault) return serverlist[i]
            }
            return serverlist[0]
        }
        return null
    },
    //根据客户端名字获取index
    getIndexFromListByName(list, name) {
        if (list) {
            for (var i = 0; i < list.length; i++) {
                if (list[i].name == name) return i
            }
        } else {
            return -1
        }
    },
})