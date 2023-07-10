'''
Author: seven
Date: 2022-10-12 17:34:17
LastEditors: Please set LastEditors
LastEditTime: 2022-10-13 16:48:21
Description: 
'''
import requests
import util
import json
#使用ddddocr库进行验证码自动识别
import ddddocr

# 签到
def attendance(host,headers,proxy):
    try:
        # 获取验证码
        data = {'action':'new'}
        code_img = requests.post(url=host+'/image_code_ajax.php',
                                headers=headers,
                                timeout=20,
                                proxies=proxy,
                                data=data)
        result = util.tool.dictToObj(json.loads(code_img.text))
        imgsrc = host+'/image.php?action=regimage&imagehash='+result.code
        imge = requests.get(url=imgsrc,headers=headers,proxies=proxy)
        # 识别验证码
        det = ddddocr.DdddOcr()
        res = det.classification(imge.content)
        # 提交验证码
        params = {
            'action':'showup',
            'imagehash':result.code,
            'imagestring':res
        }
        code_commit = requests.post(url=host+'/showup.php',
                                headers=headers,
                                timeout=20,
                                proxies=proxy,
                                data=params)
        # {"success":true,"message":10}
        sign_resut = util.tool.dictToObj(json.loads(code_commit.text))
        if sign_resut.success:
            return "signsuccess"
        else:
            return "fail"
    except Exception as e:
        return "fail"
    # index_page = self._common('https://hdsky.me/index.php')
    # print_index = open("D:/personal/qbitter/01_server_api/hdsky_index.html",'w')
    # print(index_page.encode('gbk','ignore').decode('gbk','ignore'),file=print_index)
    # print_index.close()

    # js_page = self._common('https://hdsky.me/common.js?53')
    # print_js=open("D:/personal/qbitter/01_server_api/hdsky_js.js",'w')
    # print(js_page.encode('gbk','ignore').decode('gbk','ignore'),file=print_js)
    # print_js.close()
