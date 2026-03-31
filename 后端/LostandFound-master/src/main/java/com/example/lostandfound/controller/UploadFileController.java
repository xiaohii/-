package com.example.lostandfound.controller;

import com.example.lostandfound.entity.Images;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Objects;
import java.util.UUID;

@RestController
@CrossOrigin
@RequestMapping("/lostandfound/upload")
@Slf4j
public class UploadFileController {

    private static final Path IMAGE_ROOT = Paths.get(System.getProperty("user.home"), "lostandfound-static", "image");

    @Autowired
    Images images;

    @PostMapping("/image")
    public String uploadFile(@RequestParam("file") MultipartFile file) {
        if (file.isEmpty()) {
            return "upload failed: empty file";
        }

        try {
            Files.createDirectories(IMAGE_ROOT);
            String suffix = Objects.requireNonNullElse(file.getOriginalFilename(), "file.bin");
            suffix = suffix.contains(".") ? suffix.substring(suffix.lastIndexOf('.')) : ".bin";
            String fileName = UUID.randomUUID() + suffix;
            Path outputFile = IMAGE_ROOT.resolve(fileName);
            file.transferTo(outputFile);
            images.getImages().add(outputFile.toString());
            log.info("uploaded file {}", outputFile);
            return ServletUriComponentsBuilder.fromCurrentContextPath()
                    .path("/static/image/")
                    .path(fileName)
                    .toUriString();
        } catch (IOException e) {
            return "upload failed: " + e.getMessage();
        }
    }
}
