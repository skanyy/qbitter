/*
 Navicat Premium Data Transfer

 Source Server         : aliyun
 Source Server Type    : MariaDB
 Source Server Version : 50568
 Source Host           : xxx.xx.xx.xxx:3306
 Source Schema         : qbitter

 Target Server Type    : MariaDB
 Target Server Version : 50568
 File Encoding         : 65001

 Date: 16/03/2023 15:26:14
*/

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------
-- Table structure for appuser
-- ----------------------------
DROP TABLE IF EXISTS `appuser`;
CREATE TABLE `appuser`  (
  `id` int(11) NULL DEFAULT NULL,
  `username` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL,
  `password` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL
) ENGINE = InnoDB CHARACTER SET = utf8 COLLATE = utf8_general_ci ROW_FORMAT = Compact;

-- ----------------------------
-- Records of appuser
-- ----------------------------

-- ----------------------------
-- Table structure for config
-- ----------------------------
DROP TABLE IF EXISTS `config`;
CREATE TABLE `config`  (
  `openid` varchar(50) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL,
  `data` text CHARACTER SET utf8 COLLATE utf8_general_ci NULL COMMENT '加密后的配置信息',
  `time` datetime(0) NULL DEFAULT NULL,
  PRIMARY KEY (`openid`) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8 COLLATE = utf8_general_ci ROW_FORMAT = Compact;

-- ----------------------------
-- Table structure for log
-- ----------------------------
DROP TABLE IF EXISTS `log`;
CREATE TABLE `log`  (
  `id` int(20) NOT NULL AUTO_INCREMENT,
  `openid` varchar(50) CHARACTER SET latin1 COLLATE latin1_swedish_ci NULL DEFAULT NULL,
  `time` datetime(0) NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 14264 CHARACTER SET = latin1 COLLATE = latin1_swedish_ci ROW_FORMAT = Compact;

-- ----------------------------
-- Records of log
-- ----------------------------

-- ----------------------------
-- Table structure for sign_apply
-- ----------------------------
DROP TABLE IF EXISTS `sign_apply`;
CREATE TABLE `sign_apply`  (
  `id` int(10) NOT NULL AUTO_INCREMENT COMMENT 'ID',
  `openid` varchar(50) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL COMMENT '微信openid',
  `nickname` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL COMMENT '微信昵称',
  `signtime` datetime(0) NULL DEFAULT NULL COMMENT '签到时间',
  `applytime` datetime(0) NULL DEFAULT NULL COMMENT '提交时间',
  `endtime` date NULL DEFAULT NULL COMMENT '过期时间',
  `lastsigntime` datetime(0) NULL DEFAULT NULL COMMENT '上次签到时间',
  `lastsignstatus` int(1) NULL DEFAULT 0 COMMENT '上次签到状态，0:成功，1:签到失败，2:aes解密失败',
  `sitehost` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL COMMENT '站点域名',
  `sitename` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL COMMENT '站点名',
  `customername` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL COMMENT '站点别名',
  `cookie` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL COMMENT '站点cookie',
  `status` int(2) NULL DEFAULT 0 COMMENT '0未生效，1生效，2永久',
  `running` int(2) NULL DEFAULT 1 COMMENT '0未在运行，1运行中(需要与status配合才真正自动运行，如果status为0，则这个running为1也不会自动执行）',
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 91 CHARACTER SET = utf8 COLLATE = utf8_general_ci ROW_FORMAT = Compact;

-- ----------------------------
-- Records of sign_apply
-- ----------------------------

-- ----------------------------
-- Table structure for user
-- ----------------------------
DROP TABLE IF EXISTS `user`;
CREATE TABLE `user`  (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `openid` varchar(50) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL,
  `nickname` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL,
  `gender` int(1) NULL DEFAULT NULL,
  `city` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL,
  `avatarurl` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL,
  `regist` datetime(0) NULL DEFAULT NULL,
  `status` int(1) NULL DEFAULT 0 COMMENT '是否解绑，0否，1已解绑',
  `point` int(11) NULL DEFAULT 0 COMMENT '积分',
  `closead` datetime(0) NULL DEFAULT NULL COMMENT '关闭广告截止日期,空表示始终显示广告',
  PRIMARY KEY (`id`, `openid`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 1225 CHARACTER SET = latin1 COLLATE = latin1_swedish_ci ROW_FORMAT = Compact;

-- ----------------------------
-- Records of user
-- ----------------------------

-- ----------------------------
-- Table structure for wxpointhistory
-- ----------------------------
DROP TABLE IF EXISTS `wxpointhistory`;
CREATE TABLE `wxpointhistory`  (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `openid` varchar(50) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL,
  `time` datetime(0) NULL DEFAULT NULL,
  `point` int(10) NULL DEFAULT 0,
  `type` int(1) NOT NULL DEFAULT 0 COMMENT '积分获取途径：0是签到获得，1是看广告获得',
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 193 CHARACTER SET = utf8 COLLATE = utf8_general_ci ROW_FORMAT = Compact;

-- ----------------------------
-- Records of wxpointhistory
-- ----------------------------


SET FOREIGN_KEY_CHECKS = 1;
