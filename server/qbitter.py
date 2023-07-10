from datetime import datetime,timedelta
from fastapi import FastAPI, Response
from fastapi.staticfiles import StaticFiles
#引入 CORS中间件模块
from starlette.middleware.cors import CORSMiddleware
from starlette.requests import Request
from fastapi.responses import RedirectResponse
import uvicorn, time
import requests
import json
from mylog import MyLog
from ptsites.site import PTSite
import util
import base64
import trController
import qbController
import autosign

# 后端认证
from typing import Optional
from fastapi import Depends, FastAPI, HTTPException
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from starlette import status
from jose import JWTError, jwt
from pydantic import BaseModel

#这些url直接试用fastapi处理，无业务二次处理
direct_path = {
    '/', '/api/v2/shareInfo', '/api/v2/aboutme', '/api/v2/help',
    '/site/getcookie', '/site/getloginpage', '/api/v2/wx/registstatus',
    '/api/v2/wx/regist', '/site/search', '/site/detail', '/site/supportlist',
    '/site/checkconfig', '/site/autosignstatus', '/site/applyautosign',
    '/site/resign', '/api/v2/wx/unregist','/api/v2/wx/log','/api/v2/wx/saveconfig',
    '/api/v2/wx/downconfig','/site/getsitedata','/api/v2/signhistory',
    '/api/v2/signtoday','/api/v2/viewad','/api/v2/closeAdInfo','/site/removeautosign',
    '/sys/list','/sys/update','/sys/token'
}

app = FastAPI(docs_url=None,
              redoc_url=None,
              openapi_url=None,
              include_in_schema=False)

#设置允许访问的域名
# origins = ["*"]  #也可以设置为"*"，即为所有。
# origins = ["https://www.qbiter.cc:8885"]
#设置跨域传参
app.add_middleware(
    CORSMiddleware, 
    # allow_origins=origins,  #设置允许的origins来源
    allow_credentials=True,
    allow_methods=["GET","POST"],  # 设置允许跨域的http方法，比如 get、post、put等。
    allow_headers=["*"])  #允许跨域的headers，可以用来鉴别来源等作用。

# 静态文件
app.mount("/static", StaticFiles(directory="static"), name="static")
app.mount("/admin", StaticFiles(directory="admin"), name="admin")

@app.middleware("http")
async def processMyRequest(request: Request, call_next):
    # clientInfo = str(request.client)
    # start_time = time.time()
    path = request.url.path
    # print("request_begin->" + clientInfo+",path->"+path)
    # 这些请求直接返回,不需要业务处理
    if path in direct_path or path.find('/static/')!=-1 or path.find('/admin/')!=-1:
        result = await call_next(request)
    else:
        if 'content-type' in request.headers:
            contentType = request.headers['content-type']
            # print(contentType)
            localtion = contentType.find("multipart/form-data")
            # "multipart/form-data"开头的是qb的文件上传
            if localtion == 0:
                response = await qbController.addNewTorrentFile(request)
            else:
                body = await request.body()
                body = json.loads(body)
                body = util.tool.dictToObj(body)
                body.user = json.loads(util.aes_decode(body.user))
                # 转为object
                body = util.tool.dictToObj(body)
                # print('client_url->' + str(body.user.url) + path)
                if body.type == "transmission":
                    response = trController.do(body)
                else:
                    response = qbController.doCommon(body, path)
            if hasattr(response,'content'):
                result = Response(response.content, response.status_code)
            else:
                result = Response(response, response.status_code)
        else:
            result = Response("content-type not exist", 411)
    # process_time = time.time() - start_time
    # print("request_finish->" + clientInfo + ",time spend->" + str(process_time))
    return result


@app.get("/")
async def get():
    return {"ok"}


# 用于验证服务是否可用
@app.post("/")
async def root(req: Request):
    res = await req.body()
    if res:
        return {"message": "service is running", "res": res}
    else:
        return {"serivce handler error"}

# 管理端
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")
SECRET_KEY = "09d25e094fa5fdd2556c817b93f7099f6f0f4ca7f63b88e8d3e7"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

class User(BaseModel):
    username: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str

USER_LIST = [
    User(username="admin", password="xxxxxx")
]

def get_user(username: str) -> User:
    # 伪数据库
    for user in USER_LIST:
        if user.username == username:
            return user

form_exception = HTTPException(
    status_code=status.HTTP_401_UNAUTHORIZED,
    detail="Could not validate credentials",
    headers={"WWW-Authenticate": "Bearer"},
)

credentials_exception = HTTPException(
    status_code=status.HTTP_401_UNAUTHORIZED,
    detail="Could not validate credentials",
    headers={"WWW-Authenticate": "Bearer"},
)

def create_token(user: User, expires_delta: Optional[timedelta] = None):
    expire = datetime.utcnow() + expires_delta or timedelta(minutes=15)
    return jwt.encode(
        claims={"sub": user.username, "exp": expire},
        key=SECRET_KEY,
        algorithm=ALGORITHM
    )

@app.post("/sys/token")
async def login_get_token(form_data: OAuth2PasswordRequestForm = Depends()):
    user: User = get_user(form_data.username)
    if not user or user.password != form_data.password:
        raise form_exception
    access_token = create_token(user=user, expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    return {"access_token": access_token, "token_type": "bearer"}

def token_to_list(keyword:str,token: str = Depends(oauth2_scheme)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        # 再次验证用户
        username, expire = payload.get("sub"), payload.get("exp")
        user = get_user(username)
        if user is None:
            raise JWTError
    except JWTError:
        raise credentials_exception
    return  util.user.querySignList(keyword)

def token_to_update(id:str,action:str,settime:str,token: str = Depends(oauth2_scheme)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        # 再次验证用户
        username, expire = payload.get("sub"), payload.get("exp")
        user = get_user(username)
        if user is None:
            raise JWTError
    except JWTError:
        raise credentials_exception
    return util.user.setAutoSignStatus(id,action,settime)

#用token获取信息
@app.get("/sys/list")
async def get_itemlist(info: str = Depends(token_to_list)):
    return info

# 更新用户的自动签到申请设置
@app.get("/sys/update")
async def updateUserSign(info: str = Depends(token_to_update)):
    return info

# 客户端其他请求

# 获取分享页面的信息
@app.post("/api/v2/shareInfo")
async def shareInfo(req: Request):
    info = util.getConfig().share
    return info


# 获取页面文字和图片列表
def getPageInfoAndImages(page):
    imags = []
    for img in page.images:
        with open(img, mode='rb') as image_file:
            encode_image = base64.b64encode(image_file.read())
            imags.append(encode_image)
    data = {"mime": "image/jpg", "image": imags, "info": page.info}
    return data


# 关于页面
@app.post("/api/v2/aboutme")
async def getAboutMe(req: Request):
    aboutme = util.getConfig().aboutme
    return getPageInfoAndImages(aboutme)


# 获取帮助页面
@app.post("/api/v2/help")
async def getHelp(req: Request):
    help = util.getConfig().help
    return getPageInfoAndImages(help)

# 如何关闭广告的页面说明
@app.post("/api/v2/closeAdInfo")
async def getAdInfo(req:Request):
    adinfo = util.getConfig().adinfo
    return getPageInfoAndImages(adinfo)

# 登录日志
@app.get("/api/v2/wx/log")
async def loginRecord(jscode):
    if jscode == None: return "error"
    res = await wxSession(jscode)
    if res and res.openid:
        res = util.user.record(res.openid)
        return res
    else:
        return "error"


# 获取用户注册状态
@app.get("/api/v2/wx/registstatus")
async def registStatus(jscode: str):
    # MyLog().getInstance("apilog").info('qb_requestUriWithCookies->info:jscode->' + jscode)
    if jscode == None: return "error"
    res = await wxSession(jscode)
    if res and res.openid:
        result = util.user.getInfo(res.openid)
        result = util.aes_encode(result)
        return result
    else:
        return "error"


# 用户注册
@app.get("/api/v2/wx/regist")
async def regist(jscode: str, user: str):
    user = util.aes_decode(user)
    # MyLog().getInstance("apilog").info('/api/v2/wx/regist->info:jscode->' +
    #                                    jscode + ":user->" + user)
    if jscode == None: return "error"
    res = await wxSession(jscode)
    if res and res.openid:
        count = util.user.getInfo(res.openid, True)
        result = "error"
        if count > 0:
            if util.user.regist(res.openid, user, True):
                result = util.aes_encode(res.openid)
        else:
            if util.user.regist(res.openid, user, False):
                result = util.aes_encode(res.openid)
        return result
    else:
        return "error"


# 用户解除绑定
@app.get("/api/v2/wx/unregist")
async def unregist(userinfo):
    # MyLog().getInstance("apilog").info('/api/v2/wx/unregist->:openid->' +openid)
    userinfo = json.loads(util.aes_decode(userinfo))
    openid = util.tool.dictToObj(userinfo).openid
    if openid:
        return util.user.unregist(openid)
    else:
        return "error"

# 保存用户的配置到服务器
@app.get("/api/v2/wx/saveconfig")
async def saveconfig(data):
    # 对传入的字符串判断，加强安全 2022.10.13
    try:
        config = json.loads(util.aes_decode(data))
        config = util.tool.dictToObj(config)
        if hasattr(config,"openid") and hasattr(config,"serverlist") and hasattr(config,"sitelist"):
            openid = util.tool.dictToObj(config).openid
            return util.user.saveconfig(openid,data)
        else:
            return "error"
    except Exception as e:
        return "error"

# 根据openid 获取用户配置
@app.get("/api/v2/wx/downconfig")
async def getconfig(openid):
    # 对传入的字符串判断，加强安全 2022.10.13
    try:
        openid = util.aes_decode(openid)
        if openid:
            return util.user.queryconfig(openid)
        else:
            return "error"
    except Exception as e:
        return "error"


# 微信code转session
async def wxSession(code: str):
    try:
        wxconfig = util.getConfig().wxconfig
        wxconfig.params.js_code = code
        res = requests.get(url=wxconfig.url, params=wxconfig.params)
        if res:
            res = json.loads(res.content.decode('utf8'))
            if hasattr(res,"errcode"):
                MyLog().getInstance("apilog").info('wxSession->:' + str(res))
            else:
                res = util.tool.dictToObj(res)
                return res
    except Exception as e:
        MyLog().getInstance("apilog").warning('wxSession->error:' + str(e))
    return None


#pt站点处理
#获取用户自动签到功能服务状态
@app.get("/site/autosignstatus")
async def getAutoSignStatus(config):
    try:
        params = json.loads(util.aes_decode(config))
        config = util.tool.dictToObj(params)
        return util.user.getAutoSign(config.user_id, config.sitehost,
                                     config.customername)
    except Exception as e:
        return "error"


# 手动签到
@app.get("/site/resign")
async def reSign(config, request: Request):
    try:
        params = json.loads(util.aes_decode(config))
        config = util.tool.dictToObj(params)
        task = util.user.getAutoSignTaskList(config)
        record_id = task[0][0]
        sitename = task[0][9]
        sitecookie = util.aes_decode(task[0][11])
        return autosign.signToWebSite(record_id, sitename, sitecookie, request.client)
    except Exception as e:
        return "error"

#添加或更新待审核的自动签到
@app.get("/site/applyautosign")
async def applyAutoSign(config):
    try:
        params = json.loads(util.aes_decode(config))
        config = util.tool.dictToObj(params)
        #是否存在
        count = util.user.getAutoSign(config.user_id, config.sitehost,
                                      config.customername, config.cookie,True)
        # 存在，更新
        if count > 0:
            return util.user.updateAutoSign(config.user_id, config.user_nick,
                                            config.sitehost,
                                            config.customername,
                                            config.customername2,
                                            config.cookie, config.signtime,
                                            config.running)
        # 不存在，添加
        else:
            addresult= util.user.registAutoSign(config.user_id, config.user_nick,
                                            config.sitehost, config.sitename,
                                            config.customername, config.cookie,
                                            config.signtime)
            #推送提醒
            if addresult:
                notice = util.getConfig().notice
                requests.get(notice.url+"签到开通/申请:"+str(config.user_nick)+","+str(config.sitename)+","+str(config.customername)+"?sound="+notice.sound+"&icon="+notice.icon)
            return addresult
    except Exception as e:
        return "error"


#移除自动签到
@app.get("/site/removeautosign")
async def removeAutoSign(config):
    try:
        params = json.loads(util.aes_decode(config))
        config = util.tool.dictToObj(params)
        return util.user.removeAutoSign(config.user_id,config.sitehost, config.sitename,config.customername, config.cookie)
    except Exception as e:
        return "error"


#获取支持的站点列表
@app.get('/site/supportlist')
async def getSupportSites():
    try:
        list = util.getConfig().supportsites
        list = json.dumps(list)
        return Response(list, 200)
    except Exception as e:
        return "error"


#搜索pt站资源,keywork为空则获取首页数据
@app.get('/site/search')
async def searchTorrentFromPtSite(keyword, config, request: Request):
    try:
        ptsite = initSite(config, request.client)
        result = ptsite.searchTorrentsByKeyWord(keyword)
        result = json.dumps(result)
        return Response(result, 200)
    except Exception as e:
        MyLog().getInstance("apilog").warning('/site/search->error:' + str(e))
    return "error"


#获取种子详情页面的下载url
@app.get('/site/detail')
async def getDetailFromUrl(url, config, request: Request):
    try:
        ptsite = initSite(config, request.client)
        result = ptsite.getDownloadUrlFromDetailUrl(url)
        result = json.dumps(result)
        return Response(result, 200)
    except Exception as e:
        MyLog().getInstance("apilog").warning('/site/detail->error:' + str(e))
    return "error"


#验证填入的站点账户cookie信息是否正确
@app.get('/site/checkconfig')
async def checklogin(config, request: Request):
    try:
        ptsite = initSite(config, request.client)
        result = ptsite.checklogin()
        result = json.dumps(result)
        return Response(result, 200)
    except Exception as e:
        MyLog().getInstance("apilog").warning('/site/checklogin->error:' +
                                              str(e))
    return "error"


# 获取登录页面的信息
@app.get('/site/getloginpage')
async def getLoginPage(config, request: Request):
    try:
        ptsite = initSite(config, request.client)
        result = ptsite.getLoginPage()
        result = json.dumps(result)
        return Response(result, 200)
    except Exception as e:
        MyLog().getInstance("apilog").warning('/site/getLoginPage->error:' + str(e))
    return "error"


# 根据填写的登录信息获取cookie串
@app.get('/site/getcookie')
async def getCookie(params, request: Request):
    try:
        params = json.loads(util.aes_decode(params))
        params = util.tool.dictToObj(params)
        data = {
            "username": params.username,
            "password": params.password,
            "imagestring": params.imagestring,
            "imagehash": params.imagehash
        }
        ptsite = PTSite(params.config, request.client)
        result = ptsite.getSiteCookie(data)
        result = json.dumps(result)
        return Response(result, 200)
        # url = params.config.host + params.config.takelogin
        # return RedirectResponse(url)
    except Exception as e:
        MyLog().getInstance("apilog").warning('/site/getcookie->error:' +
                                              str(e))
    return "error"


# 获取小程序的签到记录
@app.get('/api/v2/signhistory')
async def getSignHistory(openid):
    try:
        openid = util.aes_decode(openid)
        result = util.user.queryWxPointHistory(openid)
        return result
    except Exception as e:
        MyLog().getInstance("apilog").warning('/site/getSignHistory->error:' +str(e))
    return "error"

# 小程序签到
@app.get('/api/v2/signtoday')
async def signToday(openid):
    try:
        openid = util.aes_decode(openid)
        point  = 5
        result = util.user.wxSignToday(openid,point)
        if result:
            return {'info':"ok",'point':point}
    except Exception as e:
        MyLog().getInstance("apilog").warning('/site/signToday->error:' +str(e))
    return "fail"

# 看广告获取积分
@app.get('/api/v2/viewad')
async def viewAd(openid):
    try:
        openid = util.aes_decode(openid)
        point  = 2
        result = util.user.viewAd(openid,point)
        if result:
            return {'info':"ok",'point':point}
    except Exception as e:
        MyLog().getInstance("apilog").warning('/site/viewAd->error:' +str(e))
    return "fail"

# 实例化site对象
def initSite(config, clientinfo):
    config = json.loads(util.aes_decode(config))
    config = util.tool.dictToObj(config)
    return PTSite(config, clientinfo)

# 获取指定站点的刷流数据
@app.get('/site/getsitedata')
async def getSiteData(customername,sitename,sitecookie,request: Request):
    try:
        sitecookie = util.aes_decode(sitecookie)
        sitecookie = util.tool.dictToObj(sitecookie)
        siteconfig = util.tool.dictToObj({
            "name":sitename,
            "cookie":sitecookie
        })
        ptsite = PTSite(siteconfig, request.client)
        result = ptsite.getPersonData(customername)
        return result
    except Exception as e:
        MyLog().getInstance("apilog").warning('/site/getSiteData->error:' + str(e))
    return "error"

if __name__ == '__main__':
    # 启动网站
    MyLog().getInstance('api').info('server start')
    # uvicorn.run(app=app,
    #             host='0.0.0.0',
    #             port=8885,
    #             workers=1,
    #             reload=False,
    #             forwarded_allow_ips='*')
    uvicorn.run(app=app,
                host='0.0.0.0',
                port=8885,
                ssl_keyfile='/root/cer/api.qbiter.cc.key',
                ssl_certfile='/root/cer/api.qbiter.cc.pem',
                workers=1,
                reload=False)
