const app = getApp()
Component({
    properties: {
        showLeftIcon:{type:Boolean,value:true},
        leftButtonIcon:{type:String,value:'back'},
        showMiddleIcon:{type:Boolean,value:false},
        middleButtonIcon:{type:String,value:'add'},
        showRightIcon:{type:Boolean,value:false},
        rightButtonIcon:{type:String,value:'info'},
        naviBarType:{type:String,value:'normal'},
        maintitle:{type:String,value:'Qbiter'},
        subtitle:{type:String,value:''},
        includeSearchBar:{type:Boolean,value:false},
        searchInputPlaceholder:{type:String,value:'搜索'}
    },
    data: {
        statusBarHeight:app.globalData.statusBarHeight,
        navBarHeight: app.globalData.navBarHeight,
        menuRight: app.globalData.menuRight,
        menuBottom: app.globalData.menuBottom,
        menuHeight: app.globalData.menuHeight,
        menuWidth:app.globalData.menuWidth,
        iconWidth:app.globalData.menuHeight-8,
        iconHeight:app.globalData.menuHeight-8,
        searchLeft:app.globalData.menuHeight+2*app.globalData.menuRight,
        searchWidth:app.globalData.screenWidth-app.globalData.menuWidth-app.globalData.menuHeight-4*app.globalData.menuRight,
        // leftButtonsWidth:app.globalData.screenWidth-app.globalData.menuWidth-2*app.globalData.menuRight
        leftButtonWidth:app.globalData.menuHeight,
        leftButtonHeight:app.globalData.menuHeight,
        leftViewHeight:app.globalData.menuHeight,
        leftViewWidth:app.globalData.screenWidth-app.globalData.menuWidth-3*app.globalData.menuRight,
    },
    attached: function() {},
    methods: {
        onInputTyping:function(e){
            this.triggerEvent("onNavSearchInput",{value:e.detail.value})
        },
        onInputConfirm:function(e){
            this.triggerEvent("onNavSearchConfirm",{value:e.detail.value})
        },
        onLeftButtonTap:function() {
            this.triggerEvent('onNavLeftButtonTap')
        },
        onMiddleButtonTap:function() {
            this.triggerEvent('onNavMiddleButtonTap')
        },
        onRightButtonTap:function() {
            this.triggerEvent('onNavRightButtonTap')
        },
        onTitleTap:function(){
            this.triggerEvent('onNavTitleTap')
        }
    }
})