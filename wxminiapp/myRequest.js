var config = require('./config.js')
var crypto = require('./utils/crypto.js')
var url2tr = require('./utils/url2tr.js')
var utils = require('./utils/util.js')
// qb在使用本地网络时，需要先请求获取到cookie
function getLocalLoginCookiesForQb(client, callBack,localNetTimeOut) {
    if (utils.trimAllBlank(client.innerhost) == "" && utils.trimAllBlank(client.host) == "") {
        callBack("")
    } else {
        // var url = client.host + config.client.Login_torrent
        var url = client.innerhost + config.client.Login_torrent
        if (client.innerhost && utils.endWith(client.innerhost, '/'))
            url = client.innerhost.substr(0, client.innerhost.length - 1) + config.client.Login_torrent
        wx.request({
            url: url,
            data: {
                username: client.username,
                password: client.password
            },
            method: 'POST', ////qb v4.4.4 需要post方法，需添加header
            header: {
                'content-type': 'application/x-www-form-urlencoded'
            },
            timeout: localNetTimeOut,//毫秒
            success(e) {
                if (e && e.statusCode == 200 && e.data == 'Ok.') {
                    var cookies = e.cookies[0]
                    cookies = cookies.split(';')[0]
                    callBack(cookies)
                } else {
                    callBack("")
                }
            },
            fail(e) {
                callBack("")
            }
        })
    }
}
//判断本地还是远程，返回对应的请求参数
// function getRequestConfigForQb(client, callBack, params = null, localNetTimeOut) {
//     //先尝试内网
//     getLocalLoginCookiesForQb(client, function (localCookie) {
//         //获取到cookie说明内网可达
//         if (localCookie) {
//             // client.host = client.innerhost
//             //兼容旧版，旧版没有innerhost字段
//             var url = client.innerhost ? client.innerhost : client.host
//             if (url && utils.endWith(url, '/')) url = url.substr(0, url.length - 1)
//             var reqconfig = {
//                 url: url,
//                 data: params,
//                 method: "POST", //qb v4.4.4 需要post方法，需添加header
//                 header: {
//                     cookie: localCookie,
//                     'content-type': 'application/x-www-form-urlencoded'
//                 },
//                 type: 'inner'
//             }
//             // console.log("局域网访问")
//             callBack(reqconfig)
//         } else {
//             //否则尝试外网访问
//             if (utils.trimAllBlank(client.outerhost) == "" && utils.trimAllBlank(client.host) == "") {
//                 callBack("")
//             } else {
//                 // client.host = client.outerhost
//                 //兼容旧版,旧版没有outerhost字段
//                 var url = client.outerhost ? client.outerhost : client.host
//                 if (url && utils.endWith(url, '/')) url = url.substr(0, url.length - 1)
//                 var data = {
//                     user: crypto.encrypted(JSON.stringify({
//                         url: url,
//                         username: client.username,
//                         password: client.password
//                     })),
//                     params: params
//                 }
//                 // console.log("外网方式")
//                 callBack({
//                     url: config.server.host,
//                     data: data,
//                     header: {},
//                     method: "POST",
//                     type: 'outer'
//                 })
//             }
//         }
//     }, localNetTimeOut)
// }
// tr 本地网络下的请求
var tr_session_id = ""

function callLocalTr(serverConfig, params, reqUrl, callBack, localNetTimeOut = 2000) {
    if (utils.trimAllBlank(serverConfig.innerhost) == "" && utils.trimAllBlank(serverConfig.host) == "") {
        callBack(false)
    } else {
        var params = url2tr.getTRrequest(reqUrl, params)
        // 把原始的url赋给trRequest,用于远程访问功能
        params.url = reqUrl
        var auth = utils.Base64.encode(serverConfig.username + ":" + serverConfig.password)
        //兼容旧版，旧版没有innerhost字段
        var url = serverConfig.innerhost ? serverConfig.innerhost : serverConfig.host
        if (utils.endWith(url, '/')) url = url.substr(0, url.length - 1)
        wx.request({
            url: url + "/transmission/rpc",
            method: "POST",
            header: {
                'Authorization': 'Basic ' + auth,
                'X-Transmission-Session-Id': tr_session_id,
            },
            timeout: localNetTimeOut,
            data: params,
            success(e) {
                var sessionid = e.header['X-Transmission-Session-Id']
                if (e.statusCode == 409 && sessionid) {
                    tr_session_id = sessionid
                    callLocalTr(serverConfig, params, callBack, localNetTimeOut)
                } else if (e.statusCode == 401 || e.statusCode == 403) {
                    callBack(false)
                } else {
                    callBack({
                        e: e,
                        success: true,
                        data: e.data.arguments,
                        statusCode: e.statusCode,
                        type: 'inner'
                    })
                }
            },
            fail(e) {
                callBack(false)
            }
        })
    }

}
// tr外网下的请求
function callRemoteTr(serverConfig, params, reqUrl, callBack) {
    if (utils.trimAllBlank(serverConfig.outerhost) == "" && utils.trimAllBlank(serverConfig.host) == "") {
        callBack(false)
    } else {
        var params = url2tr.getTRrequest(reqUrl, params)
        // 把原始的url赋给trRequest,用于远程访问功能
        params.url = reqUrl
        //兼容旧版，旧版没有outerhost字段
        var url = serverConfig.outerhost ? serverConfig.outerhost : serverConfig.host
        if (utils.endWith(url, '/')) url = url.substr(0, url.length - 1)
        var data = {
            type: "transmission", //告诉服务端请求的是tr
            user: crypto.encrypted(JSON.stringify({
                url: url,
                username: serverConfig.username,
                password: serverConfig.password
            })),
            params: params
        }
        wx.request({
            url: config.server.host + params.url,
            data: data,
            header: {},
            method: "POST",
            success(e) {
                // console.log(e)
                if (e.data == "error") {
                    callBack(false)
                } else if (e.data == "request_time_out") {
                    callBack(false)
                } else {
                    if (e.statusCode != 200) {
                        callBack(false)
                    } else {
                        //远端返回字符串需要转成对应json对象
                        if (typeof (e.data) == "string" && e.data.indexOf('Error') != -1)
                            e.data = JSON.parse(e.data)
                        callBack({
                            e: e,
                            success: true,
                            data: e.data.arguments ? e.data.arguments : null,
                            statusCode: e.statusCode,
                            type: 'outer'
                        })
                    }
                }
            },
            fail(e) {
                callBack(false)
            }
        })
    }

}
//tr的请求方法
function callTransmissionRpc(serverConfig, params, reqUrl, callBack, localNetTimeOut) {
    callLocalTr(serverConfig, params, reqUrl, function (result) {
        if (result == false) {
            callRemoteTr(serverConfig, params, reqUrl, function (res) {
                if (res == false) {
                    callBack({
                        info: "auth fail"
                    })
                } else {
                    callBack(res)
                }
            })
        } else {
            callBack(result)
        }
    }, localNetTimeOut)
}

//qb的通用请求
// function qbRequestCommon(reqConfig, reqUrl, callBack, customerMethod = null, customerAddHeaderParams = []) {
//     var header = reqConfig.header
//     customerAddHeaderParams.forEach(element => {
//         header[element.key] = element.value
//     });
//     var url = reqConfig.url + reqUrl
//     // console.log(url)
//     wx.request({
//         url: url,
//         data: reqConfig.data,
//         method: customerMethod ? customerMethod : reqConfig.method,
//         header: header,
//         success(e) {
//             console.log("qbRequestCommon complete")
//             if (e.data == null || e.data == "error") {
//                 // console.log("req_fail")
//                 callBack(false)
//             } else {
//                 callBack({
//                     e: e,
//                     success: true,
//                     data: e.data,
//                     statusCode: e.statusCode,
//                     type: reqConfig.type
//                 })
//             }
//         },
//         fail(e) {
//             console.log("qbRequestCommon_req_fail:", e)
//             callBack(false)
//         }
//     })
// }
// qb的本地请求
var qb_cookie_id = ""
function callLocalQbCommon(client, localCookie, params, reqUrl, callBack, localNetTimeOut=2000) {
    // client.host = client.innerhost
    //兼容旧版，旧版没有innerhost字段
    var url = client.innerhost ? client.innerhost : client.host
    if (url && utils.endWith(url, '/')) url = url.substr(0, url.length - 1)
    var reqConfig = {
        url: url,
        data: params,
        method: "POST", //qb v4.4.4 需要post方法，需添加header
        header: {
            cookie: localCookie,
            'content-type': 'application/x-www-form-urlencoded'
        },
        type: 'inner'
    }
    // qbRequestCommon(reqConfig, reqUrl, callBack)
    var header = reqConfig.header
    var url = reqConfig.url + reqUrl
    // console.log(url)
    // console.log("begin call callLocalQbCommon")
    wx.request({
        url: url,
        data: reqConfig.data,
        header: header,
        timeout: localNetTimeOut,//毫秒
        success(e) {
            // console.log("callLocalQbCommon complete")
            if (e.data == null || e.data == "error") {
                // console.log("req_fail")
                callBack(false)
            } else {
                callBack({
                    e: e,
                    success: true,
                    data: e.data,
                    statusCode: e.statusCode,
                    type: reqConfig.type
                })
            }
        },
        fail(e) {
            console.log("callLocalQbCommon_req_fail:", e)
            callBack(false)
        }
    })
}

function callLocalQb(serverConfig, params, reqUrl, callBack, localNetTimeOut) {
    //先获取cookie
    // console.log("check local qb cookie:"+qb_cookie_id)
    //如果有cookie，则先试用
    if (qb_cookie_id) {
        callLocalQbCommon(serverConfig, qb_cookie_id, params, reqUrl, function (localRequestResult) {
            if (!localRequestResult.success) {
                callBack(false)
            } else {
                callBack(localRequestResult)
            }
        },localNetTimeOut)
    } else {
        //更新cookie
        getLocalLoginCookiesForQb(serverConfig, function (cookieResult) {
            // console.log("local qb cookie result:"+cookieResult)
            if (cookieResult) {
                qb_cookie_id = cookieResult
                callLocalQbCommon(serverConfig, qb_cookie_id, params, reqUrl, function (localRequestResult) {
                    if (!localRequestResult.success) {
                        callBack(false)
                    } else {
                        callBack(localRequestResult)
                    }
                },localNetTimeOut)
            } else {
                callBack(false)
            }
        },localNetTimeOut)
    }
}
//qb的远程请求
function callRemoteQb(serverConfig, params, reqUrl, callBack, customerMethod = "", customerAddHeaderParams = []) {
    var client = serverConfig
    //否则尝试外网访问
    if (utils.trimAllBlank(client.outerhost) == "" && utils.trimAllBlank(client.host) == "") {
        callBack("")
    } else {
        // client.host = client.outerhost
        //兼容旧版,旧版没有outerhost字段
        var url = client.outerhost ? client.outerhost : client.host
        if (url && utils.endWith(url, '/')) url = url.substr(0, url.length - 1)
        var data = {
            user: crypto.encrypted(JSON.stringify({
                url: url,
                username: client.username,
                password: client.password
            })),
            params: params
        }
        var reqConfig = {
            url: config.server.host,
            data: data,
            header: {},
            method: "POST",
            type: 'outer'
        }
        // qbRequestCommon(reqConfig, reqUrl, callBack, customerMethod, customerAddHeaderParams)
        var header = reqConfig.header
        customerAddHeaderParams.forEach(element => {
            header[element.key] = element.value
        });
        var url = reqConfig.url + reqUrl
        // console.log(url)
        wx.request({
            url: url,
            data: reqConfig.data,
            method: customerMethod ? customerMethod : reqConfig.method,
            header: header,
            success(e) {
                // console.log("callRemoteQb complete")
                if (e.data == null || e.data == "error") {
                    // console.log("req_fail")
                    callBack(false)
                } else {
                    callBack({
                        e: e,
                        success: true,
                        data: e.data,
                        statusCode: e.statusCode,
                        type: reqConfig.type
                    })
                }
            },
            fail(e) {
                console.log("callRemoteQb_req_fail:", e)
                callBack(false)
            }
        })
    }
}
//qb的请求方法
function callQbittorrent(serverConfig, params, reqUrl, callBack, customerMethod, customerAddHeaderParams, localNetTimeOut) {
    callLocalQb(serverConfig, params, reqUrl, function (result) {
        if (result == false) {
            console.log("qb local request fail")
            callRemoteQb(serverConfig, params, reqUrl, function (res) {
                if (res == false) {
                    console.log("qb remote request fail")
                    callBack({
                        info: "qb remote request fail"
                    })
                } else {
                    callBack(res)
                }
            }, customerMethod, customerAddHeaderParams)
        } else {
            callBack(result)
        }
    }, localNetTimeOut)
}
//根据config判断请求url
function GetClient(serverConfig, reqUrl, callBack, params = null, customerMethod = "", customerAddHeaderParams = [], localNetTimeOut = 2000) {
    if (serverConfig.type == "Transmission") {
        callTransmissionRpc(serverConfig, params, reqUrl, callBack, localNetTimeOut)
    } else {
        callQbittorrent(serverConfig, params, reqUrl, callBack, customerMethod, customerAddHeaderParams, localNetTimeOut)
    }
}
// 直接请求远程服务器url
function GetServer(reqUrl, callBack, data = null, method = 'GET', showtosat = true) {
    wx.request({
        url: config.server.host + reqUrl,
        data: data,
        method: method,
        success(e) {
            callBack({
                success: true,
                data: e.data,
                statusCode: e.statusCode
            })
        },
        fail(e) {
            console.log(e)
            // console.log("req_fail")
            if (showtosat) {
                wx.showToast({
                    title: e.errMsg,
                    icon: 'none',
                    duration: 5000
                })
            }
            callBack({
                success: false,
                info: "req_fail"
            })
        }
    })
}
module.exports = {
    GetClient,
    GetServer,
    callRemoteQb,
    callLocalQb,
    callRemoteTr,
    callLocalTr
}