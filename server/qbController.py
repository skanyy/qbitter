'''
Author: seven
Date: 2022-03-16 16:12:23
LastEditors: Please set LastEditors
LastEditTime: 2022-12-26 08:47:00
Description: 
'''
from fastapi import Request
from pydantic import Json
import requests
from mylog import MyLog
import util, json

user_cookies = None
user_session = requests.Session()
req_time_out = 15

# 上传文件
async def addNewTorrentFile(req: Request):
    try:
        form = await req.form()
        form = util.tool.dictToObj(form._dict)
        user = util.aes_decode(form.user)
        user = util.tool.dictToObj(json.loads(user))
        params = util.tool.dictToObj(json.loads(form.params))
        file = form.file.file
        filename = form.file.filename
        # requests 上传的文件传入files，将其他参数传入data，request库会将两者合并到一起做一个multi part
        data = {"name": "torrents", "filename": filename}
        for k, v in params.items():
            if k != "filepath" and k != "urls":
                data[k] = v
        file = {"file": (filename, file.read())}
        url = user.url + '/api/v2/torrents/add'
        res = user_session.post(url=url, data=data, files=file,timeout=req_time_out)
        if res.status_code == 403:
            user_cookies = getCookies(user)
            res = user_session.post(url=url,
                                    data=data,
                                    files=file,
                                    cookies=user_cookies,
                                    timeout=req_time_out)
    except Exception as e:
        MyLog().getInstance("apilog").error('qb add_torrent_file fail:' +
                                            str(e))
        return "error"
    return res

# get方法
# def getCookies(user):
#     login_res = user_session.get(url=user.url +
#                                  "/api/v2/auth/login?username=" +
#                                  user.username + "&password=" + user.password)
#     if login_res.status_code == 200:
#         return requests.utils.dict_from_cookiejar(login_res.cookies)
#     return None

# 新版本的qb使用post方法
def getCookies(user):
    data = {
        "username":user.username,
        "password":user.password
    }
    cookies_res = requests.post(url=user.url +"/api/v2/auth/login",data=data,timeout=req_time_out)
    if cookies_res.status_code == 200:
        return requests.utils.dict_from_cookiejar(cookies_res.cookies)
    return None


def doCommon(body, path):
    try:
        user = body.user
        data = body.params

        # 登录验证
        if path=='/api/v2/auth/login':
            user_cookies = getCookies(user)
            login_res = user_session.get(url=user.url + path,cookies=user_cookies,timeout=req_time_out)
            return login_res

        #其他情况
        playload = {}
        # 添加文件url时
        if data and path == "/api/v2/torrents/add":
            for k, v in data.items():
                playload[k] = (None, v)
        
        #执行请求
        res = user_session.get(url=user.url + path,params=data,files=playload,timeout=req_time_out)
        #会话过期则更新cookies
        if res.status_code == 403:
            user_cookies = getCookies(user)
            res = user_session.get(url=user.url + path,params=data,files=playload,cookies=user_cookies,timeout=req_time_out)
        return res
        # elif res.status_code == 200:
        #     return res
    except Exception as e:
        MyLog().getInstance("apilog").error(path +':qb_request_fail->detail:' +str(e))
        # dict
        result =  {}
        result["content"]="error"
        result["status_code"]= 500
        return util.tool.dictToObj(result)

