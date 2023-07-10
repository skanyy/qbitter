const FormData = require('./utils/wx-formdata/formData.js')
var utils = require('./utils/util.js')
var crypto = require('./utils/crypto.js')
var config = require('./config.js')
var MyRequest = require('./myRequest.js')

// 向tr添加下载文件
function addTorrentFileWithTr(client, params, callBack) {
    //获取文件content
    var filepath = params['filepath']
    var file = wx.getFileSystemManager()
    file.readFile({
        filePath: filepath,
        encoding: 'base64',
        success(result) {
            //filename和metainfo不能同时传入，要不然报错
            params.addtype = "file"
            params.torrents = result.data
            MyRequest.GetClient(client, config.client.New_download, callBack, params, "", [], 5000)
        },
        fail(e) {
            console.log(e)
            callBack({
                success: false,
                info: 'add_file_with_tr_read_file_fail'
            })
        }
    })
}
// 向tr添加下载url
function addTorrentUrlWithTr(client, params, callBack) {
    params.addtype = "url"
    MyRequest.GetClient(client, config.client.New_download, callBack, params, "", [], 8000)
}

// qb使用本地局域网下载
function addDownloadFileWithQBLocal(client, params, callBack) {
    var formData = new FormData()
    //构造表单参数
    for (let name of Object.keys(params)) {
        let value = params[name];
        formData.append(name, value);
    }
    //添加torrent参数
    formData.appendFile("torrents", params["filepath"])
    var data = formData.getData()
    var customerAddHeaderParams = [{
        key: 'content-type',
        value: data.contentType
    }]
    MyRequest.GetClient(client, config.client.New_download, function (result) {
        if (result.success && result.statusCode == 200) {
            callBack(result)
        } else {
            callBack(false)
        }
    }, data.buffer, "POST", customerAddHeaderParams, 5000)
}

// qb 外网方式下载
function addDownloadFileWithQBRemote(client, params, callBack) {
    //通过远程服务器
    wx.uploadFile({
        header: {
            'content-type': 'multipart/form-data'
        },
        filePath: params.filepath,
        name: "file",
        url: config.server.host + config.client.New_download_file,
        formData: {
            user: crypto.encrypted(JSON.stringify({
                url: client.outerhost ? client.outerhost : client.host, //兼容旧版，旧版没有outerhost字段,
                username: client.username,
                password: client.password
            })),
            params: JSON.stringify(params)
        },
        success(e) {
            if (e.data == "Ok.") {
                callBack({
                    success: true,
                    data: e.data
                })
            } else {
                callBack({
                    success: false,
                    info: 'add_file_with_qb_uploadfile_error'
                })
            }
        },
        fail(e) {
            callBack({
                success: false,
                info: 'add_file_with_qb_uploadfile_req_fail'
            })
        }
    })
}

//向qb添加下载文件
function addTorrentFileWithQb(client, params, callBack) {
    addDownloadFileWithQBLocal(client, params, function (result) {
        if (result == false) {
            addDownloadFileWithQBRemote(client, params, callBack)
        } else {
            callBack(result)
        }
    })
    // //本地局域网
    // if (client.islocal == true) {
    //     // 使用本地局域网下载
    //     var formData = new FormData()
    //     //构造表单参数
    //     for (let name of Object.keys(params)) {
    //         let value = params[name];
    //         formData.append(name, value);
    //     }
    //     //添加torrent参数
    //     formData.appendFile("torrents", params["filepath"])
    //     var data = formData.getData()
    //     var customerAddHeaderParams = [{
    //         key: 'content-type',
    //         value: data.contentType
    //     }]
    //     MyRequest.GetClient(client, config.client.New_download, callBack, data.buffer, "POST", customerAddHeaderParams)
    // } else {
    //     //通过远程服务器
    //     wx.uploadFile({
    //         header: {
    //             'content-type': 'multipart/form-data'
    //         },
    //         filePath: params.filepath,
    //         name: "file",
    //         url: config.server.host + config.client.New_download_file,
    //         formData: {
    //             user: crypto.encrypted(JSON.stringify({
    //                 url: client.host,
    //                 username: client.username,
    //                 password: client.password
    //             })),
    //             params: JSON.stringify(params)
    //         },
    //         success(e) {
    //             if (e.data == "Ok.") {
    //                 callBack({
    //                     success: true,
    //                     data: e.data
    //                 })
    //             } else {
    //                 callBack({
    //                     success: false,
    //                     info: 'add_file_with_qb_uploadfile_error'
    //                 })
    //             }
    //         },
    //         fail(e) {
    //             callBack({
    //                 success: false,
    //                 info: 'add_file_with_qb_uploadfile_req_fail'
    //             })
    //         }
    //     })
    // }
}
//向qb添加下载url
function addTorrentUrlWithQb(client, params, callBack) {
    // if (client.islocal == true) {
    //     // 使用本地局域网下载
    //     var data = utils.formMydata(params);
    //     var customerAddHeaderParams = [{
    //         key: 'content-type',
    //         value: data.contentType
    //     }]
    //     // 下载需要post方法
    //     MyRequest.GetClient(client, config.client.New_download, callBack, data.buffer, "POST", customerAddHeaderParams)
    // } else {
    //     // 通过远程api下载
    MyRequest.GetClient(client, config.client.New_download, callBack, params, "", [], 5000)
    // }
}
// tr添加下载任务事件响应
function onTrResultHandle(result, callBack) {
    if (result.success) {
        if (Object.keys(result.data).indexOf("torrent-added") != -1) {
            callBack({
                success: true
            })
        } else if (Object.keys(result.data).indexOf("torrent-duplicate") != -1) {
            callBack({
                success: false,
                info: "种子已存在"
            })
        }
    } else {
        callBack({
            success: false,
            info: result.data
        })
    }
}

//获取qb的版本
function GetQbVersion(info, callBack) {
    MyRequest.GetClient(info, config.client.Get_qb_version, callBack)
}

//登录验证
function CheckLogin(info, callBack) {
    // console.log(info)
    // MyRequest.GetClient(info, config.client.Login_torrent, callBack)
    var allReslut = {
        inner: false,
        outer: false
    }
    if (info.innerhost && info.outerhost) {
        wx.showLoading({title: '验证内网'})
        if (info.type == "qBittorrent") {
            MyRequest.callLocalQb(info, null, config.client.Login_torrent, function (l_result) {
                wx.hideLoading()
                allReslut.inner = l_result==false?false:true
                wx.showLoading({title: '验证外网'})
                MyRequest.callRemoteQb(info, null, config.client.Login_torrent, function (r_result) {
                    wx.hideLoading()
                    allReslut.outer = r_result==false?false:true
                    callBack(allReslut)
                })
            })
        } else if (info.type == "Transmission") {
            MyRequest.callLocalTr(info, null, config.client.Login_torrent, function (l_result) {
                wx.hideLoading()
                allReslut.inner = l_result==false?false:true
                wx.showLoading({title: '验证外网'})
                MyRequest.callRemoteTr(info, null, config.client.Login_torrent, function (r_result) {
                    wx.hideLoading()
                    allReslut.outer = r_result==false?false:true
                    callBack(allReslut)
                })
            })
        }
    }
    //只填了内网
    else if (info.innerhost && !info.outerhost) {
        wx.showLoading({title: '验证内网'})
        if (info.type == "qBittorrent") {
            MyRequest.callLocalQb(info, null, config.client.Login_torrent, function (l_result) {
                wx.hideLoading()
                allReslut.inner = l_result==false?false:true
                callBack(allReslut)
            })
        } else if (info.type == "Transmission") {
            MyRequest.callLocalTr(info, null, config.client.Login_torrent, function (l_result) {
                wx.hideLoading()
                allReslut.inner = l_result==false?false:true
                callBack(allReslut)
            })
        }
    }
    //只填外网
    else if (!info.innerhost && info.outerhost) {
        wx.showLoading({title: '验证外网'})
        if (info.type == "qBittorrent") {
            MyRequest.callRemoteQb(info, null, config.client.Login_torrent, function (r_result) {
                console.log(r_result)
                wx.hideLoading()
                allReslut.outer = r_result==false?false:true
                callBack(allReslut)
            })
        } else if (info.type == "Transmission") {
            MyRequest.callRemoteTr(info, null, config.client.Login_torrent, function (r_result) {
                wx.hideLoading()
                allReslut.outer = r_result==false?false:true
                callBack(allReslut)
            })
        }
    }
}
// 获指定客户端取种子列表
function GetTorrentList(client, callBack) {
    var url = config.client.Get_maindata
    if (client.type == "Transmission") {
        url = config.client.Get_torrent_list
    }
    MyRequest.GetClient(client, url, callBack)
}
//获取指定客户端传输数据
function GetClientGloablInfo(client, callBack) {
    MyRequest.GetClient(client, config.client.Get_global_transferinfo, callBack)
}
//获取客户端配置
function GetClientPreferences(client, callBack) {
    MyRequest.GetClient(client, config.client.Get_app_preferences, callBack)
}

//设置客户端
function SetClientPreferences(client, params, callBack) {
    MyRequest.GetClient(client, config.client.Set_app_preferences, callBack, params)
}
//新建 url下载任务
function NewDownloadTaskWithUrl(client, formdata, callBack) {
    // tr和qb分开处理
    if (client.type == "Transmission") {
        addTorrentUrlWithTr(client, formdata, function (result) {
            onTrResultHandle(result, callBack)
        })
    } else {
        addTorrentUrlWithQb(client, formdata, callBack)
    }
}
//新建文件下载任务
function NewDownloadTaskWithFile(client, formdata, callBack) {
    if (client.type == "Transmission") {
        addTorrentFileWithTr(client, formdata, function (result) {
            onTrResultHandle(result, callBack)
        })
    } else {
        addTorrentFileWithQb(client, formdata, callBack)
    }
}

//向指定客户端添加url类型的下载任务
function addDownloadTaskToClients(clients, downloadurl, callBack) {
    var formdata = {
        paused: false,
        urls: downloadurl
    }
    clients.forEach(client => {
        NewDownloadTaskWithUrl(client, formdata, callBack)
    })
}
//获取标签
function GetClientTags(client, callBack) {
    MyRequest.GetClient(client, config.client.Get_all_tags, callBack)
}
//获取目录
function GetClientCategory(client, callBack) {
    MyRequest.GetClient(client, config.client.Get_all_categories, callBack)
}
//获取主日志
function GetClientMainLog(client, callBack) {
    MyRequest.GetClient(client, config.client.Get_main_log, callBack)
}
//获取peer日志
function GetClientPeerLog(client, callBack) {
    MyRequest.GetClient(client, config.client.Get_peer_log, callBack)
}

module.exports = {
    GetQbVersion,
    CheckLogin,
    GetTorrentList,
    GetClientGloablInfo,
    GetClientPreferences,
    SetClientPreferences,
    NewDownloadTaskWithUrl,
    NewDownloadTaskWithFile,
    addDownloadTaskToClients,
    GetClientTags,
    GetClientCategory,
    GetClientMainLog,
    GetClientPeerLog
}