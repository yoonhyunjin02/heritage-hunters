package org.hh.heritagehunters.domain.post.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.hh.heritagehunters.common.exception.BadRequestException;
import org.hh.heritagehunters.common.exception.InternalServerErrorException;
import org.hh.heritagehunters.common.exception.payload.ErrorCode;
import org.hh.heritagehunters.domain.post.entity.Post;
import org.hh.heritagehunters.domain.post.repository.PostRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class PostService {

  private final PostRepository postRepository;

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
}
