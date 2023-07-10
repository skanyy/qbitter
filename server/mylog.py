'''
Author: seven
Date: 2021-12-29 09:09:36
LastEditors: Please set LastEditors
LastEditTime: 2022-10-17 08:51:47
Description: 
'''
#coding=utf-8
import logging
import logging.handlers
import datetime
import os

class MyLog:
    time = datetime.datetime.now().strftime('%Y-%m-%d')
    currentdir = os.path.abspath(os.path.dirname(__file__))
    __file = currentdir+'/log/'+time+'.log'#日志文件名称
    __handler = False
    __fmt = '%(asctime)s - %(filename)s:[line:%(lineno)s] - %(name)s - %(message)s'#输出格式

    def __init__(self):
        logging.basicConfig(filename=self.__file, filemode='a+', format=self.__fmt)
        # self.__handler = logging.handlers.RotatingFileHandler(self.__file, maxBytes=1024*1024, backupCount=5)
        #打印
        self.__handler = logging.StreamHandler()
        self.__handler.setLevel(logging.INFO)

        #设置格式
        formatter = logging.Formatter(self.__fmt)
        self.__handler.setFormatter(formatter)
        return

    #获取实例
    def getInstance(self, strname):
        logger = logging.getLogger(strname)
        logger.addHandler(self.__handler)
        logger.setLevel(logging.DEBUG)
        return logger 
    
    #设置路径
    def setLogPath(self,path):
        self.__file = path