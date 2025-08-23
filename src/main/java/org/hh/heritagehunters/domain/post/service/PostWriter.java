package org.hh.heritagehunters.domain.post.service;

import java.time.LocalDateTime;
import lombok.RequiredArgsConstructor;
import org.hh.heritagehunters.common.exception.BadRequestException;
import org.hh.heritagehunters.common.exception.payload.ErrorCode;
import org.hh.heritagehunters.domain.oauth.entity.User;
import org.hh.heritagehunters.domain.oauth.repository.UserRepository;
import org.hh.heritagehunters.domain.post.dto.request.PostCreateRequestDto;
import org.hh.heritagehunters.domain.post.dto.request.PostUpdateRequestDto;
import org.hh.heritagehunters.domain.post.entity.Post;
import org.hh.heritagehunters.domain.post.repository.PostRepository;
import org.hh.heritagehunters.domain.profile.entity.UserStamp;
import org.hh.heritagehunters.domain.profile.repository.UserStampRepository;
import org.hh.heritagehunters.domain.search.entity.Heritage;
import org.hh.heritagehunters.domain.search.repository.HeritageRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional
public class PostWriter {


  private final PostRepository postRepository;
  private final HeritageRepository heritageRepository;
  private final UserRepository userRepository;
  private final UserStampRepository userStampRepository;

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

    Heritage nearest = findNearestHeritage(request.getLat(), request.getLng());

    Post post = Post.create(user, nearest, request.getContent(), request.getLocation());
    // 유물 연동 시 스코어 +1 및 우표 획득
    if (nearest != null) {
      Integer s = user.getScore();
      user.setScore((s == null ? 0 : s) + 1);
      userRepository.save(user); // User 점수 변경사항 저장
      
      // 우표 중복 체크 및 생성
      createStampIfNotExists(user.getId(), nearest.getId());
    }
    return postRepository.save(post);
  }

  /**
   * 게시글 정보를 수정합니다
   *
   * @param post 수정할 게시글 엔티티
   * @param dto  수정 데이터
   */
  public void update(Post post, PostUpdateRequestDto dto) {
    post.setContent(dto.getContent());
    post.setLocation(dto.getLocation());
  }

  /**
   * 게시글 본문만 변경합니다.
   */
  public void updateContent(Post post, String newContent) {
    if (newContent == null || newContent.trim().isEmpty()) {
      throw new BadRequestException(ErrorCode.INVALID_INPUT_VALUE);
    }
    post.setContent(newContent);
    postRepository.save(post);
  }


  /**
   * 게시글을 삭제합니다
   *
   * @param post 삭제할 게시글 엔티티
   */
  public void delete(Post post) {
    // Heritage 연동 게시글이었다면 점수 차감 및 우표 삭제
    if (post.getHeritage() != null) {
      User user = post.getUser();
      
      // 점수 차감 (-1점)
      Integer currentScore = user.getScore();
      user.setScore(Math.max(0, (currentScore == null ? 0 : currentScore) - 1));
      userRepository.save(user);
      
      // 해당 Heritage의 다른 게시글이 있는지 확인
      boolean hasOtherPosts = postRepository.existsByUserAndHeritageAndIdNot(user, post.getHeritage(), post.getId());
      
      // 다른 게시글이 없으면 우표도 삭제
      if (!hasOtherPosts) {
        // 기존 우표 목록에서 해당 Heritage 우표 찾아서 삭제
        userStampRepository.findObtainedStamps(user.getId())
            .stream()
            .filter(stamp -> stamp.getId().equals(post.getHeritage().getId()))
            .findFirst()
            .ifPresent(stamp -> {
              UserStamp stampToDelete = new UserStamp(user.getId(), stamp.getId(), stamp.getEarnedAt());
              userStampRepository.delete(stampToDelete);
            });
      }
    }
    
    postRepository.delete(post);
  }

  /**
   * 지정된 좌표에서 200m 이내의 가장 가까운 문화유산을 찾습니다
   *
   * @param lat 위도
   * @param lng 경도
   * @return 200m 이내의 가장 가까운 문화유산 (없으면 null)
   */
  private Heritage findNearestHeritage(Double lat, Double lng) {
    if (lat == null || lng == null) {
      return null;
    }

    final double MAX_DISTANCE_METERS = 200.0;

    return heritageRepository.findNearestHeritages(lat, lng, MAX_DISTANCE_METERS);
  }

  /**
   * 우표가 존재하지 않으면 새로 생성합니다
   *
   * @param userId 사용자 ID
   * @param heritageId 문화유산 ID
   */
  private void createStampIfNotExists(Long userId, Long heritageId) {
    // 기존 우표 목록에서 해당 Heritage 우표가 있는지 확인
    boolean hasStamp = userStampRepository.findObtainedStamps(userId)
        .stream()
        .anyMatch(stamp -> stamp.getId().equals(heritageId));
    
    if (!hasStamp) {
      UserStamp newStamp = new UserStamp(userId, heritageId, LocalDateTime.now());
      userStampRepository.save(newStamp);
    }
  }

}