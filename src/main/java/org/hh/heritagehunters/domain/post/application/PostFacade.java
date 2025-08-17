package org.hh.heritagehunters.domain.post.application;

import java.util.Collections;
import java.util.List;
import java.util.Set;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.hh.heritagehunters.common.exception.UnauthorizedException;
import org.hh.heritagehunters.common.exception.payload.ErrorCode;
import org.hh.heritagehunters.domain.oauth.entity.User;
import org.hh.heritagehunters.domain.post.dto.request.CommentCreateRequestDto;
import org.hh.heritagehunters.domain.post.dto.request.PostCreateRequestDto;
import org.hh.heritagehunters.domain.post.dto.request.PostUpdateRequestDto;
import org.hh.heritagehunters.domain.post.dto.response.PostCreateResponseDto;
import org.hh.heritagehunters.domain.post.dto.response.PostDetailResponseDto;
import org.hh.heritagehunters.domain.post.dto.response.PostListResponseDto;
import org.hh.heritagehunters.domain.post.entity.Post;
import org.hh.heritagehunters.domain.post.service.CommentService;
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
  private final CommentService commentService;

  @Transactional(readOnly = true)
  public Page<PostListResponseDto> list(User currentUser,
      String keyword, String region,
      String sort, String direction,
      int page, int size) {
    Page<Post> posts = postReader.getPage(keyword, region, sort, direction, page, size);
    Set<Long> likedIds = (currentUser == null)
        ? Set.of()
        : postReader.findLikedPostIds(currentUser.getId(), posts.getContent());
    return posts.map(p -> PostListResponseDto.from(p, likedIds.contains(p.getId())));
  }

  @Transactional(readOnly = true)
  public PostListResponseDto toListItem(Post post, User currentUser) {
    // 현재 list(...)와 동일한 로직을 재사용하기 위해,
    // '좋아요 여부' 판별이 필요하면 currentUser를 받아 likedIds 조회 대신 단건 exists를 피하세요.
    boolean liked = false;
    if (currentUser != null) {
      // 성능을 위해 단건 exists 대신, 호출부에서 likedIds 배치 조회를 넘겨도 됨
      liked = likeService.isLiked(post.getId(), currentUser.getId());
    }
    return PostListResponseDto.from(post, liked);
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
    Post post = postReader.getPostWithImages(postId);

    // 조회수 증가
    post.incrementViewCount();

    boolean isLiked = currentUser != null && likeService.isLiked(postId, currentUser.getId());
    boolean isOwner = currentUser != null && post.getUser().getId().equals(currentUser.getId());

    return PostDetailResponseDto.from(post, isLiked, isOwner);
  }

  @Transactional(readOnly = true)
  public PostDetailResponseDto forEdit(Long postId, User user) {
    Post post = postReader.getPostWithImages(postId);
    if (!post.getUser().getId().equals(user.getId())) {
      throw new UnauthorizedException(ErrorCode.OWNER_ONLY);
    }

    return PostDetailResponseDto.from(post, false, true);
  }

  @Transactional
  public void update(Long postId, User user, PostUpdateRequestDto dto) {
    Post post = postReader.getById(postId);
    if (!post.getUser().getId().equals(user.getId())) {
      throw new UnauthorizedException(ErrorCode.OWNER_ONLY);
    }
    postWriter.update(post, dto);
  }

  @Transactional
  public void update(Long postId, User user, PostUpdateRequestDto dto, 
                     List<MultipartFile> newImages, List<Long> keepImageIds) {
    Post post = postReader.getById(postId);
    if (!post.getUser().getId().equals(user.getId())) {
      throw new UnauthorizedException(ErrorCode.OWNER_ONLY);
    }
    
    // 기본 정보 수정
    postWriter.update(post, dto);
    
    // 이미지 처리
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
    if (!post.getUser().getId().equals(user.getId())) {
      throw new UnauthorizedException(ErrorCode.OWNER_ONLY);
    }
    postWriter.delete(post);
  }

  @Transactional
  public boolean toggleLike(Long postId, User user) {
    return likeService.toggle(postId, user);
  }

  @Transactional
  public void addComment(Long postId, User user, CommentCreateRequestDto dto) {
    commentService.add(postId, user, dto);
  }


  // PostFacade
  @Transactional(readOnly = true)
  public Page<PostListResponseDto> userPosts(Long targetUserId, User currentUser, int page, int size) {
    Page<Post> posts = postReader.getUserPosts(targetUserId, page, size);
    return mapWithLikeFlag(posts, currentUser);
  }

  @Transactional(readOnly = true)
  public Page<PostListResponseDto> likedPosts(Long targetUserId, User currentUser, int page, int size) {
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

}