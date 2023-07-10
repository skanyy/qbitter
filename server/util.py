import json
import MySQLdb as mdb
import datetime

from mylog import MyLog
import base64
from Crypto.Cipher import AES
import os

#读取配置文件
def getConfig():
    currentdir = os.path.abspath(os.path.dirname(__file__))
    file = open(currentdir+"/config.json",'r',encoding='utf8')
    dic = json.load(file)
    file.close()
    return tool.dictToObj(dic)

#AES解密
def aes_decode(data):
    try:
        key = getConfig().aes_key
        aes = AES.new(str.encode(key), AES.MODE_ECB)  #  初始化加密器，本例采用ECB加密模式
        decrypted_text = aes.decrypt(base64.decodebytes(bytes(data, encoding='utf8'))).decode("utf8")  # 解密
        decrypted_text = decrypted_text[:-ord(decrypted_text[-1])]  # 去除多余补位
    except Exception as e:
        MyLog().getInstance("sqllog").info('AES解密失败')
        return "decode_error"
    return decrypted_text

# 补足字符串长度为16的倍数
def add_to_16(s):
    while len(s) % 16 != 0:
        s += (16 - len(s) % 16) * chr(16 - len(s) % 16)
    return str.encode(s)  # 返回bytes
#AES加密
def aes_encode(data):
    try:
        key = getConfig().aes_key
        aes = AES.new(str.encode(key), AES.MODE_ECB)  #  初始化加密器，本例采用ECB加密模式
        encrypted_text = str(base64.encodebytes(aes.encrypt(add_to_16(data))), encoding='utf8').replace('\n', '')  # 加密
    except Exception as e:
        MyLog().getInstance("sqllog").info('AES加密失败')
        pass
    return encrypted_text

#是否是json字符串
def isJosnStr(str):
    try:
        json.loads(str)
    except ValueError:
        return False
    return True

# 是否是今天
def is_today(target_date):
    # Get the year, month and day
    c_year = datetime.datetime.now().year
    c_month = datetime.datetime.now().month
    c_day = datetime.datetime.now().day
    # Disassemble the date
    date_list = target_date.split(" ")[0].split("-")
    t_year = int(date_list[0])
    t_month = int(date_list[1])
    t_day = int(date_list[2])
    final = False
    # Compare years, months and days
    if c_year == t_year and c_month == t_month and c_day == t_day:
        final = True
    return final

class Dict(dict):
    def __getattr__(self, key):
        return self.get(key)
    def __setattr__(self, key, value):
        self[key] = value

class tool:
    # 字典转对象
    def dictToObj(dictObj):
        if not isinstance(dictObj, dict):
            return dictObj
        d = Dict()
        for k, v in dictObj.items():
            d[k] = tool.dictToObj(v)
        return d

class DateEncoder(json.JSONEncoder):  
    def default(self, obj):  
        if isinstance(obj, datetime.datetime):  
            return obj.strftime('%Y-%m-%d %H:%M:%S')  
        elif isinstance(obj, datetime.date):  
            return obj.strftime("%Y-%m-%d")  
        else:  
            return json.JSONEncoder.default(self, obj) 

class user:
    # 获取用户注册信息，only_count是否只判断是否存在
    def getInfo(openId,only_count=False):
        try:
            mysql =getConfig().mysql
            conn = mdb.connect(host=mysql.host,port=mysql.port,user=mysql.user,passwd=mysql.password,db=mysql.database,charset=mysql.charset)
            cur = conn.cursor()
            sql = 'select * from user where openid="'+openId+'"'
            cur.execute(sql)
            row_headers=[x[0] for x in cur.description] 
            rv = cur.fetchall()
            json_data=[]
            if len(rv)>0:
                for result in rv:
                    json_data.append(dict(zip(row_headers,result)))
            cur.close()
            conn.close()
            # 只判断是否存在
            if only_count:
                return len(rv)
            # 返回结果
            return json.dumps(json_data,cls=DateEncoder)
        except Exception as e:
            MyLog().getInstance("sqllog").warning('getInfo->sqlerror:'+str(e))
            # 只判断是否存在
            if only_count:
                return -1
            # 返回结果
            return "error"
    # 取消绑定微信
    def unregist(openId):
        try:
            mysql =getConfig().mysql
            conn = mdb.connect(host=mysql.host,port=mysql.port,user=mysql.user,passwd=mysql.password,db=mysql.database,charset=mysql.charset)
            cur = conn.cursor()
            updatesql = 'update user set status=1 where openid="'+openId+'"'
            cur.execute(updatesql)
            conn.commit()
            cur.close()
            conn.close()
            # requests.get(getConfig().registTipUrl+":"+user.nickName)
        except Exception as e:
            MyLog().getInstance("sqllog").warning('regist->sqlerror:'+str(e))
            return "error"
        return True
    #绑定微信
    def regist(openId,userinfo,repeat=False):
        try:
            mysql =getConfig().mysql
            conn = mdb.connect(host=mysql.host,port=mysql.port,user=mysql.user,passwd=mysql.password,db=mysql.database,charset=mysql.charset)
            cur = conn.cursor()
            time = datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')
            user = tool.dictToObj(json.loads(userinfo))
            if repeat:
                updatesql = "update user set nickname='"+user.nickName+"',gender='"+str(user.gender)+"',city='"+user.city+"',avatarurl='"+user.avatarUrl+"',status=0 where openid='"+openId+"'"
                cur.execute(updatesql)
            else:
                insertsql = 'insert into user(openid,nickname,gender,city,avatarurl,regist) select "'+openId+'","'+user.nickName+'","'+str(user.gender)+'","'+user.city+'","'+user.avatarUrl+'","'+time+'" from dual where not exists(select openid from user where openid = "'+openId+'")'
                cur.execute(insertsql)
            conn.commit()
            cur.close()
            conn.close()
            # requests.get(getConfig().registTipUrl+":"+user.nickName)
        except Exception as e:
            MyLog().getInstance("sqllog").warning('regist->sqlerror:'+str(e))
            return "error"
        return True 
    
    #保存用户配置
    def saveconfig(openId,data):
        try:
            mysql =getConfig().mysql
            conn = mdb.connect(host=mysql.host,port=mysql.port,user=mysql.user,passwd=mysql.password,db=mysql.database,charset=mysql.charset)
            cur = conn.cursor()
            time = datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')
            insertsql = 'insert into config(openid,data,time) values("'+openId+'","'+data+'","'+time+'") on duplicate key update data="'+data+'",time="'+time+'"'
            cur.execute(insertsql)
            conn.commit()
            cur.close()
            conn.close()
        except Exception as e:
            MyLog().getInstance("sqllog").warning('saveconfig->sqlerror:'+str(e))
            return "error"
        return True 
    #获取用户配置
    def queryconfig(openId):
        try:
            mysql =getConfig().mysql
            conn = mdb.connect(host=mysql.host,port=mysql.port,user=mysql.user,passwd=mysql.password,db=mysql.database,charset=mysql.charset)
            cur = conn.cursor()
            sql = 'select data from config where openid="'+openId+'"'
            cur.execute(sql)
            json_data = cur.fetchone()
            cur.close()
            conn.close()
            return json.dumps(json_data,cls=DateEncoder)
        except Exception as e:
            MyLog().getInstance("sqllog").warning('saveconfig->sqlerror:'+str(e))
            return "error"

    #记录登录
    def record(openId):
        try:
            mysql =getConfig().mysql
            conn = mdb.connect(host=mysql.host,port=mysql.port,user=mysql.user,passwd=mysql.password,db=mysql.database,charset=mysql.charset)
            cur = conn.cursor()
            time = datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')
            insertsql = 'insert into log(openid,time) values("'+openId+'","'+time+'")' 
            cur.execute(insertsql)
            conn.commit()
            cur.close()
            conn.close()
        except Exception as e:
            MyLog().getInstance("sqllog").warning('record->sqlerror:'+str(e))
            return "error"
        return True
    
    #根据用户openid获取自动签到记录
    def getAutoSign(openId,sitehost,customername,cookie=None,only_count=False):
        try:
            mysql =getConfig().mysql
            conn = mdb.connect(host=mysql.host,port=mysql.port,user=mysql.user,passwd=mysql.password,db=mysql.database,charset=mysql.charset)
            cur = conn.cursor()
            if cookie:
                sql = 'select * from sign_apply where openid="'+str(openId)+'" and sitehost="'+str(sitehost)+'" and (customername="'+str(customername)+'" or cookie="'+str(cookie)+'")'
            else:
                sql = 'select * from sign_apply where openid="'+str(openId)+'" and sitehost="'+str(sitehost)+'" and customername="'+str(customername)+'"'
            cur.execute(sql)
            row_headers=[x[0] for x in cur.description] 
            rv = cur.fetchall()
            json_data=[]
            if len(rv)>0:
                for result in rv:
                    json_data.append(dict(zip(row_headers,result)))
            cur.close()
            conn.close()
            # 只判断是否存在
            if only_count:
                return len(rv)
            # 返回结果
            return json.dumps(json_data,cls=DateEncoder)
        except Exception as e:
            MyLog().getInstance("sqllog").warning('getApplySign->sqlerror:'+str(e))
            # 只判断是否存在
            if only_count:
                return -1
            # 返回结果
            return "error"
    
    # 添加自动签到请求
    # config.user_id,config.user_nick,config.sitehost,config.sitename,config.customername,config.cookie,config.signtime
    def registAutoSign(user_id,user_nick,sitehost,sitename,customername,cookie,signtime):
        if customername:
            try:
                mysql =getConfig().mysql
                conn = mdb.connect(host=mysql.host,port=mysql.port,user=mysql.user,passwd=mysql.password,db=mysql.database,charset=mysql.charset)
                cur = conn.cursor()
                time = datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')
                #添加日期，后面只取时间，为了拼接填入数据库而已
                signtime = "2022-01-01 "+signtime
                insertsql = 'insert into sign_apply(openid,nickname,signtime,applytime,endtime,sitehost,sitename,customername,cookie,status) values("'+user_id+'","'+user_nick+'","'+signtime+'","'+time+'","","'+sitehost+'","'+sitename+'","'+customername+'","'+cookie+'","0")'
                cur.execute(insertsql)
                conn.commit()
                cur.close()
                conn.close()
                # requests.get(getConfig().registTipUrl+":"+user.nickName)
            except Exception as e:
                MyLog().getInstance("sqllog").warning('regist->sqlerror:'+str(e))
                return "error"
            return True
        return "error"
    
    #删除自动签到
    def removeAutoSign(user_id,sitehost,sitename,customername,cookie):
        try:
            mysql =getConfig().mysql
            conn = mdb.connect(host=mysql.host,port=mysql.port,user=mysql.user,passwd=mysql.password,db=mysql.database,charset=mysql.charset)
            cur = conn.cursor()
            removesql = 'delete from sign_apply where openid="'+user_id+'" and sitehost="'+sitehost+'" and sitename="'+sitename+'" and customername="'+customername+'" and cookie="'+cookie+'"'
            cur.execute(removesql)
            conn.commit()
            cur.close()
            conn.close()
        except Exception as e:
            MyLog().getInstance("sqllog").warning('removeAutoSign->sqlerror:'+str(e))
            return "error"
        return True
        
    # 更新 
    # user_id, 用户微信id
    # user_nick, 用户微信昵称
    # sitehost,站点域名
    # customername,站点原来的别名称
    # customername2,站点新的名称
    # cookie 加密后的站点cookie
    # signtime, 签到时间
    # running 是否启用
    def updateAutoSign(user_id,user_nick,sitehost,customername,customername2,cookie,signtime,running):
        if customername2:
            try:
                mysql =getConfig().mysql
                conn = mdb.connect(host=mysql.host,port=mysql.port,user=mysql.user,passwd=mysql.password,db=mysql.database,charset=mysql.charset)
                cur = conn.cursor()
                #添加日期，后面只取时间，为了拼接填入数据库而已
                signtime = "2022-01-01 "+signtime
                #是否是用户自行关闭该功能
                turn_off_str = ""
                if running:
                    turn_off_str = ",running=1"
                else:
                    turn_off_str =  ",running=0"
                updatesql = 'update sign_apply set nickname="'+user_nick+'",customername="'+customername2+'",cookie="'+cookie+'",signtime="'+signtime+'"'+turn_off_str+' where openid="'+user_id+'" and sitehost="'+sitehost+'" and customername="'+customername+'"'
                
                cur.execute(updatesql)
                conn.commit()
                cur.close()
                conn.close()
                # requests.get(getConfig().registTipUrl+":"+user.nickName)
            except Exception as e:
                MyLog().getInstance("sqllog").warning('regist->sqlerror:'+str(e))
                return "error"
            return True
        return "error"
    
    def setAutoSignStatus(id,action,settime):
        if id is None:
            return "error"
        #action 1禁用；0保存
        update_sql = ""
        if action=="1":
            update_sql = "update sign_apply set status=0 where id="+id
        if action=="0":
            if settime=="":
                return "error"
            else:
                update_sql = "update sign_apply set status=1,endtime='"+settime+"' where id="+id
        try:
            mysql =getConfig().mysql
            conn = mdb.connect(host=mysql.host,port=mysql.port,user=mysql.user,passwd=mysql.password,db=mysql.database,charset=mysql.charset)
            cur = conn.cursor()
            cur.execute(update_sql)
            conn.commit()
            cur.close()
            conn.close()
        except Exception as e:
            MyLog().getInstance("sqllog").warning('setAutoSignStatus->sqlerror:'+str(e))
            return "error"
        return True


    # 获取当前时间（只取小时）下需要进行自动签到的数据
    def getAutoSignTaskList(config=None):
        try:
            mysql =getConfig().mysql
            conn = mdb.connect(host=mysql.host,port=mysql.port,user=mysql.user,passwd=mysql.password,db=mysql.database,charset=mysql.charset)
            cur = conn.cursor()
            if config:
                openId = config.user_id
                sitehost = config.sitehost
                customername = config.customername
                sql = 'SELECT * FROM sign_apply where openid="'+openId+'" and sitehost="'+sitehost+'" and customername="'+customername+'"'
            else:
            # 条件：
            # 当天时间段内
            # 需要自动签到的(running=1)
            # 会员生效的(status!=0)
            # 会员未过期的或永久会员(endtime >= CURDATE() or status=2)
                # test
                # sql = "SELECT * FROM sign_apply "
                sql = "SELECT * FROM sign_apply WHERE (DATE_FORMAT(signtime,'%H')=DATE_FORMAT(NOW(),'%H')-1) AND running = 1 AND status!= 0 AND (endtime >= CURDATE() or status=2)"
            cur.execute(sql)
            rv = cur.fetchall()
            cur.close()
            conn.close()
            # 返回结果
            return rv
        except Exception as e:
            MyLog().getInstance("sqllog").warning('getAutoSignTaskList->sqlerror:'+str(e))
            # 返回结果
            return "error"
    
    # 成功签到后，更新上次签到时间
    def updateLastSignTime(id,status):
        try:
            mysql =getConfig().mysql
            conn = mdb.connect(host=mysql.host,port=mysql.port,user=mysql.user,passwd=mysql.password,db=mysql.database,charset=mysql.charset)
            cur = conn.cursor()
            time = datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')
            updatesql = "update sign_apply set lastsigntime='"+time+"',lastsignstatus="+str(status)+" where id="+str(id)
            cur.execute(updatesql)
            conn.commit()
            cur.close()
            conn.close()
            return True
        except Exception as e:
            MyLog().getInstance("sqllog").warning('updateLastSignTime->sqlerror:'+str(e))
            return False
    
    # 获取签到申请列表
    def querySignList(keyword):
        try:
           mysql =getConfig().mysql
           conn = mdb.connect(host=mysql.host,port=mysql.port,user=mysql.user,passwd=mysql.password,db=mysql.database,charset=mysql.charset)
           cur = conn.cursor()
           sql = "select sign_apply.id,sign_apply.openid,sign_apply.nickname,user.avatarurl,sign_apply.signtime,sign_apply.applytime,sign_apply.endtime,sign_apply.lastsigntime,sign_apply.lastsignstatus,sign_apply.sitehost,sign_apply.sitename,sign_apply.customername,sign_apply.status,sign_apply.running from sign_apply,user where sign_apply.openid=user.openid order by sign_apply.applytime desc"
           if keyword!="undefined" or keyword!="":
            sql = "select sign_apply.id,sign_apply.nickname,user.avatarurl,user.point,sign_apply.signtime,sign_apply.applytime,sign_apply.endtime,sign_apply.lastsigntime,sign_apply.lastsignstatus,sign_apply.sitehost,sign_apply.sitename,sign_apply.customername,sign_apply.status,sign_apply.running from sign_apply,user where sign_apply.openid=user.openid and (user.nickname like '%"+ keyword+"%' or sign_apply.sitehost like '%"+ keyword+"%' or sign_apply.sitename like '%"+ keyword+"%' or sign_apply.customername like '%"+ keyword+"%') order by sign_apply.applytime desc"
           cur.execute(sql)
           row_headers=[x[0] for x in cur.description] 
           rv = cur.fetchall()
           json_data=[]
           if len(rv)>0:
            for result in rv:
                json_data.append(dict(zip(row_headers,result)))
           cur.close()
           conn.close()
           return json.dumps(json_data,cls=DateEncoder)
        except Exception as e:
           MyLog().getInstance("sqllog").warning('getSignList->sqlerror:'+str(e))
           return "error"
    
    def queryWxPointHistory(openid):
        try:
           mysql =getConfig().mysql
           conn = mdb.connect(host=mysql.host,port=mysql.port,user=mysql.user,passwd=mysql.password,db=mysql.database,charset=mysql.charset)
           cur = conn.cursor()
           sql = "select * from wxpointhistory where openid='"+str(openid)+"' and type=0 order by time desc"
           cur.execute(sql)
           row_headers=[x[0] for x in cur.description] 
           rv = cur.fetchall()
           json_data=[]
           if len(rv)>0:
            for result in rv:
                json_data.append(dict(zip(row_headers,result)))
           cur.close()
           conn.close()
           return json.dumps(json_data,cls=DateEncoder)
        except Exception as e:
           MyLog().getInstance("sqllog").warning('queryWxPointHistory->sqlerror:'+str(e))
           return "error"
        
    def wxSignToday(openid,point):
        try:
           mysql =getConfig().mysql
           conn = mdb.connect(host=mysql.host,port=mysql.port,user=mysql.user,passwd=mysql.password,db=mysql.database,charset=mysql.charset)
           cur = conn.cursor()
           time = datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')
           insertsql = "insert into wxpointhistory(openid,time,point,type) values('"+str(openid)+"','"+time+"','"+str(point)+"',0)"
           updatesql = "update user set point=point+"+str(point)+" where openid='"+str(openid)+"'"
           cur.execute(insertsql)
           cur.execute(updatesql)
           conn.commit()
           cur.close()
           conn.close()
        except Exception as e:
           MyLog().getInstance("sqllog").warning('wxSignToday->sqlerror:'+str(e))
           return False
        return True

    def viewAd(openid,point):
        try:
           mysql =getConfig().mysql
           conn = mdb.connect(host=mysql.host,port=mysql.port,user=mysql.user,passwd=mysql.password,db=mysql.database,charset=mysql.charset)
           cur = conn.cursor()
           time = datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')
           insertsql = "insert into wxpointhistory(openid,time,point,type) values('"+str(openid)+"','"+time+"','"+str(point)+"',1)"
           updatesql = "update user set point=point+"+str(point)+" where openid='"+str(openid)+"'"
           cur.execute(insertsql)
           cur.execute(updatesql)
           conn.commit()
           cur.close()
           conn.close()
        except Exception as e:
           MyLog().getInstance("sqllog").warning('viewAd->sqlerror:'+str(e))
           return False
        return True