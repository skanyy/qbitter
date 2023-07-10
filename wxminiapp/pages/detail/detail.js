// pages/detail/detail.js
const app = getApp()
var utils = require('../../utils/util.js')
var url2tr = require('../../utils/url2tr.js')
var config = require('../../config.js')
var MyRequest = require('../../myRequest.js')
Page({
    data: {
        scroll_top: 0,
        switch_color: '#13b2ae',
        serverIndex: "",
        currentServerConfig: "",
        torrentData: '',
        hiddenmodalput: true,
        filename: '',
        currentpath: '/',
        currenttext: '根目录',
        hashes: '',
        activeTab: 0,
        listData: [],
        pageSize: 20,
        tabs: [{
                index: 0,
                title: '设置',
                data: ""
            }, {
                index: 1,
                title: '信息',
                data: "",
                pieces: []
            },
            {
                index: 2,
                title: '内容',
                data: ""
            },
            {
                index: 3,
                title: 'Tracker',
                data: ""
            },
            {
                index: 4,
                title: '用户',
                data: ""
            },
            {
                index: 5,
                title: 'HTTP源',
                data: ""
            }
        ]
    },
    onTabChange(e) {
        this.setData({
            listData: []
        })
        var index = e.detail.index;
        this.getListDataByIndex(index);
    },
    showLongText(value) {
        if (value && value.length > 20) {
            return value.substr(0, 8) + '...' + value.substr(-8)
        }
        return value
    },
    // 启用超级做种
    onSuperSwitch(e) {
        wx.showLoading({
            title: '请稍后'
        })
        var params = {
            hashes: this.data.hashes,
            value: e.detail.value
        }
        this.updateSetting(params, config.client.Set_super_seeding)
    },
    ratioLimitText(value) {
        if (value == -1)
            return '∞'
        else if (value == -2)
            return '-'
        return value
    },
    updateView(key, value) {
        var tabs = this.data.tabs;
        var target_data = tabs[this.data.activeTab].data;
        target_data.forEach(temp => {
            if (temp.key == key) {
                temp.value = value;
                return
            }
        })
        tabs[this.data.activeTab].data = target_data
        this.setData({
            tabs: tabs
        })
    },
    getListDataByIndex(index) {
        this.setData({
            activeTab: index
        })
        if (this.data.hashes) {
            this.getDataFromHashByTapIndex(index, this.data.hashes);
        }
    },
    onRefresh() {
        this.getListDataByIndex(this.data.activeTab);
    },
    onLoad(options) {
        var hash = options.hash
        this.setData({
            contentHeight: app.globalData.screenHeight - app.globalData.navBarHeight,
            contentTop: app.globalData.navBarHeight,
            // torrentData: data,
            hashes: hash,
            serverIndex: options.index
        })
        var list = wx.getStorageSync('serverlist')
        this.data.currentServerConfig = list[this.data.serverIndex]
        this.data.is_tr = this.data.currentServerConfig.type == "Transmission"
        this.getListDataByIndex(0);
    },
    onShow() {
        //switch主题颜色
        this.setData({
            switch_color: wx.getSystemInfoSync().theme == "dark" ? "#1f7769" : "#13b2ae"
        });
        wx.onThemeChange((result) => {
            this.setData({
                switch_color: result.theme == "dark" ? "#1f7769" : "#13b2ae",
            })
        })
        if (this.data.needRefresh) {
            this.onRefresh()
        }
    },
    onHide() {
        wx.offThemeChange()
    },
    onUnload() {
        wx.offThemeChange()
    },
    getTorrentFromTr(hash, list) {
        for (var i = 0; i < list.length; i++) {
            var item = list[i]
            if (item.hashString == hash) {
                item.save_path = item.downloadDir
                item.fullpath = item.downloadDir + "/" + item.name
                item.hash = item.hashString
                item.tags = item.labels.length > 0 ? item.labels : '无'
                item.category = '无'
                item.priority = item.bandwidthPriority
                item.dl_limit = item.downloadLimit
                item.up_limit = item.uploadLimit
                item.max_ratio = item.seedRatioLimit
                return item
            }
        }
        return ""
    },
    getControlPanel(torrent_data) {
        // console.log(torrent_data)
        return [{
                name: '更改保存位置',
                key: 'location',
                value: this.showLongText(torrent_data.save_path),
                orginValue: torrent_data.save_path,
                requestData: {
                    hashes: this.data.hashes,
                    location: ''
                },
                url: config.client.Set_torrent_location,
                type: 'modalWithInput'
            }, {
                name: '重命名',
                key: 'name',
                value: this.showLongText(torrent_data.name),
                orginValue: torrent_data.name,
                requestData: {
                    hash: this.data.hashes,
                    id: torrent_data.id, //for tr
                    path: torrent_data.name, //for tr,实际上传的是name不是path
                    name: ''
                },
                url: config.client.Set_torrent_name,
                type: 'modalWithInput'
            }, {
                name: '设置标签',
                key: 'tags',
                value: torrent_data.tags,
                url: config.client.Add_torrent_tags,
                hidden: this.data.is_tr
            }, {
                name: '设置分类',
                key: 'category',
                value: torrent_data.category,
                url: config.client.Set_torrent_category,
                hidden: this.data.is_tr
            }, {
                name: '限制下载速率(K/s)',
                key: 'limit',
                value: torrent_data.dl_limit > 0 ? utils.formatSize(torrent_data.dl_limit, this.data.is_tr ? 1000 : 1024) + "/s" : '∞',
                orginValue: torrent_data.dl_limit,
                requestData: {
                    hashes: this.data.hashes,
                    limit: ''
                },
                url: config.client.Set_torrent_download_limit,
                type: 'modalWithInput'
            },
            {
                name: '限制上传速率(K/s)',
                key: 'limit',
                value: torrent_data.up_limit > 0 ? utils.formatSize(torrent_data.up_limit, this.data.is_tr ? 1000 : 1024) + "/s" : '∞',
                orginValue: torrent_data.up_limit,
                requestData: {
                    hashes: this.data.hashes,
                    limit: ''
                },
                url: config.client.Set_torrent_upload_limit,
                type: 'modalWithInput'
            }, {
                name: '限制分享率',
                key: 'ratioLimit',
                value: this.ratioLimitText(torrent_data.max_ratio),
                orginValue: torrent_data.max_ratio,
                requestData: {
                    hashes: this.data.hashes,
                    ratioLimit: '',
                    seedingTimeLimit: -2
                },
                url: config.client.Set_torrent_share_limit,
                type: 'modalWithInput'
            }, {
                name: '启用超级做种',
                key: 'setsuper',
                value: torrent_data.super_seeding,
                switch: true,
                hidden: this.data.is_tr
            }, {
                name: '重新校验',
                key: 'recheck',
                requestData: {
                    hashes: this.data.hashes
                },
                url: config.client.Recheck_torrents,
                type: 'modalWithConfirm'
            }, {
                name: '重新汇报',
                key: 'report',
                requestData: {
                    hashes: this.data.hashes
                },
                url: config.client.Reannounce_torrents,
                type: 'modalWithConfirm'
            }, {
                name: '强制继续',
                key: 'value',
                requestData: {
                    hashes: this.data.hashes,
                    value: true
                },
                url: config.client.Set_force_start,
                type: 'modalWithConfirm'
            }, {
                name: this.data.is_tr ? '调整队列' : '设置优先级', //tr不能设置种子优先级？
                key: 'priority',
                requestData: {
                    hashes: this.data.hashes
                },
                url: [{
                    desc: this.data.is_tr ? '往前移' : '提高',
                    url: config.client.Increase_torrent_priority
                }, {
                    desc: this.data.is_tr ? '往后移' : '降低',
                    url: config.client.Decrease_torrent_priority
                }, {
                    desc: this.data.is_tr ? '移到最前' : '最高',
                    url: config.client.Maximal_torrent_priority
                }, {
                    desc: this.data.is_tr ? '移到最后' : '最低',
                    url: config.client.Minimal_torrent_priority
                }],
                type: 'openSelect'
            }
        ]
    },
    onControllCellTap(e) {
        var item = e.currentTarget.dataset.item
        var that = this
        var unit = this.data.is_tr ? 1000 : 1024
        if (item.type) {
            var content = ""
            if (item.type == "modalWithInput" || item.type == 'modalWithConfirm') {
                if (item.type == "modalWithInput") {
                    if (item.value == '∞') {
                        content = ''
                    } else {
                        if (item.key == 'limit') {
                            content = item.orginValue / unit + ''
                        } else {
                            content = item.orginValue + ''
                        }
                    }
                } else if (item.type == 'modalWithConfirm') {
                    content = '是否' + item.name + '?'
                }
                wx.showModal({
                    title: item.name,
                    content: content,
                    editable: item.type == "modalWithInput" ? true : false,
                    placeholderText: item.key == 'ratioLimit' ? '-1:不限制,-2:使用全局设置' : '请输入',
                    success(res) {
                        if (res.confirm) {
                            var params = {}
                            params = item.requestData
                            if (item.key == 'limit') {
                                if (res.content <= 0)
                                    params[item.key] = 0
                                else
                                    params[item.key] = res.content * unit
                            } else if (item.key == 'ratioLimit') {
                                params[item.key] = res.content ? res.content : '-1'
                            } else {
                                params[item.key] = res.content
                            }
                            //更新服务器数据
                            that.updateSetting(params, item.url)
                        }
                    }
                })
            }
            //设置种子下载优先级
            if (item.type == 'openSelect') {
                var list = []
                item.url.forEach(m => {
                    list.push(m.desc)
                })
                // console.log(that.data.torrentData)
                var title = that.data.is_tr ? '当前第' + (that.data.torrentData.queuePosition + 1) + "位" : '当前优先级：' + url2tr.getPriority(that.data.torrentData.priority, that.data.is_tr, true)
                console.log(title)
                wx.showActionSheet({
                    alertText: title,
                    itemList: list,
                    success(res) {
                        //更新服务器数据
                        var params = item.requestData
                        item.url = item.url[res.tapIndex].url
                        that.updateSetting(params, item.url)
                    }
                })
            }
        } else {
            //设置标签和分类
            if (!item.switch) {
                if (this.data.is_tr) {
                    if (item.key == 'category' || item.key == 'tags') {
                        wx.showToast({
                            title: 'TR暂不支持该设置',
                            icon: "none"
                        })
                        return
                    }
                }
                var data = encodeURIComponent(JSON.stringify(this.data.torrentData))
                var type = item.key
                wx.navigateTo({
                    url: '/pages/tags/tags?data=' + data + '&type=' + type + "&index=" + this.data.serverIndex
                })
            }
        }
    },
    getDataFromHashByTapIndex(index, hashes) {
        if (this._freshing) return
        this._freshing = true
        wx.showLoading({
            title: '请稍后',
        })
        var that = this;
        var url = "";
        var params = {
            hash: hashes
        }
        switch (index) {
            case 0:
                url = config.client.Get_torrent_list
                params = {
                    hashes: hashes
                }
                break
            case 1:
                url = config.client.Get_torrent_properties
                break;
            case 2:
                url = config.client.Get_torrent_contents
                break;
            case 3:
                url = config.client.Get_torrent_trackers
                break;
            case 4:
                url = config.client.Get_torrent_torrentPeers
                break;
            case 5:
                url = config.client.Get_torrent_webseeds
                break;
        }
        MyRequest.GetClient(this.data.currentServerConfig, url, function (res) {
            wx.hideLoading()
            that.setData({
                triggered: false //结束刷新
            })
            that._freshing = false;
            if (res && res.success && res.data) {
                // console.log(res.data)
                var data = []
                var target = {}
                if (that.data.is_tr) {
                    target = that.getTorrentFromTr(that.data.hashes, res.data.torrents)
                } else {
                    target = res.data
                }
                switch (index) {
                    case 0:
                        if (!that.data.is_tr) {
                            target = res.data[0]
                        }
                        that.setData({
                            torrentData: target
                        })
                        data = that.getControlPanel(target)
                        break
                    case 1:
                        data = that.showGenericInof(target)
                        break
                    case 2:
                        if (that.data.is_tr) {
                            var trFilesInfo = []
                            for (var i = 0; i < target.files.length; i++) {
                                var item = target.files[i]
                                trFilesInfo.push({
                                    name: item.name,
                                    index: i,
                                    wanted: target.fileStats[i].wanted, //是否下载
                                    unwanted: target.fileStats[i].unwanted,
                                    is_seed: target.fileStats[i].priority == 5 || target.fileStats[i].priority == 6,
                                    priority: target.fileStats[i].priority,
                                    size: item.length,
                                    progress: item.bytesCompleted / item.length
                                })
                            }
                            target = trFilesInfo
                        }
                        //保存所有文件信息,供搜索使用
                        that.all_files = target;
                        that.file_page_info_list = []
                        // 获取根目录列表
                        data = that.getFileListByPathIndex(target, '/')
                        break
                    case 3:
                        if (that.data.is_tr) {
                            data = that.showTrackerByTr(target)
                        } else {
                            data = that.showTracker(target)
                        }
                        break
                    case 4:
                        if (that.data.is_tr) {
                            data = that.showUserlistByTr(target)
                        } else {
                            data = that.showUserlist(target)
                        }
                        break
                    case 5:
                        if (that.data.is_tr) {
                            data = that.showWebseedsByTr(target)
                        } else {
                            data = that.showWebseeds(target)
                        }
                        break
                }
                // 记录当前的tab的数据
                that.activeTabData = data
                // 内容显示到列表
                that.showViewByList(data)
            } else {
                wx.showToast({
                    title: '获取失败',
                    icon: "error"
                })
            }
        }, params)
    },
    showGenericInof(data) {
        var info = data;
        var data = []
        for (var name of Object.keys(info)) {
            var value = info[name];
            var item = this.translateNameAndValue(name, value);
            if (!item.hidden) data.push(item)
        }
        return data
    },
    showTrackerByTr(data) {
        var info = data.trackerStats;
        info.forEach(item => {
            item.url = item.announce
            item.num_peers = item.lastAnnouncePeerCount
            item.num_seeds = item.seederCount
            if (!item.lastAnnounceResult) item.msg = '[消息为空]'
            switch (item.announceState) {
                case 0:
                    item.status = '非活动'
                    break
                case 1:
                    item.status = '待机'
                    break
                case 2:
                    item.status = '队列中'
                    break
                case 3:
                    item.status = '活动中'
                    break
            }
            if (item.downloadCount == -1) {
                item.num_downloaded = 'N/A'
            } else {
                item.num_downloaded = item.downloadCount
            }
        })
        return info;
    },
    showTracker(data) {
        var info = data;
        info.forEach(item => {
            if (!item.msg) item.msg = '[消息为空]'
            switch (item.status) {
                case 0:
                case 1:
                    item.status = '未联系'
                    break
                case 2:
                    item.status = '正在工作'
                    break
                case 3:
                    item.status = '正在更新'
                    break
                case 4:
                    item.status = '未起作用'
                    break
            }
            if (item.num_downloaded == -1) item.num_downloaded = 'N/A'
        })
        return info;
    },
    showUserlistByTr(data) {
        var peers = data.peers;
        var list = []
        for (var i = 0; i < peers.length; i++) {
            list.push({
                country_code: peers[i].flagStr,
                country: 'unkown',
                ip: peers[i].address,
                port: peers[i].port,
                connection: peers[i].clientName,
                dl_speed: peers[i].rateToPeer,
                downloaded: peers[i].rateToClient
            })
        }
        return list
    },
    showUserlist(data) {
        var peers = data.peers;
        var data = []
        for (let name of Object.keys(peers)) {
            let value = peers[name];
            for (var key of Object.keys(value)) {
                if (key == 'dl_speed') {
                    value[key] = utils.formatSize(value[key]) + '/s'
                }
                if (key == 'downloaded') {
                    value[key] = utils.formatSize(value[key])
                }
            }
            data.push(value)
        }
        return data;
    },
    showWebseedsByTr(data) {
        var list = []
        data.webseeds.forEach(item => {
            list.push({
                url: item
            })
        })
        return list
    },
    showWebseeds(data) {
        return data;
    },
    onTrackerTap(e) {
        wx.setClipboardData({
            data: e.currentTarget.dataset.item,
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
    },
    onHttpTap(e) {
        wx.setClipboardData({
            data: e.currentTarget.dataset.item,
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
    },
    onInfoCellTap(e) {
        var item = e.currentTarget.dataset.item;
        wx.showModal({
            title: item.name,
            content: "" + item.orginValue,
            confirmText: '复制',
            success(res) {
                if (res.confirm) {
                    wx.setClipboardData({
                        data: "" + item.orginValue,
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
            }
        })
    },
    translateNameAndValue(name, value) {
        switch (name) {
            case 'activityDate':
                return {
                    name: '最后活动于', value: value == '0' ? '-' : utils.formatTime(new Date(value * 1000)), orginValue: value
                };
            case 'startDate':
                return {
                    name: '开始时间', value: value == '0' ? '-' : utils.formatTime(new Date(value * 1000)), orginValue: value
                };
            case 'status':
                return {
                    name: '当前状态', value: url2tr.getStateText(value, this.data.is_tr).text, orginValue: value
                };
            case 'addition_date': //qb的字段
            case 'addedDate': //tr的字段
                return {
                    name: '添加时间', value: value == '0' ? '-' : utils.formatTime(new Date(value * 1000)), orginValue: value
                };
            case 'bandwidthPriority':
                return {
                    name: '优先级', value: url2tr.getPriority(value, this.data.is_tr), orginValue: value
                };
            case 'save_path':
            case 'downloadDir':
                return {
                    name: '保存路径', value: value.length > 18 ? value.substr(0, 8) + '...' + value.substr(value.length - 10, value.length) : value, orginValue: value
                };
            case 'corruptEver':
                return {
                    name: '损坏', value: utils.formatSize(value), orginValue: value
                };
            case 'desiredAvailable':
                return {
                    name: '可用度', value: value, orginValue: value
                };
            case 'honorsSessionLimits':
                return {
                    name: '会话限制', value: value ? '是' : '否', orginValue: value
                };
            case 'isFinished':
                return {
                    name: '已终止', value: value ? '是' : '否', orginValue: value
                };
            case 'isPrivate':
                return {
                    name: '是否私有', value: value ? '是' : '否', orginValue: value
                };
            case 'isStalled':
                return {
                    name: '已停滞', value: value ? '是' : '否', orginValue: value
                };
            case 'haveValid':
                return {
                    name: '已验证', value: utils.formatSize(value), orginValue: value
                };
            case 'sizeWhenDone':
                return {
                    name: '完成时大小', value: utils.formatSize(value), orginValue: value
                };
            case 'secondsSeeding':
                return {
                    name: '二次做种', value: utils.formatSize(value), orginValue: value
                };
            case 'secondsDownloading':
                return {
                    name: '二次下载', value: utils.formatSize(value), orginValue: value
                };
            case 'editDate':
                return {
                    name: '编辑于', value: value == '0' ? '-' : utils.formatTime(new Date(value * 1000)), orginValue: value
                };
            case 'creation_date':
            case 'dateCreated':
                return {
                    name: '创建于', value: value == '0' ? '-' : utils.formatTime(new Date(value * 1000)), orginValue: value
                };
            case 'error':
                return {
                    name: '错误数', value: value, orginValue: value
                };
            case 'errorString':
                var valuetxt = ""
                if (value) {
                    valuetxt = value.length > 18 ? value.substr(0, 8) + '...' + value.substr(value.length - 10, value.length) : value
                } else {
                    valuetxt = '无'
                }
                return {
                    name: '错误信息',
                        value: valuetxt,
                        orginValue: value
                };
                // case 'pieces':
                //     return{
                //         name: '片段详情', value: utils.Base64.decode(value), orginValue: value
                //     };
            case 'piece_size':
            case 'pieceSize':
                return {
                    name: '片段大小', value: utils.formatSize(value), orginValue: value
                };
            case 'comment': {
                var valuetxt = ""
                if (value) {
                    valuetxt = value.length > 18 ? value.substr(0, 8) + '...' + value.substr(value.length - 10, value.length) : value
                } else {
                    valuetxt = '无'
                }
                return {
                    name: '描述',
                    value: valuetxt,
                    orginValue: value
                };
            }
            case 'total_wasted':
            case 'totalSize':
                return {
                    name: '数据总量', value: utils.formatSize(value), orginValue: value
                };
            case 'total_uploaded':
            case 'uploadedEver':
                return {
                    name: '种子上传的总数据', value: utils.formatSize(value), orginValue: value
                };
            case 'total_uploaded_session':
                return {
                    name: '此会话上传的数据总量', value: utils.formatSize(value), orginValue: value
                };
            case 'total_downloaded':
            case 'downloadedEver':
                return {
                    name: '下载的总数据', value: utils.formatSize(value), orginValue: value
                };
            case 'total_downloaded_session':
                return {
                    name: '当前会话下载总量', value: utils.formatSize(value), orginValue: value
                };
            case 'up_limit':
            case 'uploadLimit':
                return {
                    name: '上传限制', value: value == -1 ? '∞' : utils.formatSize(value) + '/s', orginValue: value
                };
            case 'dl_limit':
            case 'downloadLimit':
                return {
                    name: '下载限制', value: value == -1 ? '∞' : utils.formatSize(value) + '/s', orginValue: value
                };
            case 'downloadLimited':
                return {
                    name: '已下载限制', value: value ? '是' : '否', orginValue: value
                };
            case 'uploadLimited':
                return {
                    name: '已上传限制', value: value ? '是' : '否', orginValue: value
                };
            case 'name':
                var valuetxt = ""
                if (value) {
                    valuetxt = value.length > 18 ? value.substr(0, 8) + '...' + value.substr(value.length - 10, value.length) : value
                } else {
                    valuetxt = '无'
                }
                return {
                    name: '名称',
                        value: valuetxt,
                        orginValue: value
                };
            case 'torrentFile':
                var valuetxt = ""
                if (value) {
                    valuetxt = value.length > 18 ? value.substr(0, 8) + '...' + value.substr(value.length - 10, value.length) : value
                } else {
                    valuetxt = '无'
                }
                return {
                    name: '种子文件名',
                        value: valuetxt,
                        orginValue: value
                };
            case 'hash':
            case 'hashString':
                var valuetxt = ""
                if (value) {
                    valuetxt = value.length > 18 ? value.substr(0, 8) + '...' + value.substr(value.length - 10, value.length) : value
                } else {
                    valuetxt = '无'
                }
                return {
                    name: 'Hash',
                        value: valuetxt,
                        orginValue: value
                };
            case 'magnetLink':
                var valuetxt = ""
                if (value) {
                    valuetxt = value.length > 18 ? value.substr(0, 8) + '...' + value.substr(value.length - 10, value.length) : value
                } else {
                    valuetxt = '无'
                }
                return {
                    name: '磁力链接',
                        value: valuetxt,
                        orginValue: value
                };
            case 'manualAnnounceTime':
                return {
                    name: '手动汇报于', value: value == '0' ? '-' : utils.formatTime(new Date(value * 1000)), orginValue: value
                };
            case 'time_elapsed':
                return {
                    name: '活动时间', value: utils.formatSecToStr(value), orginValue: value
                };
            case 'seeding_time':
                return {
                    name: '做种时间', value: utils.formatSecToStr(value), orginValue: value
                };
            case 'nb_connections':
            case 'maxConnectedPeers':
                return {
                    name: '连接', value: value, orginValue: value
                };
            case 'metadataPercentComplete':
                return {
                    name: '元数据完成', value: (value * 100).toFixed(2) + '%', orginValue: value
                };
            case 'nb_connections_limit':
            case 'peer-limit':
                return {
                    name: '连接限制', value: value == -1 ? '∞' : value, orginValue: value
                };
                // case 'wanted':
                //     return {
                //         name: '需要下载', value: utils.formatSize(value), orginValue: value
                //     };
            case 'seedRatioMode':
                return {
                    name: '停止做种当分享率达', value: value, orginValue: value
                };
            case 'seedRatioLimit':
                return {
                    name: '分享率限制', value: value == -1 ? '∞' : value.toFixed(2), orginValue: value
                };
            case 'share_ratio':
                return {
                    name: '分享率', value: value == -1 ? '∞' : value.toFixed(2), orginValue: value
                };
            case 'completion_date':
            case 'doneDate':
                return {
                    name: '完成于', value: value == '0' ? '-' : utils.formatTime(new Date(value * 1000)), orginValue: value
                };
            case 'created_by':
            case 'creator':
                return {
                    name: '创建者', value: value.length > 18 ? value.substr(0, 8) + '...' + value.substr(value.length - 10, value.length) : value, orginValue: value
                };
            case 'files':
                return {
                    name: '文件数', value: value.length, orginValue: value.length
                };
            case 'haveUnchecked':
                return {
                    name: '未校检', value: utils.formatSize(value), orginValue: value
                };
            case 'dl_speed_avg':
                return {
                    name: '平均下载速度', value: utils.formatSize(value) + '/s', orginValue: value
                };
            case 'dl_speed':
            case 'rateDownload':
                return {
                    name: '下载速度', value: utils.formatSize(value) + '/s', orginValue: value
                };
            case 'eta':
                return {
                    name: 'ETA', value: utils.formatSize(value), orginValue: value
                };
            case 'etaIdle':
                return {
                    name: 'ETA状态', value: utils.formatSize(value), orginValue: value
                };
            case 'last_seen':
                return {
                    name: '最后完整可见', value: value == -1 ? '-' : utils.formatTime(new Date(value * 1000)), orginValue: value
                };
            case 'peers':
                return {
                    name: '用户数', value: value.length, orginValue: value.length
                };
            case 'trackers':
                return {
                    name: 'Tracker', value: value.length, orginValue: value.length
                };
            case 'peersConnected':
                return {
                    name: '已连接用户', value: value, orginValue: value
                };
            case 'seedIdleLimit':
                return {
                    name: '种子会话限制', value: value, orginValue: value
                };
            case 'seedIdleMode':
                return {
                    name: '超时自动停止做种', value: value, orginValue: value
                };
            case 'peersGettingFromUs':
                return {
                    name: '我发给的用户数', value: value, orginValue: value
                };
            case 'peersSendingToUs':
                return {
                    name: '发给我的用户数', value: value, orginValue: value
                };
                // case 'priorities':
                //     return {
                //         name: '属性', value: value.length > 0 ? value.join(',') : '无', orginValue: value.length > 0 ? value.join(',') : '无'
                //     };
            case 'labels':
                return {
                    name: '标签', value: value.length > 0 ? value.join(',') : '无', orginValue: value.length > 0 ? value.join(',') : '无'
                };
            case 'queuePosition':
                return {
                    name: '队列位置', value: value, orginValue: value
                };
            case 'percentDone':
                return {
                    name: '完成率', value: value, orginValue: value
                };
            case 'peers_total':
                return {
                    name: '用户总计', value: value, orginValue: value
                };
            case 'pieces_have':
                return {
                    name: '完成区块', value: value, orginValue: value
                };
            case 'pieceCount':
            case 'pieces_num':
                return {
                    name: '总区块数', value: value, orginValue: value
                };
            case 'reannounce':
                return {
                    name: '下次汇报', value: utils.formatSecToStr(value), orginValue: value
                };
            case 'seeds':
                return {
                    name: '种子数', value: value, orginValue: value
                };
            case 'webseeds':
                return {
                    name: '种子数', value: value.length, orginValue: value.length
                };
            case 'webseedsSendingToUs':
                return {
                    name: '发送给我的种子数', value: value, orginValue: value
                };
            case 'seeds_total':
                return {
                    name: '种子总计', value: value, orginValue: value
                };
                // case 'leecherCount':
                //     return {
                //         name: '下载（活跃）', value: value, orginValue: value
                //     };
                // case 'seederCount':
                //     return {
                //         name: '种子（活跃）', value: value, orginValue: value
                //     };
            case 'total_size':
                return {
                    name: '总大小', value: utils.formatSize(value), orginValue: value
                };
            case 'leftUntilDone':
                return {
                    name: '剩余', value: utils.formatSize(value), orginValue: value
                };
            case 'up_speed_avg':
                return {
                    name: '平均上传速度', value: utils.formatSize(value) + '/s', orginValue: value
                };
            case 'up_speed':
            case 'rateUpload':
                return {
                    name: '上传速度', value: utils.formatSize(value) + '/s', orginValue: value
                };
            case 'uploadRatio':
                return {
                    name: '上传率', value: value, orginValue: value
                };
            case 'recheckProgress':
                return {
                    name: '重新校检进度', value: value.toFixed(2), orginValue: value
                };
        }
        return {
            name: name,
            value: value,
            orginValue: value,
            hidden: true
        };
    },
    onFileLongPress(e) {
        var that = this
        var item = e.currentTarget.dataset.item;
        //依次为 下载（不下载），高，正常，低，重命名
        // qb的文件优先级只有：
        // 0	Do not download
        // 1	Normal priority
        // 6	High priority
        // 7	Maximal priority
        // tr的文件优先级设置有:
        // files-wanted 下载
        // files-unwanted 不下载
        // priority-high
        // priority-low
        // priority-normal
        console.log(item)
        // 先获取显示下载还是不下载
        var DownloadOrNot = {}
        if (that.data.is_tr) {
            DownloadOrNot = item.data.wanted || item.data.unwanted == false ? {
                txt: "不下载",
                value: 0
            } : {
                txt: "下载",
                value: 1
            }
        } else {
            DownloadOrNot = item.data.priority == 0 ? {
                txt: "下载",
                value: 1
            } : {
                txt: "不下载",
                value: 0
            }
        }

        var itemlist = [DownloadOrNot, {
            txt: '高优先级',
            value: 6
        }, {
            txt: '正常优先级',
            value: 1
        }, {
            txt: '低优先级',
            value: 7
        }, {
            txt: '重命名',
            value: '-1'
        }]
        //tr不支持对种子里的文件重命名
        if (this.data.is_tr) itemlist.pop()
        var titles = []
        itemlist.forEach(item => {
            titles.push(item.txt)
        })
        wx.showActionSheet({
            alertText: '选择操作',
            itemList: titles,
            success(res) {
                var ids = []
                if (Array.isArray(item.data)) {
                    item.data.forEach(temp => {
                        ids.push(temp.index)
                    })
                    ids = that.data.is_tr ? ids : ids.join('|')
                } else {
                    ids = that.data.is_tr ? [item.data.index] : item.data.index
                }
                var params = {
                    hash: that.data.hashes,
                    id: ids,
                    priority: itemlist[res.tapIndex].value
                }
                console.log(params)
                if (res.tapIndex <= 3) {
                    // console.log(params)
                    that.updateSetting(params, config.client.Set_file_priority)
                    // 文件重命名
                } else {
                    if (that.data.is_tr) {
                        wx.showToast({
                            title: 'tr不支持该选项',
                            icon: 'none'
                        })
                    } else {
                        var oldPath = item.type == 'folder' ? item.key : item.data.name
                        wx.showModal({
                            title: '重命名',
                            content: oldPath,
                            editable: true,
                            placeholderText: '请输入',
                            success(res) {
                                if (res.confirm) {
                                    var url = config.client.Rename_file
                                    if (item.type == 'folder') {
                                        url = config.client.Rename_folder
                                    }
                                    params = {
                                        hash: that.data.hashes,
                                        oldPath: oldPath,
                                        newPath: res.content
                                    }
                                    that.updateSetting(params, url)
                                }
                            }
                        })
                    }
                }
            }
        })
    },
    updateSetting(params, url) {
        var that = this
        MyRequest.GetClient(this.data.currentServerConfig, url, function (res) {
            if (!res.success) {
                wx.showToast({
                    title: '设置失败',
                    icon: 'none'
                })
            } else {
                // console.log(res)
                //qb需启用队列功能才能调整种子的优先级
                if (res.statusCode == 409 && !that.data.is_tr) {
                    wx.showToast({
                        title: '请先启用队列功能',
                        icon: "none"
                    })
                } else {
                    that.setData({
                        triggered: true
                    })
                }

            }
        }, params)
    },
    gotoPrevPath() {
        var lastIndex = this.data.currentpath.lastIndexOf('/')
        var path = this.data.currentpath.substr(0, lastIndex)
        this.setData({
            currentpath: path,
            currenttext: path.length > 0 ? '返回上一级' : '根目录'
        })
        var list = this.getFileListByPathIndex(this.all_files, this.data.currentpath)
        this.showViewByList(list);
    },
    gotoNextPath(e) {
        var item = e.currentTarget.dataset.item;
        if (item.type == "folder") {
            this.setData({
                scroll_top: 0, //scroll-view 滚动到顶部
                currentpath: this.data.currentpath == '/' ? '/' + item.key : this.data.currentpath + '/' + item.key,
                currenttext: '返回上一级'
            })
            var list = this.getFileListByPathIndex(this.all_files, this.data.currentpath)
            this.showViewByList(list);
        } else {
            this.onFileLongPress(e)
        }
    },
    //根据路径构造该路径下的文件和文件夹信息列表
    getFileListByPathIndex(files, pathIndex) {
        var checkResult = this.checkPageFilesInfoIsExist(pathIndex)
        // 存在直接返回数据
        if (checkResult) return checkResult
        //不存在则获取
        // console.log(files)
        wx.showLoading({
            title: '加载中..',
        })
        var showlist = []
        //去掉前面的斜杠再处理
        if (pathIndex.indexOf('/') == 0) {
            pathIndex = pathIndex.substr(1, pathIndex.length)
        }
        // ‘/’表示根目录，去掉后，pathIndex就为空，所以要判断一下非根目录情况下
        var subfromindex = 0
        // console.log(pathIndex)
        if (pathIndex) {
            subfromindex = pathIndex.length + 1
        }
        var total_count = files.length
        var files_count = 0
        var folder_count = 0
        files.forEach(item => {
            var index = item.name.indexOf(pathIndex)
            //只取以当前目录开头的那些条目，即当前目录下
            if (index == 0) {
                var temp = item.name.substr(subfromindex, item.name.length)
                var pos = temp.indexOf('/')
                //剔除当前目录后，名字还有 ‘/’的则表示还是目录，否则就是文件
                if (pos == -1) {
                    showlist.push({
                        key: temp,
                        type: "file",
                        icon: this.getIconByFileName(temp),
                        data: item
                    })
                    files_count++
                } else if (pos > 0) {
                    // 名字还有 ‘/’的情况下，获取下一级子目录名称
                    var subname = temp.substr(0, pos)
                    // 判断list里面是否保存有该目录
                    var targetIndex = this.checkIsExsit(showlist, {
                        key: subname
                    })
                    // 没有则加入list
                    if (targetIndex == -1) {
                        showlist.push({
                            key: subname,
                            type: "folder",
                            icon: '/icons/file/folder.svg',
                            data: this.getPathDataByKey(subname)
                        })
                        folder_count++
                    }
                }
            }
        })

        this.setData({
            total_count_text: this.data.currentpath.length <= 1 ? '共' + total_count + '个文件,' : '',
            current_folder: folder_count,
            current_files: files_count
        })
        var temp = []

        showlist.forEach(element => {
            var priority = element.data.priority
            var prioritytxt = url2tr.getPriority(priority, this.data.is_tr)
            // console.log(element, prioritytxt)
            if (this.data.is_tr) {
                if (!element.data.wanted || element.data.unwanted) {
                    prioritytxt = "不下载"
                }
            }
            var size = utils.formatSize(element.data.size)
            var progresstxt = (100 * element.data.progress).toFixed(1) + "%"
            if (element.type == "folder") {
                var attr = this.getFolderAttriute(element.data)
                priority = attr.priority
                prioritytxt = attr.prioritytxt
                size = attr.size
                progresstxt = (100 * attr.progresstxt).toFixed(1) + "%"
            }
            temp.push({
                key: element.key,
                type: element.type,
                icon: element.icon,
                data: element.data,
                priority: priority,
                prioritytxt: prioritytxt,
                size: size,
                progresstxt: progresstxt
            })
        });
        wx.hideLoading()
        //每次获取都记下该页原始数据，后续判断是否读取过，读取过就直接返回，提高性能
        this.file_page_info_list.push({
            pathIndex: '/' + pathIndex,
            data: temp
        })
        return temp;
    },
    getFolderAttriute(datas) {
        var downSize = 0
        var undownSize = 0
        var totalSize = 0
        var priority = 1
        datas.forEach(data => {
            totalSize += data.size
            if (data.priority == 0) {
                priority = -1
                undownSize += data.size
            } else {
                downSize += data.size
            }
            if (downSize == 0) {
                priority = 0
            }
        })
        return {
            prioritytxt: url2tr.getPriority(priority, this.data.is_tr),
            priority: priority,
            size: utils.formatSize(totalSize),
            progresstxt: downSize / totalSize
        }
    },
    //判断是否存在该路径下的文件列表信息,存在则直接返回该路径下的数据
    checkPageFilesInfoIsExist(path) {
        if (!this.file_page_info_list || this.file_page_info_list.length <= 0) return false
        if (path.length <= 0) path = '/'
        // console.log(path, this.file_page_info_list)
        for (var i = 0; i < this.file_page_info_list.length; i++) {
            var item = this.file_page_info_list[i]
            if (item.pathIndex == path) return item.data
        }
        return false
    },
    showViewByList(data) {
        //保存符合条件的全部数据，供加载更多截取使用
        this.current_show_data = data
        var showdata = data.slice(0, this.data.pageSize)
        this.setData({
            listData: showdata
        })
    },
    onLoadmore() {
        var old = this.data.listData
        var targetdata = this.current_show_data
        if (targetdata.length <= this.data.pageSize) return
        var showData = targetdata.slice(0, old.length + this.data.pageSize)
        this.setData({
            listData: showData
        })
    },
    //过滤当前tabs显示的内容
    onSearchInput(e) {
        var key = e.detail.value
        this.onSearchByKeyWord(key)
    },
    onSearchConfirm(e) {
        var key = e.detail.value
        this.onSearchByKeyWord(key)
    },
    onSearchByKeyWord(key) {
        var originData = this.activeTabData
        //文件内容列表特殊处理
        if (this.data.activeTab == 2) {
            //当前路径下的全部数据
            originData = this.getFileListByPathIndex(this.all_files, this.data.currentpath)
        }
        //关键字为空则显示全部
        if (utils.trimAllBlank(key) == "") {
            this.showViewByList(originData)
            return
        }
        this.searachResult = []
        for (var i = 0; i < originData.length; i++) {
            var item = originData[i]
            var name = ""
            if (this.data.activeTab == 2) {
                name = item.key
            } else if (this.data.activeTab == 3) {
                name = item.url + item.status + item.msg
            } else if (this.data.activeTab == 4) {
                name = item.client + item.connection + item.country + item.country_code
            } else if (this.data.activeTab == 5) {
                name = item.url
            }
            if (name.toLowerCase().indexOf(key) != -1) {
                this.searachResult.push(item)
            }
        }
        this.showViewByList(this.searachResult)
    },
    getPathDataByKey(subname) {
        var current = this.data.currentpath.substr(1)
        var key = current + "/" + subname
        if (key.indexOf('/') == 0)
            key = key.substr(1)
        var temp = []
        this.all_files.forEach(item => {
            if (item.name.indexOf(key) == 0) {
                temp.push(item)
            }
        })
        return temp;
    },
    getFirstPath(item) {
        var key = item.name;
        var type = "files"
        var pos = item.name.indexOf('/');
        if (pos > 0) {
            key = item.name.substr(0, pos)
            type = "folder"
            item.name = item.name.substr(pos + 1, item.name.length)
        }
        return {
            key: key,
            type: type,
            data: item
        }
    },
    checkIsExsit(list, target) {
        for (var i = 0; i < list.length; i++) {
            if (list[i].key == target.key) {
                return i
            }
        }
        return -1
    },
    getIconByFileName(fileName) {
        var fileExtension = fileName.split('.').pop().toLowerCase();
        switch (fileExtension) {
            case "exe":
                return "/icons/file/exe.svg"
            case "jpg":
            case "png":
            case "jpeg":
            case "jpg":
                return "/icons/file/pic.svg"
            case "avi":
            case "mpeg":
            case "wmv":
            case "mpeg":
            case "m4v":
            case "mov":
            case "asf":
            case "flv":
            case "f4v":
            case "rmvb":
            case "rm":
            case "mov":
            case "avchd":
            case "mkv":
            case "m2ts":
            case "mp4":
            case "bdmv":
            case "mpls":
                return "/icons/file/movie.svg"
            case "nfo":
            case "txt":
            case "xml":
                return "/icons/file/txt.svg"
        }
        return "/icons/file/other.svg"
    },
    onNaviBack() {
        wx.navigateBack()
    },
    onShareAppMessage: function () {
        return app.onShareCommon()
    }
})