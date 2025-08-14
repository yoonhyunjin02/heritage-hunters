package org.hh.heritagehunters.domain.post.service;

import java.util.List;
import java.util.Set;
import lombok.RequiredArgsConstructor;
import org.hh.heritagehunters.common.exception.NotFoundException;
import org.hh.heritagehunters.common.exception.payload.ErrorCode;
import org.hh.heritagehunters.domain.post.entity.Comment;
import org.hh.heritagehunters.domain.post.entity.Post;
import org.hh.heritagehunters.domain.post.repository.CommentRepository;
import org.hh.heritagehunters.domain.post.repository.LikeRepository;
import org.hh.heritagehunters.domain.post.repository.PostRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 게시글 조회 서비스
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PostReader {

  private final PostRepository postRepository;
  private final CommentRepository commentRepository;
  private final LikeRepository likeRepository;

  /**
   * 게시글 목록을 페이지네이션으로 조회합니다
   * @param keyword 검색 키워드
   * @param region 지역 필터
   * @param sort 정렬 기준
   * @param direction 정렬 방향
   * @param page 페이지 번호
   * @param size 페이지 크기
   * @return 게시글 목록 페이지
   */
  public Page<Post> getPage(String keyword, String region, String sort, String direction, int page, int size) {
    // 정렬/검증 로직은 기존 PostService.getPostsWithFilters 사용
    Sort sortCondition = createSortCondition(sort, direction);
    Pageable pageable = PageRequest.of(page, size, sortCondition);
    String searchKeyword = (keyword != null && !keyword.trim().isEmpty()) ? keyword.trim() : null;
    String searchRegion = (region != null && !region.trim().isEmpty()) ? region.trim() : null;
    // 기존 findPostsWithFilters 그대로 활용
    return postRepository.findPostsWithFilters(searchKeyword, searchRegion, pageable);
  }

  /**
   * ID로 게시글을 조회합니다
   * @param postId 게시글 ID
   * @return 게시글 엔티티
   */
  public Post getById(Long postId) {
    return postRepository.findById(postId)
        .orElseThrow(() -> new NotFoundException(ErrorCode.POST_NOT_FOUND));
  }

  /**
   * 이미지를 포함하여 게시글 정보를 조회합니다
   * @param postId 게시글 ID
   * @return 이미지가 포함된 게시글 엔티티
   */
  public Post getPostWithImages(Long postId) {
    return postRepository.findByIdWithImages(postId)
        .orElseThrow(() -> new NotFoundException(ErrorCode.POST_NOT_FOUND));
  }

  /**
   * 게시글의 댓글 목록을 조회합니다
   * @param postId 게시글 ID
   * @return 댓글 목록
   */
  public List<Comment> loadComments(Long postId) {
    return commentRepository.findAllByPostIdWithUser(postId);
  }

  /**
   * 사용자가 좋아요를 누른 게시글 ID 목록을 조회합니다
   * @param userId 사용자 ID
   * @param posts 게시글 목록
   * @return 좋아요를 누른 게시글 ID 집합
   */
  public Set<Long> findLikedPostIds(Long userId, List<Post> posts) {
    return likeRepository.findLikedPostIds(userId, posts);
  }

  /**
   * 정렬 조건을 생성합니다
   * @param sort 정렬 기준
   * @param direction 정렬 방향
   * @return Spring Data Sort 객체
   */
  private Sort createSortCondition(String sort, String direction) {
    Sort.Direction dir = "asc".equalsIgnoreCase(direction) ? Sort.Direction.ASC : Sort.Direction.DESC;
    return switch (sort != null ? sort.toLowerCase() : "createdat") {
      case "viewcount" -> Sort.by(dir, "viewCount");
      case "likecount" -> Sort.by(dir, "likeCount");
      case "commentcount" -> Sort.by(dir, "commentCount");
      case "createdat" -> Sort.by(dir, "createdAt");
      default -> Sort.by(dir, "createdAt");
    };
  }
}