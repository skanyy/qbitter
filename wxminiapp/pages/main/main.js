// pages/main.js
var utils = require('../../utils/util.js')
var url2tr = require('../../utils/url2tr.js')
var config = require('../../config.js')
var Client = require('../../client.js')
const app = getApp()
var MyRequest = require('../../myRequest.js')
//插屏广告
let interstitialAd = null
Page({
    /**
     * 页面的初始数据
     */
    data: {
        refresher_style: 'black',
        category_color_value: '#339999',
        process_color_value: "#13b2ae",
        category_text_color: "#eee",
        serverIndex: -1,
        currentServerConfig: '',
        timer: '',
        retrytext: '正在加载',
        pageIndex: 0,
        pageSize: 20,
        tabsIndex: 0,
        currentSize: 0,
        notconfig: true,
        main_title: 'Qbiter',
        sub_title: '',
        my_nav_height: 0,
        loading_hidden: true,
        error: '',
        list: [],
        triggered: false,
        showLoadMore: false,
        loadmoretext: "上拉加载更多"
    },

    onAddBitEvent() {
        wx.navigateTo({
            url: '/pages/addbt/add?index=' + this.data.serverIndex,
        })
    },

    onBackToHome() {
        wx.switchTab({
            url: '/pages/clientlist/clients',
        })
    },

    onGotoServerDetail() {
        wx.navigateTo({
            url: '/pages/clientdetail/clientdetail?index=' + this.data.serverIndex,
        })
    },

    onLongPress(e) {
        var item = e.currentTarget.dataset.item
        // console.log(item)
        var hashes = item.id
        var text = '暂停'
        if (item.state == 'pausedDL' || item.state == 'pausedUP') {
            text = '继续'
        }
        var that = this;
        wx.showActionSheet({
            itemList: [text, '移除种子', '删除文件'],
            success(action_res) {
                console.log(action_res)
                if (action_res.tapIndex == 0) {
                    if (text == '继续') {
                        that.onControllTorrents("resume", hashes);
                    } else {
                        that.onControllTorrents("pause", hashes);
                    }
                } else {
                    wx.showModal({
                        title: '注意',
                        content: action_res.tapIndex == 1 ? '移除种子？' : '该操作将连同文件一起删除！',
                        success(modalresult) {
                            if (modalresult.confirm) {
                                if (action_res.tapIndex == 1) {
                                    that.onControllTorrents("delete", hashes)
                                } else if (action_res.tapIndex == 2) {
                                    that.onControllTorrents("deleteFiles", hashes)
                                }
                            }
                        }
                    })
                }
            },
        })
    },
    async onControllTorrents(action, hashes) {
        var tip = "操作"
        var params = {
            hashes: hashes,
        }
        var that = this;
        wx.showLoading({
            title: '请稍后..',
        });
        var url = "";
        if (action == "pause") {
            tip = "暂停"
            url = config.client.Pause_downloading;
        } else if (action == "resume") {
            tip = "恢复下载"
            url = config.client.Resume_download;
        } else if (action == "delete") {
            tip = "删除种子"
            url = config.client.Delete_download
            params.deleteFiles = false
        } else if (action == "deleteFiles") {
            tip = "删除种子及文件"
            url = config.client.Delete_download
            params.deleteFiles = true
        }
        console.log(params)
        MyRequest.GetClient(this.data.currentServerConfig, url, function (res) {
            wx.hideLoading()
            if (!res.success) {
                wx.showModal({
                    title: "提示",
                    content: tip + "失败",
                    showCancel: false
                })
            } else {
                that.onRefresh()
            }
        }, params)
    },

    // tr需单独用这个请求获取
    getGloablInfo() {
        if (!wx.getStorageSync('speedOnTitle')) return
        if (this._gettingGloablInfo) return
        this._gettingGloablInfo = true
        var that = this
        Client.GetClientGloablInfo(this.data.currentServerConfig, function (res) {
            that._gettingGloablInfo = false
            if (res && res.success && res.data) {
                if (that.data.is_tr) {
                    res.data.dl_info_speed = res.data.downloadSpeed
                    res.data.up_info_speed = res.data.uploadSpeed
                }
                that.showSpeedValueOnTop(res.data)
            }
        })
    },

    //在标题栏显示速率
    showSpeedValueOnTop(data) {
        if (!data) return
        var dlspeed = data.dl_info_speed
        var upspeed = data.up_info_speed
        // console.log(dlspeed, upspeed)
        var dl_speed = " ↓ " + (dlspeed > 0 ? utils.formatSize(dlspeed) : '0K') + '/s'
        var up_speed = " ↑ " + (upspeed > 0 ? utils.formatSize(upspeed) : '0K') + '/s'
        var info = dl_speed + " | " + up_speed
        if (dlspeed != 0 && upspeed == 0) {
            info = dl_speed
        } else if (dlspeed == 0 && upspeed != 0) {
            info = up_speed
        } else if (dlspeed == 0 && upspeed == 0) {
            info = ""
        }
        this.setData({
            sub_title: info
        })
    },
    onSearchInput(e) {
        var key = e.detail.value
        if (utils.trimAllBlank(key) == "") {
            this._keyWord = ""
            this.onRefresh()
            this.startAutoRefresh()
        }
    },
    //搜索
    onSearchConfirm(e) {
        var key = e.detail.value
        if (utils.trimAllBlank(key) == "") return
        //记录下当前关键字
        this._keyWord = key
        console.log(this._keyWord)
        this.getList(0, this.data.pageSize, false, false)
    },
    // 加载更多
    onLoadmore(e) {
        this.setData({
            showLoadMore: true,
            loadmoretext: "加载中.."
        })
        this.getList(this.data.list.length, this.data.pageSize, false, true)
    },

    getList(fromIndex, pageSize, showloading = false, loadmore = false) {
        // console.log("尝试刷新")
        if (this._freshing){
            // console.log("上次刷新未完成，请等待")
            return
        } 
        // console.log("可以进行刷新了")
        this._freshing = true
        this.setData({
            triggered: showloading
        })
        var that = this
        var all_count = []
        var downloading_count = []
        var uploding_count = []
        var seeding_count = []
        var paused_count = []
        Client.GetTorrentList(this.data.currentServerConfig, function (res) {
            // console.log("刷新请求完毕")
            if (res && res.success && res.data) {
                // console.log(res.data)
                if (that.data.is_tr) {
                    //反序
                    for (var i = res.data.torrents.length - 1; i >= 0; i--) {
                        var item = res.data.torrents[i]
                        var itemName = item.name.toLowerCase()
                        //剔除不含关键字的项
                        if (that._keyWord && itemName.indexOf(that._keyWord) == -1) {
                            continue
                        }
                        all_count.push(item)
                        //transmission torrent status:
                        // a number between 0 and 6, where:  
                        // 0: Torrent is stopped
                        // 1: Queued to check files
                        // 2: Checking files
                        // 3: Queued to download
                        // 4: Downloading 
                        // 5: Queued to seed 
                        // 6: Seeding 
                        // console.log(item)
                        if (item.status == 3 || item.status == 4) {
                            downloading_count.push(item)
                        }
                        if (item.status == 5 || item.status == 6) {
                            seeding_count.push(item)
                        }
                        if (item.rateUpload > 0) {
                            uploding_count.push(item)
                        }
                        if (item.status == 0) {
                            paused_count.push(item)
                        }
                    }
                } else {
                    // console.log(res.data)
                    if (wx.getStorageSync('speedOnTitle')) {
                        that.showSpeedValueOnTop(res.data['server_state'])
                    }
                    for (let name of Object.keys(res.data['torrents'])) {
                        let value = res.data['torrents'][name];
                        value['id'] = name
                        value['hash'] = name
                        var itemName = value['name'].toLowerCase()
                        //剔除不含关键字的项
                        if (that._keyWord && itemName.indexOf(that._keyWord) == -1) {
                            continue
                        }
                        all_count.push(value)
                        if (value.state == 'downloading') {
                            downloading_count.push(value)
                        }
                        if (value.state == 'stalledUP') {
                            seeding_count.push(value)
                        }
                        if (value.state == 'uploading') {
                            uploding_count.push(value)
                        }
                        if (value.state == 'pausedUP' || value.state == "pausedDL") {
                            paused_count.push(value)
                        }
                    }
                }
                //根据当前条件筛选列表
                var torrents = all_count
                if (that.data.tabsIndex == 1) torrents = seeding_count
                else if (that.data.tabsIndex == 2) torrents = downloading_count
                else if (that.data.tabsIndex == 3) torrents = uploding_count
                else if (that.data.tabsIndex == 4) torrents = paused_count
                // 排序
                torrents = torrents.sort(utils.compareList("added_on", "desc"))

                // 设置选项和标题
                var labels = ['全部(' + all_count.length + ')', '正在做种(' + seeding_count.length + ')', '下载中(' + downloading_count.length + ')', '上传中(' + uploding_count.length + ')', '已暂停(' + paused_count.length + ')']
                that.setData({
                    actionsheetlable: labels,
                    main_title: that.data.currentServerConfig.name + "-" + labels[that.data.tabsIndex]
                })
                // 分页
                torrents = torrents.slice(fromIndex, fromIndex + pageSize)
                //获取到数据后继续
                var result = that.dataForViewlist(torrents, that.data.is_tr)
                if (loadmore) {
                    result = that.data.list.concat(result)
                }
                that.setData({
                    list: result,
                    retrytext: result.length <= 0 ? '没有数据' : '共' + result.length + '条数据',
                    currentSize: result.length,
                    loadmoretext: (result.length <= 0 || result.length < that.data.pageSize) ? "没有了" : "上拉加载更多"
                })
            } else {
                that.setData({
                    retrytext: '获取失败，试试下拉刷新'
                })
            }
            that._freshing = false
            that.setData({
                triggered: false,
            })
        })
    },

    //根据数据显示到对应的视图
    dataForViewlist(data, is_tr) {
        // console.log(data)
        var list = []
        // console.log(data)
        if (data && data instanceof Array) {
            data.forEach(element => {
                var size = utils.formatSize(is_tr ? element.totalSize : element.size);
                var time = utils.timeago(is_tr ? element.addedDate * 1000 : element.added_on * 1000);
                var complete = (is_tr ? element.percentDone * 100 : element.progress * 100).toFixed(0);
                var eta = (element.eta == 8640000 || element.eta <= 0) ? '--' : utils.formatSecToStr(element.eta);
                var downloadspeed = utils.formatSize(is_tr ? element.rateDownload : element.dlspeed) + "/S";
                var uploadspeed = utils.formatSize(is_tr ? element.rateUpload : element.upspeed) + "/S";
                list.push({
                    id: is_tr ? element.hashString : element.hash,
                    hash: is_tr ? element.hashString : element.hash,
                    status: is_tr ? element.status : element.state,
                    state: is_tr ? url2tr.getStateText(element.status, is_tr).stateText : element.state,
                    stateText: is_tr ? url2tr.getStateText(element.status, is_tr).text : url2tr.getStateText(element.state, is_tr),
                    save_path: is_tr ? element.downloadDir : element.save_path,
                    tags: element.tags,
                    up_limit: is_tr ? element.uploadLimit : element.up_limit,
                    ratio: is_tr ? (element.uploadRatio).toFixed(2) : element.ratio.toFixed(2),
                    max_ratio: element.max_ratio,
                    super_seeding: element.super_seeding,
                    tracker: element.tracker,
                    time_active: is_tr ? element.activityDate : element.time_active,
                    category: element.category ? (element.category.length > 8 ? element.category.substr(0, 8) + ".." : element.category) : '',
                    dlspeedNumber: is_tr ? element.rateDownload : element.dlspeed,
                    dlspeed: downloadspeed,
                    upspeedNumber: is_tr ? element.rateUpload : element.upspeed,
                    upspeed: uploadspeed,
                    eta: eta,
                    name: element.name,
                    size: size,
                    time: time,
                    complete: complete,
                })
            })
        }
        return list
    },
    gotoDetail(e) {
        wx.navigateTo({
            url: '/pages/detail/detail?hash=' + e.currentTarget.id + "&index=" + this.data.serverIndex
        })
    },
    gotoClientOption() {
        wx.navigateTo({
            url: '/pages/setting/setting?index=' + this.data.serverIndex
        })
    },
    onTabChange(e) {
        var that = this
        wx.showActionSheet({
            alertText: '请筛选',
            itemList: that.data.actionsheetlable,
            success(e) {
                that.setData({
                    tabsIndex: e.tapIndex,
                    currentSize: that.data.pageSize
                })
                that.getList(0, that.data.pageSize, true, false)
            },
            fail(e) {
                if (e.errMsg != "showActionSheet:fail cancel") {
                    wx.showToast({
                        title: '此时无法筛选',
                        icon: "none"
                    })
                }
            }
        })
    },
    abortRequest() {
        console.log("abort...")
        clearInterval(this.data.timer) //解决真机无法停止计时器的bug
        this.setData({
            timer: null,
        })
    },
    //手动刷新
    onRefresh() {
        this.setData({
            retrytext: '正在加载',
            showLoadMore: false
        })
        //判断内外网，自动设置islocal
        this.getList(0, this.data.pageSize, true, false)
    },
    startAutoRefresh() {
        //先清除之前的计时器
        clearInterval(this.data.timer)
        //远程默认刷新频率5s
        var updateSet = wx.getStorageSync('updateSpeed') ? wx.getStorageSync('updateSpeed') : 5
        var time = updateSet * 1000
        //使用本地网络时，提高刷新频率
        // if (this.data.currentServerConfig.islocal == true) {
        //     time = 600
        // }
        // console.log(time)
        var autoIntervalRefresh = setInterval(() => {
            //取大的页数，避免取不完
            var pagesize = Math.max(this.data.pageSize, this.data.currentSize)
            this.getList(0, pagesize, false, false)
            //tr需要用这个方法取实时速率
            if (this.data.is_tr) this.getGloablInfo()
        }, time)
        this.setData({
            timer: autoIntervalRefresh
        })
    },

    // scrollview滚动事件
    onScroll() {
        //scrollview没有监听停止滑动的事件，需要用一个定时器来判断是否停止滑动：
        // 即每监听到滚动时则停止自动刷新，一定时间（300ms）后再自动开始
        //清除之前的计时器,停止自动刷新
        clearInterval(this.data.timer)
        let _this = this;
        if (this.scrollEndTimer) {
            clearTimeout(this.scrollEndTimer);
            this.scrollEndTimer = null;
        }
        this.scrollEndTimer = setTimeout(function () {
            // console.log('滑动结束');
            // 滑动结束后再开始自动刷新
            _this.startAutoRefresh()
        }, 300);
    },
    onLoad: function (option) {
        this.setData({
            contentHeight: wx.getSystemInfoSync().windowHeight - app.globalData.navBarHeight,
            screenWidth: app.globalData.screenWidth,
            contentTop: app.globalData.navBarHeight,
            controllBarHeight: 70,
            currentSize: this.data.pageSize,
            serverIndex: option.index,
        })
        //计算scrollview的高度
        var that = this
        wx.createSelectorQuery().select('#searchView').boundingClientRect(function (rect) {
            that.setData({
                searchViewHeight: rect.height
            }) // 节点的高度
        }).exec()

        if (this.data.serverIndex >= 0) {
            var list = wx.getStorageSync('serverlist')
            this.data.currentServerConfig = list[this.data.serverIndex]
        } else {
            // 没指定页面则进入默认页面
            this.data.currentServerConfig = app.getDefaultServerConfig()
        }
        this.setData({
            is_tr: this.data.currentServerConfig.type == "Transmission",
            main_title: this.data.currentServerConfig.name
        })
        this.onRefresh()
    },
    onShow() {
        //启用自动刷新
        this.startAutoRefresh()
        // 监听主题变化
        this.onMyThemeChange(wx.getSystemInfoSync().theme)
        wx.onThemeChange((result) => {
            this.onMyThemeChange(result.theme)
        })
    },

    onMyThemeChange(result) {
        // console.log(result)
        this.setData({
            category_color_value: result == "dark" ? "#003333" : "#339999",
            category_text_color: result == "dark" ? "#999" : "#eee",
            process_color_value: result == "dark" ? "#1f7769" : "#13b2ae",
            refresher_style: result == "dark" ? "white" : "black"
        })
    },

    onHide: function () {
        this.abortRequest()
        wx.offThemeChange()
    },
    onUnload: function () {
        this.abortRequest()
        wx.offThemeChange()
    },
    onShareAppMessage: function () {
        return app.onShareCommon()
    },
})