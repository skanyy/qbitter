const app = getApp()
var crypto = require('../../utils/crypto.js')
var MyRequest = require('../../myRequest.js')
var util = require('../../utils/util.js')
const config = require('../../config.js')
var refreshTaskCount = 0
Page({
    data: {
        refreashInfo: "",
        showBottomAddButton: false,
        list: "",
        refresher_style: 'black',
    },
    onLoad(options) {
        this.setData({
            contentHeight: wx.getSystemInfoSync().windowHeight - app.globalData.navBarHeight,
            screenWidth: app.globalData.screenWidth,
            contentTop: app.globalData.navBarHeight,
        })
        setTimeout(this.showTips, 600)
    },
    showTips() {
        this.setData({
            refreashInfo: '↓下拉刷新站点数据'
        })
    },
    onShow() {
        var currentlist = wx.getStorageSync('sitelist')
        //把缓存赋值过来
        for (var i = 0; i < currentlist.length; i++) {
            var target = this.checkExistWithCustomerName(currentlist[i].named)
            if (target != false) {
                currentlist[i].data = target.data
            } else {
                currentlist[i].data = ""
            }
        }
        this.setData({
            triggered: false,
            showBottomAddButton: (currentlist && currentlist.length > 0),
            list: currentlist
        })
        // this.loadSiteDateByList()
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
        if (refreshTaskCount > 0) return
        this.loadSiteDateByList(true)
    },
    //刷新站点列表并判断是否刷新站点数据,默认不刷新refreshAll = false
    loadSiteDateByList(refreshAll = false) {
        if (this._isloading) return
        this._isloading = true
        //先判断是否绑定了微信，绑定后才执行获取站点的刷流数据
        var that = this
        app.checkUserWxRegist(function (result) {
            that._isloading = false
            var list = that.data.list
            if (result.info == "registed") {
                if (list && list.length > 0) {
                    //全部更新
                    if (refreshAll) {
                        for (var i = 0; i < list.length; i++) {
                            that.getSiteDataBySiteConfig(list[i])
                        }
                    } else {
                        for (var i = 0; i < list.length; i++) {
                            //只更新没有数据的
                            if (list[i].data == "") {
                                that.getSiteDataBySiteConfig(list[i])
                            }
                        }
                    }
                }
            } else if (result.info == "check_fail") {
                wx.showToast({
                    title: '用户认证失败',
                    icon: 'none'
                })
            }
        }, false)
    },
    //从服务器获取指定站点数据
    getSiteDataBySiteConfig(siteconfig) {
        refreshTaskCount++
        var data = {
            customername: siteconfig.named,
            sitename: siteconfig.name,
            sitecookie: crypto.encrypted(siteconfig.cookie)
        }
        this.setDataWithName(siteconfig.named, "正在更新..")
        var that = this
        MyRequest.GetServer(config.server.site_sitedata, function (result) {
            refreshTaskCount--
            if (refreshTaskCount == 0) {
                that.setData({
                    triggered: false
                })
            }
            var target = siteconfig.named
            var text = '获取失败'
            if (result.success && result.data != "error") {
                text = result.data.sitedata
                text = util.trimAllBlank(text)
                target = result.data.customername
            }
            that.setDataWithName(target, text)
        }, data, "GET", false)
    },

    //获取指定站点缓存的数据
    checkExistWithCustomerName(named) {
        for (var i = 0; i < this.data.list.length; i++) {
            if (this.data.list[i].named == named) {
                return this.data.list[i]
            }
        }
        return false
    },
    //给指定站点赋值
    setDataWithName(named, data) {
        // console.log(named)
        var templist = this.data.list
        for (var i = 0; i < templist.length; i++) {
            if (templist[i].named == named) {
                templist[i].data = data == 'error' ? '更新失败' : data
                break
            }
        }
        this.setData({
            list: templist
        })
    },
    gotoSearch() {
        wx.navigateTo({
            url: '/pages/search/search',
        })
    },
    onBack() {
        wx.navigateBack()
    },
    onAddSiteConfig() {
        wx.navigateTo({
            url: '/pages/siteconfig/siteconfig',
        })
    },
    onEditConfig(e) {
        var item = e.currentTarget.dataset.item
        wx.navigateTo({
            url: '/pages/siteconfig/siteconfig?editName=' + item.named,
        })
    },
    onShowAction(e) {
        // console.log(e)
        var that = this
        var item = e.currentTarget.dataset.item
        wx.showActionSheet({
            alertText: '选择',
            itemList: ['刷新该站', '编辑', '删除'],
            success(res) {
                if (res.tapIndex == 0) {
                    // console.log(item)
                    that.getSiteDataBySiteConfig(item)
                } else if (res.tapIndex == 1) {
                    wx.navigateTo({
                        url: '/pages/siteconfig/siteconfig?editName=' + item.named,
                    })
                } else if (res.tapIndex == 2) {
                    wx.showModal({
                        title: '提示',
                        content: '确定删除站点[' + item.named + ']吗？',
                        success(result) {
                            if (result.confirm) {
                                that.removeSiteConfig(item)
                            }
                        }
                    })
                }
            }

        })
    },
    removeSiteConfig(item) {
        // console.log(item)
        if (item.support_sign == true) {
            //删除服务器记录
            var params = {
                //用户opendid，站点域名，命名 组成唯一识别条件
                config: crypto.encrypted(JSON.stringify({
                    user_id: wx.getStorageSync('userInfo').openid, // 用户openid，查找条件
                    sitehost: item.host, // 站点域名，查找条件
                    sitename: item.name, // 站点名
                    customername: item.named, //自定义的名称
                    cookie: crypto.encrypted(item.cookie), //站点的cookie,二次加密
                }))
            }
            var that = this
            MyRequest.GetServer(config.server.site_removeautosign, function (result) {
                // console.log(result)
                if (result.success && result.data == true) {
                    that.removeLocalData(item)
                } else {
                    wx.showToast({
                        title: '删除失败',
                        icon: 'error'
                    })
                }
            }, params)
        }else{
            this.removeLocalData(item)
        }
    },
    removeLocalData(item) {
        var sitename = item.named
        var temp = []
        var currentlist = wx.getStorageSync('sitelist')
        for (var i = 0; i < currentlist.length; i++) {
            if (currentlist[i]['named'] != sitename) {
                temp.push(currentlist[i])
            }
        }
        wx.setStorageSync('sitelist', temp)
        this.onShow()
    }
})