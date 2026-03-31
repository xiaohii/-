package com.example.lostandfound.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.nio.file.Paths;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        String staticRoot = Paths.get(System.getProperty("user.home"), "lostandfound-static").toUri().toString();
        registry.addResourceHandler("/static/**")
                .addResourceLocations(staticRoot);
    }
}
