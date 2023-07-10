'''
Author: seven
Date: 2022-10-13 10:58:19
LastEditors: Please set LastEditors
LastEditTime: 2022-10-13 15:58:25
Description: 
'''
import requests
from bs4 import BeautifulSoup

# 签到
def attendance(host,headers,proxy):
    try:
        site_page = requests.get(url=host+"/sign_in.php?action=sign_in",headers=headers,timeout=20,proxies=proxy)
        html = site_page.content.decode('utf8')
        sign_page = BeautifulSoup(html, 'html.parser')
        text = sign_page.get_text(strip=True)
        if text.find('已经签到') != -1 or text.find('已經簽到')!=-1 or text.find('重复签到')!=-1:
            return "signed"
        elif text.find('签到成功') != -1 or text.find('簽到成功') != -1 or text.find('已连续签到')!=-1:
            return "signsuccess"
        return "fail"
    except Exception as e:
        return "fail"
