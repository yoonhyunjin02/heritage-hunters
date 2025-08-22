package org.hh.heritagehunters.domain.post.infrastructure.storage;

import java.io.File;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import software.amazon.awssdk.core.exception.SdkClientException;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.model.S3Exception;

/**
 * AWS S3 관련 작업을 담당하는 서비스 클래스
 * 파일 업로드, 삭제, URL 생성 등의 순수한 S3 작업만 수행합니다
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class S3Service {

  private final S3Client s3Client;

  @Value("${cloud.aws.s3.bucket}")
  private String bucketName;

  @Value("${cloud.aws.region.static}")
  private String region;

  /**
   * S3에 파일을 업로드합니다
   * @param key S3 저장 경로 (키)
   * @param file 업로드할 파일
   * @throws RuntimeException 업로드 실패 시
   */
  public void uploadFile(String key, File file) {
    log.debug("S3 업로드 시도: bucket={}, key={}", bucketName, key);

    try {
      s3Client.putObject(
          PutObjectRequest.builder()
              .bucket(bucketName)
              .key(key)
              .build(),
          RequestBody.fromFile(file)
      );
      log.info("S3 업로드 성공: {}", key);

    } catch (S3Exception s3e) {
      // AWS S3 API에서 내려온 에러 (권한/버킷 정책/리전 문제 등)
      log.error("S3 API 오류: {}", s3e.awsErrorDetails().errorMessage());
      throw new RuntimeException("S3 업로드 실패: " + s3e.awsErrorDetails().errorMessage(), s3e);

    } catch (SdkClientException sdkEx) {
      // 네트워크 문제 or 자격 증명 문제
      log.error("AWS SDK 클라이언트 오류: {}", sdkEx.getMessage());
      throw new RuntimeException("AWS 연결 실패: " + sdkEx.getMessage(), sdkEx);

    } catch (Exception e) {
      // 그 외 예외
      log.error("S3 업로드 중 알 수 없는 오류: {}", e.getMessage());
      throw new RuntimeException("S3 업로드 실패", e);
    }
  }

  /**
   * S3에서 파일을 삭제합니다
   * @param key 삭제할 파일의 S3 키
   * @throws RuntimeException 삭제 실패 시
   */
  public void deleteFile(String key) {
    try {
      s3Client.deleteObject(
          DeleteObjectRequest.builder()
              .bucket(bucketName)
              .key(key)
              .build()
      );
      log.info("S3 파일 삭제 성공: {}", key);
      
    } catch (Exception e) {
      log.error("S3 파일 삭제 실패: key={}, reason={}", key, e.getMessage());
      throw new RuntimeException("S3 파일 삭제 실패: " + e.getMessage(), e);
    }
  }

  /**
   * S3 파일의 공개 URL을 생성합니다
   * @param key S3 파일 키
   * @return 공개 접근 가능한 URL
   */
  public String getFileUrl(String key) {
    return String.format("https://%s.s3.%s.amazonaws.com/%s", bucketName, region, key);
  }

  /**
   * S3 URL에서 키를 추출합니다
   * @param imageUrl S3 이미지 URL
   * @return 추출된 S3 키
   */
  public String extractKeyFromUrl(String imageUrl) {
    String baseUrl = String.format("https://%s.s3.%s.amazonaws.com/", bucketName, region);
    return imageUrl.replace(baseUrl, "");
  }
}