'''
Author: seven
Date: 2022-02-08 15:16:05
LastEditors: Please set LastEditors
LastEditTime: 2023-01-10 10:36:18
Description: 
'''
import MySQLdb as mdb
import requests
import util

def dbCommon(sql):
    try:
        mysql =util.getConfig().mysql
        conn = mdb.connect(host=mysql.host,port=mysql.port,user=mysql.user,passwd=mysql.password,db=mysql.database,charset=mysql.charset)
        cur = conn.cursor()
        cur.execute(sql)
        rv = cur.fetchone()
        cur.close()
        conn.close()
        return rv[0]
    except Exception as e:
        return -1

#统计上周数据注册用户数
def getDayOfSummary():
    sql = 'select count(*) as last_week from user where to_days(regist)<=TO_DAYS(now()) and TO_DAYS(regist)>TO_DAYS(now())-8'
    return dbCommon(sql)

#统计上周登录人数
def getDayOfLogin():
    # sql = 'select count(1) from log where to_days(now())=to_days(time)+1'
    sql = 'select count(*) as last_week from log where to_days(time)<=TO_DAYS(now()) and TO_DAYS(time)>TO_DAYS(now())-8'
    return dbCommon(sql)

if __name__ == '__main__':
    result = getDayOfSummary()
    result_log = getDayOfLogin()
    notice = util.getConfig().notice
    requests.get(notice.url+"上周统计/绑定"+str(result)+"人,登录"+str(result_log)+"人?sound="+notice.sound+"&icon="+notice.icon)
