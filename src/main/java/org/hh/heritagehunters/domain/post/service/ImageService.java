package org.hh.heritagehunters.domain.post.service;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.hh.heritagehunters.common.exception.BadRequestException;
import org.hh.heritagehunters.common.exception.payload.ErrorCode;
import org.hh.heritagehunters.domain.post.entity.Post;
import org.hh.heritagehunters.domain.post.entity.PostImage;
import org.hh.heritagehunters.domain.post.util.ImageUploader;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

@Service
@RequiredArgsConstructor
public class ImageService {

  private final ImageUploader imageUploader;

  /**
   * 게시글에 새 이미지들을 첨부합니다
   * @param images 업로드할 이미지 파일 목록
   * @param post 이미지를 첨부할 게시글
   */
  public void attachImages(List<MultipartFile> images, Post post) {
    if (images == null || images.isEmpty()) {
      throw new BadRequestException(ErrorCode.EMPTY_IMAGE_FILE);
    }
    for (int i = 0; i < images.size(); i++) {
      MultipartFile image = images.get(i);
      if (image.isEmpty() || image.getContentType() == null || !image.getContentType().startsWith("image/")) {
        throw new BadRequestException(ErrorCode.INVALID_IMAGE_FORMAT);
      }
      if (image.getSize() > 50L * 1024 * 1024) {
        throw new BadRequestException(ErrorCode.IMAGE_TOO_LARGE);
      }
      String url = imageUploader.upload(image);
      post.getImages().add(new PostImage(null, post, url, i));
    }
  }

  /**
   * 게시글 이미지를 수정합니다 (기존 이미지 중 유지할 것과 새로 추가할 것 처리)
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

    // 2. 새 이미지 추가 및 검증
    if (newImages != null && !newImages.isEmpty()) {
      int startIndex = post.getImages().size(); // 기존 이미지 개수부터 시작
      int validImageCount = 0;
      
      for (MultipartFile image : newImages) {
        // 파일 검증
        if (image.isEmpty()) continue;
        
        if (image.getContentType() == null || !image.getContentType().startsWith("image/")) {
          throw new BadRequestException(ErrorCode.INVALID_IMAGE_FORMAT);
        }
        
        if (image.getSize() > 50L * 1024 * 1024) { // 50MB 제한
          throw new BadRequestException(ErrorCode.IMAGE_TOO_LARGE);
        }
        
        // 총 이미지 개수 제한 확인 (기존 + 새로 추가)
        if (startIndex + validImageCount >= 3) {
          throw new BadRequestException(ErrorCode.TOO_MANY_IMAGES);
        }
        
        try {
          String url = imageUploader.upload(image);
          post.getImages().add(new PostImage(null, post, url, startIndex + validImageCount));
          validImageCount++;
        } catch (Exception e) {
          throw new BadRequestException(ErrorCode.IMAGE_UPLOAD_FAILED);
        }
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
}
