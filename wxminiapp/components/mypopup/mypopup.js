// components/mypopup/mypopup.js
Component({
    properties: {
        popupCancelText: {
            type: String,
            value: '取消'
        },
        popupComfirmText: {
            type: String,
            value: '确定'
        },
        popupTitle: {
            type: String,
            value: '请选择'
        },
        show: {
            type: Boolean,
            value: false,
            observer: function (val) {
                if (val) this.onShowPopup()
            }
        }
    },
    data: {
        show: false,
        animationData: {}
    },
    methods: {
        onCancelTap: function (e) {
            this.onHidePopupTap()
            this.triggerEvent("onPopupCancelTap", {
                value: e.detail.value
            })
        },
        onComfirmTap: function (e) {
            this.onHidePopupTap()
            this.triggerEvent("onPopupComfirmTap", {
                value: e.detail.value
            })
        },
        onShowPopup() {
            var screenHeight = wx.getSystemInfoSync().screenHeight
            var animation = wx.createAnimation({
                duration: 300,
                timingFunction: "ease"
            })
            this.animation = animation
            //先藏到屏幕最底部
            animation.translateY(screenHeight/2).step()
            this.setData({
                animationData: animation.export(),
            })
            setTimeout(function () {
                // 动画上弹出来
                animation.translateY(0).step()
                this.setData({
                    animationData: animation.export()
                })
            }.bind(this),100)
        },
        onHidePopupTap: function () {
            var screenHeight = wx.getSystemInfoSync().screenHeight
            var animation = wx.createAnimation({
                duration: 300,
                timingFunction: "ease"
            })
            this.animation = animation
            // 动画隐藏起来
            animation.translateY(screenHeight/2).step()
            this.setData({
                animationData: animation.export(),
            })
            setTimeout(function () {
                this.setData({show:false})
            }.bind(this),100)
            
        }
    }
})