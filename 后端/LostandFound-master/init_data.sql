USE `laf`;

DELETE FROM `post` WHERE `title` IN ('test', 'upload-test', 'upload-check');

REPLACE INTO `roles` (`id`, `name`, `description`, `created_time`, `updated_time`, `is_deleted`, `created_by`, `updated_by`) VALUES
(1, '普通用户', '可以发布失物与招领信息', NOW(), NOW(), 0, 6, 6),
(2, '管理员', '负责内容审核和系统维护', NOW(), NOW(), 0, 6, 6);

REPLACE INTO `permissions` (`id`, `name`, `description`, `created_time`, `updated_time`, `is_deleted`) VALUES
(1, '发布帖子', '允许发布失物或招领帖子', NOW(), NOW(), 0),
(2, '管理帖子', '允许下架违规帖子', NOW(), NOW(), 0),
(3, '管理用户', '允许查看和处理用户反馈', NOW(), NOW(), 0);

REPLACE INTO `role_permission` (`id`, `role_id`, `permission_id`, `created_time`, `updated_time`) VALUES
(1, 1, 1, NOW(), NOW()),
(2, 2, 1, NOW(), NOW()),
(3, 2, 2, NOW(), NOW()),
(4, 2, 3, NOW(), NOW());

REPLACE INTO `user` (`id`, `header`, `nickname`, `real_name`, `age`, `clazz`, `phone_number`, `gender`, `QQ`, `email`, `other_contacts`, `find_num`, `lost_num`, `is_deleted`, `status`, `integral`, `created_time`, `updated_time`) VALUES
(1, '', '小林', '林安然', 20, '软件231班', '13800138001', 2, '120001001', 'linanran@example.com', '微信：linanran', 2, 1, 0, 1, 120, NOW(), NOW()),
(2, '', '小周', '周知远', 21, '计科232班', '13800138002', 1, '120001002', 'zhouzhiyuan@example.com', '微信：zhouzhiyuan', 1, 2, 0, 1, 95, NOW(), NOW()),
(3, '', '小陈', '陈雨晴', 20, '网工231班', '13800138003', 2, '120001003', 'chenyuqing@example.com', '微信：chenyuqing', 3, 1, 0, 1, 140, NOW(), NOW()),
(4, '', '小何', '何嘉树', 22, '大数据221班', '13800138004', 1, '120001004', 'hejiashu@example.com', '微信：hejiashu', 1, 1, 0, 1, 88, NOW(), NOW()),
(5, '', '小吴', '吴星河', 20, '电商231班', '13800138005', 1, '120001005', 'wuxinghe@example.com', '微信：wuxinghe', 0, 2, 0, 1, 76, NOW(), NOW()),
(6, '', '管理员', '系统管理员', 28, '信息中心', '13800138000', 1, '120001000', 'admin@laf.local', '值班电话：13800138000', 0, 0, 0, 1, 500, NOW(), NOW());

REPLACE INTO `user_role` (`id`, `user_id`, `role_id`, `created_time`, `updated_time`) VALUES
(1, 1, 1, NOW(), NOW()),
(2, 2, 1, NOW(), NOW()),
(3, 3, 1, NOW(), NOW()),
(4, 4, 1, NOW(), NOW()),
(5, 5, 1, NOW(), NOW()),
(6, 6, 2, NOW(), NOW());

REPLACE INTO `user_settings` (`user_id`, `push_notification`, `follow_me`, `report_notification`, `follow_others`, `reply_notification`, `bookmark_notification`) VALUES
(1, 1, 1, 1, 1, 1, 1),
(2, 1, 1, 1, 1, 1, 1),
(3, 1, 1, 1, 1, 1, 1),
(4, 1, 1, 1, 1, 1, 1),
(5, 1, 1, 1, 1, 1, 1),
(6, 1, 1, 1, 1, 1, 1);

REPLACE INTO `tasks` (`id`, `task_name`, `points`, `description`, `created_time`, `updated_time`) VALUES
(1, '完善联系方式', 10, '首次补充手机号或微信号可获得积分', NOW(), NOW()),
(2, '发布有效线索', 15, '发布被确认有效的失物线索可获得积分', NOW(), NOW()),
(3, '成功认领物品', 20, '帮助失主成功找回物品可获得积分', NOW(), NOW());

REPLACE INTO `task_users` (`id`, `task_id`, `user_id`, `status`, `created_time`, `updated_time`) VALUES
(1, 1, 1, 2, NOW(), NOW()),
(2, 2, 3, 2, NOW(), NOW()),
(3, 3, 4, 1, NOW(), NOW());

REPLACE INTO `attribute` (`id`, `attr_key`, `number_value`, `text_value`) VALUES
(1, 'category', 1, '校园卡'),
(2, 'category', 2, '雨伞'),
(3, 'category', 3, '钱包'),
(4, 'category', 4, '钥匙'),
(5, 'category', 5, '电子设备'),
(6, 'location', 1, '图书馆'),
(7, 'location', 2, '第一食堂'),
(8, 'location', 3, '教学楼'),
(9, 'location', 4, '操场'),
(10, 'location', 5, '宿舍楼'),
(11, 'location', 6, '实验楼'),
(12, 'location', 7, '快递站');

REPLACE INTO `post` (`id`, `type`, `title`, `image`, `content`, `count`, `user_id`, `comment_num`, `collection_num`, `likes_num`, `tags`, `user_nickname`, `status`, `is_deleted`, `created_time`, `updated_time`) VALUES
(1, 1, '图书馆丢失校园卡', '[]', '今天上午在图书馆一楼自习区丢失一张校园卡，卡套是透明的，上面贴了蓝色贴纸。如果有同学捡到，麻烦联系我，非常感谢。', 18, 1, 2, 1, 3, '校园卡,证件,丢失', '小林', 1, 0, NOW(), NOW()),
(2, 1, '食堂丢失黑色钱包', '[]', '中午在第一食堂靠窗位置吃饭后发现黑色短款钱包不见了，里面有身份证、饭卡和少量现金，希望好心人联系我。', 22, 2, 1, 2, 4, '钱包,证件,丢失', '小周', 1, 0, NOW(), NOW()),
(3, 1, '教学楼丢失折叠雨伞', '[]', '下午上完课后把一把深蓝色折叠雨伞落在教学楼A座302教室，伞柄有白色挂绳，如果有人看到请告知。', 11, 3, 1, 1, 2, '雨伞,生活用品,丢失', '小陈', 1, 0, NOW(), NOW()),
(4, 1, '操场看台丢失耳机盒', '[]', '昨晚在操场看台丢失一个白色蓝牙耳机盒，盒盖上有一枚小星星贴纸，里面耳机不在盒里。', 9, 5, 0, 1, 1, '电子设备,丢失', '小吴', 1, 0, NOW(), NOW()),
(5, 2, '二食堂门口捡到校园卡', '[]', '在第二食堂门口台阶处捡到一张校园卡，卡套是透明磨砂的，失主可描述卡面信息后联系认领。', 16, 4, 1, 1, 3, '校园卡,招领,证件', '小何', 1, 0, NOW(), NOW()),
(6, 2, '宿舍楼下捡到棕色钱包', '[]', '晚上在宿舍5号楼门口捡到一个棕色钱包，里面有门禁卡和少量零钱，已暂时保管。', 14, 3, 1, 1, 2, '钱包,招领,证件', '小陈', 1, 0, NOW(), NOW()),
(7, 2, '图书馆门口捡到黑色长柄雨伞', '[]', '傍晚离开图书馆时在门口雨伞架发现一把黑色长柄雨伞，伞面内侧有白色字样，需要的同学可联系我。', 13, 1, 0, 1, 2, '雨伞,招领,生活用品', '小林', 1, 0, NOW(), NOW()),
(8, 2, '实验楼捡到银色U盘', '[]', '在实验楼三楼机房门口捡到一个银色U盘，外壳有红色编号贴纸，失主可说明容量与贴纸内容后认领。', 10, 2, 0, 0, 1, '电子设备,招领', '小周', 1, 0, NOW(), NOW());

REPLACE INTO `comments` (`id`, `post_id`, `commenter_id`, `commented_user_id`, `content`, `created_time`, `updated_time`, `deleted_time`, `comment_type`, `parent_id`, `status`) VALUES
(1, 1, 2, 1, '我中午在服务台看到过类似的校园卡，你可以去问问阿姨。', NOW(), NOW(), NULL, 1, NULL, 1),
(2, 2, 3, 2, '第一食堂失物招领角刚刚有人送去一个钱包，建议尽快过去确认。', NOW(), NOW(), NULL, 1, NULL, 1),
(3, 5, 1, 4, '这张卡是不是卡套边缘有一点裂口？如果是的话我认识失主。', NOW(), NOW(), NULL, 1, NULL, 1),
(4, 6, 5, 3, '钱包里如果有蓝色门禁卡，可能是我同学的，我去帮你问一下。', NOW(), NOW(), NULL, 1, NULL, 1),
(5, 7, 4, 1, '这把伞是不是伞骨有一点弯？我好像知道是谁的。', NOW(), NOW(), NULL, 1, NULL, 1);

REPLACE INTO `likes` (`id`, `user_id`, `post_id`, `status`, `created_time`, `updated_time`) VALUES
(1, 2, 1, 1, NOW(), NOW()),
(2, 3, 1, 1, NOW(), NOW()),
(3, 4, 1, 1, NOW(), NOW()),
(4, 1, 2, 1, NOW(), NOW()),
(5, 3, 2, 1, NOW(), NOW()),
(6, 5, 2, 1, NOW(), NOW()),
(7, 2, 3, 1, NOW(), NOW()),
(8, 1, 5, 1, NOW(), NOW()),
(9, 3, 5, 1, NOW(), NOW()),
(10, 4, 6, 1, NOW(), NOW()),
(11, 1, 7, 1, NOW(), NOW()),
(12, 5, 7, 1, NOW(), NOW());

REPLACE INTO `collection` (`id`, `user_id`, `post_id`, `status`, `created_time`, `updated_time`) VALUES
(1, 3, 1, 1, NOW(), NOW()),
(2, 1, 2, 1, NOW(), NOW()),
(3, 5, 3, 1, NOW(), NOW()),
(4, 2, 5, 1, NOW(), NOW()),
(5, 4, 6, 1, NOW(), NOW()),
(6, 1, 7, 1, NOW(), NOW());

REPLACE INTO `follow` (`id`, `follower_id`, `following_id`, `status`, `created_time`, `updated_time`) VALUES
(1, 1, 3, 1, NOW(), NOW()),
(2, 2, 4, 1, NOW(), NOW()),
(3, 3, 1, 1, NOW(), NOW()),
(4, 5, 2, 1, NOW(), NOW());

REPLACE INTO `attention` (`id`, `attention_user_id`, `attentioned_user_id`, `status`, `created_time`) VALUES
(1, 1, 2, 1, NOW()),
(2, 2, 3, 1, NOW()),
(3, 3, 4, 1, NOW());

REPLACE INTO `message` (`id`, `user_id`, `type`, `content`, `result`, `status`, `created_time`, `updated_time`) VALUES
(1, 1, 1, '你发布的“图书馆丢失校园卡”有新的评论，请及时查看。', '待查看', 1, NOW(), NOW()),
(2, 2, 1, '你关注的招领信息“实验楼捡到银色U盘”有新的互动。', '待查看', 1, NOW(), NOW()),
(3, 4, 2, '管理员提醒：招领信息请在确认失主后及时标记处理结果。', '已发送', 1, NOW(), NOW());

REPLACE INTO `report` (`id`, `user_id`, `post_id`, `content`, `status`, `created_time`, `updated_time`) VALUES
(1, 6, 4, '示例举报：帖子内容待确认真实性，管理员可在后台查看。', 1, NOW(), NOW());
