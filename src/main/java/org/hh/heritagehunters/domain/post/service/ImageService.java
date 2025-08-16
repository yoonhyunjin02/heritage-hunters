package org.hh.heritagehunters.domain.post.service;

import java.util.List;
import java.util.Set;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.stream.Collectors;
import java.util.stream.IntStream;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.hh.heritagehunters.common.exception.BadRequestException;
import org.hh.heritagehunters.common.exception.payload.ErrorCode;
import org.hh.heritagehunters.domain.post.entity.Post;
import org.hh.heritagehunters.domain.post.entity.PostImage;
import org.hh.heritagehunters.domain.post.util.ImageUploader;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import jakarta.annotation.PreDestroy;

@Service
@RequiredArgsConstructor
@Slf4j
public class ImageService {

  private final ImageUploader imageUploader;
  
  // 이미지 업로드용 스레드 풀 (CPU 코어 수만큼 스레드)
  private final ExecutorService imageUploadExecutor = Executors.newFixedThreadPool(
      Math.min(Runtime.getRuntime().availableProcessors(), 8)
  );

  /**
   * 게시글에 새 이미지들을 첨부합니다 (병렬 처리)
   * @param images 업로드할 이미지 파일 목록
   * @param post 이미지를 첨부할 게시글
   */
  public void attachImages(List<MultipartFile> images, Post post) {
    if (images == null || images.isEmpty()) {
      throw new BadRequestException(ErrorCode.EMPTY_IMAGE_FILE);
    }

    // 1단계: 이미지 유효성 검증 (빠른 실패)
    for (MultipartFile image : images) {
      validateImage(image);
    }

    try {
      // 2단계: 병렬로 이미지 업로드
      List<CompletableFuture<String>> uploadFutures = IntStream.range(0, images.size())
          .mapToObj(i -> CompletableFuture.supplyAsync(() -> {
            try {
              MultipartFile image = images.get(i);
              log.debug("이미지 업로드 시작: {} ({}번째)", image.getOriginalFilename(), i);
              String url = imageUploader.upload(image);
              log.debug("이미지 업로드 완료: {} -> {}", image.getOriginalFilename(), url);
              return url;
            } catch (Exception e) {
              log.error("이미지 업로드 실패: {}", images.get(i).getOriginalFilename(), e);
              throw new RuntimeException("이미지 업로드 실패: " + e.getMessage(), e);
            }
          }, imageUploadExecutor))
          .toList();

      // 3단계: 모든 업로드 완료 대기
      CompletableFuture<Void> allUploads = CompletableFuture.allOf(
          uploadFutures.toArray(new CompletableFuture[0])
      );

      // 모든 업로드 완료 후 결과 수집
      List<String> uploadedUrls = allUploads
          .thenApply(v -> uploadFutures.stream()
              .map(CompletableFuture::join)
              .toList())
          .join();

      // 4단계: PostImage 엔티티 생성 및 연결
      for (int i = 0; i < uploadedUrls.size(); i++) {
        post.getImages().add(new PostImage(null, post, uploadedUrls.get(i), i));
      }

      log.info("이미지 {}개 병렬 업로드 완료", uploadedUrls.size());

    } catch (Exception e) {
      log.error("이미지 병렬 업로드 중 오류 발생", e);
      throw new BadRequestException(ErrorCode.IMAGE_UPLOAD_FAILED);
    }
  }

  /**
   * 이미지 파일 유효성 검증
   */
  private void validateImage(MultipartFile image) {
    if (image.isEmpty()) {
      throw new BadRequestException(ErrorCode.EMPTY_IMAGE_FILE);
    }
    if (image.getContentType() == null || !image.getContentType().startsWith("image/")) {
      throw new BadRequestException(ErrorCode.INVALID_IMAGE_FORMAT);
    }
    if (image.getSize() > 50L * 1024 * 1024) {
      throw new BadRequestException(ErrorCode.IMAGE_TOO_LARGE);
    }
  }

  /**
   * 게시글 이미지를 수정합니다 (병렬 처리)
   * @param post 이미지를 수정할 게시글
   * @param newImages 새로 추가할 이미지 파일 목록
   * @param keepImageIds 유지할 기존 이미지 ID 목록
   */
  public void updateImages(Post post, List<MultipartFile> newImages, List<Long> keepImageIds) {
    // 1. 기존 이미지 중 삭제할 것들 제거
    if (keepImageIds != null && !keepImageIds.isEmpty()) {
      Set<Long> keepIds = Set.copyOf(keepImageIds);
      post.getImages().removeIf(image -> !keepIds.contains(image.getId()));
    } else {
      // keepImageIds가 null이거나 비어있으면 모든 기존 이미지 삭제
      post.getImages().clear();
    }

    // 2. 새 이미지가 있으면 병렬로 업로드
    if (newImages != null && !newImages.isEmpty()) {
      // 유효한 이미지만 필터링
      List<MultipartFile> validImages = newImages.stream()
          .filter(image -> !image.isEmpty())
          .toList();

      if (validImages.isEmpty()) {
        return;
      }

      // 이미지 유효성 검증
      for (MultipartFile image : validImages) {
        validateImage(image);
      }

      try {
        int startIndex = post.getImages().size(); // 기존 이미지 개수부터 시작

        // 병렬로 새 이미지 업로드
        List<CompletableFuture<String>> uploadFutures = IntStream.range(0, validImages.size())
            .mapToObj(i -> CompletableFuture.supplyAsync(() -> {
              try {
                MultipartFile image = validImages.get(i);
                log.debug("수정 시 이미지 업로드 시작: {} ({}번째)", image.getOriginalFilename(), i);
                String url = imageUploader.upload(image);
                log.debug("수정 시 이미지 업로드 완료: {} -> {}", image.getOriginalFilename(), url);
                return url;
              } catch (Exception e) {
                log.error("수정 시 이미지 업로드 실패: {}", validImages.get(i).getOriginalFilename(), e);
                throw new RuntimeException("이미지 업로드 실패: " + e.getMessage(), e);
              }
            }, imageUploadExecutor))
            .toList();

        // 모든 업로드 완료 대기
        CompletableFuture<Void> allUploads = CompletableFuture.allOf(
            uploadFutures.toArray(new CompletableFuture[0])
        );

        // 업로드된 URL 수집 및 PostImage 엔티티 생성
        List<String> uploadedUrls = allUploads
            .thenApply(v -> uploadFutures.stream()
                .map(CompletableFuture::join)
                .toList())
            .join();

        // PostImage 엔티티 생성 및 연결
        for (int i = 0; i < uploadedUrls.size(); i++) {
          post.getImages().add(new PostImage(null, post, uploadedUrls.get(i), startIndex + i));
        }

        log.info("수정 시 이미지 {}개 병렬 업로드 완료", uploadedUrls.size());

      } catch (Exception e) {
        log.error("수정 시 이미지 병렬 업로드 중 오류 발생", e);
        throw new BadRequestException(ErrorCode.IMAGE_UPLOAD_FAILED);
      }
    }

    // 3. 이미지 순서 재정렬
    for (int i = 0; i < post.getImages().size(); i++) {
      post.getImages().get(i).updateOrder(i);
    }
    
    // 4. 최소 1장 이미지 검증 (게시글에는 최소 1장의 이미지가 필요)
    if (post.getImages().isEmpty()) {
      throw new BadRequestException(ErrorCode.EMPTY_IMAGE_FILE);
    }
  }

  /**
   * 스레드 풀 정리 (애플리케이션 종료 시)
   */
  @PreDestroy
  public void cleanup() {
    if (imageUploadExecutor != null && !imageUploadExecutor.isShutdown()) {
      log.info("이미지 업로드 스레드 풀 종료 중...");
      imageUploadExecutor.shutdown();
      try {
        if (!imageUploadExecutor.awaitTermination(5, java.util.concurrent.TimeUnit.SECONDS)) {
          log.warn("스레드 풀 정상 종료 실패, 강제 종료");
          imageUploadExecutor.shutdownNow();
        }
      } catch (InterruptedException e) {
        log.warn("스레드 풀 종료 대기 중 인터럽트 발생");
        imageUploadExecutor.shutdownNow();
        Thread.currentThread().interrupt();
      }
      log.info("이미지 업로드 스레드 풀 종료 완료");
    }
  }
}
