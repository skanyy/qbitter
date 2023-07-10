'''
Author: seven
Date: 2022-10-14 16:13:08
LastEditors: Please set LastEditors
LastEditTime: 2022-10-19 10:56:40
Description: 
'''
import util
import json
from ptsites.site import PTSite
from mylog import MyLog

# 检查哪些用户需要执行自动签到
def checkSignPlan():
    MyLog().getInstance("sqllog").info('--------------start----------------')
    autoSignPlanTick = util.getConfig().auto_sign_enable
    if autoSignPlanTick:
        MyLog().getInstance("sqllog").info('已开启自动签到服务')
    else:
        MyLog().getInstance("sqllog").info('未开启自动签到服务')
        return
    tasklist = util.user.getAutoSignTaskList()
    if tasklist=='error':
        MyLog().getInstance("sqllog").info('获取任务失败！')
        return
    if len(tasklist) <= 0:
        MyLog().getInstance("sqllog").info('没有要处理的自动签到任务')
        return
    else:
        MyLog().getInstance("sqllog").info('有'+str(len(tasklist))+'个待自动签到任务需要判断是否执行')
    for task in tasklist:
        #用户的openid
        openid = task[1]
        userinfo = util.user.getInfo(openid)
        if userinfo=='error':
            continue
        regist_status = json.loads(userinfo)
        regist_status = util.tool.dictToObj(regist_status)[0]
        regist_status = util.tool.dictToObj(regist_status).status
        # 取消绑定的用户不进行签到
        if regist_status==1: 
            continue
        # lastsigntime 上次签到时间
        lastsigntime = task[6]
        # lastsignstatus 0 表示上次签到成功 1 表示上次签到失败
        lastsignstatus = task[7]
        # 两种情况：1，上次未签成功；2，上次签成功了，但是不是今天签的
        if lastsignstatus == 1 or (lastsignstatus == 0 and (lastsigntime == None or util.is_today(lastsigntime.strftime("%Y-%m-%d")) == False)):
            record_id = task[0]
            sitename = task[9]
            MyLog().getInstance("sqllog").info('正在处理:'+str(sitename)+',id 是:'+str(record_id))
            sitecookie = util.aes_decode(task[11])
            signToWebSite(record_id, sitename, sitecookie)

# 执行站点签到
def signToWebSite(record_id, sitename, sitecookie, client=None):
    siteconfig = {
        "name": sitename,  #sitename,
        "cookie": sitecookie,  #cookie
    }
    siteconfig = util.tool.dictToObj(siteconfig)
    if client == None:
        client = util.tool.dictToObj({"host": "localhost", "port": 8000})
    ptsite = PTSite(siteconfig, client)
    if ptsite._config.sign=='unsupport':
        MyLog().getInstance("sqllog").info(sitename+'该站点不支持签到')
        return False
    result = ptsite.signToWeb()
    signstatus = 1
    if result != "fail":
        MyLog().getInstance("sqllog").info(sitename+':站点签到成功!')
        signstatus = 0
    else:
        MyLog().getInstance("sqllog").info(sitename+':站点签到失败!')
    updateResult = util.user.updateLastSignTime(record_id, signstatus)
    if updateResult:
        MyLog().getInstance("sqllog").info(sitename+':签到状态已更新')
    if signstatus == 0 and updateResult:
        MyLog().getInstance("sqllog").info(sitename+':签到任务处理成功!')
        return True
    return False

if __name__ == '__main__':
    checkSignPlan()