// pages/tags/tags.js
var utils = require('../../utils/util.js')
var Client = require('../../client.js')
var config = require('../../config.js')
const app = getApp()
var MyRequest = require('../../myRequest.js')
Page({
    data: {
        radio_checkbox_color: '#13b2ae',
        modal_title: '新建',
        fromdownload: false, //是否来自新建下载页面
        downloadValue: '', //来自下载页面，已选择的值
        isedit: false, //是否是编辑目录
        hiddenmodalput: true,
        nameTextInput: '',
        savePathInput: '',
        triggered: false,
        torrent_data: '',
        main_title: '设置分类',
        viewtype: 'category',
        itemList: []
    },
    onNaviBack() {
        var pages = getCurrentPages();
        var prevPage = pages[pages.length - 2];
        prevPage.setData({
            needRefresh: true,
            inputData: {
                key: this.data.viewtype,
                value: this.data.downloadValue
            }
        });
        wx.navigateBack({
            delta: 1,
        })
    },
    /**
     * 生命周期函数--监听页面加载
     */
    onLoad: function (options) {
        // console.log(options)
        var data = options.data ? JSON.parse(decodeURIComponent(options.data)) : ''
        var title = "标签/分类/日志"
        if (options.type == 'tags') {
            title = options.download ? "选择标签" : "管理标签"
        } else if (options.type == 'category') {
            title = options.download ? "选择分类" : "管理分类"
        } else if (options.type == "syslog") {
            title = "日志(仅最新100条)"
        } else if (options.type == "peerlog") {
            title = "PEER记录"
        }
        this.setData({
            contentHeight: wx.getSystemInfoSync().windowHeight - app.globalData.navBarHeight,
            contentTop: app.globalData.navBarHeight,
            main_title: title,
            torrent_data: data,
            viewtype: options.type,
            clientIndex: options.index,
            fromdownload: options.download,
            downloadValue: options.value,
            radio_checkbox_color: wx.getSystemInfoSync().theme == "dark" ? "#1f7769" : "#13b2ae"
        })
        wx.onThemeChange((result) => {
            this.setData({
                radio_checkbox_color: result.theme == "dark" ? "#1f7769" : "#13b2ae"
            })
        })
        var list = wx.getStorageSync('serverlist')
        this.data.currentServerConfig = list[this.data.clientIndex]
        this.getList(this.data.viewtype)
    },
    getList(type) {
        if (this._freshing) return
        this._freshing = true
        wx.showLoading({
            title: '请稍后',
        })
        var that = this
        if (type == "tags") {
            Client.GetClientTags(this.data.currentServerConfig,function(result){
                that.onListHandler(type,result)
            })
        } else if (type == "category") {
            Client.GetClientCategory(this.data.currentServerConfig,function(result){
                that.onListHandler(type,result)
            })
        } else if (type == "syslog") {
            Client.GetClientMainLog(this.data.currentServerConfig,function(result){
                that.onListHandler(type,result)
            })
        } else if (type == "peerlog") {
            Client.GetClientPeerLog(this.data.currentServerConfig,function(result){
                that.onListHandler(type,result)
            })
        }
    },
    onListHandler(type,e) {
        wx.hideLoading()
        this.setData({
            triggered: false
        })
        this._freshing = false
        if (e && e.success && e.data) {
            var list = []
            if (type == "category") {
                // 显示已选的目录
                for (var name of Object.keys(e.data)) {
                    var obj = e.data[name]
                    if (Object.keys(obj).includes("save_path")) {
                        obj.savePath = obj.save_path //版本不一致，该字段名称不一样，坑
                    }
                    //来自新建页面
                    if (this.data.fromdownload) {
                        if (this.data.downloadValue && this.data.downloadValue.includes(obj.name)) {
                            obj.checked = true
                        }
                    } else {
                        // 来自已创建的下载
                        if (this.data.torrent_data && obj.name == this.data.torrent_data.category) {
                            obj.checked = true
                        }
                    }
                    list.push(obj)
                }
            } else if (type == "tags") {
                // 显示已选的标签
                e.data.forEach(item => {
                    var obj = {
                        name: item
                    }
                    if (this.data.fromdownload) {
                        // console.log(that.data.downloadValue, obj.name)
                        if (this.data.downloadValue && this.data.downloadValue.includes(obj.name)) {
                            obj.checked = true
                        }
                    } else {
                        if (this.data.torrent_data && this.data.torrent_data.tags.includes(item)) {
                            obj.checked = true
                        }
                    }
                    list.push(obj)
                });
            } else if (type == "syslog" || type == "peerlog") {
                if (e.data.length > 0) {
                    // 只取最新100条
                    for (var i = e.data.length - 1; i >= 0; i--) {
                        var item = e.data[i]
                        if (item.type != 1) {
                            list.push({
                                message: type == "syslog" ? item.message : '',
                                ip: type == "syslog" ? "" : item.ip,
                                reason: type == "syslog" ? '' : item.reason,
                                blocked: type == "syslog" ? '' : item.blocked,
                                type: type == "syslog" ? this.getLogTypeText(item.type) : '',
                                time: utils.formatTime(new Date(item.timestamp))
                            })
                        }
                        if (list.length >= 100) break
                    }
                }
            }
            this.setData({
                itemList: list
            })
        } else {
            wx.showToast({
                title: '请求失败',
                icon: 'error'
            })
        }
    },
    getLogTypeText(logtype) {
        switch (logtype) {
            case 1:
                return "Normal"
            case 2:
                return "INFO"
            case 3:
                return "WARNING"
            case 4:
                return "CRITICAL"
        }
        return "Other"
    },
    //设置标签
    onTagsCheckboxChange(e) {
        // console.log(e)
        var list = e.currentTarget.dataset.item
        var values = e.detail.value
        var checklist = []
        var unchecklist = []
        for (var i = 0; i < list.length; i++) {
            var item = list[i]
            if (values.includes(item.name)) {
                checklist.push(item.name)
            } else {
                unchecklist.push(item.name)
            }
        }
        //console.log(checklist, unchecklist)
        //为某个种子添加标签
        if (checklist.length) {
            var url = config.client.Add_torrent_tags
            var data = {
                hashes: this.data.torrent_data.hash,
                tags: checklist.join(',')
            }
            // 来自新建下载页面时不需要修改值只需要返回值
            if (this.data.fromdownload) {
                this.data.downloadValue = checklist.join(',')
            } else {
                this.onChangeEvent(url, data)
            }
        } else {
            // 来自新建下载页面时不需要修改值只需要返回值
            if (this.data.fromdownload) {
                this.data.downloadValue = "选择"
            }
        }
        // 为某个种子移除标签,来自新建页面时不需要处理
        if (unchecklist.length && !this.data.fromdownload) {
            var url = config.client.Remove_torrent_tags
            var data = {
                hashes: this.data.torrent_data.hash,
                tags: unchecklist.join(',')
            }
            this.onChangeEvent(url, data)
        }
    },
    // 为某个种子设置目录
    onCategoryRadioChange(e) {
        var value = e.detail.value
        var url = config.client.Set_torrent_category
        var data = {
            hashes: this.data.torrent_data.hash,
            category: value
        }
        // 来自新建下载页面时不需要修改值只需要返回值
        if (this.data.fromdownload) {
            this.data.downloadValue = value ? value : "选择"
        } else {
            this.onChangeEvent(url, data)
        }
    },
    // 处理某个种子下载页面的标签或目录
    async onChangeEvent(url, data) {
        MyRequest.GetClient(this.data.currentServerConfig, url, function (res) {
            wx.hideLoading()
            if (!res.success) {
                wx.showToast({
                    title: '操作失败',
                    icon: 'error'
                })
            }
        }, data)
    },
    // 新建标签或类别
    async onCreateTagOrCategory(e) {
        this.setData({
            hiddenmodalput: false,
            modal_title: '新建',
            isedit: false,
            nameTextInput: '',
        })
        if (this.data.torrent_data) {
            this.setData({
                savePathInput: this.data.torrent_data.save_path,
            })
        } else if (this.data.viewtype == 'category') {
            //获取全局配置中默认保存位置
            wx.showLoading({
                title: '请稍后',
            })
            var that = this
            MyRequest.GetClient(this.data.currentServerConfig, config.client.Get_defaultSavePath, function (res) {
                wx.hideLoading()
                that.setData({
                    hiddenmodalput: false
                })
                if (res.success) {
                    that.setData({
                        savePathInput: res.data
                    })
                }
            })

        } else {
            this.setData({
                hiddenmodalput: false
            })
        }

    },
    onSavePathTextInput(e) {
        this.setData({
            savePathInput: e.detail.value
        })
    },
    onNameTextInput(e) {
        this.setData({
            nameTextInput: e.detail.value
        })
    },
    // 为服务器创建目录或标签
    async onCreateConfirm(e) {
        var url = ""
        var params = {}
        if (this.data.viewtype == "tags") {
            url = config.client.Create_tags
            params = {
                tags: this.data.nameTextInput
            }
        } else if (this.data.viewtype == "category") {
            url = this.data.isedit ? config.client.Edit_category : config.client.Add_new_category
            params = {
                category: this.data.nameTextInput,
                savePath: this.data.savePathInput
            }
        }

        var that = this
        wx.showLoading({
            title: '请稍后',
        })
        MyRequest.GetClient(this.data.currentServerConfig, url, function (res) {
            wx.hideLoading()
            that.setData({
                triggered: true,
                hiddenmodalput: true
            })
            if (!res.success) {
                wx.showToast({
                    title: '保存失败',
                    icon: 'error'
                })
            }
        }, params)
    },
    onCreateCancel() {
        this.setData({
            hiddenmodalput: true
        })
    },
    onCellLongPress(e) {
        var that = this
        var item = e.currentTarget.dataset.item
        var list = this.data.viewtype == 'tags' ? ['删除'] : ['删除', '编辑']
        wx.showActionSheet({
            alertText: item.name,
            itemList: list,
            success(res) {
                if (res.tapIndex == 1) {
                    that.setData({
                        modal_title: '编辑[' + item.name + ']',
                        isedit: true,
                        hiddenmodalput: false,
                        nameTextInput: item.name,
                        savePathInput: item.savePath,
                    })
                } else if (res.tapIndex == 0) {
                    wx.showModal({
                        title: '提示',
                        content: '确定删除[' + item.name + ']吗',
                        success(res) {
                            if (res.confirm) {
                                wx.showLoading({
                                    title: '请稍后',
                                })
                                var url = config.client.Remove_categories
                                var params = {
                                    categories: item.name
                                }
                                if (that.data.viewtype == "tags") {
                                    url = config.client.Delete_tags
                                    params = {
                                        tags: item.name
                                    }
                                }
                                that.onDeleteEvent(url, params)
                            }
                        }
                    })
                }
            }
        })
    },

    // 删除服务器上某个目录或标签
    async onDeleteEvent(url, data) {
        var that = this
        MyRequest.GetClient(this.data.currentServerConfig, url, function (res) {
            wx.hideLoading()
            if (res.success) {
                that.setData({
                    triggered: true
                })
            } else {
                wx.showToast({
                    title: '删除失败',
                    icon: 'error'
                })
            }
        }, data)
    },
    onRefresh() {
        this.getList(this.data.viewtype)
    },

    onHide: function () {
        wx.offThemeChange()
    },
    onUnload: function () {
        wx.offThemeChange()
    },
    onShareAppMessage: function () {
        return app.onShareCommon()
    }
})