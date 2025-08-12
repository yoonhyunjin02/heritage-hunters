package org.hh.heritagehunters.domain.post.application;

import java.util.List;
import java.util.Set;
import lombok.RequiredArgsConstructor;
import org.hh.heritagehunters.common.exception.UnauthorizedException;
import org.hh.heritagehunters.common.exception.payload.ErrorCode;
import org.hh.heritagehunters.domain.oauth.entity.User;
import org.hh.heritagehunters.domain.post.dto.request.CommentCreateRequestDto;
import org.hh.heritagehunters.domain.post.dto.request.PostCreateRequestDto;
import org.hh.heritagehunters.domain.post.dto.request.PostUpdateRequestDto;
import org.hh.heritagehunters.domain.post.dto.response.PostCreateResponseDto;
import org.hh.heritagehunters.domain.post.dto.response.PostDetailResponseDto;
import org.hh.heritagehunters.domain.post.dto.response.PostListResponseDto;
import org.hh.heritagehunters.domain.post.entity.Comment;
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

  @Transactional
  public PostCreateResponseDto create(User user, PostCreateRequestDto req,
      List<MultipartFile> images) {
    Post post = postWriter.create(user, req);
    imageService.attachImages(images, post);
    return new PostCreateResponseDto(post.getId(), "게시글이 성공적으로 등록되었습니다.",
        post.getHeritage() != null ? 1 : 0);
  }

  @Transactional(readOnly = true)
  public PostDetailResponseDto detail(Long postId, User currentUser) {
    Post post = postReader.getDetailWithImages(postId);
    boolean isLiked = currentUser != null && likeService.isLiked(postId, currentUser.getId());
    boolean isOwner = currentUser != null && post.getUser().getId().equals(currentUser.getId());
    return PostDetailResponseDto.from(post, isLiked, isOwner);
  }

  @Transactional(readOnly = true)
  public PostDetailResponseDto forEdit(Long postId, User user) {
    Post post = postReader.getForEditWithImages(postId);
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

  @Transactional(readOnly = true)
  public List<Comment> listComments(Long postId) {
    return postReader.loadComments(postId);
  }
}