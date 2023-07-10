from genericpath import isfile
import requests
from bs4 import BeautifulSoup
import sys
from mylog import MyLog

sys.path.append("./")
from urllib import parse
import util
import random
import importlib
import os


# import cfscrape
class PTSite(object):
    def _getSiteConfig(self):
        sites = util.getConfig().supportsites
        sites = util.tool.dictToObj(sites)
        for site in sites:
            site = util.tool.dictToObj(site)
            if site.name == self._name:
                return site
        return None

    def _common(self, url):
        # if method=='GET':
        site_page = requests.get(url=url,
                                 headers=self._headers,
                                 timeout=20,
                                 proxies=self._proxy)
        html = site_page.content.decode('utf8')
        soup = BeautifulSoup(html, 'html.parser')
        return soup

    # 获取首页数据
    def getSiteTorrentsList(self, category=None):
        page_info = self._common(self._config.host + self._config.torrent +
                                 (category if category else ''))
        # category_list = self.getCategory(page_info)
        return self._praseListPage(page_info)

    #获取分类目录
    def getCategory(self, searchbox):
        result = []
        box = searchbox.find("table", class_="searchbox")
        cats = box.find_all("td", class_="bottom")
        for cat in cats:
            a_label = cat.find('a')
            if a_label:
                # a标签有title属性则取title属性，没有则取下一级的img的title属性
                a_title = a_label['title'] if 'title' in a_label.attrs else ''
                title = a_title if a_title else a_label.find('img')['title']
                href = a_label['href']
                result.append({"title": title, "href": href})
        return result

    # 按关键字搜索
    def searchTorrentsByKeyWord(self, keyword):
        page_info = self._common(self._config.host + self._config.torrent +
                                 "?search=" + keyword)
        return self._praseListPage(page_info)

    # 解析页面数据
    def _praseListPage(self, page_info):
        table = page_info.find('table', class_='torrents')
        if table:
            rows = table.find_all('tr', recursive=False)
            # 标题
            header = []
            for header_item in rows[0].find_all('td', recursive=False):
                header_item_title = header_item.text
                if header_item_title:
                    header.append(header_item_title)
                else:
                    header.append(header_item.find('img')['title'])
            # 数据
            datas = []
            # 从1开始
            for index in range(1, len(rows)):
                row = rows[index]
                # 每一行
                row_items = row.find_all('td', class_='rowfollow')
                cat_label = row_items[0].find('span')
                category = cat_label['title'] if cat_label else row_items[
                    0].find('img')['title']
                hot_label = row_items[1].find('font', class_='hot')
                hot = hot_label.get_text(strip=True) if hot_label else ''

                subtitle_lable = row_items[1].find('a', class_='torrentname')
                subtitle = ""
                if subtitle_lable:
                    subtitle = subtitle_lable['title']
                else:
                    subtitle = row_items[1].find('a').get_text(strip=True)

                torrentTable = row_items[1].find(
                    'table',
                    class_='torrentname').find('td',
                                               class_='embedded').contents

                torrentname_label = torrentTable[len(torrentTable) - 1]
                torrentname = torrentname_label.get_text(strip=True)

                fwbs = row_items[1].find(
                    'table', class_='torrentname').find_all('a', class_='fwb')
                douban = ''
                douban_url = ''
                imdb = ''
                imdb_url = ''
                if len(fwbs):
                    douban = fwbs[0].get_text(strip=True)
                    douban_url = fwbs[0]['href']
                    imdb = fwbs[1].get_text(strip=True)
                    imdb_url = fwbs[1]['href']
                promotion_label = row_items[1].find('font', class_='promotion')
                promotion = promotion_label.get_text(
                    strip=True) if promotion_label else ""

                # 针对1ptbar
                if promotion == "":
                    for item in torrentTable:
                        if item and item.name == 'img':
                            item_class = str(item['class'])
                            if item_class.find('pro_') != -1:
                                promotion = item['alt'] if item[
                                    'alt'] else item['title']
                                break

                tagcontent = row_items[1].find_all('span', class_='tags')
                tags = []
                for tag in tagcontent:
                    tags.append(tag.get_text(strip=True))
                ptr = ''
                progress = ''
                if len(row_items) <= 9:
                    comment = row_items[len(row_items) -
                                        7].get_text(strip=True)
                    live = row_items[len(row_items) - 6].get_text(strip=True)
                    size = row_items[len(row_items) - 5].get_text(strip=True)
                    seeders = row_items[len(row_items) -
                                        4].get_text(strip=True)
                    leechers = row_items[len(row_items) -
                                         3].get_text(strip=True)
                    complete = row_items[len(row_items) -
                                         2].get_text(strip=True)
                    publisher = row_items[len(row_items) -
                                          1].get_text(strip=True)

                    #1ptbar
                    divs = row_items[1].find(
                        'table', class_='torrentname').find_all('div')
                    for div in divs:
                        if 'title' in div.attrs and div['title'].find(
                                'inactivity') != -1:
                            progress = div['title'].replace('inactivity ', "")
                    if progress == '':
                        #hdatoms，#pttime
                        if isinstance(torrentname_label,
                                      str) == False and len(row_items) == 9:
                            progress = torrentname_label['title'].replace(
                                'inactivity ', ""
                            ) if 'title' in torrentname_label.attrs else ''
                            if progress == '':
                                #hdhome
                                progress = row_items[
                                    8].previous_sibling.get_text(
                                        strip=True) if len(
                                            row_items) == 9 else ''

                else:  #pttime
                    ptr = row_items[2].get_text(strip=True)
                    comment = row_items[3].get_text(strip=True)
                    live = row_items[4].get_text(strip=True)
                    size = row_items[5].get_text(strip=True)
                    seeders = row_items[6].get_text(strip=True)
                    leechers = row_items[7].get_text(strip=True)
                    complete = row_items[8].get_text(strip=True)
                    progress = row_items[9].get_text(strip=True)
                    publisher = row_items[10].get_text(strip=True)
                # 尝试获取详情页连接
                detail_href = subtitle_lable[
                    'href'] if subtitle_lable else row_items[1].find(
                        'a')['href']
                row_data = {
                    "category": category,
                    "hot": hot,
                    "torrentname": torrentname,
                    "subtitle": subtitle,
                    "detail_url": detail_href,
                    "douban": douban if douban else '',
                    "douan_url": douban_url,
                    "imdb": imdb if imdb else '',
                    "imdb_url": imdb_url,
                    "promotion": promotion,
                    "tags": tags,
                    "ptr": ptr if ptr else '',
                    "comment": comment,
                    "live": live,
                    "size": size,
                    "seeders": seeders,
                    "leechers": leechers,
                    "complete": complete,
                    "progress": progress,
                    "publisher": publisher
                }
                datas.append(row_data)
            return datas
        else:
            return []

    def getDownloadUrlFromDetailUrl(self, url):
        url = self._config.host + "/" + url
        details_page = self._common(url)
        table = details_page.find('table', class_="mainouter")
        if table.find('td', id="outer"):
            a_list = table.find('td', id="outer").find_all('a')
            for a_label in a_list:
                if a_label['href'].find('download.php') != -1 and a_label[
                        'href'].find('downhash') != -1:
                    return a_label['href']
        else:
            href = details_page.find('a', class_='index')['href']
            return href
        return "download_url_not_found"

    def checklogin(self):
        login_page = self._common(self._config.host + self._config.login)
        text = login_page.get_text(strip=True)
        if text.find('已经登陆') != -1 or text.find('已经登录') != -1 or text.find(
                '控制面板') != -1 or text.find('已經登錄') != -1:
            return "ok"
        return "error"

    def getLoginPage(self):
        loginurl = self._config.host + self._config.login
        session = requests.session()
        result = session.post(url=loginurl, proxies=self._proxy)
        html = result.content.decode('utf8')
        soup = BeautifulSoup(html, 'html.parser')

        # 提示剩余次数
        trysay = ""
        p_labels = soup.find_all('p')
        for label in p_labels:
            if label.get_text(strip=True).find('次尝试机会') != -1:
                trysay = label.get_text(strip=True)
                break

        # 图片验证码
        imgsrc = ""
        hash = ""
        if self._config.needcode:
            imgs = soup.find_all('img')

            for img in imgs:
                if img['alt'] == 'CAPTCHA':
                    imgsrc = img['src']
                    break
            # image.php?action=regimage&imagehash=ccb3e7c29b1cff6a74ad633f855736cc&secret=
            # image.php?action=regimage&imagehash=718df8425d8ff116331728ea672679a6
            # image.php?action=regimage&imagehash=239bff6d6dd3c09d842cfe913d681845&secret=
            params = parse.parse_qs(parse.urlparse(imgsrc).query)
            hash = params.get('imagehash', '')[0]
        result = {"src": imgsrc, "hash": hash, "trysay": trysay}
        return result

    def getSiteCookie(self, userinfo):
        session = requests.session()
        session.post(url=self._config.host + self._config.takelogin,
                     data=userinfo,
                     headers=self._headers,
                     proxies=self._proxy)
        cookie = session.cookies
        result = cookie.get_dict()
        if result:
            return result
        return ""

    def findScriptFile(self, name):
        currentdir = os.path.abspath(os.path.dirname(__file__))
        # 判断脚本是否存在
        for scriptfile in os.listdir(currentdir+"/sitelist/"):
            # 存在则执行脚本
            if scriptfile == (name + ".py"):
                return True
        return False

    #自动签到
    def signToWeb(self):
        try:
            # 获取对应的py脚本
            name = self._config.name
            host = self._config.host
            start = host.find('://')
            model_path = host[start + 3:]
            model_path = model_path.replace(".", "_")
            # 判断脚本是否存在
            if self.findScriptFile(model_path):
                module = importlib.import_module("ptsites.sitelist." + model_path)
                webresult = module.attendance(host, self._headers, self._proxy)
                if webresult=="fail":
                    MyLog().getInstance("apilog").info(name+ "-尝试签到失败")
                return webresult
            else:
                MyLog().getInstance("apilog").info(name+ "的签到执行脚本不存在，请添加")
                return "fail"
        except Exception as e:
            MyLog().getInstance("apilog").info("signToWeb->"+name+ "-尝试签到出错->"+str(e))
            return "fail"

    #获取个人站点流量数据
    def getPersonData(self, customername):
        try:
            home_page = self._common(self._config.host + self._config.forums)
            table = home_page.find('table', id='info_block')
            # 魔力值，分享率，上传量，下载量，当前活动，可连接，连接数

            mybonus = table.find('a', href='mybonus.php').nextSibling
            ll = mybonus.find(':')
            mybonus = '魔力值:' + mybonus[ll + 1:len(mybonus)]
            # attendance = ''
            # point = ''
            # # 有些站点没有积分字段
            # if table.find('a',href='attendance.php'):
            #     attendance = table.find('a',href='attendance.php').getText(strip=True)
            #     point = table.find_all('font',class_='color_bonus')[1].nextSibling
            # # attendance = table.find('a',href='attendance.php').getText(strip=True) if table.find('a',href='attendance.php') else ''

            ratio = '分享率:' + table.find('font',
                                        class_='color_ratio').nextSibling
            uploaded = '上传:' + table.find('font',
                                          class_='color_uploaded').nextSibling
            downloaded = '下载:' + table.find(
                'font', class_='color_downloaded').nextSibling
            # pttime的活动标签
            pttime = self._config.host.find('pttime.org')
            if pttime >= 0:
                seeding = table.find('i', class_='arrowup').nextSibling
                down = table.find('i', class_='arrowdown').nextSibling
                connectable = table.find_all(
                    'span', class_='mr5')[4].getText(strip=True)
                conneslots = table.find_all(
                    'span', class_='mr5')[5].getText(strip=True)
            else:
                seeding = table.find('img', class_='arrowup').nextSibling
                down = table.find('img', class_='arrowdown').nextSibling
                connectable = table.find(
                    'font', class_='color_connectable').getText(
                        strip=True) if table.find(
                            'font', class_='color_connectable') else ''
                conneslots = table.find('font',
                                        class_='color_slots').nextSibling
            seeding = '做种:' + seeding
            down = '下载:' + down
            connectable = '连接:' + connectable
            # text = table.getText(strip=True)
            # location = text.find('魔力值')
            # if location:
            #     text = text[location:len(text)]
            # print(self._config.name,"-->",mybonus,attendance,point,ratio,uploaded,downloaded,seeding,down,connectable,conneslots)
            return {
                "customername":
                customername,
                "sitename":
                self._config.name,
                "sitedata":
                mybonus + ';' + ratio + ';' + uploaded + ';' + downloaded +
                ';' + seeding + ';' + down + ';' + connectable + ';' +
                conneslots
                # "sitedata":mybonus+';'+attendance+';'+point+';'+ratio+';'+uploaded+';'+downloaded+';'+seeding+';'+down+';'+connectable+';'+conneslots
                # "sitedata":text
            }
            # print(home_page.getText(strip=True))
            # tables = home_page.find_all('table')
            # for table in tables:
            #     if table and table.id=="info_block":
            #         table_text = table.getText(strip=True)
            # return {
            #     "bonus":'1,281,525.6',
            #     "ratio":'6.693',
            #     "uploaded":'14.029 TB',
            #     "downloaded":'2.096 TB',
            #     "seeding":'55',
            #     "leeching":'0',
            #     "connectable":'是',
            #     "slots":'无限制'
            # }
        except Exception as e:
            return {
                "customername": customername,
                "sitename": self._config.name,
                "sitedata": "error"
            }

    def __init__(self, config, client):
        self._name = config.name
        self._cookie = config.cookie
        self._client = client
        self._proxy = {
            'http:':
            'http://' + self._client.host + ":" + str(self._client.port),
            'https:':
            'https://' + self._client.host + ":" + str(self._client.port)
        }
        # print(self._proxy)
        user_agents_list = [
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/53.0.2785.116 Safari/537.36',
            'Mozilla/5.0 (Windows NT 6.1; rv:2.0.1) Gecko/20100101 Firefox/4.0.1',
            'Mozilla/5.0 (Windows; U; Windows NT 6.1; en-us) AppleWebKit/534.50 (KHTML, like Gecko) Version/5.1 Safari/534.50',
            'Opera/9.80 (Windows NT 6.1; U; en) Presto/2.8.131 Version/11.11'
        ]
        user_agent = random.choice(user_agents_list)
        self._headers = {
            'Cookie': config.cookie,
            'User-Agent': user_agent,
        }
        self._config = self._getSiteConfig()
