var utils = require('../../utils/util.js')
var crypto = require('../../utils/crypto.js')
var Client = require('../../client.js')
var config = require('../../config.js')
var MyRequest = require('../../myRequest.js')
const app = getApp()
Page({
    data: {
        maintitle: '搜索',
        currentSiteConfig: '',
        ptSiteConfigs: [],
        searchInputFocus: false,
        keyword: '',
        pageIndex: 0,
        list: [],
        retrytext: '输入关键字开始搜索',
        loadmore_text: '点我加载更多',
        scroll_top: 0,
        showPopList: false,
        currentDownloadUrl: "",
        selectedClients: [],
        refresher_style: 'black',
    },
    onSiteSetting() {
        var url = '/pages/siteconfig/siteconfig'
        var list = wx.getStorageSync('sitelist')
        if (list && list.length) {
            url = '/pages/sitelist/sitelist'
        }
        wx.navigateTo({
            url: url,
        })
    },

    onScroll(e) {
        this.setData({
            showSearchTip: false,
            searchInputFocus: false
        })
    },
    onSearchBlur(e) {
        this.setData({
            showSearchTip: false
        })
    },
    onSearchFocus(e) {
        this.setData({
            showSearchTip: true
        })
    },
    onSearchInput(e) {
        var keyword = e.detail.value
        this.setData({
            keyword: keyword
        })
        if (utils.trimAllBlank(keyword) != "") {
            this.setData({
                maintitle: '搜索'
            })
        }
    },
    onSearchConfirm(e) {
        var keyword = e.detail.value
        //获取设置为默认的站点
        var siteConfig = this.getDefaultSiteConfig()
        this.setData({
            keyword: keyword,
            showSearchTip: false,
            currentSiteConfig: siteConfig
        })
        // console.log(keyword, siteConfig)
        this.searchSiteWithConfig(keyword, siteConfig)
    },
    getDefaultSiteConfig() {
        var list = this.data.ptSiteConfigs
        for (var i = 0; i < list.length; i++) {
            if (list[i].isdefault) return list[i]
        }
        //没有则取第一个
        return list[0]
    },
    onSearchTipItemTap(e) {
        var itemConfig = e.target.dataset.item
        this.setData({
            showSearchTip: false,
            currentSiteConfig: itemConfig
        })
        this.searchSiteWithConfig(this.data.keyword, itemConfig)
    },

    onLoadmore() {
        var page = this.data.pageIndex + 1
        this.setData({
            loadmore_text: '正在加载更多..'
        })
        this.searchSiteWithConfig(this.data.keyword, this.data.currentSiteConfig, page, true)
    },
    onRefresh() {
        this.searchSiteWithConfig(this.data.keyword, this.data.currentSiteConfig)
    },
    // incldead 0包括断种 1活种 2断种
    //spstate:0全部，1普通，2免费，3 2x上传，4 2x免费，5 50%免费，6 2x上传&50%免费，7 30% 免费，8 0流量
    //inclbookmarked 0全部，1仅收藏 2仅未收藏
    //search 关键字
    //search_area 0标题，1简介，2副标题，3发布者，4 imdb链接，5豆瓣链接或ID
    //search_mode 0与，1或，2精确
    //page 页码
    searchSiteWithConfig(keyword, siteConfig, pageIndex = 0, loadmore = false) {
        if (this._isSearching) return
        this._isSearching = true
        var params = {
            keyword: keyword + "&page=" + pageIndex,
            config: crypto.encrypted(JSON.stringify(siteConfig))
        }
        if (!loadmore) {
            wx.showLoading({
                title: '搜索中'
            })
            this.setData({
                triggered: true
            })
        }
        var that = this
        MyRequest.GetServer(config.server.site_search, function (result) {
            that._isSearching = false
            that.setData({
                triggered: false
            })
            wx.hideLoading()
            // console.log(result)
            if (result.success && result.data != "error") {
                if (!loadmore) that.setData({
                    scroll_top: 0
                })
                that.setData({
                    retrytext: result.data.length <= 0 ? '没有搜索到[' + keyword + ']的相关内容' : '当前共' + result.data.length + '条结果',
                    list: loadmore ? that.data.list.concat(result.data) : result.data,
                    pageIndex: pageIndex,
                    loadmore_text: result.data.length <= 0 ? '没有了' : '点我加载更多',
                })
                var count = that.data.list.length
                if (count > 999) {
                    count = '999+'
                }
                that.setData({
                    maintitle: siteConfig.name + '当前共(' + count + ')条',
                })
            } else {
                wx.showToast({
                    title: '获取失败' + result.data,
                    icon: 'none'
                })
            }
        }, params)
    },
    getDetailInfoFromUrl(url, actionId) {
        var params = {
            url: url,
            config: crypto.encrypted(JSON.stringify(this.data.currentSiteConfig))
        }
        wx.showLoading({
            title: '获取下载链接..',
        })
        var that = this
        MyRequest.GetServer(config.server.site_detail, function (result) {
            wx.hideLoading()
            if (result.success && result.data != "error") {
                //判断url是否附带该站点的域名
                var downloadUrl = result.data.indexOf(that.data.currentSiteConfig.host) != 0 ? that.data.currentSiteConfig.host + "/" + result.data : result.data
                if (actionId == 0) {
                    var list = wx.getStorageSync('serverlist')
                    // console.log(list)
                    if (list && list.length > 0) {
                        that.setData({
                            clients: list,
                            showPopList: true,
                            currentDownloadUrl: downloadUrl
                        })
                    } else {
                        list = []
                        wx.showToast({
                            title: '客户端列表为空',
                            icon: "none"
                        })
                    }
                } else if (actionId == 1) {
                    wx.setClipboardData({
                        data: downloadUrl,
                        success(res) {
                            wx.getClipboardData({
                                success(res) {
                                    wx.showToast({
                                        title: '已复制',
                                        icon: "success"
                                    })
                                }
                            })
                        }
                    })
                }
            } else {
                wx.showToast({
                    title: '下载连接获取失败',
                    icon: "none",
                    duration: 4000
                })
            }
        }, params)
    },
    onShowAction(e) {
        var item = e.currentTarget.dataset.item
        var that = this
        wx.showActionSheet({
            itemList: ['立即下载', '复制下载链接'],
            success(res) {
                that.getDetailInfoFromUrl(item['detail_url'], res.tapIndex)
            }
        })
    },
    getClientInfoFromName(name) {
        for (var i = 0; i < this.data.clients.length; i++) {
            if (this.data.clients[i].name == name) return this.data.clients[i]
        }
    },
    onClientCheckboxChange(e) {
        var clientlist = e.detail.value
        var temp = []
        clientlist.forEach(name => {
            var client = this.getClientInfoFromName(name)
            temp.push(client)
        })
        this.setData({
            selectedClients: temp
        })
    },
    onAddToClientDownload(e) {
        if (this.data.currentDownloadUrl == "") {
            wx.showToast({
                title: '下载连接获取失败',
                icon: "none",
                duration: 3000
            })
        } else {
            if (this.data.selectedClients.length <= 0) {
                wx.showToast({
                    title: '请选择客户端',
                    icon: "none",
                    duration: 3000
                })
            } else {
                wx.showLoading({
                    title: '正在添加',
                })
                var that = this
                Client.addDownloadTaskToClients(this.data.selectedClients, this.data.currentDownloadUrl, function (result) {
                    console.log(result)
                    wx.hideLoading()
                    if (result.success) {
                        wx.showToast({
                            title: '已添加',
                            complete: function () {
                                that.setData({
                                    showPopList: false
                                })
                            }
                        })
                    } else {
                        wx.showModal({
                            title: "添加失败",
                            content: '添加到客户端失败,你可以复制链接手动添加',
                            confirmText: "复制链接",
                            showCancel: true,
                            success(result) {
                                wx.setClipboardData({
                                    data: that.data.currentDownloadUrl,
                                    success(res) {
                                        wx.getClipboardData({
                                            success(res) {
                                                wx.showToast({
                                                    title: '已复制',
                                                    icon: "success"
                                                })
                                            }
                                        })
                                    }
                                })
                            }
                        })
                    }
                })
            }
        }
    },
    onHideClientsSelect() {
        this.setData({
            showPopList: false
        })
    },
    onLoad(options) {
        this.setData({
            contentHeight: wx.getSystemInfoSync().windowHeight - app.globalData.navBarHeight,
            screenWidth: app.globalData.screenWidth,
            contentTop: app.globalData.navBarHeight
        })

        //获取设置为默认的站点
        // var siteConfig = this.getDefaultSiteConfig()
        // this.setData({
        //     showSearchTip: false,
        //     currentSiteConfig: siteConfig
        // })
        // this.searchSiteWithConfig("", siteConfig)
    },
    onShow() {
        var siteConfigList = wx.getStorageSync('sitelist')
        this.setData({
            ptSiteConfigs: siteConfigList
        })
        if (siteConfigList && siteConfigList.length > 0) {
            var that = this
            wx.createSelectorQuery().select('#searchView').boundingClientRect(function (rect) {
                that.setData({
                    searchViewHeight: rect.height
                }) // 节点的高度
            }).exec()
        }
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
    onBack() {
        wx.navigateBack()
    }
})