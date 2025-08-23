package org.hh.heritagehunters.domain.post.service;

import java.time.LocalDateTime;
import lombok.RequiredArgsConstructor;
import org.hh.heritagehunters.domain.oauth.entity.User;
import org.hh.heritagehunters.domain.oauth.repository.UserRepository;
import org.hh.heritagehunters.domain.post.repository.PostRepository;
import org.hh.heritagehunters.domain.profile.entity.UserStamp;
import org.hh.heritagehunters.domain.profile.repository.UserStampRepository;
import org.hh.heritagehunters.domain.search.entity.Heritage;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class RewardService {

  private final UserRepository userRepository;
  private final UserStampRepository userStampRepository;
  private final PostRepository postRepository;

  /**
   * Heritage 연동 게시글 작성 시 보상 지급 (점수 +1, 우표 생성)
   */
  public void grantReward(User user, Heritage heritage) {
    increaseUserScore(user);
    createStampIfNotExists(user.getId(), heritage.getId());
  }

  /**
   * Heritage 연동 게시글 삭제 시 보상 회수 (점수 -1, 조건부 우표 삭제)
   */
  public void revokeReward(User user, Heritage heritage, Long excludePostId) {
    decreaseUserScore(user);
    
    // 해당 Heritage의 다른 게시글이 있는지 확인
    boolean hasOtherPosts = postRepository.existsByUserAndHeritageAndIdNot(user, heritage, excludePostId);
    
    // 다른 게시글이 없으면 우표도 삭제
    if (!hasOtherPosts) {
      deleteStamp(user.getId(), heritage.getId());
    }
  }

  private void increaseUserScore(User user) {
    Integer currentScore = user.getScore();
    user.setScore((currentScore == null ? 0 : currentScore) + 1);
    userRepository.save(user);
  }

  private void decreaseUserScore(User user) {
    Integer currentScore = user.getScore();
    user.setScore(Math.max(0, (currentScore == null ? 0 : currentScore) - 1));
    userRepository.save(user);
  }

  private void createStampIfNotExists(Long userId, Long heritageId) {
    boolean hasStamp = userStampRepository.findObtainedStamps(userId)
        .stream()
        .anyMatch(stamp -> stamp.getId().equals(heritageId));
    
    if (!hasStamp) {
      UserStamp newStamp = new UserStamp(userId, heritageId, LocalDateTime.now());
      userStampRepository.save(newStamp);
    }
  }

  private void deleteStamp(Long userId, Long heritageId) {
    userStampRepository.findObtainedStamps(userId)
        .stream()
        .filter(stamp -> stamp.getId().equals(heritageId))
        .findFirst()
        .ifPresent(stamp -> {
          UserStamp stampToDelete = new UserStamp(userId, stamp.getId(), stamp.getEarnedAt());
          userStampRepository.delete(stampToDelete);
        });
  }
}