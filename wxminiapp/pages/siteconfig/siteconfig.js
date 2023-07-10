const app = getApp()
var util = require('../../utils/util.js')
var commonConfig = require('../../config.js')
var MyRequest = require('../../myRequest.js')
const crypto = require('../../utils/crypto.js')
Page({
    data: {
        siteName: '',
        siteHost: '',
        named: '',
        oldnamed: '',
        cookie: '',
        siteid: '',
        support_sign: true,
        isAutoSign: false,
        signTime: "10:00",
        lastsigntime: '-',
        autoSignEndTime: '未生效',
        isdefault: false,
        editName: "",
        inputData: '',
        nameInputParams: {
            "name": "站点别名",
            "key": "named",
            "placeholder": '填入别名',
            "desc": '填写别名，方便记忆'
        },
        cookieInputParams: {
            "name": "站点cookie",
            "key": "cookie",
            "istextarea": true,
            "placeholder": '请填入该站点的cookie信息',
            "desc": '电脑浏览器登录你的站点,然后按F12->应用程序->左边Cookie->对应站点->复制所有cookie信息,并填入上述输入框。最后的样子应该是这样:c_secure_login=xxxx;c_secure_tracker_ss=xxxx;c_secure_ssl=xxxx;c_secure_pass=xxxxxxxx;c_secure_uid=xxxx;'
        },
        siteidInputParams: {
            "name": "站点账号",
            "key": "siteid",
            "placeholder": '填入该站点的账户名称',
            "desc": '使用签到功能需填入该站点的账户名称,若修改，自动签到需重新激活'
        },
        supportsitesResult: "",
        showListSelect: false,
        currentConfig: "",
        sign_duration_index: 0,
        sign_duration: [
            '1个月', '2个月', '3个月', '4个月', '5个月', '半年',
        ]
    },
    onBack() {
        wx.navigateBack()
    },
    onLoad(options) {
        this.setData({
            contentHeight: wx.getSystemInfoSync().windowHeight - app.globalData.navBarHeight,
            screenWidth: app.globalData.screenWidth,
            contentTop: app.globalData.navBarHeight
        })
        //编辑情况下
        if (options.editName) {
            var config = this.getConfigByName(options.editName)
            // console.log(config)
            this.setData({
                siteName: config.name,
                siteHost: config.host,
                named: config.named,
                oldnamed: config.named,
                cookie: config.cookie,
                siteid: config.siteid,
                support_sign: config.support_sign,
                isdefault: config.isdefault,
                editName: options.editName,
                isAutoSign: config.autosign,
                signTime: config.signtime
            })
            //同时请求服务器，看看该站点是否可以自动签到了
            var that = this
            MyRequest.GetServer(commonConfig.server.site_supportlist, function (result) {
                // console.log(result)
                if (result.success && result.data != "error") {
                    for (var i = 0; i < result.data.length; i++) {
                        if (config.name == result.data[i].name) {
                            console.log(result.data[i].sign)
                            that.setData({
                                support_sign: result.data[i].sign != "unsupport" ? true : false
                            })
                            break
                        }
                    }
                }
            })
            this.setData({
                currentConfig: config,
            });
            if (config.autosign) {
                //如果打开了自动签到，则检查自动签到状态
                this.getAutoSignStatus(config)
            }
        }
    },

    onSiteListSelect(e) {
        //编辑状态下不能更改此项
        if (this.data.editName) {
            wx.showToast({
                title: '不可以编辑该项',
                icon: 'none',
                duration: 1000,
                mask: true,
            })
            return
        }
        this.getSupportSiteList()
    },
    getSupportSiteList() {
        if (this.data.supportsitesResult) {
            this.setData({
                showListSelect: true
            })
            return
        }
        wx.showLoading({
            title: "正在获取支持站点"
        })
        var that = this
        MyRequest.GetServer(commonConfig.server.site_supportlist, function (result) {
            wx.hideLoading()
            if (result.success) {
                var temp = []
                //标记编辑状态下的勾选
                if (that.data.editName) {
                    var config = that.getConfigByName(that.data.editName)
                    for (var i = 0; i < result.data.length; i++) {
                        var item = result.data[i]
                        if (config.name == item.name) {
                            item.checked = true
                        } else {
                            item.checked = false
                        }
                        temp.push(item)
                    }
                } else {
                    temp = result.data
                }
                that.setData({
                    supportsitesResult: temp,
                    showListSelect: true
                })
            } else {
                wx.showToast({
                    title: '获取失败',
                    icon: 'error'
                })
            }
        })
    },
    onShow() {
        //填写后返回的值
        var prePageData = this.data.inputData
        if (prePageData) {
            var key = prePageData.key
            var value = prePageData.value
            if (key == 'cookie') this.setData({
                cookie: value
            })
            else if (key == 'named') this.setData({
                named: value
            })
            else if (key == 'siteid') this.setData({
                siteid: value
            })
        }
    },
    onSelectComfirm(e) {
        if (!this.data.siteName) {
            wx.showToast({
                title: '请选择',
                icon: "error"
            })
        }
    },
    // 根据网站名称获取网站配置
    getSupportSiteBySiteName(name) {
        for (var i = 0; i < this.data.supportsitesResult.length; i++) {
            var item = this.data.supportsitesResult[i]
            if (item.name == name) return item
        }
        return ""
    },
    onRadioChange(e) {
        var site = this.getSupportSiteBySiteName(e.detail.value)
        this.setData({
            siteName: e.detail.value,
            siteHost: site.host,
            support_sign: site.sign == "unsupport" ? false : true
        })
        if (site.sign == "unsupport") {
            wx.showModal({
                title: '提示',
                content: '该站点还不支持自动签到',
                confirmText: '知道了',
                showCancel: false
            })
        }
    },
    onGotoInput(e) {
        var data = e.currentTarget.dataset.item;
        if (data.key == 'cookie') data.originValue = this.data.cookie
        else if (data.key == 'named') data.originValue = this.data.named
        else if (data.key == 'siteid') data.originValue = this.data.siteid
        var params = encodeURIComponent(JSON.stringify(data))
        wx.navigateTo({
            url: '/pages/input/input?data=' + params
        })
    },
    gotoGetCookie(e) {
        this.onGotoInput(e)
        //没有有效的代理ip，暂时关闭自动获取功能，避免试错过多服务器ip被封
        // var that = this
        // wx.showActionSheet({
        //     title: '填写方式',
        //     itemList: ['通过账户信息自动获取', '手动填写'],
        //     success(res) {
        //         if (res.tapIndex == 0) {
        //             if (!that.data.siteName) {
        //                 wx.showToast({
        //                     title: '请先选择站点',
        //                     icon: "none",
        //                     duration: 1500
        //                 })
        //                 return
        //             }
        //             wx.showLoading({
        //                 title:'请稍后'
        //             })
        //             MyRequest.GetServer(commonConfig.server.site_supportlist, function (result) {
        //                 wx.hideLoading()
        //                 if (result.success) {
        //                     that.setData({
        //                         supportsitesResult: result.data
        //                     })
        //                     var site = that.getSupportSiteBySiteName(that.data.siteName)
        //                     var params = encodeURIComponent(JSON.stringify(site));
        //                     wx.navigateTo({
        //                         url: '/pages/sitecookie/getcookie?data=' + params
        //                     })
        //                 }
        //             })
        //         } else {
        //             that.onGotoInput(e)
        //         }
        //     }
        // })
    },
    //设为默认
    onSwitch(e) {
        var checked = e.detail.value
        this.setData({
            isdefault: checked
        })
    },
    //自动签到开关
    onAutoSignToggle(e) {
        var checked = e.detail.value
        this.setData({
            isAutoSign: checked
        })
        if (checked) {
            //手动打开后，检查状态
            this.getAutoSignStatus(this.data.currentConfig, false, true)
        }
    },
    //根据定义的命名获取网站配置
    getConfigByName(named, includeIndex = false) {
        var sitelist = wx.getStorageSync("sitelist")
        if (sitelist) {
            for (var i = 0; i < sitelist.length; i++) {
                var item = sitelist[i]
                if (item.named == named) {
                    if (includeIndex) return {
                        target: item,
                        index: i
                    }
                    return item
                }
            }
        }
        // 不存在
        return false
    },
    //根据站点域名获取网站配置
    getConfigByHost(sitehost) {
        var sitelist = wx.getStorageSync("sitelist")
        if (sitelist) {
            for (var i = 0; i < sitelist.length; i++) {
                var item = sitelist[i]
                if (item.host == sitehost) {
                    return item
                }
            }
        }
        // 不存在
        return false
    },
    //检查填写是否合法
    checkInputHasError() {
        if (!this.data.siteName || !util.trimAllBlank(this.data.named) || !util.trimAllBlank(this.data.cookie) || !this.data.siteHost) {
            return "请填写完整"
        }
        //编辑状态
        if (this.data.editName) {

        } else {
            //判断非编辑状态下，名称是否存在
            var target = this.getConfigByName(this.data.named)
            if (target && this.data.editName != target.named) {
                return "名称已存在"
            }
            //新增的，判断当前站点下是否重复cookie
            if (target == false) {
                var item = this.getConfigByHost(this.data.siteHost)
                if (item && item.cookie == this.data.cookie) return "站点cookie重复"
            }
        }
        return ""
    },
    //点击保存，保存前检查绑定状态和自动签到功能状态
    saveSiteConfig() {
        var check = this.checkInputHasError()
        if (check) {
            wx.showToast({
                title: check,
                icon: "error"
            })
            return
        }
        if (this.data.autoSignEndTime == '正在验证..') {
            wx.showToast({
                title: '请稍后',
                icon: 'none',
                duration: 1000,
                mask: true,
            })
            return
        }
        //开始联网验证cookie，签到状态，是否绑定
        this.readyToSaveSiteConfig()
    },

    //保存所有配置
    //先验证站点cookies是否正确，再判断是否开启自动签到，若开启，则需先判断微信是否绑定，不绑定微信不能使用自动签到
    readyToSaveSiteConfig() {
        wx.showLoading({
            title: '请稍后'
        })
        var that = this
        var params = {
            config: crypto.encrypted(JSON.stringify({
                name: this.data.siteName,
                cookie: this.data.cookie
            }))
        }
        //验证网站的cookies信息是否正确
        MyRequest.GetServer(commonConfig.server.site_checkconfig, function (res) {
            wx.hideLoading()
            // console.log(res)
            if (res.success && res.data == "ok") {
                //cookie正确再开始验证是否开启自动签到
                // 开启自动签到则先检查是否绑定微信
                if (that.data.isAutoSign) {
                    //是否绑定微信
                    that.registWxBeforeDo(function (result) {
                        //若绑定，则可以使用该功能
                        if (result) {
                            // //计算需要多少积分进行兑换
                            // var pay = (parseInt(that.data.sign_duration_index)+1)*100
                            // console.log(pay)
                            //第一次使用或者未生效的，则提示如何生效
                            if (that.data.autoSignEndTime == "未生效") {
                                wx.showModal({
                                    title: '签到功能提示',
                                    content: '自动签到功能已开启但未生效，可进官方Q群了解更多',
                                    confirmText: '我了解的',
                                    cancelText: '关闭功能',
                                    mask: true,
                                    success(e) {
                                        //关闭签到功能
                                        if (e.cancel) {
                                            that.setData({
                                                isAutoSign: false
                                            })
                                        } else {
                                            //添加新的待审核自动签到记录
                                            that.requesAutoSign()
                                        }
                                    }
                                })
                                // wx.showModal({
                                //     title: '提示',
                                //     content: '将使用'+pay+'积分兑换？(100积分/月)',
                                //     confirmText: '好的',
                                //     cancelText: '取消',
                                //     mask: true,
                                //     success(e) {
                                //         //关闭签到功能
                                //         if (e.cancel) {
                                //             // that.setData({
                                //             //     isAutoSign: false
                                //             // })
                                //         } else {
                                //             //添加新的待审核自动签到记录
                                //             that.requesAutoSign()
                                //         }
                                //     }
                                // })
                            } else {
                                //已经生效下的更新
                                that.requesAutoSign()
                            }
                        } else {
                            //不同意绑定或者绑定验证失败，关掉自动签到开关
                            wx.showModal({
                                title: '绑定验证',
                                content: '因为微信绑定失败，无法开启自动签到功能，是否关闭自动签到功能后继续保存？',
                                confirmText: '继续保存',
                                mask: true,
                                success(e) {
                                    if (e.confirm) {
                                        that.setData({
                                            isAutoSign: false
                                        })
                                        that.saveSiteConfigFinal()
                                    }
                                }
                            })
                        }
                    })
                } else {
                    //开关关闭的情况下
                    //编辑状态
                    if (that.data.editName) {
                        that.requesAutoSign()
                    } else {
                        //新建状态
                        that.saveSiteConfigFinal()
                    }
                }
            } else {
                wx.showToast({
                    title: '站点cookie验证失败',
                    icon: 'none',
                    duration: 5000
                })
            }
        }, params)
    },
    //添加自动签到请求
    requesAutoSign() {
        wx.showLoading({
            title: '请稍后',
        })
        var userInfo = wx.getStorageSync('userInfo')
        var params = {
            //用户opendid，站点域名，命名 组成唯一识别条件
            config: crypto.encrypted(JSON.stringify({
                user_id: userInfo.openid, // 用户openid，查找条件
                user_nick: userInfo.nickname, // 用户昵称
                sitehost: this.data.siteHost, // 站点域名，查找条件
                sitename: this.data.siteName, // 站点名
                customername: this.data.editName ? this.data.oldnamed : this.data.named, //站点别名，查找条件；如果是新建，取填入的值
                customername2: this.data.editName ? this.data.named : '', //新的站点别名；如果是编辑，取填入后的新值
                cookie: crypto.encrypted(this.data.cookie), //站点的cookie,二次加密
                signtime: this.data.signTime, // 签到计划时间
                running: this.data.isAutoSign //是否开启
            }))
        }
        var that = this
        //更新自动签到设置
        MyRequest.GetServer(commonConfig.server.site_applyautosign, function (result) {
            wx.hideLoading()
            console.log(result)
            that.saveSiteConfigFinal()
        }, params)
    },
    //最后把设置保存到用户文件下
    saveSiteConfigFinal() {
        var config = {
            name: this.data.siteName,
            host: this.data.siteHost,
            named: this.data.named,
            cookie: this.data.cookie,
            siteid: this.data.siteid,
            support_sign: this.data.support_sign,
            isdefault: this.data.isdefault,
            autosign: this.data.isAutoSign,
            signtime: this.data.signTime
        }
        // console.log(config)
        var sitelist = wx.getStorageSync("sitelist")
        if (sitelist) {
            //如果当前设置为默认，则先把其它修改为非默认,再把当前的加入或更新
            if (config.isdefault) {
                for (var i = 0; i < sitelist.length; i++) {
                    sitelist[i].isdefault = false
                }
            }
            // 编辑
            if (this.data.editName) {
                //要获取index
                var index = this.getConfigByName(this.data.editName, true).index
                sitelist[index] = config
            } else { //新增
                sitelist.push(config)
            }
        } else {
            sitelist = [config]
        }
        try {
            wx.setStorageSync('sitelist', sitelist)
            wx.showToast({
                title: '已保存',
                icon: 'success',
                duration: 2000,
                mask: true,
                complete(e) {
                    setTimeout(() => {
                        wx.navigateBack()
                    }, 2000);
                }
            })
        } catch (e) {
            wx.showToast({
                title: '保存失败',
                icon: 'error'
            })
        }
    },

    //判断微信绑定并且询问执行绑定
    registWxBeforeDo(callback) {
        //判断是否绑定微信
        var userInfo = wx.getStorageSync('userInfo')
        if (userInfo) {
            callback(true)
        } else {
            app.checkUserWxRegist(function (result) {
                if (result.info == "not_regist" || result.info == "cancel_regist") {
                    wx.showModal({
                        title: '签到功能需绑定微信，是否绑定？',
                        confirmText: '绑定',
                        success(e) {
                            if (e.confirm) {
                                wx.getUserProfile({
                                    desc: '绑定微信', // 声明获取用户个人信息后的用途，后续会展示在弹窗中，请谨慎填写
                                    success: (res) => {
                                        var userInfo = res.userInfo
                                        //绑定个人信息
                                        app.registWxUser(result.code, userInfo, function (res) {
                                            if (res) {
                                                wx.setStorageSync('userInfo', userInfo)
                                                callback(true)
                                            } else {
                                                callback(false)
                                            }
                                        })
                                    }
                                })
                            } else {
                                callback(false)
                            }
                        }
                    })
                } else if (result.info == "registed") {
                    wx.setStorageSync('userInfo', result.userInfo)
                    callback(true)
                } else {
                    callback(false)
                }
            }, false)
        }
    },

    //获取自动签到状态
    getAutoSignStatus(config, showModalTip = false, manual = false) {
        var userInfo = wx.getStorageSync('userInfo')
        if (!userInfo) {
            wx.showToast({
                title: '未绑定微信',
                icon: "none"
            })
            return
        }
        var params = {
            config: crypto.encrypted(JSON.stringify({
                user_id: userInfo.openid,
                sitehost: config.host,
                customername: config.named,
            }))
        }
        this.setData({
            autoSignEndTime: '正在验证..'
        })
        var that = this;
        MyRequest.GetServer(commonConfig.server.site_autosignstatus, function (result) {
            if (result.success && result.data != "error" && result.data != "[]") {
                var data = JSON.parse(result.data)
                data = data[0]
                if (!manual) {
                    //不是手动开启的话，就通过服务器的数据更新本地自动签到开关
                    that.setData({
                        isAutoSign: data.running
                    })
                }
                var last_time_str = '-'
                if (data.lastsignstatus == 1) {
                    last_time_str = '失败(点击重试)'
                } else {
                    // 解决ios真机下时间显示未NaN的问题
                    if (data.lastsigntime) {
                        var dd = data.lastsigntime.replace(/-/g, '/')
                        var timestr = new Date(dd).getTime()
                        last_time_str = util.timeago(timestr)
                    } else {
                        last_time_str = "-"
                    }

                }
                // 0未生效，1生效，2永久
                // 0申请未生效
                if (data.status == 0) {
                    that.setData({
                        autoSignEndTime: '未生效',
                        lastsigntime: '-'
                    })
                    //自动签到功能验证 是否在有效期内，5元/每月，25元/半年，50元/每年
                    if (showModalTip) {
                        wx.showModal({
                            title: '自动签到功能未生效',
                            content: '要使自动签到功能生效请加入官方Q群了解更多',
                            confirmText: '获取帮助',
                            cancelText: '好的',
                            mask: true,
                            success(e) {
                                if (e.confirm) {
                                    wx.navigateTo({
                                        url: '/pages/about/about?type=help',
                                    })
                                }
                            }
                        })
                    }
                }
                // 生效，需判断过期时间
                else if (data.status == 1) {
                    var endtimestr = '-'
                    var end_date = new Date(data.endtime)
                    if (new Date().getTime() > end_date.getTime()) {
                        endtimestr = "已过期"
                        wx.showModal({
                            title: endtimestr,
                            content: "自动签到功能已过期",
                            showCancel: false
                        })
                    } else {
                        endtimestr = data.endtime.substr(0, 10)
                    }
                    that.setData({
                        signTime: data.signtime.substr(11, 5),
                        lastsigntime: last_time_str,
                        autoSignEndTime: endtimestr
                    })
                }
                // 永久，不需判断过期时间
                else {
                    that.setData({
                        signTime: data.signtime.substr(11, 5),
                        lastsigntime: last_time_str,
                        autoSignEndTime: "永久"
                    })
                }
            } else {
                that.setData({
                    autoSignEndTime: '未生效'
                })
            }
        }, params)
    },
    //手动重签
    reSign() {
        if (this.data.autoSignEndTime == "未生效" || this.data.autoSignEndTime == "已过期") {
            wx.showModal({
                title: this.data.autoSignEndTime,
                content: "当前状态不支持手动重签",
                showCancel: false
            })
            return
        }
        wx.showLoading({
            title: '重签中..',
            mask: true
        })
        var userInfo = wx.getStorageSync('userInfo')
        var params = {
            config: crypto.encrypted(JSON.stringify({
                user_id: userInfo.openid,
                sitehost: this.data.currentConfig.host,
                customername: this.data.currentConfig.named,
            }))
        }
        var that = this;
        MyRequest.GetServer(commonConfig.server.site_resign, function (result) {
            // console.log(result)
            wx.hideLoading()
            if (result.success && result.data) {
                that.setData({
                    lastsigntime: '刚刚(手动)'
                })
            } else {
                that.setData({
                    lastsigntime: '失败(点击重试)'
                })
                wx.showToast({
                    title: '重签失败',
                    icon: "error"
                })
            }
        }, params)
    },
    //查看有效期
    viewAutoSignPay() {
        if (this.data.autoSignEndTime == '正在验证..') {
            wx.showToast({
                title: '别着急',
                icon: 'none',
                duration: 1000,
                mask: true,
            })
            return
        }
        this.getAutoSignStatus(this.data.currentConfig, true)
    },

    //修改签到时间
    bindTimeChange: function (e) {
        this.setData({
            signTime: e.detail.value
        })
    },

    //修改兑换的签到时长
    bindSignDurationChange: function (e) {
        this.setData({
            sign_duration_index: e.detail.value
        })
    }
})