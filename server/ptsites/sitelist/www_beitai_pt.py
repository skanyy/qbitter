'''
Author: seven
Date: 2022-10-13 11:10:41
LastEditors: Please set LastEditors
LastEditTime: 2022-10-13 16:22:30
Description: 
'''
import requests
from bs4 import BeautifulSoup
# 签到
def attendance(host,headers,proxy):
    try:
        # 保存主页html，检查看看是否支持签到
        # home_page = requests.get(url=host+"/index.php",headers=headers,timeout=20,proxies=proxy)
        # home_html = home_page.content.decode('utf8')
        # f = open("D:\\personal\\qbitter\\01_server_api\\ptsites\\sitelist\\www_beitai_pt.html","w")
        # print(home_html,file=f)
        # 该站点不支持签到
        return "fail"
    except Exception as e:
        return "fail"