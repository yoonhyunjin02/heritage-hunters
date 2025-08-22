package org.hh.heritagehunters.domain.post.application;

import java.util.Collections;
import java.util.List;
import java.util.Set;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.hh.heritagehunters.common.exception.UnauthorizedException;
import org.hh.heritagehunters.common.exception.payload.ErrorCode;
import org.hh.heritagehunters.domain.oauth.entity.User;
import org.hh.heritagehunters.domain.post.dto.request.PostCreateRequestDto;
import org.hh.heritagehunters.domain.post.dto.request.PostUpdateRequestDto;
import org.hh.heritagehunters.domain.post.dto.response.PostCreateResponseDto;
import org.hh.heritagehunters.domain.post.dto.response.PostDetailResponseDto;
import org.hh.heritagehunters.domain.post.dto.response.PostListResponseDto;
import org.hh.heritagehunters.domain.post.entity.Comment;
import org.hh.heritagehunters.domain.post.entity.Post;
import org.hh.heritagehunters.domain.post.service.ImageService;
import org.hh.heritagehunters.domain.post.service.LikeService;
import org.hh.heritagehunters.domain.post.service.PostReader;
import org.hh.heritagehunters.domain.post.service.PostWriter;
import org.springframework.data.domain.Page;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

@Slf4j
@Service
@RequiredArgsConstructor
public class PostFacade {

  private final PostReader postReader;
  private final PostWriter postWriter;
  private final ImageService imageService;
  private final LikeService likeService;

  @Transactional(readOnly = true)
  public Page<PostListResponseDto> list(User currentUser,
      String keyword, String region,
      String sort, String direction,
      int page, int size) {
    Page<Post> posts = postReader.getPage(keyword, region, sort, direction, page, size);
    return mapWithLikeFlag(posts, currentUser);
  }

  @Transactional
  public PostCreateResponseDto create(User user, PostCreateRequestDto req,
      List<MultipartFile> images) {
    // 1단계: 게시글 먼저 저장
    Post post = postWriter.create(user, req);

    // 2단계: 이미지 처리 (이 부분이 오래 걸림)
    try {
      imageService.attachImages(images, post);
    } catch (Exception e) {
      // 이미지 처리 실패해도 게시글은 유지
      log.warn("이미지 처리 실패: {}", e.getMessage());
    }

    return new PostCreateResponseDto(post.getId(), "게시글이 성공적으로 등록되었습니다.",
        post.getHeritage() != null ? 1 : 0);
  }

  @Transactional
  public PostDetailResponseDto detail(Long postId, User currentUser) {
    // 1. 게시글 + 이미지 조회 (1개 쿼리)
    Post post = postReader.getPostWithImages(postId);

    // 2. 댓글 조회 (1개 쿼리)  
    List<Comment> comments = postReader.loadComments(postId);

    // 3. 조회수 증가
    post.incrementViewCount();

    boolean isLiked = currentUser != null && likeService.isLiked(postId, currentUser.getId());
    boolean isOwner = currentUser != null && post.getUser().getId().equals(currentUser.getId());

    return PostDetailResponseDto.from(post, comments, isLiked, isOwner);
  }

  @Transactional(readOnly = true)
  public PostDetailResponseDto forEdit(Long postId, User user) {
    Post post = postReader.getPostWithImages(postId);

    // 게시글 소유자 검증
    validateOwnership(post, user);
    return PostDetailResponseDto.from(post, false, true);
  }

  @Transactional
  public void update(Long postId, User user, PostUpdateRequestDto dto,
      List<MultipartFile> newImages, List<Long> keepImageIds) {
    Post post = postReader.getById(postId);

    // 게시글 소유자 검증
    validateOwnership(post, user);

    postWriter.update(post, dto);

    if (newImages != null || keepImageIds != null) {
      try {
        imageService.updateImages(post, newImages, keepImageIds);
      } catch (Exception e) {
        log.warn("이미지 처리 실패: {}", e.getMessage());
      }
    }
  }

  @Transactional
  public void delete(Long postId, User user) {
    Post post = postReader.getById(postId);

    // 게시글 소유자 검증
    validateOwnership(post, user);

    if (post.getImages() != null && !post.getImages().isEmpty()) {
      log.info("게시글 삭제 시 S3에서 {}개의 이미지 파일을 삭제합니다.", post.getImages().size());
      post.getImages().forEach(image -> {
        try {
          imageService.deleteImage(image.getUrl());
        } catch (Exception e) {
          log.warn("게시글 삭제 중 S3 파일 삭제 실패: {}. 게시글은 DB에서 제거됩니다.", image.getUrl(), e);
        }
      });
    }

    postWriter.delete(post);
  }

  // PostFacade
  @Transactional(readOnly = true)
  public Page<PostListResponseDto> userPosts(Long targetUserId, User currentUser, int page,
      int size) {
    Page<Post> posts = postReader.getUserPosts(targetUserId, page, size);
    return mapWithLikeFlag(posts, currentUser);
  }

  @Transactional(readOnly = true)
  public Page<PostListResponseDto> likedPosts(Long targetUserId, User currentUser, int page,
      int size) {
    Page<Post> posts = postReader.getLikedPosts(targetUserId, page, size);
    return mapWithLikeFlag(posts, currentUser);
  }

  private Page<PostListResponseDto> mapWithLikeFlag(Page<Post> posts, User currentUser) {
    Set<Long> likedIds = Collections.emptySet();
    if (currentUser != null && !posts.isEmpty()) {
//      List<Long> postIds = posts.getContent().stream().map(Post::getId).toList();
      likedIds = postReader.findLikedPostIds(currentUser.getId(), posts.stream().toList());
    }
    Set<Long> finalLiked = likedIds; // effectively final
    return posts.map(p -> PostListResponseDto.from(p, finalLiked.contains(p.getId())));
  }

  private void validateOwnership(Post post, User user) {
    if (!post.getUser().getId().equals(user.getId())) {
      throw new UnauthorizedException(ErrorCode.OWNER_ONLY);
    }
  }

}