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

  public Page<Post> getPage(String keyword, String region, String sort, String direction, int page, int size) {
    // 정렬/검증 로직은 기존 PostService.getPostsWithFilters 사용
    Sort sortCondition = createSortCondition(sort, direction);
    Pageable pageable = PageRequest.of(page, size, sortCondition);
    String searchKeyword = (keyword != null && !keyword.trim().isEmpty()) ? keyword.trim() : null;
    String searchRegion = (region != null && !region.trim().isEmpty()) ? region.trim() : null;
    // 기존 findPostsWithFilters 그대로 활용
    return postRepository.findPostsWithFilters(searchKeyword, searchRegion, pageable);
  }

  public Post getById(Long postId) {
    return postRepository.findById(postId)
        .orElseThrow(() -> new NotFoundException(ErrorCode.POST_NOT_FOUND));
  }

  public Post getPostWithImages(Long postId) {
    return postRepository.findByIdWithImages(postId)
        .orElseThrow(() -> new NotFoundException(ErrorCode.POST_NOT_FOUND));
  }

  public List<Comment> loadComments(Long postId) {
    return commentRepository.findAllByPostIdWithUser(postId);
  }

  public Set<Long> findLikedPostIds(Long userId, List<Post> posts) {
    return likeRepository.findLikedPostIds(userId, posts);
  }


  public Page<Post> getUserPosts(Long userId, int page, int size) {
    var pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "id"));
    return postRepository.findByUserIdOrderByIdDesc(userId, pageable);
  }

  public Page<Post> getLikedPosts(Long userId, int page, int size) {
    var pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "id"));
    return postRepository.findLikedPostsByUserId(userId, pageable);
  }

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