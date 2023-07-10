var config = require('../config.js')
//根据请求的url构造tr请求，以及将获取到的tr数据转换为qb对应的字段关系
function getTRrequest(qburl, params) {
    switch (qburl) {
        case config.client.Login_torrent: //登录
        case config.client.Get_app_speedlimitstate: // 获取是否限速模式
        case config.client.Get_defaultSavePath: //获取默认保存位置
        case config.client.Get_app_preferences: // 获取所有配置项
        case config.client.Get_maindata://获取客户端会话详情
            return {
                'method': 'session-get',
                'arguments': {}
            };
            //客户端的选项设置
        case config.client.Set_app_preferences:
            var args = {}
            // console.log(params.json)
            var data = JSON.parse(params.json)
            var keys = Object.keys(data)
            for (var i = 0; i < keys.length; i++) {
                var value = data[keys[i]]
                switch (keys[i]) {
                    case 'save_path':
                        args = {
                            'download-dir': value
                        }
                        break
                    case 'upnp':
                        args = {
                            'port-forwarding-enabled': value
                        }
                        break
                    case 'start_paused_enabled'://手动开始
                        args={
                            'start-added-torrents':!value
                        }
                        break
                    case 'random_port':
                        args={
                            'peer-port-random-on-start':value//随机端口
                        }
                        break
                    case 'utp-enabled'://utp开关
                        args = {
                            'utp-enabled': value
                        }
                        break
                    case 'dht': //dht开关
                        args = {
                            'dht-enabled': value
                        }
                        break
                    case 'pex':
                        args = {
                            'pex-enabled': value
                        }
                        break
                    case 'lsd':
                        args={
                            'lpd-enabled':value
                        }
                        break
                    case 'alt-speed-enabled': //备用速度开关
                        args = {
                            'alt-speed-enabled': value
                        }
                        break
                    case 'alt_dl_limit': //备用速度下载限制
                        args = {
                            'alt-speed-down': parseFloat(value)
                        }
                        break
                    case 'alt_up_limit': //备用速度上传限制
                        args = {
                            'alt-speed-up': parseFloat(value)
                        }
                        break
                    case 'speed-limit-down-enabled': //全局下载限速开关
                        args = {
                            'speed-limit-down-enabled': value
                        }
                        break
                    case 'dl_limit': //全局速度下载限制
                        args = {
                            'speed-limit-down': parseFloat(value)
                        }
                        break
                    case 'speed-limit-up-enabled': //全局上传限速开关
                        args = {
                            'speed-limit-up-enabled': value
                        }
                        break
                    case 'up_limit': //全局速度上传限制
                        args = {
                            'speed-limit-up': parseFloat(value)
                        }
                        break
                    case 'download-queue-enabled': //下载队列开关
                        args = {
                            'download-queue-enabled': value
                        }
                        break
                    case 'max_active_downloads': //最大活动的下载数
                        args = {
                            'download-queue-size': parseInt(value)
                        }
                        break
                    case 'seed-queue-enabled': //启用上传队列
                        args = {
                            'seed-queue-enabled': value
                        }
                        break
                    case 'max_active_uploads': //最大活动的上传数
                        args = {
                            'seed-queue-size': parseInt(value)
                        }
                        break
                    case 'max_connec': //最大连接数
                        args = {
                            'peer-limit-global': parseInt(value)
                        }
                        break
                    case 'max_connec_per_torrent': //每个种子最大连接数
                        args = {
                            'peer-limit-per-torrent': parseInt(value)
                        }
                        break
                }
            }
            // console.log(args)
            return {
                'method': 'session-set',
                'arguments': args
            };
        //获取tr的可用空间
        case config.client.Get_TR_Free_Space:
            return{
                'method':'free-space',
                'arguments': {
                    'path':params.path
                }
            };
            // 获取全局传输信息
        case config.client.Get_global_transferinfo:
            return {
                'method': 'session-stats',
                'arguments': {}
            };
        case config.client.Set_app_queuing:
            return {
                'method': 'session-set',
                'arguments': {
                    'queue-stalled-enabled': params.queueEnable
                }
            };
            // 切换备用限速模式
        case config.client.Set_app_toggleSpeedLimitsMode:
            return {
                'method': 'session-set',
                'arguments': {
                    'alt-speed-enabled': params.altSpeedEnabled
                }
            };
            // 获取标签
        case config.client.Get_all_tags:
            return {
                'method': 'torrent-get',
                'arguments': {
                    fields: ['id', 'hashString', 'status', 'name', 'totalSize', 'addedDate', 'percentDone', 'labels']
                }
            };
            // 获取种子列表
        case config.client.Get_torrent_list:
            return {
                'method': 'torrent-get',
                'arguments': {
                    fields: ['id', 'hashString', 'status', 'name', 'totalSize', 'addedDate', 'percentDone', 'eta','etaIdle', 'activityDate','downloadDir' ,  'labels', 'bandwidthPriority', 'queuePosition','rateDownload', 'rateUpload','downloadLimit', 'uploadLimit', 'uploadRatio','seedRatioLimit']
                }
            };
            //获取种子属性
        case config.client.Get_torrent_properties:
        case config.client.Get_torrent_contents:
        case config.client.Get_torrent_trackers:
        case config.client.Get_torrent_torrentPeers:
        case config.client.Get_torrent_webseeds:
            return {
                'method': 'torrent-get',
                'arguments': {
                    'ids': params.hashes,
                    'fields': ['addedDate', 'bandwidthPriority', 'comment', 'corruptEver', 'creator', 'dateCreated', 'desiredAvailable', 'doneDate', 'downloadDir', 'downloadedEver', 'downloadLimit', 'downloadLimited', 'editDate', 'error', 'errorString', 'eta', 'etaIdle', 'file-count', 'files', 'fileStats', 'hashString', 'haveUnchecked', 'haveValid', 'honorsSessionLimits', 'id', 'isFinished', 'isPrivate', 'isStalled', 'labels', 'leftUntilDone', 'magnetLink', 'manualAnnounceTime', 'maxConnectedPeers', 'metadataPercentComplete', 'name', 'peer-limit', 'peers', 'peersConnected', 'peersFrom', 'peersGettingFromUs', 'peersSendingToUs', 'percentDone', 'pieces', 'pieceCount', 'pieceSize', 'priorities', 'primary-mime-type', 'queuePosition', 'rateDownload', 'rateUpload', 'recheckProgress', 'secondsDownloading', 'secondsSeeding', 'seedIdleLimit', 'seedIdleMode', 'seedRatioLimit', 'seedRatioMode', 'sizeWhenDone', 'startDate', 'status', 'trackers', 'trackerStats', 'totalSize', 'torrentFile', 'uploadedEver', 'uploadLimit', 'uploadLimited', 'uploadRatio', 'wanted', 'webseeds', 'webseedsSendingToUs']
                }
            };
            //新增下载
        case config.client.New_download:
            var reqInfo = {
                'method': 'torrent-add'
            }
            if (params.addtype == "file") {
                reqInfo.arguments = {
                    'download-dir': params.save_path,
                    'paused': params.paused,
                    'metainfo': params.torrents
                }
            } else if (params.addtype == "url") {
                if (params.urls.match(/^[0-9a-f]{40}$/i)) {
                    params.urls = 'magnet:?xt=urn:btih:' + params.urls;
                }
                reqInfo.arguments = {
                    'download-dir': params.save_path,
                    'paused': params.paused,
                    'filename': params.urls
                }
            }
            return reqInfo;
            // 删除
        case config.client.Delete_download:
            return {
                'method': 'torrent-remove',
                'arguments': {
                    'ids': [params.hashes],
                    'delete-local-data': params.deleteFiles
                }
            };
            // 暂停
        case config.client.Pause_downloading:
            return {
                'method': 'torrent-stop',
                'arguments': {
                    'ids': params.hashes
                }
            };
            // 恢复,开始
        case config.client.Resume_download:
            return {
                'method': 'torrent-start',
                'arguments': {
                    'ids': params.hashes
                }
            };
        case config.client.Set_super_seeding:
            return {
                //tr没有这个方法
            };
            // 重新汇报
        case config.client.Reannounce_torrents:
            return {
                'method': 'torrent-reannounce',
                'arguments': {
                    'ids': params.hashes
                }
            };
            // 重新校检
        case config.client.Recheck_torrents:
            return {
                'method': 'torrent-verify',
                'arguments': {
                    'ids': params.hashes
                }
            };
            // 设置下载限速
        case config.client.Set_torrent_download_limit:
            return {
                'method': 'torrent-set',
                'arguments': {
                    'ids': params.hashes,
                    'downloadLimit': params.limit
                }
            };
            // 设置上传限速
        case config.client.Set_torrent_upload_limit:
            return {
                'method': 'torrent-set',
                'arguments': {
                    'ids': params.hashes,
                    'uploadLimit': params.limit
                }
            };
            // 设置种子保存位置
        case config.client.Set_torrent_location:
            return {
                'method': 'torrent-set-location',
                'arguments': {
                    'ids': params.hashes,
                    'location': params.location,
                    'move': true
                }
            };
            // 重命名
        case config.client.Rename_file:
        case config.client.Rename_folder:
        case config.client.Set_torrent_name:
            return {
                'method': 'torrent-rename-path',
                'arguments': {
                    'ids': [params.hash], //传hash和id都可以
                    'path': params.path,
                    'name': params.name
                }
            };
            // 为种子添加标签
        case config.client.Create_tags:
        case config.client.Add_torrent_tags:
            return {
                'method': 'torrent-set',
                'arguments': {
                    'ids': params.hashes,
                    'labels': params.tags
                }
            };
            // 设置分享率
        case config.client.Set_torrent_share_limit:
            return {
                'method': 'torrent-set',
                'arguments': {
                    'ids': params.hashes,
                    'seedRatioLimit': params.ratioLimit
                }
            };
            //强制继续
        case config.client.Set_force_start:
            return {
                'method': 'torrent-start-now',
                'arguments': {
                    'ids': params.hashes
                }
            };
            //下载与否
        case config.client.Set_file_priority:
            // qb文件优先级设置有：Set file priority
            // 对应状态码：
            // 0	Do not download
            // 1	Normal priority
            // 6	High priority
            // 7	Maximal priority
            // tr文件优先级设置有:
            // files-wanted 下载
            // files-unwanted 不下载
            // priority-high
            // priority-low
            // priority-normal
            //下载
            var args = {}
            // 不下载
            if (params.priority == 0) {
                args = {
                    "ids": params.hash,
                    "files-unwanted": params.id
                }
            } else if (params.priority == 1) {
                args = {
                    "ids": params.hash,
                    "files-wanted": params.id,
                    "priority-normal": params.id
                }
            } else if (params.priority == 6) {
                args = {
                    "ids": params.hash,
                    "priority-high": params.id
                }
            } else if (params.priority == 7) {
                args = {
                    "ids": params.hash,
                    "priority-low": params.id
                }
            }
            return {
                "method": "torrent-set",
                "arguments": args
            };
            //提高种子优先级
        case config.client.Increase_torrent_priority:
            return {
                "method": "queue-move-up",
                "arguments": {
                    "ids": params.hashes
                }
            };
            //降低种子优先级
        case config.client.Decrease_torrent_priority:
            return {
                "method": "queue-move-down",
                "arguments": {
                    "ids": params.hashes
                }
            };
            // 种子优先级为高
        case config.client.Maximal_torrent_priority:
            return {
                "method": "queue-move-top",
                "arguments": {
                    "ids": params.hashes
                }
            };
            // 种子优先级为最低
        case config.client.Minimal_torrent_priority:
            return {
                "method": "queue-move-bottom",
                "arguments": {
                    "ids": params.hashes
                }
            };
    }
}

function getStateText(state, is_tr) {
    if (is_tr) {
        switch (state) {
            case 0:
                return {
                    text: '已暂停', stateText: 'pausedDL', code: state
                };
            case 1:
                return {
                    text: '等待校检', stateText: 'checkingUP', code: state
                };
            case 2:
                return {
                    text: '校检中', stateText: 'checkingUP', code: state
                };
            case 3:
                return {
                    text: '等待下载', stateText: 'pausedDL', code: state
                };
            case 4:
                return {
                    text: '下载中', stateText: 'downloading', code: state
                };
            case 5:
                return {
                    text: '等待做种', stateText: 'queuedUP', code: state
                };
            case 6:
                return {
                    text: '做种中', stateText: 'stalledUP', code: state
                };
        }
    } else {
        switch (state) {
            case "missingFiles":
                return "丢失"
            case "checkingUP":
                return "校验"
            case "forcedUP":
                return "F-UP"
            case "forcedDL":
                return "F-DL"
            case "queuedUP":
                return "排队"
            case "stalledUP":
                return "做种"
            case "pausedDL":
                return "暂停下载"
            case "pausedUP":
                return "暂停上传"
            case "uploading":
                return "上传"
            case "downloading":
                return "下载"
        }
        return ""
    }
}

function getPriority(priority, is_tr, is_qb_torrent = false) {
    //qb的种子和文件优先级的状态码不一样，需判断一下
    //for qb： priority	integer	Torrent priority. Returns -1 if queuing is disabled or torrent is in seed mode
    // qb种子优先级设置有：
    // 提高Increase
    // 降低Decrease
    // 最高Maximal
    // 最低Minimal
    // tr种子优先级设置有
    // queue-move-top
    // queue-move-up 
    // queue-move-down
    // queue-move-bottom

    // 种子
    if (is_qb_torrent && priority == 0) return "正常"
    // 文件
    switch (priority) {
        case -1:
            return is_tr ? "低" : "其他"
        case 0:
            return is_tr ? "正常" : "不下载"
        case 1:
            return is_tr ? "高" : "正常"
        case 6:
            return "高"
        case 7:
            return "低"
    }
    return "其他"
}
module.exports = {
    getTRrequest,
    getStateText,
    getPriority
}