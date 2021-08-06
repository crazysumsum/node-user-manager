module.exports = {
  createUserTable:
  "CREATE TABLE IF NOT EXISTS `user` (" +
    "`id` varchar(50) NOT NULL DEFAULT ''," +
    "`email` varchar(1000) NOT NULL DEFAULT ''," +
    "`password` varchar(100) NOT NULL DEFAULT '' COMMENT 'default SHA-3(256, hex)'," +
    "`name` varchar(200) NOT NULL DEFAULT ''," +
    "`phone` varchar(100) DEFAULT ''," +
    "`phone_area_code` varchar(20) DEFAULT ''," +
    "`status` varchar(10) NOT NULL COMMENT 'default 0=disable, 1=active,  2=frozen'," +
    "`login_fail_count` int(10) DEFAULT '0'," +
    "`create_date` datetime DEFAULT NULL," +
    "`last_login_date` datetime DEFAULT NULL," +
    "PRIMARY KEY (`id`)," +
    "UNIQUE KEY `email_idx` (`email`)," +
    "KEY `phone_idx` (`phone_area_code`,`phone`)" +
  ") ENGINE=InnoDB DEFAULT CHARSET=utf8;",

  createUserModifyLogTable:
  "CREATE TABLE IF NOT EXISTS `user_modify_log` (" +
    "`id` varchar(50) NOT NULL DEFAULT ''," +
    "`user_id` varchar(50) NOT NULL DEFAULT ''," +
    "`action` varchar(50) NOT NULL DEFAULT ''," +
    "`action_detail` longtext," +
    "`date` datetime NOT NULL," +
    "PRIMARY KEY (`id`)," +
    "KEY `user_id_idx` (`user_id`)," +
    "FOREIGN KEY (`user_id`) REFERENCES `user` (`id`) ON DELETE CASCADE" +
  ") ENGINE=InnoDB DEFAULT CHARSET=utf8;",

  createUserOTPTable:
  "CREATE TABLE IF NOT EXISTS `user_otp` (" +
    "`id` varchar(50) NOT NULL DEFAULT ''," +
    "`user_id` varchar(50) NOT NULL DEFAULT ''," +
    "`otp` varchar(50) NOT NULL DEFAULT ''," +
    "`create_date` datetime NOT NULL," +
    "`exp_date` datetime DEFAULT NULL," +
    "`verify_date` datetime DEFAULT NULL," +
    "`retry_count` int(2) NOT NULL DEFAULT '0'," +
    "`used` int(1) NOT NULL DEFAULT '1' COMMENT '0=used, 1=unused'," +
    "PRIMARY KEY (`id`)," +
    "KEY `user_id` (`user_id`,`used`)," +
    "FOREIGN KEY (`user_id`) REFERENCES `user` (`id`) ON DELETE CASCADE" +
  ") ENGINE=InnoDB DEFAULT CHARSET=utf8;"
};
