package org.hh.heritagehunters.domain.post.infrastructure.storage;

import java.io.File;
import java.io.IOException;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

/**
 * 이미지 업로드 관련 비즈니스 로직을 담당하는 서비스
 * S3Service를 활용하여 이미지 파일 처리를 수행합니다
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ImageUploadService {

  private final S3Service s3Service;

  /**
   * 이미지를 S3에 업로드하고 URL을 반환합니다
   * @param file 업로드할 이미지 파일
   * @return 업로드된 이미지의 S3 URL
   * @throws RuntimeException 업로드 실패 시
   */
  public String uploadImage(MultipartFile file) {
    log.debug("이미지 업로드 시작: {}", file.getOriginalFilename());

    File tempFile = null;
    try {
      // 1. MultipartFile → 임시 파일 변환
      tempFile = createTempFile(file);

      // 2. S3 키 생성
      String s3Key = generateS3Key(file.getOriginalFilename());
      log.debug("S3 키 생성: {}", s3Key);

      // 3. S3 업로드
      s3Service.uploadFile(s3Key, tempFile);

      // 4. S3 URL 생성
      String imageUrl = s3Service.getFileUrl(s3Key);
      log.info("이미지 업로드 성공: {} -> {}", file.getOriginalFilename(), imageUrl);

      return imageUrl;

    } catch (IOException e) {
      log.error("파일 처리 오류: {}", e.getMessage());
      throw new RuntimeException("파일 처리 실패: " + e.getMessage(), e);

    } catch (Exception e) {
      log.error("이미지 업로드 실패: {}", file.getOriginalFilename(), e);
      throw new RuntimeException("이미지 업로드 실패: " + e.getMessage(), e);

    } finally {
      // 5. 임시 파일 정리
      cleanupTempFile(tempFile);
    }
  }

  /**
   * S3에서 이미지를 삭제합니다
   * @param imageUrl 삭제할 이미지의 S3 URL
   */
  public void deleteImage(String imageUrl) {
    try {
      String key = s3Service.extractKeyFromUrl(imageUrl);
      log.debug("이미지 삭제 시도: {}", key);

      s3Service.deleteFile(key);
      log.info("이미지 삭제 성공: {}", imageUrl);

    } catch (Exception e) {
      log.error("이미지 삭제 실패: {}", imageUrl, e);
      throw new RuntimeException("이미지 삭제 실패: " + e.getMessage(), e);
    }
  }

  /**
   * MultipartFile로부터 임시 파일을 생성합니다
   */
  private File createTempFile(MultipartFile file) throws IOException {
    String originalFilename = file.getOriginalFilename();
    String fileExtension = "";

    if (originalFilename != null && originalFilename.contains(".")) {
      fileExtension = originalFilename.substring(originalFilename.lastIndexOf("."));
    }

    String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss"));
    String safeFilename = UUID.randomUUID().toString() + "_" + timestamp + fileExtension;

    File tempFile = File.createTempFile("heritage-upload-", "-" + safeFilename);
    file.transferTo(tempFile);

    log.debug("임시 파일 생성: {} (size: {})", tempFile.getAbsolutePath(), tempFile.length());
    return tempFile;
  }

  /**
   * S3 키를 생성합니다
   * 형식: posts/yyyy/MM/dd/UUID_원본파일명
   */
  private String generateS3Key(String originalFilename) {
    String datePrefix = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy/MM/dd"));
    String uuid = UUID.randomUUID().toString();
    return String.format("posts/%s/%s_%s", datePrefix, uuid, originalFilename);
  }

  /**
   * 임시 파일을 정리합니다
   */
  private void cleanupTempFile(File tempFile) {
    if (tempFile != null && tempFile.exists()) {
      if (tempFile.delete()) {
        log.debug("임시 파일 삭제 완료: {}", tempFile.getAbsolutePath());
      } else {
        log.warn("임시 파일 삭제 실패: {}", tempFile.getAbsolutePath());
      }
    }
  }
}