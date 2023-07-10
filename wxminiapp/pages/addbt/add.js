// pages/add/add.js
var utils = require('../../utils/util.js')
var Client = require('../../client.js')
var config = require('../../config.js')
const app = getApp()
var MyRequest = require('../../myRequest.js')
Page({
    data: {
        serverIndex: -1,
        currentServerConfig: '',
        myNavBarData: {
            my_nav_type: 'normal'
        },
        inputData: '',
        error: '',
        itemList: [{
                "name": "添加种子/链接",
                "key": "torrents",
                "value": "选择或添加",
                "originValue": "",
                "select": true,
                "fortype": 'qb,tr'
            },
            {
                "name": "保存位置",
                "key": "save_path",
                "value": "点击修改",
                "originValue": "",
                "istextarea": true,
                "placeholder": "保存位置",
                "desc": '此次下载文件的保存位置设置',
                "fortype": 'qb,tr'
            },
            {
                "name": "重新命名",
                "key": "rename",
                "value": "",
                "originValue": "",
                "istextarea": true,
                "placeholder": "可重新命名",
                "desc": '',
                "fortype": 'qb'
            },
            {
                "name": "标签",
                "key": "tags",
                "value": "选择",
                "originValue": "",
                "placeholder": "",
                "desc": '',
                "fortype": 'qb'
            },
            {
                "name": "分类",
                "key": "category",
                "value": "选择",
                "originValue": "",
                "placeholder": "",
                "desc": '',
                "fortype": 'qb'
            },
            // {
            //     "name": "上传速度限制",
            //     "key": "upLimit",
            //     "value": "未限制",
            //     "originValue": "",
            //     "type": 'digit',
            //     "placeholder": "",
            //     "desc": '单位KiB/s,填0则表示不限制'
            // },
            // {
            //     "name": "下载速度限制",
            //     "key": "dlLimit",
            //     "value": "未限制",
            //     "originValue": "",
            //     "type": 'digit',
            //     "placeholder": "",
            //     "desc": '单位KiB/s,填0则表示不限制'
            // },
            {
                "name": "跳过Hash检查",
                "switch": true,
                "key": "skip_checking",
                "value": false,
                "originValue": false,
                "fortype": 'qb'
            },
            {
                "name": "手动开始",
                "switch": true,
                "key": "paused",
                "value": false,
                "originValue": false,
                "fortype": 'qb,tr'
            },
            {
                "name": "创建根文件夹",
                "switch": true,
                "key": "root_folder",
                "value": false,
                "originValue": false,
                "fortype": 'qb'
            },
            {
                "name": "顺序下载",
                "switch": true,
                "key": "sequentialDownload",
                "value": false,
                "originValue": false,
                "fortype": 'qb'
            },
            {
                "name": "先下载首尾",
                "switch": true,
                "key": "firstLastPiecePrio",
                "value": false,
                "originValue": false,
                "fortype": 'qb'
            }
        ],
        committype: 'file',
        selectedFile: '', //选择的文件对象
        filepath: ''
    },
    onNaviBack() {
        wx.navigateBack()
    },
    onCellTap(e) {
        var data = e.currentTarget.dataset.item;
        // console.log(data)
        data.urltype = "add"
        if (!data.select) {
            if (data.key == "tags" || data.key == "category") {
                // 设置标签和分类
                wx.navigateTo({
                    url: '/pages/tags/tags?value=' + data.originValue + '&type=' + data.key + "&index=" + this.data.serverIndex + "&download=true"
                })
            } else {
                //输入值
                var params = encodeURIComponent(JSON.stringify(data));
                wx.navigateTo({
                    url: '/pages/input/input?data=' + params
                })
            }
        } else if (data.key == "torrents") {
            var that = this
            wx.showActionSheet({
                alertText: '选择添加方式',
                itemList: ['种子文件', '种子链接'],
                success(res) {
                    if (res.tapIndex == 0) {
                        wx.chooseMessageFile({
                            count: 1,
                            type: 'file',
                            extension: ['torrent'],
                            success(e) {
                                var filename = e.tempFiles[0].name
                                if (!utils.endWith(filename, '.torrent')) {
                                    wx.showToast({
                                        title: '文件格式必须为torrent',
                                        icon: 'none'
                                    })
                                } else {
                                    that.setItemValueByKey("torrents", filename);
                                    that.setData({
                                        itemList: that.data.itemList,
                                        filepath: e.tempFiles[0].path
                                    })
                                }
                            },
                            fail(e) {
                                wx.showToast({
                                    title: '选择取消',
                                    icon: 'none'
                                })
                            }
                        })
                    } else {
                        var urlOrFileData = that.getItemByKey("torrents")
                        var inputDesc = {
                            "name": "填写地址",
                            "key": "torrents",
                            "value": "",
                            "originValue": urlOrFileData.originValue ? urlOrFileData.originValue : "",
                            "istextarea": true,
                            "placeholder": "下载地址",
                            "desc": '支持http://,https://,magnet://,bc://,bt/开头,每个地址一行'
                        }
                        var params = encodeURIComponent(JSON.stringify(inputDesc))
                        wx.navigateTo({
                            url: '/pages/input/input?data=' + params
                        })
                    }
                }
            })
        }
    },
    getItemByKey(key) {
        for (var i = 0; i < this.data.itemList.length; i++) {
            if (this.data.itemList[i].key == key) return this.data.itemList[i]
        }
        return null
    },
    onSwitch(e) {
        var key = e.currentTarget.dataset.item
        var value = e.detail.value
        // if(key=="paused")
        //     value = !value
        this.setItemValueByKey(key, value);
        this.setData({
            itemList: this.data.itemList
        })
    },
    formSubmit(e) {
        var formdata = {};
        for (var i = 0; i < this.data.itemList.length; i++) {
            var item = this.data.itemList[i]
            var key = item["key"];
            var value = item["originValue"];
            if (value) {
                if (key == "save_path") {
                    formdata['save_path'] = ""
                    formdata['savepath'] = value
                }
                formdata[key] = value
            }
            //始终传这个值
            if (key == "paused") {
                formdata[key] = value
            }
        }
        // console.log(formdata)
        if (!formdata.torrents) {
            this.setData({
                error: "请填写url或者选择种子文件"
            })
        } else {
            //for debug
            // this.readyToAdd(formdata)
            // return
            // 验证是否绑定微信
            var userInfo = wx.getStorageSync('userInfo')
            if(userInfo){
                this.readyToAdd(formdata)
            }else{
                var that = this
                app.checkUserWxRegist(function (result) {
                    if (result.info=="not_regist"||result.info=="cancel_regist") {
                        wx.showModal({
                            title: '该功能需绑定微信，是否绑定？',
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
                                                    that.readyToAdd(formdata)
                                                }
                                            })
                                        }
                                    })
                                }
                            }
                        })
                    } else if(result.info=="registed") {
                        wx.setStorageSync('userInfo', result.userInfo)
                        that.readyToAdd(formdata)
                    }
                })   
            }
        }
    },
    //开始准备添加
    readyToAdd(formdata){
        wx.showLoading({title: '请稍后'})
        //url链接方式添加
        if (this.data.committype == "urls") {
            formdata["urls"] = formdata['torrents']
            formdata["torrents"] = ""
            Client.NewDownloadTaskWithUrl(this.data.currentServerConfig,formdata,this.onNewDownloadTaskResult)
        } else { //文件上传方式添加
            formdata["urls"] = ""
            formdata["filepath"] = this.data.filepath
            Client.NewDownloadTaskWithFile(this.data.currentServerConfig,formdata,this.onNewDownloadTaskResult)
        }
    },
    onNewDownloadTaskResult(result){
        wx.hideLoading()
        if(result.success){
            wx.navigateBack()
        }else{
            wx.showModal({
                title: "添加失败",
                content:result.info,
                confirmText: "好吧",
                showCancel:false
            })
        }
    },

    checkUrls(urls) {
        urls = urls.trim()
        return (utils.startWith(urls, "http://") || utils.startWith(urls, "https://") || utils.startWith(urls, "magnet:") || utils.startWith(urls, "bc://bt/"))
    },
    setItemValueByKey(key, value) {
        for (var i = 0; i < this.data.itemList.length; i++) {
            var item = this.data.itemList[i]
            // console.log(item)
            if (item.key == key) {
                //保留原始值
                item.originValue = value;
                //设置显示方式
                if (key == "alt_dl_limit" || key == "alt_up_limit") {
                    value = utils.formatSize(value) + "/s"
                }
                if (key == "save_path") {
                    if (value.length > 20) {
                        value = value.substr(0, 8) + "..." + value.substr(value.length - 10, value.length)
                    }
                }
                if (key == "torrents" && value) {
                    if (utils.endWith(value, ".torrent")) {
                        if (value.length > 20) {
                            value = value.substr(0, 8) + "..." + value.substr(value.length - 10, value.length)
                        }
                        this.setData({
                            committype: "file"
                        })
                    } else {
                        if (this.checkUrls(value)) {
                            value = "已填写下载地址"
                        } else {
                            value = "下载地址有误"
                        }
                        this.setData({
                            committype: "urls"
                        })
                    }
                }
                item.value = value
                break
            }
        }
    },
    getDefaultSavePath() {
        //获取默认设置
        wx.showLoading({
            title: '请稍后',
        })
        var that = this
        MyRequest.GetClient(this.data.currentServerConfig, config.client.Get_defaultSavePath, function (res) {
            wx.hideLoading()
            if (res && res.success && res.data) {
                if (that.data.is_tr) {
                    res.data = res.data['download-dir']
                }
                that.setItemValueByKey("save_path", res.data)
                that.setData({
                    itemList: that.data.itemList
                })
            } else {
                wx.showToast({
                    title: '默认保存位置获取失败',
                    icon: "none"
                })
            }
        })
    },
    onLoad: async function (options) {
        this.setData({
            contentHeight: app.globalData.screenHeight - app.globalData.navBarHeight,
            contentTop: app.globalData.navBarHeight,
            serverIndex: options.index,
        })
        var list = wx.getStorageSync('serverlist')
        this.data.currentServerConfig = list[this.data.serverIndex]
        this.data.is_tr = this.data.currentServerConfig.type == "Transmission"
        //根据tr还是qb确定是否显示对应项
        for (var i = 0; i < this.data.itemList.length; i++) {
            var item = this.data.itemList[i]
            if (this.data.is_tr) {
                item.show = item.fortype.indexOf('tr') != -1
            } else {
                item.show = item.fortype.indexOf('qb') != -1
            }
        }
        this.getDefaultSavePath()
    },
    onShow: function () {
        // console.log(this.data.inputData)
        if (this.data.inputData) {
            this.setItemValueByKey(this.data.inputData.key, this.data.inputData.value);
            this.setData({
                itemList: this.data.itemList,
            })
        }
    },
    /**
     * 用户点击右上角分享
     */
    onShareAppMessage: function () {
        return app.onShareCommon()
    }
})