package com.example.lostandfound.filter;

import com.example.lostandfound.utils.JwtUtil;
import com.example.lostandfound.utils.RedisCache;
import io.jsonwebtoken.Claims;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.concurrent.TimeUnit;
import java.util.regex.Matcher;
import java.util.regex.Pattern;


@Component
@Slf4j
public class JwtAuthenticationTokenFilter extends OncePerRequestFilter {

    @Autowired
    RedisCache redisCache;

    @Autowired
    UserDetailsService userDetailsService;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain) throws ServletException, IOException {
        Claims parseToken;
        String token = request.getHeader("Token");
        response.addHeader("Access-Control-Expose-Headers", "status");
        if ("/lostandfound/login/".equals(request.getRequestURI())) {
            filterChain.doFilter(request, response);
            return;
        }
        if (request.getRequestURI().contains("/lostandfound/post/") ||
                request.getRequestURI().contains("/lostandfound/user/") ||
                request.getRequestURI().contains("/static/") ||
                request.getRequestURI().contains("/lostandfound/attribute/") ||
                request.getRequestURI().contains("/swagger-ui/") ||
                request.getRequestURI().contains("/api-docs") ||
                request.getRequestURI().contains("/register/email") ||
                request.getRequestURI().endsWith("/getopenid.php") ||
                request.getRequestURI().endsWith("/logout.php") ||
                request.getRequestURI().contains("/login/auto_login.php") ||
                request.getRequestURI().contains("/login/login.php") ||
                request.getRequestURI().contains("/login/register.php") ||
                request.getRequestURI().contains("/login/setcontact.php") ||
                request.getRequestURI().contains("/index/show.php") ||
                request.getRequestURI().contains("/index/search.php") ||
                request.getRequestURI().contains("/comments/list.php") ||
                request.getRequestURI().contains("/comments/add.php") ||
                request.getRequestURI().contains("/likes/status.php") ||
                request.getRequestURI().contains("/likes/toggle.php") ||
                request.getRequestURI().contains("/edit/edit.php") ||
                request.getRequestURI().contains("/edit/upload.php") ||
                request.getRequestURI().contains("/myinfo/get_user_info.php") ||
                request.getRequestURI().contains("/myinfo/set_avatar.php") ||
                request.getRequestURI().contains("/myinfo/set_nickname.php") ||
                request.getRequestURI().contains("/myinfo/change_password.php") ||
                request.getRequestURI().contains("/myinfo/show_user_publishing.php") ||
                request.getRequestURI().contains("/myinfo/delete_publish.php")

        ) {
            filterChain.doFilter(request, response);
            return;
        }
        if (token == null) {
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.addIntHeader("status", 403);
            filterChain.doFilter(request, response);
            return;
        } else {
            try {
                parseToken = JwtUtil.parseJWT(token);
            } catch (Exception e) {
                throw new RuntimeException(e);
            }


            String subject = parseToken.getSubject();
            Pattern pattern = Pattern.compile("email=(.*?)\\)");
            Matcher matcher = pattern.matcher(subject);

            String email;
            if (matcher.find()) {
                email = matcher.group(1);
                String jwt = redisCache.getCacheObject("token-user-" + email);
                if (token.isEmpty() || !token.equals(jwt)) {
                    log.info("认证失败====");
                    response.setStatus(HttpServletResponse.SC_FORBIDDEN);
                    filterChain.doFilter(request, response);
                } else {
                    log.info("认证成功");
                    redisCache.expire("token-user-" + email, 2, TimeUnit.DAYS);
                    filterChain.doFilter(request, response);
                }
            } else {
                log.info("认证失败====");
                response.setStatus(HttpServletResponse.SC_FORBIDDEN);
                filterChain.doFilter(request, response);
            }
        }

    }
}
