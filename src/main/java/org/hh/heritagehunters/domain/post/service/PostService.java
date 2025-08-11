package org.hh.heritagehunters.domain.post.service;

import java.util.Comparator;
import java.util.List;
import java.util.Set;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.hh.heritagehunters.common.exception.BadRequestException;
import org.hh.heritagehunters.common.exception.InternalServerErrorException;
import org.hh.heritagehunters.common.exception.NotFoundException;
import org.hh.heritagehunters.common.exception.UnauthorizedException;
import org.hh.heritagehunters.common.exception.payload.ErrorCode;
import org.hh.heritagehunters.domain.oauth.entity.User;
import org.hh.heritagehunters.domain.post.dto.request.PostCreateRequestDto;
import org.hh.heritagehunters.domain.post.dto.response.PostCreateResponseDto;
import org.hh.heritagehunters.domain.post.dto.response.PostListResponseDto;
import org.hh.heritagehunters.domain.post.entity.Post;
import org.hh.heritagehunters.domain.post.entity.PostImage;
import org.hh.heritagehunters.domain.post.repository.PostRepository;
import org.hh.heritagehunters.domain.post.util.ImageUploader;
import org.hh.heritagehunters.domain.search.entity.Heritage;
import org.hh.heritagehunters.domain.search.repository.HeritageRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

@Service
@RequiredArgsConstructor
@Slf4j
public class PostService {

  private final PostRepository postRepository;
  private final HeritageRepository heritageRepository;
  private final ImageUploader imageUploader;

  public Page<PostListResponseDto> getPostResponses(
      User currentUser,
      String keyword, String region, String sort, String direction,
      int page, int size
  ) {
    Page<Post> postPage = getPostsWithFilters(keyword, region, sort, direction, page, size);

    Set<Long> likedPostIds;

    if (currentUser != null) {
      likedPostIds = postRepository.findLikedPostIds(currentUser.getId(), postPage.getContent());
    } else {
      likedPostIds = Set.of(); // 비로그인 경우
    }

    return postPage.map(post -> PostListResponseDto.from(post, likedPostIds.contains(post.getId())));
  }

  public Page<Post> getPostsWithFilters(
      String keyword,
      String region,
      String sort,
      String direction,
      int page,
      int size) {

    log.debug("게시글 조회 - keyword: {}, region: {}, sort: {}, direction: {}, page: {}, size: {}",
        keyword, region, sort, direction, page, size);

    // 입력 값 검증
    validateInputParameters(page, size, direction);

    try {
      // 정렬 조건 설정
      Sort sortCondition = createSortCondition(sort, direction);

      // 페이징 조건 설정
      Pageable pageable = PageRequest.of(page, size, sortCondition);

      // 키워드와 지역 필터가 비어있으면 null로 처리
      String searchKeyword = (keyword != null && !keyword.trim().isEmpty()) ? keyword.trim() : null;
      String searchRegion = (region != null && !region.trim().isEmpty()) ? region.trim() : null;

      // 게시글 조회
      Page<Post> posts = postRepository.findPostsWithFilters(searchKeyword, searchRegion, pageable);

      log.debug("게시글 조회 결과 - 총 {}개, 현재 페이지 {}개", posts.getTotalElements(),
          posts.getContent().size());

      return posts;

    } catch (Exception e) {
      log.error("게시글 조회 중 데이터베이스 오류 발생", e);
      throw new InternalServerErrorException(ErrorCode.DATABASE_ERROR);
    }
  }

  private void validateInputParameters(int page, int size, String direction) {
    if (page < 0) {
      throw new BadRequestException(ErrorCode.INVALID_INPUT_VALUE);
    }

    if (size <= 0 || size > 100) {
      throw new BadRequestException(ErrorCode.INVALID_INPUT_VALUE);
    }

    if (direction != null && !direction.equalsIgnoreCase("asc") && !direction.equalsIgnoreCase(
        "desc")) {
      throw new BadRequestException(ErrorCode.INVALID_INPUT_VALUE);
    }
  }

  private Sort createSortCondition(String sort, String direction) {
    Sort.Direction sortDirection =
        "asc".equalsIgnoreCase(direction) ? Sort.Direction.ASC : Sort.Direction.DESC;

    return switch (sort != null ? sort.toLowerCase() : "createdat") {
      case "viewcount" -> Sort.by(sortDirection, "viewCount");
      case "likecount" -> Sort.by(sortDirection, "likeCount");
      case "commentcount" -> Sort.by(sortDirection, "commentCount");
      case "createdat" -> Sort.by(sortDirection, "createdAt");
      default -> Sort.by(sortDirection, "createdAt");
    };
  }

  /**
   * 게시글 작성
   */
  @Transactional
  public PostCreateResponseDto createPost(User user, PostCreateRequestDto request,
      List<MultipartFile> images) {

    if (user == null) {
      throw new BadRequestException(ErrorCode.LOGIN_REQUIRED);
    }
    
    validatePostImages(images);

    // 프론트에서 위경도 검증 다 했으니, DB에서 가장 가까운 Heritage만 찾으면 됨
    Heritage heritage = null;
    if (request.getLat() != null && request.getLng() != null) {
      double lat = request.getLat();
      double lng = request.getLng();
      heritage = heritageRepository.findAll().stream()
          .min(Comparator.comparingDouble(h -> distanceBetween(
              lat, lng,
              h.getLatitude().doubleValue(),
              h.getLongitude().doubleValue()
          )))
          .orElse(null);
    }

    Post post = Post.create(user, heritage, request.getContent(), request.getLocation());
    attachImagesToPost(images, post);

    // (추가) 유물 연동이 성공했다면 포인트 부여, 유저 점수 저장 등
    if (heritage != null) {
      user.setScore(user.getScore() + 1); // 단, 영속성 컨텍스트에 user 저장 필요
    }

    postRepository.save(post);  // Post + images cascade 저장
    return new PostCreateResponseDto(post.getId(), "게시글이 성공적으로 등록되었습니다.", heritage != null ? 1 : 0);
  }

  /**
   * 이미지 업로드/연결
   */
  private void attachImagesToPost(List<MultipartFile> images, Post post) {
    if (images == null || images.isEmpty()) {
      return;
    }
    for (int i = 0; i < images.size(); i++) {
      String url = imageUploader.upload(images.get(i));
      PostImage postImage = new PostImage(null, post, url, i);
      post.getImages().add(postImage);
    }
  }

  /**
   * 이미지 기본 검증
   */
  private void validatePostImages(List<MultipartFile> images) {
    if (images == null || images.isEmpty()) {
      throw new BadRequestException(ErrorCode.EMPTY_IMAGE_FILE);
    }
    for (MultipartFile image : images) {
      if (image.isEmpty()) {
        throw new BadRequestException(ErrorCode.EMPTY_IMAGE_FILE);
      }
      if (!image.getContentType().startsWith("image/")) {
        throw new BadRequestException(ErrorCode.INVALID_IMAGE_FORMAT);
      }
      if (image.getSize() > 50 * 1024 * 1024) {
        throw new BadRequestException(ErrorCode.IMAGE_TOO_LARGE);
      }
    }
  }

  /**
   * 두 지점 사이 거리 (meter 단위)
   */
  private double distanceBetween(double lat1, double lng1, double lat2, double lng2) {
    double earthRadius = 6371000;
    double dLat = Math.toRadians(lat2 - lat1);
    double dLon = Math.toRadians(lng2 - lng1);
    double radLat1 = Math.toRadians(lat1);
    double radLat2 = Math.toRadians(lat2);
    double a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(radLat1) * Math.cos(radLat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return earthRadius * c;
  }

  /**
   * 게시글 삭제
   * @param postId 게시글 ID
   * @param user 삭제 요청한 사용자
   */
  @Transactional
  public void deletePost(Long postId, User user) {
    Post post = postRepository.findById(postId)
        .orElseThrow(() -> new NotFoundException(ErrorCode.POST_NOT_FOUND));

    // 작성자 검증
    if (!post.getUser().getId().equals(user.getId())) {
      throw new UnauthorizedException(ErrorCode.OWNER_ONLY);
    }
    
    // 게시글 삭제
    postRepository.delete(post);

    log.info("게시글 삭제 완료 = postId: {}, userId: {}", postId, user.getId());
  }
}