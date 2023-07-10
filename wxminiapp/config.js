//通用配置
var version = "Qbiter3.2.6"
var version_info = "<div style='text-align:center;'><a style='font-size:20px;color:#13b2ae;width:100%'>--" + version + "--</a><br><a style='color:gray'>PT移动助手</a></div><br>"
var server ={
    host: 'http://192.168.99.101:8885', //debug
    site_supportlist:'/site/supportlist',
    site_search: '/site/search',
    site_detail: '/site/detail',
    site_checkconfig:'/site/checkconfig',
    site_getcookie:'/site/getcookie',
    site_getloginpage:'/site/getloginpage',
    site_autosignstatus:'/site/autosignstatus',
    site_applyautosign:'/site/applyautosign',
    site_removeautosign:'/site/removeautosign',
    site_resign:'/site/resign',
    site_sitedata:'/site/getsitedata',
    wx_log:'/api/v2/wx/log',
    wx_registstatus:'/api/v2/wx/registstatus',
    wx_regist:'/api/v2/wx/regist',
    wx_unregist:'/api/v2/wx/unregist',
    wx_save_config:'/api/v2/wx/saveconfig',
    wx_down_config:'/api/v2/wx/downconfig',
    sign_history:'/api/v2/signhistory',
    sign_today:'/api/v2/signtoday',
    view_ad:'/api/v2/viewad'
} 
var client = {
    Get_qb_version: '/api/v2/app/version',
    Get_api_version: '/api/v2/app/webapiVersion',
    Get_help_info: '/api/v2/help',
    Get_about_me: '/api/v2/aboutme',
    Get_close_ad_info:'/api/v2/closeAdInfo',
    Get_share_info: '/api/v2/shareInfo',
    Login_torrent: '/api/v2/auth/login',
    Get_torrent_list: '/api/v2/torrents/info',
    Get_defaultSavePath: '/api/v2/app/defaultSavePath',
    Pause_downloading: '/api/v2/torrents/pause',
    Resume_download: '/api/v2/torrents/resume',
    New_download_file: '/api/v2/torrents/addfile', //远程服务器用这个
    New_download: '/api/v2/torrents/add',
    Delete_download: '/api/v2/torrents/delete',
    Get_global_transferinfo: '/api/v2/transfer/info',
    Get_torrent_contents: '/api/v2/torrents/files',
    Get_torrent_pieceStates: '/api/v2/torrents/pieceStates',
    Get_torrent_properties: '/api/v2/torrents/properties',
    Get_torrent_trackers: '/api/v2/torrents/trackers',
    Get_torrent_torrentPeers: '/api/v2/sync/torrentPeers',
    Get_torrent_webseeds: '/api/v2/torrents/webseeds',
    Get_app_preferences: '/api/v2/app/preferences',
    Set_app_preferences: '/api/v2/app/setPreferences',
    Get_app_speedlimitstate: '/api/v2/transfer/speedLimitsMode',
    Set_app_toggleSpeedLimitsMode: '/api/v2/transfer/toggleSpeedLimitsMode',
    Get_app_globaldownloadLimit: '/api/v2/transfer/downloadLimit',
    Get_app_globaluploadLimit: '/api/v2/transfer/uploadLimit',
    Set_app_globaldownloadLimit: '/api/v2/transfer/setDownloadLimit',
    Set_app_globaluploadLimit: '/api/v2/transfer/setUploadLimit',
    // 针对种子
    Increase_torrent_priority: '/api/v2/torrents/increasePrio',
    Decrease_torrent_priority: '/api/v2/torrents/decreasePrio',
    Maximal_torrent_priority: '/api/v2/torrents/topPrio',
    Minimal_torrent_priority: '/api/v2/torrents/bottomPrio',
    // 针对种子的内容文件
    Set_file_priority: '/api/v2/torrents/filePrio',
    Rename_file: '/api/v2/torrents/renameFile',
    Rename_folder: '/api/v2/torrents/renameFolder',
    Set_torrent_location: '/api/v2/torrents/setLocation',
    Set_torrent_name: '/api/v2/torrents/rename',
    Get_all_categories: '/api/v2/torrents/categories',
    Add_new_category: '/api/v2/torrents/createCategory',
    Edit_category: '/api/v2/torrents/editCategory',
    Remove_categories: '/api/v2/torrents/removeCategories',
    Set_torrent_category: '/api/v2/torrents/setCategory',
    Add_torrent_tags: '/api/v2/torrents/addTags',
    Remove_torrent_tags: '/api/v2/torrents/removeTags',
    Get_all_tags: '/api/v2/torrents/tags',
    Create_tags: '/api/v2/torrents/createTags',
    Delete_tags: '/api/v2/torrents/deleteTags',
    Get_torrent_download_limit: '/api/v2/torrents/downloadLimit',
    Set_torrent_download_limit: '/api/v2/torrents/setDownloadLimit',
    Get_torrent_upload_limit: '/api/v2/torrents/uploadLimit',
    Set_torrent_upload_limit: '/api/v2/torrents/setUploadLimit',
    Set_torrent_share_limit: '/api/v2/torrents/setShareLimits',
    Set_super_seeding: '/api/v2/torrents/setSuperSeeding',
    Recheck_torrents: '/api/v2/torrents/recheck',
    Reannounce_torrents: '/api/v2/torrents/reannounce',
    Set_force_start: '/api/v2/torrents/setForceStart',
    Get_main_log: '/api/v2/log/main',
    Get_peer_log: '/api/v2/log/peers',
    Get_maindata: '/api/v2/sync/maindata',
    Get_TR_Free_Space: 'Get_TR_Free_Space', //只针对tr
    Set_app_queuing: 'Set_app_queuing', //只针对tr
}

module.exports ={
    version,
    version_info,
    server,
    client
}