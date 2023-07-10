// pages/sysset/set.js
const app = getApp()
Page({

    /**
     * 页面的初始数据
     */
    data: {
        switch_color:'#13b2ae',
        initPageList:app.globalData.startPageList,
        selectIntoValue: '',
        selectSpeedViewType:'区域',
        echartsSmooth:false,
        showSpeedOnTitle:false,
        updateSpeed:8
    },
    onSelectInto() {
        var that = this
        wx.showActionSheet({
            alertText: '请选择',
            itemList: this.data.initPageList,
            success(e) {
                that.setData({
                    selectIntoValue: that.data.initPageList[e.tapIndex]
                })
                wx.setStorageSync('defaultPage', e.tapIndex)
            }
        })
    },
    //速率样式，区域/曲线
    onSelectViewType(){
        var that = this
        wx.showActionSheet({
            alertText: '请选择',
            itemList:app.globalData.speedViewType,
            success(e) {
                that.setData({
                    selectSpeedViewType:app.globalData.speedViewType[e.tapIndex]
                })
                wx.setStorageSync('speedViewType', e.tapIndex)
            }
        })
    },
    //echarts速度曲线是否使用平滑样式
    onChangeSmoothSwitch(e){
        var value = e.detail.value
        wx.setStorageSync('echartsSmooth', value)
    },
    onSpeedOnTitleSwitch(e){
        var value = e.detail.value
        wx.setStorageSync('speedOnTitle', value)
    },
    // 数据更新速度
    onChangeUpdateSpeed(){
        var that = this
        var list = ['实时','1秒','2秒','5秒']
        wx.showActionSheet({
          itemList: list,
          success (res) {
            if(res.tapIndex==0){
                wx.showModal({
                    title: '提示',
                    content: '哥们啊,实时刷新的话，我弱小的服务器顶不住啊',
                    confirmText:'去资助',
                    confirmColor:'#13b2ae',
                    success (res) {
                      if (res.confirm) {
                        wx.navigateTo({
                          url: '/pages/about/about',
                        })
                      }
                    }
                })
            }else{
                wx.setStorageSync('updateSpeed', list[res.tapIndex].replace('秒',''))
                that.setData({
                    updateSpeed:list[res.tapIndex].replace('秒','')
                })
            }
          },
        })
    },
    /**
     * 生命周期函数--监听页面加载
     */
    onLoad: function (options) {
        var defaulIndex = wx.getStorageSync('defaultPage')
        this.setData({
            contentHeight: wx.getSystemInfoSync().windowHeight - app.globalData.navBarHeight,
            contentTop: app.globalData.navBarHeight,
            selectIntoValue:app.globalData.startPageList[defaulIndex],
            selectSpeedViewType:app.globalData.speedViewType[wx.getStorageSync('speedViewType')],
            echartsSmooth:wx.getStorageSync('echartsSmooth'),
            showSpeedOnTitle:wx.getStorageSync('speedOnTitle'),
            updateSpeed:wx.getStorageSync('updateSpeed')?wx.getStorageSync('updateSpeed'):8
        })
    },
    onNaviBack() {
        wx.navigateBack()
    },

    onShow: function () {
        //switch主题颜色
        this.setData({
            switch_color:wx.getSystemInfoSync().theme=="dark"?"#1f7769":"#13b2ae"
        });
        wx.onThemeChange((result) => {
            this.setData({switch_color:result.theme=="dark"?"#1f7769":"#13b2ae",})
        })
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