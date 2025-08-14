package org.hh.heritagehunters.domain.post.util;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.UUID;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

@Component
@Profile("local")
@Slf4j
public class ImageUploader {
  private static final Path UPLOAD_ROOT = Paths.get(System.getProperty("user.dir"), "uploads").toAbsolutePath();

  public String upload(MultipartFile file) {
    try {
      Files.createDirectories(UPLOAD_ROOT);      // 없으면 생성 (이미 있으면 그대로)

      String filename = UUID.randomUUID() + "_" + file.getOriginalFilename();
      Path dest = UPLOAD_ROOT.resolve(filename);

      file.transferTo(dest);                     // Spring 3.2+ 는 Path 지원

      return "/uploads/" + filename;             // ★ 정적 리소스 매핑을 해 둬야 브라우저에서 열립니다
    } catch (IOException e) {
      log.error("로컬 이미지 업로드 실패", e);
      throw new RuntimeException("이미지 업로드 실패", e);
    }
  }
}
