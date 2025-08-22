package org.hh.heritagehunters.domain.post.service;

import lombok.RequiredArgsConstructor;
import org.hh.heritagehunters.common.exception.BadRequestException;
import org.hh.heritagehunters.common.exception.payload.ErrorCode;
import org.hh.heritagehunters.domain.oauth.entity.User;
import org.hh.heritagehunters.domain.post.dto.request.PostCreateRequestDto;
import org.hh.heritagehunters.domain.post.dto.request.PostUpdateRequestDto;
import org.hh.heritagehunters.domain.post.entity.Post;
import org.hh.heritagehunters.domain.post.repository.PostRepository;
import org.hh.heritagehunters.domain.search.entity.Heritage;
import org.hh.heritagehunters.domain.post.infrastructure.external.HeritageGeoService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional
public class PostWriter {


  private final PostRepository postRepository;
  private final HeritageGeoService heritageGeoService;
  private final RewardService rewardService;

  /**
   * 새로운 게시글을 생성합니다
   *
   * @param user    게시글 작성자
   * @param request 게시글 생성 요청 데이터
   * @return 생성된 게시글 엔티티
   */
  public Post create(User user, PostCreateRequestDto request) {
    if (user == null) {
      throw new BadRequestException(ErrorCode.LOGIN_REQUIRED);
    }

    Heritage nearest = heritageGeoService.findNearestHeritage(request.getLat(), request.getLng());

    Post post = Post.create(user, nearest, request.getContent(), request.getLocation());
    
    if (nearest != null) {
      rewardService.grantReward(user, nearest);
    }
    return postRepository.save(post);
  }

  public void update(Post post, PostUpdateRequestDto dto) {
    post.setContent(dto.getContent());
    post.setLocation(dto.getLocation());
  }

  /**
   * 게시글을 삭제합니다
   *
   * @param post 삭제할 게시글 엔티티
   */
  public void delete(Post post) {
    if (post.getHeritage() != null) {
      rewardService.revokeReward(post.getUser(), post.getHeritage(), post.getId());
    }
    
    postRepository.delete(post);
  }
}