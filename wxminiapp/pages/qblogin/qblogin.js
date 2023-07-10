// pages/qblogin/qblogin.js
const app = getApp()
var Client = require('../../client.js')
var util = require('../../utils/util.js')
Page({
    data: {
        myRequest: "",
        type: '',
        switch_color: "#13b2ae",
        navtitle: '添加客户端',
        isedit: false,
        editIndex: -1,
        typelist: ['qBittorrent', 'Transmission'],
        itemList: [{
                "name": "客户端类型",
                "key": "type",
                "value": "qBittorrent",
                "originValue": "qBittorrent",
                "select": true,
                "placeholder": '选择客户端类型'
            }, {
                "name": "名称",
                "key": "name",
                "placeholder": '填写名称',
                "desc": "输入一个名称以方便管理"
            }, {
                "name": "内网地址",
                "key": "innerhost",
                "istextarea": true,
                "placeholder": '请填入客户端访局域网问地址，以http://或https://开头',
                "desc": '例如:http://192.168.1.2:8080,IOS系统请在设置->隐私->本地网络->打开微信的权限',
                "empty": true
            }, {
                "name": "外网地址",
                "key": "outerhost",
                "istextarea": true,
                "placeholder": '请填入客户端外网访问地址，以http://或https://开头',
                "desc": '例如:http://www.myqbittorrent.com:6363',
                "empty": true
            }, {
                "name": "用户名",
                "key": "username",
                "placeholder": '用户名',
                "desc": "访问账号用户名,账号信息全程加密且不会另外储存,请放心使用"
            }, {
                "name": "密码",
                "key": "password",
                "placeholder": '访问密码',
                "isinput": true,
                "type": "text",
                "desc": "访问账号的密码,账号信息全程加密且不会另外储存,请放心使用"
            },
            //  {
            //     "name": "局域网",
            //     "key": "islocal",
            //     "switch": true,
            //     "value": true,
            //     "originValue": true,
            // }, 
            {
                "name": "设为默认",
                "key": "isdefault",
                "switch": true,
                "value": false,
                "originValue": false,
            }
        ]
    },
    onShow() {
        this.setData({
                switch_color: wx.getSystemInfoSync().theme == "dark" ? "#1f7769" : "#13b2ae"
            }),
            wx.onThemeChange((result) => {
                this.setData({
                    switch_color: result.theme == "dark" ? "#1f7769" : "#13b2ae",
                })
            })
        //填写后返回的值
        var prePageData = this.data.inputData
        if (prePageData)
            this.setValueByKey(prePageData.key, prePageData.value)
    },

    onBack(e) {
        wx.navigateBack()
    },
    onCellTap(e) {
        var data = e.currentTarget.dataset.item;
        data.urltype = "qblogin"
        var params = encodeURIComponent(JSON.stringify(data));
        wx.navigateTo({
            url: '/pages/input/input?data=' + params
        })
    },
    onSelectTap(e) {
        var that = this
        wx.showActionSheet({
            alertText: '选择客户端类型',
            itemList: that.data.typelist,
            success(res) {
                that.setValueByKey('type', that.data.typelist[res.tapIndex])
            }
        })
    },
    onSwitch(e) {
        var key = e.currentTarget.id
        var value = e.detail.value
        this.setValueByKey(key, value)
    },
    setValueByKey(key, value) {
        if (typeof (value) != "undefined") {
            for (var i = 0; i < this.data.itemList.length; i++) {
                var item = this.data.itemList[i]
                if (item.key == key) {
                    if (key == "isdefault") {
                        item.originValue = value
                        item.value = value
                    } else {
                        item.originValue = value;
                        if (value.length > 0) {
                            item.value = value.length > 30 ? value.substr(0, 15) + "..." + value.substr(value.length - 10, value.length) : value
                        } else {
                            item.value = '未填写'
                        }
                    }
                    break
                }
            }
            this.setData({
                itemList: this.data.itemList
            })
        }
    },
    getValueByKey(key) {
        for (var i = 0; i < this.data.itemList.length; i++) {
            var item = this.data.itemList[i]
            if (item.key == key) {
                return item.originValue
            }
        }
        return ""
    },
    onLoad: function (options) {
        this.setData({
            contentHeight: wx.getSystemInfoSync().windowHeight - app.globalData.navBarHeight,
            contentTop: app.globalData.navBarHeight
        })
        if (options.index && options.index != -1) {
            this.setData({
                isedit: true,
                editIndex: options.index,
                navtitle: "编辑"
            })
            var list = wx.getStorageSync('serverlist')
            var params = list[options.index]
            // console.log(params)
            for (var key of Object.keys(params)) {
                this.setValueByKey(key, params[key])

                //从旧版本升级过来，需把旧数据匹配到新版本，内网，外网字段
                //内网
                if (key == "islocal" && params['islocal'] == true) {
                    this.setValueByKey("innerhost", params['host'])
                    this.setValueByKey("outerhost", '')
                }
                //外网
                if (key == "islocal" && params['islocal'] != true) {
                    this.setValueByKey("outerhost", params['host'])
                    this.setValueByKey("innerhost", '')
                }
            }
        }
    },
    async saveConfig() {
        if (this._isSaving) return
        this._isSaving = true
        wx.showLoading({
            title: '验证中',
        })
        var config = {
            type: this.getValueByKey("type"),
            name: this.getValueByKey('name'),
            islocal: this.getValueByKey('islocal'),
            host: "",
            innerhost: this.getValueByKey('innerhost'),
            outerhost: this.getValueByKey('outerhost'),
            username: this.getValueByKey('username'),
            password: this.getValueByKey('password'),
            isdefault: this.getValueByKey('isdefault'),
        }
        var that = this
        Client.CheckLogin(config, function (res) {
            that._isSaving = false
            wx.hideLoading()
            // console.log(res)
            wx.showModal({
                title: "验证结果",
                content: (res.inner ? "内网验证:√ 成功" : "内网验证:× 失败") + "\n" + (res.outer ? "外网验证:√ 成功" : "外网验证:× 失败"),
                confirmText: (res.inner && res.outer) ? "好" : "仍然保存",
                showCancel: !(res.inner && res.outer),
                success(result) {
                    if (result.confirm) {
                        that.addOrEditServerConfig(config)
                    }
                }
            })
            // wx.showModal在地址请求失败fail时，不会显示，只能用showtoast来解决这个问题
        //     if(!res.success){
        //         wx.showToast({
        //           title: '连接失败！请重试！',
        //           icon:"none",
        //           duration:3000
        //         })
        //     }else{
        //         var success = false
        //         if(config.type=="Transmission"){
        //             success = res.success
        //         }else{
        //             success = res.success&&res.data=="Ok."
        //         }
        //         wx.showModal({
        //             title: success?"太棒了":"验证失败",
        //             content: success?"客户端验证成功":"账户或密码验证失败，原因:"+(config.type=="Transmission"?res.info:res.data),
        //             confirmText: success?"好":"仍然保存",
        //             showCancel:!success,
        //             success(result) {
        //                 if (result.confirm) {
        //                     that.addOrEditServerConfig(config)
        //                 }
        //             }
        //         })
        //     }
        })
    },

    sumbitConfig() {
        var validate = this.checkFill()
        if (validate == "success") {
            this.saveConfig()
        } else {
            wx.showToast({
                title: validate,
                icon: "error"
            })
        }
    },
    addOrEditServerConfig(config) {
        var list = wx.getStorageSync('serverlist')
        if (list) {
            if (config.isdefault) {
                list.forEach(item => {
                    item.isdefault = false
                });
            }
            //如果是编辑
            if (this.data.isedit) {
                list[this.data.editIndex] = config
            } else {
                //新增
                list.push(config)
            }
            wx.setStorageSync('serverlist', list)
        } else {
            var data = [config]
            wx.setStorageSync('serverlist', data)
        }
        wx.navigateBack()
    },
    checkFill() {
        // console.log(this.data.itemList)
        // return
        //判断是否填写完整
        for (var i = 0; i < this.data.itemList.length; i++) {
            // 不检查是否本地网络和是否默认 这两个字段
            if (!this.data.itemList[i].value && this.data.itemList[i].key != "islocal" && this.data.itemList[i].key != 'isdefault' && this.data.itemList[i].key != 'innerhost' && this.data.itemList[i].key != 'outerhost')
                return "请填写" + this.data.itemList[i].name
        }
        //检查地址是否填写,内网和外网地址至少填一个
        if (!this.getValueByKey('innerhost') && !this.getValueByKey('outerhost')) {
            return "请填写地址"
        }


        // 判断名称或地址是否重复
        var list = wx.getStorageSync('serverlist')
        if (list) {
            var input_name = this.getValueByKey("name")
            var input_host = this.getValueByKey("host")
            var input_innerhost = this.getValueByKey("innerhost")
            var input_outerhost = this.getValueByKey("outerhost")
            for (var i = 0; i < list.length; i++) {
                var item = list[i]
                //排除编辑状态下的那项
                if (this.data.isedit == true) {
                    //编辑状态
                } else {
                    //新建
                    if (input_name == item.name) return "该名称已存在"
                    if (input_host == item.host && util.trimAllBlank(input_host) != "") return "该地址已存在"
                    if (input_innerhost == item.innerhost && util.trimAllBlank(input_innerhost) != "") return "该内网地址已存在"
                    if (input_outerhost == item.outerhost && util.trimAllBlank(input_outerhost) != "") return "该外网地址已存在"
                }
            }
        }
        return "success"
    },
    /**
     * 用户点击右上角分享
     */
    onShareAppMessage: function () {
        return app.onShareCommon()
    },
    onHide() {
        if (this.data.myRequest) {
            this.data.myRequest.abort()
            this.data.myRequest = ""
        }
        wx.offThemeChange()
    },
    onUnload() {
        if (this.data.myRequest) {
            this.data.myRequest.abort()
            this.data.myRequest = ""
        }
        wx.offThemeChange()
    }
})