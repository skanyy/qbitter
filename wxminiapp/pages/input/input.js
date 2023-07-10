// pages/input/input.js
const app = getApp()
var utils = require('../../utils/util.js')
Page({
    data: {
        inputvalue: '',
        newInputValue: '',
        pageData: {}
    },
    onLoad: function (options) {
        var params = JSON.parse(decodeURIComponent(options.data));
        var value = params.originValue;
        if (params.key == "alt_dl_limit" || params.key == "alt_up_limit"||params.key == "dl_limit" || params.key == "up_limit") {
            value = params.originValue / 1024;
        }

        this.setData({
            contentHeight: wx.getSystemInfoSync().windowHeight - app.globalData.navBarHeight,
            contentTop: app.globalData.navBarHeight,
            pageData: params,
            inputvalue: value,
            newInputValue:value
        })
    },
    onInputEvent(e) {
        this.setData({
            newInputValue: e.detail.value
        })
    },
    onSaveInput(){
        var input = utils.trimAllBlank(this.data.newInputValue)
        //加入是否允许留空的判断 empty=true?
        if(this.data.pageData.empty||input.length>0){
            var key = this.data.pageData.key;
            var pages = getCurrentPages();
            var prevPage = pages[pages.length - 2];
            prevPage.setData({
                inputData: {
                    key:key,
                    value:this.data.newInputValue
                }
            });
            wx.navigateBack({
                delta: 1,
            })
        }else{
            wx.showToast({
              title: '请输入信息',
              icon:"error"
            })
        }
    },
    onBack(e) {
        wx.navigateBack()
    },
    onShareAppMessage: function () {
        return app.onShareCommon()
    }
})