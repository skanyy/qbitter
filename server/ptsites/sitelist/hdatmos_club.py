'''
Author: seven
Date: 2022-10-13 10:00:12
LastEditors: Please set LastEditors
LastEditTime: 2022-10-14 12:01:01
Description: 
'''
import requests
from bs4 import BeautifulSoup

# 签到
def attendance(host,headers,proxy):
    try:
        site_page = requests.get(url=host+"/attendance.php",headers=headers,timeout=20,proxies=proxy)
        html = site_page.content.decode('utf8')
        sign_page = BeautifulSoup(html, 'html.parser')
        print(host+"request success")
        text = sign_page.get_text(strip=True)
        if text.find('已经签到') != -1 or text.find('已經簽到')!=-1 or text.find('重复签到')!=-1:
            return "signed"
        elif text.find('签到成功') != -1 or text.find('簽到成功') != -1 or text.find('已连续签到')!=-1:
            return "signsuccess"
        return "fail"
    except Exception as e:
        return "fail"
