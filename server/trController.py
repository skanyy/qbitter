'''
Author: seven
Date: 2022-03-11 17:35:08
LastEditors: Please set LastEditors
LastEditTime: 2022-10-17 17:01:40
Description: 
'''
from math import fabs
import util
import requests
from requests.auth import HTTPBasicAuth
from mylog import MyLog

user_session = requests.Session()
def callTransmission(session_id,params):
    try:
        result = {}
        userinfo = params.user
        req = params.req
        auth = HTTPBasicAuth(userinfo.username,userinfo.password)
        url = userinfo.url
        if url.endswith('/'):
            url = url[0:len(url)-1]
        if url.endswith('/transmission/rpc')==False:
            url = url+'/transmission/rpc'
        # print('tr_request:',url,',',req)
        res = user_session.post(
            url= url,
            headers={'x-transmission-session-id': session_id},
            json=req,
            auth=auth,timeout=25)
        session_id = res.headers.get("X-Transmission-Session-Id", "0")
        if res.status_code in {401, 403}:
            return "auth fail"
        elif res.status_code == 409:
            return callTransmission(session_id=session_id,params=params)
        elif res.status_code==200:
            return res
        else:
            result['content']="tr_query_fail"
            result['status_code']=404
            return util.tool.dictToObj(result)
    except requests.exceptions.Timeout as e:
        MyLog().getInstance("apilog").error('tr_request_time_out:'+str(e))
        result['content']="request_time_out"
        result['status_code']=408
        return util.tool.dictToObj(result)
    except requests.exceptions.ConnectionError as e:
        MyLog().getInstance("apilog").error('tr_request_connect_error:'+str(e))
        result['content']="request_connect_error"
        result['status_code']=500
        return util.tool.dictToObj(result)


def do(body):
    params = {
        'user':body.user,
        'req':body.params
    }
    params = util.tool.dictToObj(params)
    response = callTransmission(session_id='0',params=params)
    return response

