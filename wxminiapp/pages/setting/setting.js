// pages/qblogin/qblogin.js
var utils = require('../../utils/util.js')
var Client = require('../../client.js')
var config = require('../../config.js')
const app = getApp()
Page({
    data: {
        switch_color:'#13b2ae',
        inputData: null,
        clientIndex: '',
        navtitle: "选项",
        supportlogview:false,//是否支持查看日志
        itemList: [{
                "name": "默认保存位置",
                "key": "save_path",
                "istextarea": true,
                "value": "",
                "originValue": "",
                "desc": '文件下载后默认保存位置，请填写完整',
                "fortype":"qb,tr"
            }, {
                "name": "标签管理",
                "key": "tags",
                "button": "true",
                "fortype":"qb"
            }, {
                "name": "类别管理",
                "key": "category",
                "button": "true",
                "fortype":"qb"
            }, {
                "name": "启用DHT",
                "key": "dht",
                "switch": true,
                "fortype":"qb,tr"
            }
            , {
                "name": "启用PEX",
                "key": "pex",
                "switch": true,
                "fortype":"qb,tr"
            }, {
                "name": "启用LSD/LPD",
                "key": "lsd",
                "switch": true,
                "fortype":"qb,tr"
            },
            {
                "name": "启用备用速度",
                "key": "alt-speed-enabled",
                "value": "",
                "switch": true,
                "fortype":"tr"
            },
             {
                "name": "备用速度下载限制",
                "key": "alt_dl_limit",
                "value": "",
                "type": 'digit',
                "originValue": "",
                "desc": '单位KiB/s,填0则表示不限制(只针对qb)',
                "fortype":"qb,tr"
            }, {
                "name": "备用速度上传限制",
                "key": "alt_up_limit",
                "value": "",
                "type": 'digit',
                "originValue": "",
                "desc": '单位KiB/s,填0则表示不限制(只针对qb)',
                "fortype":"qb,tr"
            }, {
                "name": "启用全局下载速度限制",
                "key": "speed-limit-down-enabled",
                "value": "",
                "switch": true,
                "fortype":"tr"
            },{
                "name": "全局速度下载限制",
                "key": "dl_limit",
                "value": "",
                "type": 'digit',
                "originValue": "",
                "desc": '单位KiB/s,填0则表示不限制(只针对qb)',
                "fortype":"qb,tr"
            },{
                "name": "启用全局上传速度限制",
                "key": "speed-limit-up-enabled",
                "value": "",
                "switch": true,
                "fortype":"tr"
            }, {
                "name": "全局速度上传限制",
                "key": "up_limit",
                "value": "",
                "type": 'digit',
                "originValue": "",
                "desc": '单位KiB/s,填0则表示不限制(只针对qb)',
                "fortype":"qb,tr"
            }, {
                "name": "启用队列",
                "key": "queueing_enabled",
                "switch": true,
                "fortype":"qb"
            },
            {
                "name": "最大活动的torrent数",
                "key": "max_active_torrents",
                "value": "",
                "type": 'digit',
                "originValue": "",
                "fortype":"qb"
            },
            {
                "name": "启用下载队列",
                "key": "download-queue-enabled",
                "switch": true,
                "fortype":"tr"
            },
            {
                "name": "最大活动的下载数",
                "key": "max_active_downloads",
                "value": "",
                "type": 'digit',
                "originValue": "",
                "fortype":"qb,tr"
            },
            {
                "name": "启用上传队列",
                "key": "seed-queue-enabled",
                "switch": true,
                "fortype":"tr"
            },
            {
                "name": "最大活动的上传数",
                "key": "max_active_uploads",
                "value": "",
                "type": 'digit',
                "originValue": "",
                "fortype":"qb,tr"
            },
            {
                "name": "最大连接数",
                "key": "max_connec",
                "value": "",
                "type": 'digit',
                "originValue": "",
                "fortype":"qb,tr"
            },
            {
                "name": "每个种子最大连接数",
                "key": "max_connec_per_torrent",
                "value": "",
                "type": 'digit',
                "originValue": "",
                "fortype":"qb,tr"
            },{
                "name": "创建子文件夹",
                "key": "create_subfolder_enabled",
                "switch": true,
                "fortype":"qb"
            },{
                "name": "手动开始",
                "key": "start_paused_enabled",
                "switch": true,
                "fortype":"qb,tr"
            }, {
                "name": "完成时重新检查种子",
                "key": "recheck_completed_torrents",
                "switch": true,
                "fortype":"qb"
            },{
                "name": "启用UPNP",
                "key": "upnp",
                "switch": true,
                "fortype":"qb,tr"
            },{
                "name": "启用UTP",
                "key": "utp-enabled",
                "switch": true,
                "fortype":"tr"
            },{
                "name": "使用随机端口",
                "key": "random_port",
                "switch": true,
                "fortype":"qb,tr"
            },
        ]
    },
    viewSysLog() {
        wx.navigateTo({
            url: '/pages/tags/tags?index=' + this.data.clientIndex + "&type=syslog"
        })
    },
    viewPeerLog() {
        wx.navigateTo({
            url: '/pages/tags/tags?index=' + this.data.clientIndex + "&type=peerlog"
        })
    },
    editClientConfig() {
        wx.navigateTo({
            url: '/pages/qblogin/qblogin?index=' + this.data.clientIndex
        })
    },
    removeClient() {
        var that = this
        var item = this.data.currentServerConfig
        wx.showModal({
            title: '注意',
            content: '确认移除客户端[' + item.name + ']?',
            success(res) {
                if (res.confirm) {
                    var list = wx.getStorageSync('serverlist')
                    list.splice(that.data.clientIndex, 1)
                    if (list.length <= 0) {
                        wx.removeStorageSync('serverlist')
                    } else {
                        wx.setStorageSync('serverlist', list)
                    }
                    wx.switchTab({
                        url: '/pages/clientlist/clients',
                    })
                }
            }
        })
    },
    onBack(e) {
        wx.navigateBack()
    },
    onCellTap(e) {
        var data = e.currentTarget.dataset.item;
        if (!data.button) {
            var params = encodeURIComponent(JSON.stringify(data));
            wx.navigateTo({
                url: '/pages/input/input?data=' + params
            })
        } else {
            wx.navigateTo({
                url: '/pages/tags/tags?type=' + data.key + '&index=' + this.data.clientIndex,
            })
        }
    },
    onSwitch(e) {
        var key = e.target.dataset.item;
        this.setQbPreferences(key, e.detail.value)
    },
    onRefresh() {
        this.getQbPreferences()
    },
    onLoad: function (option) {
        // console.log(option)
        this.setData({
            contentHeight: wx.getSystemInfoSync().windowHeight - app.globalData.navBarHeight,
            contentTop: app.globalData.navBarHeight
        })
        if (option.index >= 0) {
            this.setData({
                clientIndex: option.index
            })
            var list = wx.getStorageSync('serverlist')
            this.data.currentServerConfig = list[this.data.clientIndex]
            this.setData({
                navtitle:this.data.currentServerConfig.type == 'Transmission'?'transmission选项':'qbittorrent选项'
            })
            this.getQbPreferences();
        } else {
            console.log("no server index")
        }
    },
    onShow() {
        this.setData({
            supportlogview:this.data.currentServerConfig.type != "Transmission"
        })
        //switch主题颜色
        this.setData({
            switch_color:wx.getSystemInfoSync().theme=="dark"?"#1f7769":"#13b2ae"
        });
        wx.onThemeChange((result) => {
            this.setData({switch_color:result.theme=="dark"?"#1f7769":"#13b2ae",})
        })
        //仅处理设置新值后的显示
        if (this.data.inputData != null) {
            //先把界面更新了
            var value = this.data.inputData.value
            if (this.data.inputData.key == "dl_limit" || this.data.inputData.key == "up_limit" || this.data.inputData.key == "alt_dl_limit" || this.data.inputData.key == "alt_up_limit") {
                value = 1024 * this.data.inputData.value
            }
            this.setItemValueByKey(this.data.inputData.key, value);
            this.setData({
                itemList: this.data.itemList
            })
            //再提交
            this.setQbPreferences(this.data.inputData.key, this.data.inputData.value);
        }
    },
    onHide: function () {
        this.setData({
            isfromHide: true
        })
        wx.offThemeChange()
    },
    onUnload:function(){
        wx.offThemeChange()
    },
    //获取选项值
    getQbPreferences() {
        if (this._freshing) return
        this._freshing = true
        var that = this;
        wx.showLoading({
            title: '加载中',
        })
        Client.GetClientPreferences(this.data.currentServerConfig,function(res){
            wx.hideLoading()
            that.setData({
                triggered: false
            })
            that._freshing = false
            if (res&&res.success&&res.data) {
                // console.log(res.data)
                var data = {}
                if(that.data.currentServerConfig.type == 'Transmission'){
                    data['save_path'] = res.data['download-dir']
                    data['tags'] = '不支持tr'
                    data['category']='不支持tr'
                    data['upnp']=res.data['port-forwarding-enabled']
                    data['random_port']=res.data['peer-port-random-on-start']
                    data['dht']=res.data['dht-enabled']
                    data['pex']=res.data['pex-enabled']
                    data['lsd']=res.data['lpd-enabled']
                    data['start_paused_enabled']=!res.data['start-added-torrents']
                    data['utp-enabled']=res.data['utp-enabled']
                    data['alt-speed-enabled']=res.data['alt-speed-enabled'] //tr
                    data['alt_dl_limit'] = 1024*res.data['alt-speed-down']
                    data['alt_up_limit'] = 1024*res.data['alt-speed-up']
                    data['speed-limit-down-enabled']=res.data['speed-limit-down-enabled']//tr
                    data['dl_limit']=1024*res.data['speed-limit-down']
                    data['speed-limit-up-enabled'] = res.data['speed-limit-up-enabled']//tr
                    data['up_limit']=1024*res.data['speed-limit-up']
                    data['max_active_torrents']='不支持tr'
                    data['download-queue-enabled']=res.data['download-queue-enabled']//tr
                    data['max_active_downloads']=res.data['download-queue-size']
                    data['seed-queue-enabled'] = res.data['seed-queue-enabled']//tr
                    data['max_active_uploads']=res.data['seed-queue-size']
                    data['max_connec'] = res.data['peer-limit-global']
                    data['max_connec_per_torrent']=res.data['peer-limit-per-torrent']
                    data['recheck_completed_torrents']='不支持tr'
                }else{
                    data = res.data
                }
                for (var name of Object.keys(data)) {
                    var value = data[name];
                    that.setItemValueByKey(name, value)
                }
                that.setData({
                    itemList: that.data.itemList
                })
            } else {
                wx.showToast({
                    title: '加载失败',
                    icon: 'error'
                })
            }
        })
    },
    setQbPreferences(key, value) {
        var obj = {};
        //全局限速
        if (key == "up_limit" || key == "dl_limit" || key == "alt_up_limit" || key == "alt_dl_limit")
            value = this.data.currentServerConfig.type=="Transmission"?value:value * 1024
        obj[key] = value
        var params = {
            json: JSON.stringify(obj)
        }
        Client.SetClientPreferences(this.data.currentServerConfig,params,function(res){
            wx.hideLoading()
            if(!res.success){
                wx.showToast({
                    title: '设置保存失败！',
                    icon: 'none'
                })
            }
        })
    },
    setItemValueByKey(key, value) {
        for (var i = 0; i < this.data.itemList.length; i++) {
            var item = this.data.itemList[i]
            if(this.data.currentServerConfig.type=="Transmission"){
                item.show = item.fortype.indexOf('tr')!=-1
            }else{
                item.show = item.fortype.indexOf('qb')!=-1
            }
            if (item.key == key) {
                //保留原始值
                item.originValue = value;
                //设置显示方式
                if (key == "dl_limit" || key == "up_limit" || key == "alt_dl_limit" || key == "alt_up_limit") {
                    if (value == 0) {
                        value = "∞"
                    } else {
                        value = utils.formatSize(value) + "/s"
                    }
                }
                if (key == "save_path"&&value.length>12) {
                    value = value.substr(0, 8) + ".." + value.substr(value.length - 4, value.length)
                }
                item.value = value
                break
            }
        }
    },
    /**
     * 用户点击右上角分享
     */
    onShareAppMessage: function () {
        return app.onShareCommon()
    }
})