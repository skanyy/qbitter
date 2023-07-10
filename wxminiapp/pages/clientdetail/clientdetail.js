// pages/clientdetail/clientdetail.js
import * as echarts from '../../components/ec-canvas/echarts'
var utils = require('../../utils/util.js')
var config = require('../../config.js')
const app = getApp()
var MyRequest = require('../../myRequest.js')
Page({
    data: {
        switch_color: '#13b2ae',
        process_active_color: '#13b2ae',
        process_bg_color: '#333',
        main_title: 'Qbiter',
        clientIndex: "",
        currentServerConfig: '',
        timer: '',
        connection_status: '未连接',
        speedLimitState: false,
        ec_line: {
            lazyLoad: true
        },
        ec_bar: {
            lazyLoad: true
        },
        ec_pie: {
            lazyLoad: true
        }
    },
    getTimeForXAxis(date) {
        var hour = date.getHours()
        var minute = date.getMinutes()
        var second = date.getSeconds()
        return [hour.toString().length < 2 ? "0" + hour.toString() : hour, minute.toString().length < 2 ? "0" + minute.toString() : minute, second.toString().length < 2 ? "0" + second.toString() : second].join(':')
    },

    getBarConfig(trackers, torrents, categories, tags, dht) {
        var max = Math.max(trackers, torrents, categories, tags, dht)
        var min = Math.min(trackers, torrents, categories, tags, dht)

        return {
            disableTouch: true,
            grid: {
                left: '8',
                right: '10',
                top: '15',
                bottom: '0',
                containLabel: true
            },
            xAxis: {
                type: 'category',
                data: this.data.is_tr ? ['种子总数', '活动种子', '暂停种子'] : ['Trackers', '种子', '分类', '标签', 'DHT'],
                axisTick: {
                    alignWithLabel: true
                }
            },
            yAxis: {
                type: (max - min) >= 300 ? 'log' : 'value', //数据相差太大用log形式，柱状图更美观
                splitLine: {
                    //网格线
                    lineStyle: {
                        type: "dotted", //设置网格线类型 dotted：虚线   solid:实线
                        color: wx.getSystemInfoSync().theme == 'dark' ? '#333' : '#ccc'
                    }
                },
            },
            series: [{
                data: this.data.is_tr?[{
                    value: trackers,
                    itemStyle: {
                        color: wx.getSystemInfoSync().theme == 'dark' ? '#003333' : '#006666'
                    }
                }, {
                    value: torrents,
                    itemStyle: {
                        color: wx.getSystemInfoSync().theme == 'dark' ? '#336699' : '#6666CC'
                    }
                }, {
                    value: categories,
                    itemStyle: {
                        color: wx.getSystemInfoSync().theme == 'dark' ? '#99CC99' : '#66CC99'
                    }
                }]:[{
                    value: trackers,
                    itemStyle: {
                        color: wx.getSystemInfoSync().theme == 'dark' ? '#003333' : '#006666'
                    }
                }, {
                    value: torrents,
                    itemStyle: {
                        color: wx.getSystemInfoSync().theme == 'dark' ? '#336699' : '#6666CC'
                    }
                }, {
                    value: categories,
                    itemStyle: {
                        color: wx.getSystemInfoSync().theme == 'dark' ? '#99CC99' : '#66CC99'
                    }
                },{
                    value: tags,
                    itemStyle: {
                        color: wx.getSystemInfoSync().theme == 'dark' ? '#330000' : '#660033'
                    }
                },{
                    value: dht,
                    itemStyle: {
                        color: wx.getSystemInfoSync().theme == 'dark' ? '#CC9999' : '#CC9933'
                    }
                }],
                type: 'bar',
                itemStyle: {
                    normal: {
                        barBorderRadius: [3, 3, 0, 0]
                    }
                },
                label: {
                    show: true, //开启显示
                    position: 'top', //在上方显示
                    textStyle: { //数值样式
                        color: wx.getSystemInfoSync().theme == 'dark' ? 'lightgray' : 'gray',
                        fontSize: 10
                    }
                },
            }]
        }
    },
    getLineLegendAndSeriesConfig(name, color, opacity, yAxisIndex, data) {
        return {
            legend: {
                name: name,
                itemStyle: {
                    opacity: opacity
                },
                textStyle: {
                    color: color
                }
            },
            series: {
                name: name,
                type: 'line',
                showSymbol: false,
                smooth: wx.getStorageSync('echartsSmooth'),
                areaStyle: wx.getStorageSync('speedViewType') == 0 ? {
                    opacity: opacity,
                    color: color
                } : {
                    normal: {
                        color: 'rgba(0,0,0,0)' //透明即为曲线样式
                    }
                },
                lineStyle: {
                    width: wx.getStorageSync('speedViewType') == 0 ? 0 : 1
                },
                itemStyle: wx.getStorageSync('speedViewType') == 0 ? {} : {
                    normal: {
                        lineStyle: {
                            color: color
                        }
                    }
                },
                yAxisIndex: yAxisIndex, //多个y轴时需指定用哪个y轴显示
                data: data
            }
        }
    },
    createLineOptionByData(dlspeed, upspeed, peers, io) {
        var dl_speed = " ↓ " + (dlspeed > 0 ? utils.formatSize(dlspeed) : '0K') + '/S'
        var dl_speed_color = wx.getSystemInfoSync().theme == 'dark' ? '#1f7769' : '#13b2ae'
        var up_speed = " ↑ " + (upspeed > 0 ? utils.formatSize(upspeed) : '0K') + '/S'
        var up_speed_color = wx.getSystemInfoSync().theme == 'dark' ? '#8f1251' : '#ff0000'
        var peers_count = 'Peers:' + (peers > 99 ? '99+' : peers)
        var peers_count_color = wx.getSystemInfoSync().theme == 'dark' ? '#986f1d' : '#CC9933'
        var io_count = 'IO:' + (io > 99 ? '99+' : io)
        var io_count_color = wx.getSystemInfoSync().theme == 'dark' ? '#666666' : '#663333'
        return {
            disableTouch: true,
            grid: [{
                left: '8',
                right: '10',
                top: '25',
                bottom: '0',
                containLabel: true
            }],
            //图例
            legend: {
                data: [
                    this.getLineLegendAndSeriesConfig(dl_speed, dl_speed_color, 0).legend,
                    this.getLineLegendAndSeriesConfig(up_speed, up_speed_color, 0).legend,
                    this.getLineLegendAndSeriesConfig(peers_count, peers_count_color, 0).legend,
                    this.getLineLegendAndSeriesConfig(io_count, io_count_color, 0).legend
                ]
            },
            xAxis: {
                data: this.xdata
            },
            yAxis: [{
                type: 'value',
                axisLabel: {
                    formatter: function (value) {
                        return utils.formatSpeedForYAxisLable(value)
                    }
                },
                splitLine: {
                    //网格线
                    lineStyle: {
                        type: "dotted", //设置网格线类型 dotted：虚线   solid:实线
                        color: wx.getSystemInfoSync().theme == 'dark' ? '#333' : '#ccc'
                    }
                },
            }, {
                type: 'value',
                splitLine: {
                    show: false
                },
            }],
            series: [
                this.getLineLegendAndSeriesConfig(dl_speed, dl_speed_color, 0.8, 0, this.downSeriesData).series,
                this.getLineLegendAndSeriesConfig(up_speed, up_speed_color, 0.8, 0, this.upSeriesData).series,
                this.getLineLegendAndSeriesConfig(peers_count, peers_count_color, 0.8, 1, this.peersSeriesData).series,
                this.getLineLegendAndSeriesConfig(io_count, io_count_color, 0.8, 1, this.ioSeriesData).series
            ]
        }
    },
    //dht,trackers,torrents
    showBarNumberForSecond(trackers, torrents, categories, tags, dht) {
        this.setData({
            trackers:trackers,
            torrents:torrents,
            categories:categories,
            tags:tags,
            dht:dht
        })
    },
    //速度图表
    showSpeedLineForSecond(date, dlspeed, upspeed, peers, io) {
        if (app.globalData.lineCharts) {
            this.downSeriesData.shift()
            this.upSeriesData.shift()
            this.peersSeriesData.shift()
            this.ioSeriesData.shift()
            this.xdata.shift()

            this.downSeriesData.push(dlspeed / 1024)
            this.upSeriesData.push(upspeed / 1024)
            this.peersSeriesData.push(peers)
            this.ioSeriesData.push(io)
            this.xdata.push(this.getTimeForXAxis(date))
            app.globalData.lineCharts.setOption(this.createLineOptionByData(dlspeed, upspeed, peers, io));
        } else {
            var time = new Date().getTime()
            var length = 20
            this.data.xdata = [] //先清空
            for (var i = 1; i <= length; i++) {
                // var _temp = this.dataWithTime("none")
                this.downSeriesData.push('')
                this.upSeriesData.push('')
                this.peersSeriesData.push('')
                this.ioSeriesData.push('')
                //依次取之前的秒数
                var date = new Date(time - (length - i) * 1000)
                var timestr = this.getTimeForXAxis(date)
                this.xdata.push(timestr)
            }
            this.echarts_line_Component.init((canvas, width, height, dpr) => {
                app.globalData.lineCharts = echarts.init(canvas, null, {
                    width: width,
                    height: height,
                    devicePixelRatio: dpr
                })
                app.globalData.lineCharts.setOption(this.createLineOptionByData(dlspeed, upspeed, peers, io))
                return app.globalData.lineCharts
            })
        }
    },

    getGlobaInfo(firstload = false) {
        if (this._globalInfoRefreshing) return
        this._globalInfoRefreshing = true
        // console.log("refresh globalInfo")
        if (firstload) {
            wx.showLoading({
                title: '请稍后',
            })
        }
        var that = this
        MyRequest.GetClient(this.data.currentServerConfig, config.client.Get_maindata, function (res) {
            wx.hideLoading()
            that._globalInfoRefreshing = false
            // console.log(res)
            if (res && res.success && res.data) {
                var obj = res.data
                // 因为对于tr，需要用另一个请求才能获取到以下数据，所以单独分开判断
                if (!that.data.is_tr) {
                    obj.categories_count = Object.keys(res.data['categories']).length
                    obj.tags_count = res.data.tags.length
                    obj.torrents_count = Object.keys(res.data['torrents']).length
                    obj.trackers_count = Object.keys(res.data['trackers']).length
                    //累计下载量和累计上传量
                    obj.server_state.alltime_dl_text = utils.formatSize(res.data.server_state['alltime_dl'])
                    obj.server_state.alltime_ul_text = utils.formatSize(res.data.server_state['alltime_ul'])
                    // 累计下载占比
                    obj.server_state.down_ratio = (100 * obj.server_state.alltime_dl / (obj.server_state.alltime_dl + obj.server_state.alltime_ul)).toFixed(2)
                    // 当前下载量和上传量，当前分享率
                    obj.server_state.dl_info_data_text = utils.formatSize(res.data.server_state['dl_info_data'])
                    obj.server_state.up_info_data_text = utils.formatSize(res.data.server_state['up_info_data'])
                    obj.server_state.current_ratio = res.data.server_state['dl_info_data'] == 0 ? "-" : (res.data.server_state['up_info_data'] / res.data.server_state['dl_info_data']).toFixed(2)
                    // 当前速率
                    obj.server_state.dl_info_speed_text = utils.formatSize(res.data.server_state['dl_info_speed'])
                    obj.server_state.up_info_speed_text = utils.formatSize(res.data.server_state['up_info_speed'])
                    // 显示到图表上,对于tr，以下显示需在另一个请求里完成
                    that.showSpeedLineForSecond(new Date(), obj.server_state.dl_info_speed, obj.server_state.up_info_speed, obj.server_state.total_peer_connections, obj.server_state.queued_io_jobs)
                    that.showBarNumberForSecond(obj.trackers_count, obj.torrents_count, obj.categories_count, obj.tags_count, obj.server_state.dht_nodes)
                    //备用限速开关
                    obj.server_state.use_alt_speed_limits = res.data.server_state['use_alt_speed_limits']
                    // 上传和下载限制
                    var up_limit = res.data.server_state['up_rate_limit']
                    var dl_limit = res.data.server_state['dl_rate_limit']
                    obj.server_state.up_rate_limit = up_limit==0?'∞':utils.formatSize(up_limit),
                    obj.server_state.dl_rate_limit = dl_limit==0?'∞':utils.formatSize(dl_limit),
                    // 会话丢弃
                    obj.server_state.total_wasted_session = utils.formatSize(res.data.server_state['total_wasted_session'])
                    // 缓存
                    obj.server_state.read_cache_hits = utils.formatSize(res.data.server_state['read_cache_hits'])
                    obj.server_state.total_buffers_size = utils.formatSize(res.data.server_state['total_buffers_size'])
                    // 队列
                    obj.server_state.queueing = res.data.server_state['queueing']
                    obj.server_state.total_queued_size = utils.formatSize(res.data.server_state['total_queued_size'])
                    obj.server_state.average_time_queue = utils.formatSecToStr(res.data.server_state['average_time_queue'] / 1000)
                    // 磁盘占用
                    var disk_used = that.caculateTorrentsSize(res.data['torrents'])
                    var disk_free = res.data.server_state['free_space_on_disk']
                    obj.server_state.dick_used = (100 * disk_used / (disk_used + disk_free)).toFixed(2)
                    obj.server_state.used_spece_on_disk = utils.formatSize(disk_used)
                    obj.server_state.free_space_on_disk = utils.formatSize(disk_free)

                    that.setData({
                        maindata: obj
                    })
                } else {
                    //备用限速开关
                    //tr需要先判断是否启用，然后判断对应的上传下载限速是否启用，还需要获取对应的单位units
                    //在tr中，speed-limit-down全局下载限制;alt-speed-down 备用下载速度限制；speed-limit-up全局上传限制;alt-speed-up 备用上传速度限制
                    // var de = res.data['units']['speed-bytes'] //1024
                    var de = 1024
                    var up_limit = de * (res.data['alt-speed-enabled'] ? res.data['alt-speed-up'] : (res.data['speed-limit-up-enabled'] ? res.data['speed-limit-up'] : 0))
                    var dl_limit = de * (res.data['alt-speed-enabled'] ? res.data['alt-speed-down'] : (res.data['speed-limit-down-enabled'] ? res.data['speed-limit-down'] : 0))
                    that.setData({
                        tr_download_dir: res.data['download-dir'],
                        tr_alt_speed_enabled: res.data['alt-speed-enabled'],
                        tr_up_rate_limit:up_limit==0?'∞':utils.formatSize(up_limit,de),
                        tr_dl_rate_limit:dl_limit==0?'∞':utils.formatSize(dl_limit,de),
                        tr_cache_size: res.data['cache-size-mb'] + 'M',
                        tr_queue_state: res.data['queue-stalled-enabled'],
                        tr_queue_time: res.data['queue-stalled-minutes'],
                        tr_free_space: utils.formatSize(res.data['download-dir-free-space'])
                    })
                }

            } else {
                if (firstload) {
                    // wx.showModal({
                    //     title: "提示",
                    //     content: "获取失败",
                    //     showCancel: false
                    // })
                    wx.showToast({
                      title: '获取失败',
                      icon:"none"
                    })
                }
            }
        })
    },
    caculateTorrentsSize(torrents) {
        let size = 0
        for (let name of Object.keys(torrents)) {
            let value = torrents[name];
            size += value['size']
        }
        return size
    },
    
    // 针对tr的情况
    getTrSessionStats() {
        //不是tr则不执行
        if (!this.data.is_tr) return
        if (this._TrSessionStatsRefreshing) return
        this._TrSessionStatsRefreshing = true
        var that = this
        MyRequest.GetClient(this.data.currentServerConfig, config.client.Get_global_transferinfo, function (res) {
            wx.hideLoading()
            that._TrSessionStatsRefreshing = false
            if (res && res.success) {
                that.showBarNumberForSecond(res.data['torrentCount'], res.data['activeTorrentCount'], res.data['pausedTorrentCount'], 0, 0)
                that.showSpeedLineForSecond(new Date(), res.data['downloadSpeed'], res.data['uploadSpeed'], 0, 0)
                that.setData({
                    tr_down_speed: utils.formatSize(res.data['downloadSpeed']),
                    tr_up_speed: utils.formatSize(res.data['uploadSpeed']),
                    tr_current_dl_data: utils.formatSize(res.data['current-stats'].downloadedBytes),
                    tr_current_ul_data: utils.formatSize(res.data['current-stats'].uploadedBytes),
                    tr_current_ratio: res.data['current-stats'].downloadedBytes == 0 ? "-" : (res.data['current-stats'].uploadedBytes / res.data['current-stats'].downloadedBytes).toFixed(2),
                    tr_total_dl_data: utils.formatSize(res.data['cumulative-stats'].downloadedBytes),
                    tr_total_ul_data: utils.formatSize(res.data['cumulative-stats'].uploadedBytes),
                    // 总分享率
                    tr_global_ratio: (res.data['cumulative-stats'].uploadedBytes / res.data['cumulative-stats'].downloadedBytes).toFixed(2),
                    //总下载占比
                    tr_total_down_ratio: (100 * res.data['cumulative-stats'].downloadedBytes / (res.data['cumulative-stats'].downloadedBytes + res.data['cumulative-stats'].uploadedBytes)).toFixed(2)
                })
            }
        })
    },
    onQueueToggleSwitch(e) {
        wx.showLoading({
            title: '请稍后',
        })
        //tr客户端需要提供这个值
        var params = {
            "queueEnable": e.detail.value
        }
        MyRequest.GetClient(this.data.currentServerConfig, config.client.Set_app_queuing, function (res) {
            wx.hideLoading()
            if (!res.success) {
                wx.showToast({
                    title: '切换失败',
                    icon: 'none'
                })
            }
        }, params)
    },
    onSpeedToggleSwitch(e) {
        wx.showLoading({
            title: '请稍后',
        })
        //tr客户端需要提供这个值
        var params = {
            "altSpeedEnabled": e.detail.value
        }
        MyRequest.GetClient(this.data.currentServerConfig,config.client.Set_app_toggleSpeedLimitsMode, function (res) {
            wx.hideLoading()
            if (!res.success) {
                wx.showToast({
                    title: '备用速度切换失败',
                    icon: 'none'
                })
            }
        }, params)
    },

    onLoad: function (option) {
        var contentH = wx.getSystemInfoSync().windowHeight - app.globalData.navBarHeight
        this.setData({
            contentHeight: contentH,
            contentTop: app.globalData.navBarHeight,
            speedViewHeight: 0.22 * contentH
        })
        this.setData({
            clientIndex: option.index
        })
        this.echarts_line_Component = this.selectComponent("#myechart_line")
        this.echarts_bar_Component = this.selectComponent("#myechart_bar")
        // this.echarts_pie_Component = this.selectComponent("#myechart_pie")

        this.downSeriesData = []
        this.upSeriesData = []
        this.peersSeriesData = []
        this.ioSeriesData = []
        this.xdata = []

        if (this.data.clientIndex >= 0) {
            var list = wx.getStorageSync('serverlist')
            this.data.currentServerConfig = list[this.data.clientIndex]
            this.setData({
                main_title: this.data.currentServerConfig.name,
                is_tr: this.data.currentServerConfig.type == "Transmission"
            })
            clearInterval(this.data.timer)
            this.getGlobaInfo(true)
            this.getTrSessionStats()
            this.showSpeedLineForSecond(new Date(), 0, 0, 0, 0)
            this.showBarNumberForSecond(0, 0, 0, 0, 0)
            this.startAutoRefresh()
        } else {
            console.log("no server index")
        }
    },
    startAutoRefresh(){
        clearInterval(this.data.timer)
        //远程默认刷新频率8s
        var updateSet = wx.getStorageSync('updateSpeed') ? wx.getStorageSync('updateSpeed') : 8
        var time = updateSet * 1000
        //使用本地网络时，提高刷新频率
        // if (this.data.currentServerConfig.islocal == true) {
        //     time = 800
        // }
        // console.log(time)
        var autoIntervalRefresh = setInterval(() => {
            this.getGlobaInfo()
            this.getTrSessionStats()
        }, time)
        this.setData({
            timer: autoIntervalRefresh
        })
    },
    onMyThemeChange(theme){
        this.setData({
            switch_color: theme == "dark" ? "#1f7769" : "#13b2ae",
            process_active_color: theme == "dark" ? '#1f7769' : '#13b2ae',
            process_bg_color: theme == "dark" ? '#212121' : '#ddd',
        })
    },
    onShow: function () {
        this.startAutoRefresh()
        //监听主题改变
        var theme = wx.getSystemInfoSync().theme
        this.onMyThemeChange(theme)
        wx.onThemeChange((result) => {
            this.onMyThemeChange(result.theme)
        })
    },
    onBackToHome() {
        wx.navigateBack()
    },

    gotoSetting() {
        wx.navigateTo({
            url: '/pages/setting/setting?index=' + this.data.clientIndex
        })
    },

    abortRequest(includechart = true) {
        console.log("abort...")
        clearInterval(this.data.timer)
        this.setData({
            timer: null
        })
        if (includechart) {
            if (app.globalData.lineCharts) {
                app.globalData.lineCharts.clear()
                app.globalData.lineCharts = null
            }
            if (app.globalData.barCharts) {
                app.globalData.barCharts.clear()
                app.globalData.barCharts = null
            }
            if (app.globalData.pieCharts) {
                app.globalData.pieCharts.clear()
                app.globalData.pieCharts = null
            }
            this.downSeriesData = []
            this.upSeriesData = []
            this.peersSeriesData = []
            this.ioSeriesData = []
            this.xdata = []
        }
    },

    onHide: function () {
        this.abortRequest(false)
    },

    onUnload: function () {
        this.abortRequest()
    },

    onShareAppMessage: function () {
        return app.onShareCommon()
    }
})