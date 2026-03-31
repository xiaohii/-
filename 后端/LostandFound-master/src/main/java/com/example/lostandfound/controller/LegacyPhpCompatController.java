package com.example.lostandfound.controller;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.example.lostandfound.entity.Comments;
import com.example.lostandfound.entity.Likes;
import com.example.lostandfound.entity.Post;
import com.example.lostandfound.entity.User;
import com.example.lostandfound.entity.UserSettings;
import com.example.lostandfound.service.CommentsService;
import com.example.lostandfound.service.LikesService;
import com.example.lostandfound.service.PostService;
import com.example.lostandfound.service.UserSettingsService;
import com.example.lostandfound.service.UserService;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@RestController
@CrossOrigin
public class LegacyPhpCompatController {

    private static final DateTimeFormatter LEGACY_TIME_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
    private static final int UNBOUND_USER_ID = -1;
    private static final Map<String, Integer> OPENID_USER_MAP = new ConcurrentHashMap<>();

    @Autowired
    private UserService userService;

    @Autowired
    private PostService postService;

    @Autowired
    private CommentsService commentsService;

    @Autowired
    private LikesService likesService;

    @Autowired
    private UserSettingsService userSettingsService;

    @Autowired
    private UploadFileController uploadFileController;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @PostConstruct
    public void initializeLegacyAccountBindingTable() {
        jdbcTemplate.execute(
                "CREATE TABLE IF NOT EXISTS legacy_account_binding ("
                        + "id INT NOT NULL AUTO_INCREMENT,"
                        + "account VARCHAR(64) NOT NULL,"
                        + "user_id INT NOT NULL,"
                        + "password VARCHAR(255) NOT NULL,"
                        + "openid VARCHAR(128) DEFAULT NULL,"
                        + "created_time DATETIME DEFAULT CURRENT_TIMESTAMP,"
                        + "updated_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,"
                        + "PRIMARY KEY (id),"
                        + "UNIQUE KEY uk_legacy_account_binding_account (account),"
                        + "UNIQUE KEY uk_legacy_account_binding_user_id (user_id),"
                        + "KEY idx_legacy_account_binding_openid (openid)"
                        + ") ENGINE=InnoDB DEFAULT CHARSET=utf8mb4"
        );
    }

    @GetMapping("/getopenid.php")
    public Map<String, Object> getOpenId(@RequestParam(value = "code", required = false) String code) {
        Map<String, Object> result = new HashMap<>();
        String openid = "wx_" + Integer.toUnsignedString(Objects.toString(code, UUID.randomUUID().toString()).hashCode());
        OPENID_USER_MAP.putIfAbsent(openid, UNBOUND_USER_ID);
        result.put("openid", openid);
        return result;
    }

    @GetMapping("/login/auto_login.php")
    public Map<String, Object> autoLogin(@RequestParam(value = "openid", required = false) String openid) {
        Map<String, Object> result = new HashMap<>();
        Integer userId = resolveUserIdByOpenid(normalizeText(openid));
        if (userId != null && userId > 0 && userService.getById(userId) != null) {
            result.put("user_id", String.valueOf(userId));
        }
        return result;
    }

    @GetMapping("/login/register.php")
    public Map<String, Object> legacyRegister(@RequestParam(value = "user_id", required = false) String userIdText,
                                              @RequestParam(value = "user_password", required = false) String rawPassword,
                                              @RequestParam(value = "openid", required = false) String openid,
                                              @RequestParam(value = "nickName", required = false) String nickName,
                                              @RequestParam(value = "avatarUrl", required = false) String avatarUrl) {
        Map<String, Object> result = new HashMap<>();
        Map<String, Object> data = new HashMap<>();
        String account = normalizeText(userIdText);

        if (account == null || rawPassword == null || rawPassword.isEmpty()) {
            result.put("code", 1);
            result.put("msg", "invalid params");
            data.put("tag", "error");
            result.put("data", data);
            return result;
        }

        LegacyAccountBinding binding = findLegacyAccountByAccount(account);
        User existingUser = binding == null ? null : userService.getById(binding.userId());
        if (binding != null && existingUser != null) {
            result.put("code", 1);
            result.put("msg", "account already exists");
            data.put("tag", "registered");
            result.put("data", data);
            return result;
        }

        User user = new User();
        user.setNickname(resolveDisplayName(account, nickName));
        user.setHeader(normalizeText(avatarUrl));
        user.setStatus(1);
        userService.save(user);
        ensureUserSettings(user.getId());
        saveLegacyAccountBinding(account, user.getId(), rawPassword, openid);

        result.put("code", 0);
        result.put("msg", "ok");
        data.put("tag", "created");
        data.put("user_id", String.valueOf(user.getId()));
        result.put("data", data);
        return result;
    }

    @GetMapping("/login/login.php")
    public Map<String, Object> legacyLogin(@RequestParam(value = "user_id", required = false) String userIdText,
                                           @RequestParam(value = "user_password", required = false) String rawPassword,
                                           @RequestParam(value = "openid", required = false) String openid,
                                           @RequestParam(value = "nickName", required = false) String nickName,
                                           @RequestParam(value = "avatarUrl", required = false) String avatarUrl) {
        Map<String, Object> result = new HashMap<>();
        Map<String, Object> data = new HashMap<>();
        String account = normalizeText(userIdText);

        if (account == null || rawPassword == null || rawPassword.isEmpty()) {
            result.put("code", 1);
            result.put("msg", "invalid params");
            data.put("tag", "error");
            result.put("data", data);
            return result;
        }

        LegacyAccountBinding binding = findLegacyAccountByAccount(account);
        User user = binding == null ? null : userService.getById(binding.userId());
        if (binding == null || user == null) {
            result.put("code", 1);
            result.put("msg", "account not found");
            data.put("tag", "error");
            result.put("data", data);
            return result;
        }

        if (!passwordMatches(rawPassword, binding.password())) {
            result.put("code", 1);
            result.put("msg", "account or password error");
            data.put("tag", "error");
            result.put("data", data);
            return result;
        }

        syncUserProfile(user, account, nickName, avatarUrl);
        bindOpenIdToUser(account, user.getId(), openid);

        result.put("code", 0);
        result.put("msg", "ok");
        data.put("tag", "registered");
        data.put("user_id", String.valueOf(user.getId()));
        result.put("data", data);
        return result;
    }

    @GetMapping("/login/setcontact.php")
    public Map<String, Object> setContact(@RequestParam("user_id") Integer userId,
                                          @RequestParam(value = "contact_type", required = false) String contactType,
                                          @RequestParam(value = "contact_value", required = false) String contactValue) {
        Map<String, Object> result = new HashMap<>();
        User user = userService.getById(userId);
        if (user == null) {
            result.put("code", 1);
            result.put("msg", "user not found");
            return result;
        }

        String type = contactType == null ? "" : contactType.toLowerCase(Locale.ROOT);
        if (type.contains("qq")) {
            user.setQQ(contactValue);
        } else if (type.contains("phone")
                || type.contains("mobile")
                || type.contains("手机")
                || type.contains("手机号")) {
            user.setPhoneNumber(contactValue);
        } else {
            user.setOtherContacts(contactValue);
        }

        userService.updateById(user);
        result.put("code", 0);
        result.put("msg", "ok");
        return result;
    }

    @GetMapping("/logout.php")
    public Map<String, Object> logout(@RequestParam(value = "openid", required = false) String openid) {
        clearOpenIdBinding(normalizeText(openid));
        Map<String, Object> result = new HashMap<>();
        result.put("code", 0);
        result.put("msg", "ok");
        return result;
    }

    @GetMapping("/index/show.php")
    public Map<String, Object> showPosts(@RequestParam(value = "type", required = false) String type,
                                         @RequestParam(value = "category", required = false) String category) {
        QueryWrapper<Post> queryWrapper = new QueryWrapper<>();
        queryWrapper.eq("status", 1);
        Integer postType = toPostType(type);
        if (postType != null) {
            queryWrapper.eq("type", postType);
        }
        if (!isAllCategory(category)) {
            queryWrapper.and(q -> q.like("tags", category).or().like("title", category).or().like("content", category));
        }
        queryWrapper.orderByDesc("created_time");

        Map<String, Object> result = new HashMap<>();
        result.put("code", 0);
        result.put("data", toLegacyPostList(postService.list(queryWrapper)));
        return result;
    }

    @GetMapping("/index/search.php")
    public List<Map<String, Object>> searchPosts(@RequestParam(value = "key", required = false) String key) {
        QueryWrapper<Post> queryWrapper = new QueryWrapper<>();
        queryWrapper.eq("status", 1);
        if (key != null && !key.isEmpty()) {
            queryWrapper.and(q -> q.like("title", key).or().like("content", key).or().like("tags", key));
        }
        queryWrapper.orderByDesc("created_time");
        return toLegacyPostList(postService.list(queryWrapper));
    }

    @GetMapping("/edit/edit.php")
    public Map<String, Object> addPost(@RequestParam("user_id") Integer userId,
                                       @RequestParam(value = "type_t", required = false) String type,
                                       @RequestParam(value = "category", required = false) String category,
                                       @RequestParam(value = "title", required = false) String title,
                                       @RequestParam(value = "msg", required = false) String message,
                                       @RequestParam(value = "claim_point", required = false) String claimPoint) {
        Map<String, Object> result = new HashMap<>();
        Map<String, Object> data = new HashMap<>();

        User user = userService.getById(userId);
        if (user == null) {
            result.put("code", 1);
            result.put("msg", "user not found");
            data.put("publish_id", -1);
            result.put("data", data);
            return result;
        }

        Post post = new Post();
        post.setUserId(userId);
        post.setUserNickname(user.getNickname());
        post.setType(toPostType(type));
        post.setStatus(1);
        post.setTitle(resolvePostTitle(title, category, claimPoint));
        post.setContent(message);
        post.setTags(category);
        post.setImage("[]");
        postService.save(post);

        result.put("code", 0);
        data.put("publish_id", post.getId());
        result.put("data", data);
        return result;
    }

    @PostMapping("/edit/upload.php")
    public Map<String, Object> uploadImage(@RequestParam("file") MultipartFile file,
                                           @RequestParam(value = "publish_id", required = false) Integer publishId) {
        Map<String, Object> result = new HashMap<>();
        String url = uploadFileController.uploadFile(file);

        if (publishId != null && url.startsWith("http")) {
            Post post = postService.getById(publishId);
            if (post != null) {
                List<String> images = parseImageUrls(post.getImage());
                images.add(url);
                post.setImage(toJsonArray(images));
                postService.updateById(post);
            }
        }

        result.put("code", 0);
        result.put("url", url);
        return result;
    }

    @GetMapping("/myinfo/get_user_info.php")
    public Map<String, Object> getUserInfo(@RequestParam("user_id") Integer userId) {
        User user = userService.getById(userId);
        Map<String, Object> result = new HashMap<>();
        if (user == null) {
            return result;
        }

        result.put("nickName", user.getNickname());
        result.put("avatarUrl", user.getHeader());
        result.put("user_id", user.getId());
        result.put("user_status", user.getStatus());
        result.put("can_publish", user.getStatus() == null || user.getStatus() == 1);
        if (user.getPhoneNumber() != null && !user.getPhoneNumber().isEmpty()) {
            result.put("contact_type", "手机号码");
            result.put("contact_value", user.getPhoneNumber());
        } else if (user.getQQ() != null && !user.getQQ().isEmpty()) {
            result.put("contact_type", "QQ");
            result.put("contact_value", user.getQQ());
        } else {
            result.put("contact_type", "微信号");
            result.put("contact_value", user.getOtherContacts());
        }
        result.put("is_admin", isAdminUser(userId));
        return result;
    }

    @GetMapping("/myinfo/show_user_publishing.php")
    public List<Map<String, Object>> getUserPublishing(@RequestParam("user_id") Integer userId) {
        QueryWrapper<Post> queryWrapper = new QueryWrapper<>();
        queryWrapper.eq("user_id", userId);
        queryWrapper.eq("status", 1);
        queryWrapper.orderByDesc("created_time");
        return toLegacyPostList(postService.list(queryWrapper));
    }

    @GetMapping("/myinfo/set_avatar.php")
    public Map<String, Object> setAvatar(@RequestParam("user_id") Integer userId,
                                         @RequestParam(value = "avatar_url", required = false) String avatarUrl) {
        Map<String, Object> result = new HashMap<>();
        User user = userService.getById(userId);
        String normalizedAvatarUrl = normalizeText(avatarUrl);

        if (user == null) {
            result.put("code", 1);
            result.put("msg", "user not found");
            return result;
        }

        if (normalizedAvatarUrl == null) {
            result.put("code", 1);
            result.put("msg", "avatar url required");
            return result;
        }

        user.setHeader(normalizedAvatarUrl);
        userService.updateById(user);

        result.put("code", 0);
        result.put("msg", "ok");
        result.put("avatarUrl", normalizedAvatarUrl);
        return result;
    }

    @GetMapping("/myinfo/set_nickname.php")
    public Map<String, Object> setNickname(@RequestParam("user_id") Integer userId,
                                           @RequestParam(value = "nick_name", required = false) String nickName,
                                           @RequestParam(value = "nickName", required = false) String altNickName) {
        Map<String, Object> result = new HashMap<>();
        User user = userService.getById(userId);
        String normalizedNickname = normalizeText(nickName);

        if (normalizedNickname == null) {
            normalizedNickname = normalizeText(altNickName);
        }

        if (user == null) {
            result.put("code", 1);
            result.put("msg", "user not found");
            return result;
        }

        if (normalizedNickname == null) {
            result.put("code", 1);
            result.put("msg", "invalid params");
            return result;
        }

        if (normalizedNickname.length() < 2 || normalizedNickname.length() > 16) {
            result.put("code", 1);
            result.put("msg", "nickname length invalid");
            return result;
        }

        user.setNickname(normalizedNickname);
        userService.updateById(user);
        jdbcTemplate.update("UPDATE user_security SET nickname = ? WHERE user_id = ?", normalizedNickname, userId);
        jdbcTemplate.update("UPDATE post SET user_nickname = ? WHERE user_id = ?", normalizedNickname, userId);

        result.put("code", 0);
        result.put("msg", "ok");
        result.put("nickName", normalizedNickname);
        return result;
    }

    @GetMapping("/myinfo/change_password.php")
    public Map<String, Object> changePassword(@RequestParam("user_id") Integer userId,
                                              @RequestParam(value = "origin_password", required = false) String originPassword,
                                              @RequestParam(value = "new_password", required = false) String newPassword) {
        Map<String, Object> result = new HashMap<>();
        User user = userService.getById(userId);
        String normalizedOriginPassword = normalizeText(originPassword);
        String normalizedNewPassword = normalizeText(newPassword);

        if (user == null) {
            result.put("code", 1);
            result.put("msg", "user not found");
            return result;
        }

        if (normalizedOriginPassword == null || normalizedNewPassword == null) {
            result.put("code", 1);
            result.put("msg", "invalid params");
            return result;
        }

        if (normalizedNewPassword.length() < 6) {
            result.put("code", 1);
            result.put("msg", "password too short");
            return result;
        }

        LegacyAccountBinding binding = findLegacyAccountByUserId(userId);
        if (binding == null) {
            result.put("code", 1);
            result.put("msg", "account not found");
            return result;
        }

        if (!passwordMatches(normalizedOriginPassword, binding.password())) {
            result.put("code", 1);
            result.put("msg", "origin password error");
            return result;
        }

        String encodedPassword = passwordEncoder.encode(normalizedNewPassword);
        jdbcTemplate.update(
                "UPDATE legacy_account_binding SET password = ? WHERE user_id = ?",
                encodedPassword,
                userId
        );
        jdbcTemplate.update(
                "INSERT INTO user_security(user_id, nickname, password, email) VALUES (?, ?, ?, ?) "
                        + "ON DUPLICATE KEY UPDATE nickname = VALUES(nickname), password = VALUES(password), email = VALUES(email)",
                userId,
                normalizeText(user.getNickname()),
                "{bcrypt}" + encodedPassword,
                normalizeText(user.getEmail())
        );

        result.put("code", 0);
        result.put("msg", "ok");
        result.put("account", binding.account());
        return result;
    }

    @GetMapping("/myinfo/delete_publish.php")
    public String deletePublishing(@RequestParam("publish_id") Integer publishId) {
        return postService.removeById(publishId) ? "true" : "false";
    }

    @GetMapping("/comments/list.php")
    public Map<String, Object> listComments(@RequestParam("publish_id") Integer publishId) {
        Map<String, Object> result = new HashMap<>();
        Map<String, Object> data = new HashMap<>();
        Post post = postService.getById(publishId);

        if (post == null) {
            result.put("code", 1);
            result.put("msg", "post not found");
            data.put("list", new ArrayList<>());
            data.put("count", 0);
            result.put("data", data);
            return result;
        }

        QueryWrapper<Comments> queryWrapper = new QueryWrapper<>();
        queryWrapper.eq("post_id", publishId);
        queryWrapper.eq("status", 1);
        queryWrapper.orderByDesc("created_time");

        List<Comments> comments = commentsService.list(queryWrapper);
        int commentCount = syncPostCommentCount(publishId, comments.size());

        data.put("list", toLegacyCommentList(comments));
        data.put("count", commentCount);
        result.put("code", 0);
        result.put("msg", "ok");
        result.put("data", data);
        return result;
    }

    @PostMapping("/comments/add.php")
    public Map<String, Object> addComment(@RequestParam("publish_id") Integer publishId,
                                          @RequestParam("user_id") Integer userId,
                                          @RequestParam(value = "content", required = false) String content) {
        Map<String, Object> result = new HashMap<>();
        Map<String, Object> data = new HashMap<>();
        String normalizedContent = normalizeText(content);
        Post post = postService.getById(publishId);
        User commenter = userService.getById(userId);

        if (post == null) {
            result.put("code", 1);
            result.put("msg", "post not found");
            data.put("count", 0);
            result.put("data", data);
            return result;
        }

        if (commenter == null) {
            result.put("code", 1);
            result.put("msg", "user not found");
            data.put("count", post.getCommentNum() == null ? 0 : post.getCommentNum());
            result.put("data", data);
            return result;
        }

        if (normalizedContent == null) {
            result.put("code", 1);
            result.put("msg", "content required");
            data.put("count", post.getCommentNum() == null ? 0 : post.getCommentNum());
            result.put("data", data);
            return result;
        }

        Comments comment = new Comments();
        comment.setPostId(publishId);
        comment.setCommenterId(userId);
        comment.setCommentedUserId(post.getUserId() == null ? userId : post.getUserId());
        comment.setContent(normalizedContent);
        comment.setCommentType(1);
        comment.setParentId(null);
        comment.setStatus(1);
        commentsService.save(comment);

        int commentCount = syncPostCommentCount(publishId, null);
        data.put("count", commentCount);
        data.put("item", toLegacyCommentItem(comment));
        result.put("code", 0);
        result.put("msg", "ok");
        result.put("data", data);
        return result;
    }

    @GetMapping("/likes/status.php")
    public Map<String, Object> likeStatus(@RequestParam("publish_id") Integer publishId,
                                          @RequestParam(value = "user_id", required = false) Integer userId) {
        Map<String, Object> result = new HashMap<>();
        Map<String, Object> data = new HashMap<>();
        Post post = postService.getById(publishId);

        if (post == null) {
            result.put("code", 1);
            result.put("msg", "post not found");
            data.put("liked", false);
            data.put("count", 0);
            result.put("data", data);
            return result;
        }

        data.put("liked", hasUserLikedPost(publishId, userId));
        data.put("count", syncPostLikeCount(publishId, null));
        result.put("code", 0);
        result.put("msg", "ok");
        result.put("data", data);
        return result;
    }

    @PostMapping("/likes/toggle.php")
    public Map<String, Object> toggleLike(@RequestParam("publish_id") Integer publishId,
                                          @RequestParam("user_id") Integer userId) {
        Map<String, Object> result = new HashMap<>();
        Map<String, Object> data = new HashMap<>();
        Post post = postService.getById(publishId);
        User user = userService.getById(userId);

        if (post == null) {
            result.put("code", 1);
            result.put("msg", "post not found");
            data.put("liked", false);
            data.put("count", 0);
            result.put("data", data);
            return result;
        }

        if (user == null) {
            result.put("code", 1);
            result.put("msg", "user not found");
            data.put("liked", false);
            data.put("count", post.getLikesNum() == null ? 0 : post.getLikesNum());
            result.put("data", data);
            return result;
        }

        QueryWrapper<Likes> queryWrapper = new QueryWrapper<>();
        queryWrapper.eq("post_id", publishId);
        queryWrapper.eq("user_id", userId);
        queryWrapper.eq("status", 1);
        List<Likes> existingLikes = likesService.list(queryWrapper);

        boolean liked;
        if (existingLikes.isEmpty()) {
            Likes like = new Likes();
            like.setPostId(publishId);
            like.setUserId(userId);
            like.setStatus(1);
            likesService.save(like);
            liked = true;
        } else {
            likesService.remove(queryWrapper);
            liked = false;
        }

        data.put("liked", liked);
        data.put("count", syncPostLikeCount(publishId, null));
        result.put("code", 0);
        result.put("msg", "ok");
        result.put("data", data);
        return result;
    }

    private Integer toPostType(String legacyType) {
        if (legacyType == null || legacyType.isEmpty()) {
            return null;
        }
        if ("found".equalsIgnoreCase(legacyType)) {
            return 2;
        }
        if ("lost".equalsIgnoreCase(legacyType)) {
            return 1;
        }

        Integer parsed = parseInteger(legacyType);
        return parsed != null ? parsed : 1;
    }

    private boolean isAllCategory(String category) {
        if (category == null) {
            return true;
        }

        String normalized = category.trim();
        if (normalized.isEmpty()) {
            return true;
        }

        return normalized.equalsIgnoreCase("all")
                || normalized.equals("所有")
                || normalized.equals("全部")
                || normalized.contains("所有")
                || normalized.contains("全部")
                || normalized.contains("鎵€鏈?");
    }

    private String toLegacyType(Integer postType) {
        return Objects.equals(postType, 2) ? "found" : "lost";
    }

    private List<Map<String, Object>> toLegacyPostList(List<Post> posts) {
        List<Map<String, Object>> data = new ArrayList<>();
        for (Post post : posts) {
            Map<String, Object> item = new HashMap<>();
            User user = post.getUserId() == null ? null : userService.getById(post.getUserId());
            List<String> images = parseImageUrls(post.getImage());

            item.put("publish_id", post.getId());
            item.put("type", toLegacyType(post.getType()));
            item.put("user_id", String.valueOf(post.getUserId()));
            item.put("nickName", user != null ? user.getNickname() : post.getUserNickname());
            item.put("avatarUrl", user != null ? user.getHeader() : null);
            item.put("msg", post.getContent());
            item.put("claim_point", resolveClaimPoint(post));
            item.put("comment_num", post.getCommentNum() == null ? 0 : post.getCommentNum());
            item.put("likes_num", post.getLikesNum() == null ? 0 : post.getLikesNum());
            item.put("image_url", images);
            item.put("image_exist", images.isEmpty() ? "0" : "1");
            item.put(
                    "submission_time",
                    post.getCreatedTime() == null
                            ? ""
                            : LEGACY_TIME_FORMATTER.format(
                                    post.getCreatedTime().toInstant().atZone(ZoneId.systemDefault()).toLocalDateTime()
                            )
            );
            data.add(item);
        }
        return data;
    }

    private String resolvePostTitle(String title, String category, String claimPoint) {
        String normalizedTitle = normalizeText(title);
        if (normalizedTitle != null) {
            return normalizedTitle;
        }

        String normalizedClaimPoint = normalizeText(claimPoint);
        if (normalizedClaimPoint != null) {
            return normalizedClaimPoint;
        }

        String normalizedCategory = normalizeText(category);
        return normalizedCategory == null ? "" : normalizedCategory;
    }

    private String resolveClaimPoint(Post post) {
        String normalizedTitle = normalizeText(post.getTitle());
        if (normalizedTitle == null) {
            return "";
        }

        String normalizedTags = normalizeText(post.getTags());
        if (normalizedTags != null && normalizedTags.equals(normalizedTitle)) {
            return "";
        }

        return normalizedTitle;
    }

    private List<Map<String, Object>> toLegacyCommentList(List<Comments> comments) {
        List<Map<String, Object>> data = new ArrayList<>();
        for (Comments comment : comments) {
            data.add(toLegacyCommentItem(comment));
        }
        return data;
    }

    private Map<String, Object> toLegacyCommentItem(Comments comment) {
        Map<String, Object> item = new HashMap<>();
        User commenter = comment.getCommenterId() == null ? null : userService.getById(comment.getCommenterId());

        item.put("comment_id", comment.getId());
        item.put("user_id", comment.getCommenterId());
        item.put("nickName", commenter != null && normalizeText(commenter.getNickname()) != null
                ? commenter.getNickname()
                : "匿名用户");
        item.put("avatarUrl", commenter != null ? commenter.getHeader() : null);
        item.put("content", comment.getContent());
        item.put(
                "submission_time",
                comment.getCreatedTime() == null
                        ? ""
                        : LEGACY_TIME_FORMATTER.format(
                                comment.getCreatedTime().toInstant().atZone(ZoneId.systemDefault()).toLocalDateTime()
                        )
        );
        return item;
    }

    private boolean hasUserLikedPost(Integer postId, Integer userId) {
        if (postId == null || userId == null) {
            return false;
        }

        QueryWrapper<Likes> queryWrapper = new QueryWrapper<>();
        queryWrapper.eq("post_id", postId);
        queryWrapper.eq("user_id", userId);
        queryWrapper.eq("status", 1);
        return likesService.count(queryWrapper) > 0;
    }

    private int syncPostCommentCount(Integer postId, Integer knownCount) {
        if (postId == null) {
            return 0;
        }

        int commentCount;
        if (knownCount != null) {
            commentCount = knownCount;
        } else {
            QueryWrapper<Comments> queryWrapper = new QueryWrapper<>();
            queryWrapper.eq("post_id", postId);
            queryWrapper.eq("status", 1);
            commentCount = Math.toIntExact(commentsService.count(queryWrapper));
        }

        Post post = postService.getById(postId);
        if (post != null && !Objects.equals(post.getCommentNum(), commentCount)) {
            post.setCommentNum(commentCount);
            postService.updateById(post);
        }

        return commentCount;
    }

    private int syncPostLikeCount(Integer postId, Integer knownCount) {
        if (postId == null) {
            return 0;
        }

        int likeCount;
        if (knownCount != null) {
            likeCount = knownCount;
        } else {
            QueryWrapper<Likes> queryWrapper = new QueryWrapper<>();
            queryWrapper.eq("post_id", postId);
            queryWrapper.eq("status", 1);
            likeCount = Math.toIntExact(likesService.count(queryWrapper));
        }

        Post post = postService.getById(postId);
        if (post != null && !Objects.equals(post.getLikesNum(), likeCount)) {
            post.setLikesNum(likeCount);
            postService.updateById(post);
        }

        return likeCount;
    }

    private String normalizeText(String value) {
        if (value == null) {
            return null;
        }

        String normalized = value.trim();
        return normalized.isEmpty() ? null : normalized;
    }

    private Integer resolveUserIdByAccount(String account) {
        LegacyAccountBinding binding = findLegacyAccountByAccount(account);
        if (binding != null && binding.userId() != null && userService.getById(binding.userId()) != null) {
            return binding.userId();
        }

        Integer parsedUserId = parseInteger(account);
        if (parsedUserId != null && userService.getById(parsedUserId) != null) {
            return parsedUserId;
        }

        return null;
    }

    private Integer resolveUserIdByOpenid(String openid) {
        if (openid == null) {
            return null;
        }

        Integer cachedUserId = OPENID_USER_MAP.get(openid);
        if (cachedUserId != null && cachedUserId > 0 && userService.getById(cachedUserId) != null) {
            return cachedUserId;
        }

        LegacyAccountBinding binding = findLegacyAccountByOpenid(openid);
        if (binding != null && binding.userId() != null && userService.getById(binding.userId()) != null) {
            OPENID_USER_MAP.put(openid, binding.userId());
            return binding.userId();
        }

        return null;
    }

    private String resolveDisplayName(String account, String nickName) {
        String normalizedNickname = normalizeText(nickName);
        return normalizedNickname == null ? account : normalizedNickname;
    }

    private void syncUserProfile(User user, String account, String nickName, String avatarUrl) {
        boolean changed = false;
        String normalizedNickname = normalizeText(nickName);
        String currentNickname = normalizeText(user.getNickname());
        if (normalizedNickname != null && (currentNickname == null || account.equals(currentNickname))) {
            user.setNickname(normalizedNickname);
            changed = true;
        }

        String normalizedAvatarUrl = normalizeText(avatarUrl);
        if (normalizedAvatarUrl != null && normalizeText(user.getHeader()) == null) {
            user.setHeader(normalizedAvatarUrl);
            changed = true;
        }

        if (changed) {
            userService.updateById(user);
        }
    }

    private void ensureUserSettings(Integer userId) {
        if (userId == null || userSettingsService.getById(userId) != null) {
            return;
        }

        UserSettings settings = new UserSettings();
        settings.setUserId(userId);
        userSettingsService.save(settings);
    }

    private void saveLegacyAccountBinding(String account, Integer userId, String rawPassword, String openid) {
        String normalizedOpenid = normalizeText(openid);
        if (normalizedOpenid != null) {
            jdbcTemplate.update(
                    "UPDATE legacy_account_binding SET openid = NULL WHERE openid = ? AND account <> ?",
                    normalizedOpenid,
                    account
            );
        }

        jdbcTemplate.update(
                "INSERT INTO legacy_account_binding(account, user_id, password, openid) VALUES (?, ?, ?, ?) "
                        + "ON DUPLICATE KEY UPDATE user_id = VALUES(user_id), password = VALUES(password), openid = VALUES(openid)",
                account,
                userId,
                passwordEncoder.encode(rawPassword),
                normalizedOpenid
        );

        if (normalizedOpenid != null) {
            OPENID_USER_MAP.put(normalizedOpenid, userId);
        }
    }

    private void bindOpenIdToUser(String account, Integer userId, String openid) {
        String normalizedOpenid = normalizeText(openid);
        if (account == null || userId == null || normalizedOpenid == null) {
            return;
        }

        jdbcTemplate.update(
                "UPDATE legacy_account_binding SET openid = NULL WHERE openid = ? AND account <> ?",
                normalizedOpenid,
                account
        );
        jdbcTemplate.update(
                "UPDATE legacy_account_binding SET openid = ? WHERE account = ?",
                normalizedOpenid,
                account
        );
        OPENID_USER_MAP.put(normalizedOpenid, userId);
    }

    private void clearOpenIdBinding(String openid) {
        if (openid == null) {
            return;
        }

        OPENID_USER_MAP.remove(openid);
        jdbcTemplate.update("UPDATE legacy_account_binding SET openid = NULL WHERE openid = ?", openid);
    }

    private LegacyAccountBinding findLegacyAccountByAccount(String account) {
        if (account == null) {
            return null;
        }

        List<LegacyAccountBinding> bindings = jdbcTemplate.query(
                "SELECT account, user_id, password, openid FROM legacy_account_binding WHERE account = ? LIMIT 1",
                (rs, rowNum) -> new LegacyAccountBinding(
                        rs.getString("account"),
                        rs.getInt("user_id"),
                        rs.getString("password"),
                        rs.getString("openid")
                ),
                account
        );
        return bindings.isEmpty() ? null : bindings.get(0);
    }

    private LegacyAccountBinding findLegacyAccountByOpenid(String openid) {
        if (openid == null) {
            return null;
        }

        List<LegacyAccountBinding> bindings = jdbcTemplate.query(
                "SELECT account, user_id, password, openid FROM legacy_account_binding WHERE openid = ? ORDER BY updated_time DESC LIMIT 1",
                (rs, rowNum) -> new LegacyAccountBinding(
                        rs.getString("account"),
                        rs.getInt("user_id"),
                        rs.getString("password"),
                        rs.getString("openid")
                ),
                openid
        );
        return bindings.isEmpty() ? null : bindings.get(0);
    }

    private LegacyAccountBinding findLegacyAccountByUserId(Integer userId) {
        if (userId == null) {
            return null;
        }

        List<LegacyAccountBinding> bindings = jdbcTemplate.query(
                "SELECT account, user_id, password, openid FROM legacy_account_binding WHERE user_id = ? LIMIT 1",
                (rs, rowNum) -> new LegacyAccountBinding(
                        rs.getString("account"),
                        rs.getInt("user_id"),
                        rs.getString("password"),
                        rs.getString("openid")
                ),
                userId
        );
        return bindings.isEmpty() ? null : bindings.get(0);
    }

    private boolean isAdminUser(Integer userId) {
        if (userId == null) {
            return false;
        }

        try {
            Integer count = jdbcTemplate.queryForObject(
                    "SELECT COUNT(*) "
                            + "FROM user_role ur "
                            + "JOIN role_permission rp ON rp.role_id = ur.role_id "
                            + "JOIN permissions p ON p.id = rp.permission_id "
                            + "WHERE ur.user_id = ? AND COALESCE(p.is_deleted, 0) = 0 "
                            + "AND rp.permission_id IN (9513, 9514, 9515)",
                    Integer.class,
                    userId
            );
            return count != null && count > 0;
        } catch (Exception ignored) {
            return false;
        }
    }

    private boolean passwordMatches(String rawPassword, String storedPassword) {
        String normalizedStoredPassword = normalizeText(storedPassword);
        if (rawPassword == null || normalizedStoredPassword == null) {
            return false;
        }

        if (normalizedStoredPassword.startsWith("{bcrypt}")) {
            normalizedStoredPassword = normalizedStoredPassword.substring("{bcrypt}".length());
        }

        return normalizedStoredPassword.equals(rawPassword)
                || passwordEncoder.matches(rawPassword, normalizedStoredPassword);
    }

    private List<String> parseImageUrls(String raw) {
        if (raw == null || raw.trim().isEmpty()) {
            return new ArrayList<>();
        }

        String text = raw.trim();
        if (text.startsWith("[") && text.endsWith("]")) {
            text = text.substring(1, text.length() - 1);
        }
        if (text.isEmpty()) {
            return new ArrayList<>();
        }

        String[] parts = text.split(",");
        List<String> result = new ArrayList<>();
        for (String part : parts) {
            String cleaned = part.trim();
            if (cleaned.startsWith("\"") && cleaned.endsWith("\"") && cleaned.length() >= 2) {
                cleaned = cleaned.substring(1, cleaned.length() - 1);
            }
            if (!cleaned.isEmpty()) {
                result.add(cleaned);
            }
        }
        return result;
    }

    private String toJsonArray(List<String> values) {
        StringBuilder builder = new StringBuilder("[");
        for (int i = 0; i < values.size(); i++) {
            if (i > 0) {
                builder.append(",");
            }
            builder.append("\"").append(values.get(i).replace("\"", "")).append("\"");
        }
        builder.append("]");
        return builder.toString();
    }

    private Integer parseInteger(String text) {
        try {
            return Integer.parseInt(text);
        } catch (Exception e) {
            return null;
        }
    }

    private record LegacyAccountBinding(String account, Integer userId, String password, String openid) {
    }
}
