package org.hh.heritagehunters.domain.post.application;

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

  /**
   * 게시글 목록을 조회합니다
   * @param currentUser 현재 로그인한 사용자
   * @param keyword 검색 키워드
   * @param region 지역 필터
   * @param sort 정렬 기준
   * @param direction 정렬 방향
   * @param page 페이지 번호
   * @param size 페이지 크기
   * @return 게시글 목록 페이지
   */
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

  /**
   * 새로운 게시글을 생성합니다
   * @param user 게시글 작성자
   * @param req 게시글 생성 요청 데이터
   * @param images 업로드할 이미지 파일 목록
   * @return 게시글 생성 결과
   */
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

  /**
   * 게시글 상세 정보를 조회합니다
   * @param postId 조회할 게시글 ID
   * @param currentUser 현재 로그인한 사용자
   * @return 게시글 상세 정보
   */
  @Transactional
  public PostDetailResponseDto detail(Long postId, User currentUser) {
    Post post = postReader.getPostWithImages(postId);

    // 조회수 증가
    post.incrementViewCount();

    boolean isLiked = currentUser != null && likeService.isLiked(postId, currentUser.getId());
    boolean isOwner = currentUser != null && post.getUser().getId().equals(currentUser.getId());

    return PostDetailResponseDto.from(post, isLiked, isOwner);
  }

  /**
   * 게시글 수정을 위한 데이터를 조회합니다
   * @param postId 수정할 게시글 ID
   * @param user 수정 요청자
   * @return 수정용 게시글 데이터
   */
  @Transactional(readOnly = true)
  public PostDetailResponseDto forEdit(Long postId, User user) {
    Post post = postReader.getPostWithImages(postId);
    if (!post.getUser().getId().equals(user.getId())) {
      throw new UnauthorizedException(ErrorCode.OWNER_ONLY);
    }

    return PostDetailResponseDto.from(post, false, true);
  }

  /**
   * 게시글 기본 정보를 수정합니다
   * @param postId 수정할 게시글 ID
   * @param user 수정 요청자
   * @param dto 게시글 수정 데이터
   */
  @Transactional
  public void update(Long postId, User user, PostUpdateRequestDto dto) {
    Post post = postReader.getById(postId);
    if (!post.getUser().getId().equals(user.getId())) {
      throw new UnauthorizedException(ErrorCode.OWNER_ONLY);
    }
    postWriter.update(post, dto);
  }

  /**
   * 게시글과 이미지를 함께 수정합니다
   * @param postId 수정할 게시글 ID
   * @param user 수정 요청자
   * @param dto 게시글 수정 데이터
   * @param newImages 새로 업로드할 이미지 목록
   * @param keepImageIds 유지할 기존 이미지 ID 목록
   */
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

  /**
   * 게시글을 삭제합니다
   * @param postId 삭제할 게시글 ID
   * @param user 삭제 요청자
   */
  @Transactional
  public void delete(Long postId, User user) {
    Post post = postReader.getById(postId);
    if (!post.getUser().getId().equals(user.getId())) {
      throw new UnauthorizedException(ErrorCode.OWNER_ONLY);
    }
    postWriter.delete(post);
  }

  /**
   * 게시글 좋아요를 토글합니다
   * @param postId 게시글 ID
   * @param user 사용자
   * @return 좋아요 상태 (추가되면 true, 취소되면 false)
   */
  @Transactional
  public boolean toggleLike(Long postId, User user) {
    return likeService.toggle(postId, user);
  }

  /**
   * 게시글에 댓글을 추가합니다
   * @param postId 게시글 ID
   * @param user 댓글 작성자
   * @param dto 댓글 생성 데이터
   */
  @Transactional
  public void addComment(Long postId, User user, CommentCreateRequestDto dto) {
    commentService.add(postId, user, dto);
  }

}