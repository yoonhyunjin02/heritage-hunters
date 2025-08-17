package org.hh.heritagehunters.domain.oauth.repository;

import org.hh.heritagehunters.domain.oauth.entity.User;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;

import java.lang.reflect.Field;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;
import java.util.stream.IntStream;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
class UserRepositoryTest {

  @Autowired
  UserRepository userRepository;

  @Autowired
  TestEntityManager em;

  // ---------- 헬퍼: 필요한 필드만 리플렉션으로 세팅 ----------
  private static <T> void setField(T target, String name, Object value) {
    try {
      Field f = target.getClass().getDeclaredField(name);
      f.setAccessible(true);
      f.set(target, value);
    } catch (NoSuchFieldException e) {
      throw new IllegalStateException("엔티티에 '" + name + "' 필드가 없습니다. 테스트 헬퍼를 엔티티에 맞게 수정하세요.", e);
    } catch (IllegalAccessException e) {
      throw new RuntimeException(e);
    }
  }

  private User newUser(String email, String nickname, int score) {
    try {
      User u = User.class.getDeclaredConstructor().newInstance();
      setField(u, "email", email);
      setField(u, "nickname", nickname);
      setField(u, "score", score);
      // 필요시 추가 필드 세팅 (ex. role, provider 등)
      return u;
    } catch (ReflectiveOperationException e) {
      throw new RuntimeException("User 인스턴스 생성 실패", e);
    }
  }

  private User persist(String email, String nickname, int score) {
    User u = newUser(email, nickname, score);
    em.persist(u);
    em.flush();
    return u;
  }

  // ---------- 테스트 ----------

  @Test
  @DisplayName("existsByEmail / existsByNickname: 존재 여부 반환")
  void exists_checks() {
    persist("a@ex.com", "alpha", 10);

    assertThat(userRepository.existsByEmail("a@ex.com")).isTrue();
    assertThat(userRepository.existsByEmail("b@ex.com")).isFalse();

    assertThat(userRepository.existsByNickname("alpha")).isTrue();
    assertThat(userRepository.existsByNickname("beta")).isFalse();
  }

  @Test
  @DisplayName("findByEmail: 존재하면 Optional.present, 없으면 Optional.empty")
  void findByEmail_present_or_empty() {
    persist("who@ex.com", "who", 1);

    Optional<User> found = userRepository.findByEmail("who@ex.com");
    assertThat(found).isPresent();
    assertThat(found.get()).extracting("email").isEqualTo("who@ex.com");

    assertThat(userRepository.findByEmail("none@ex.com")).isNotPresent();
  }

  @Test
  @DisplayName("findTop24ByOrderByScoreDesc: 상위 24명만 점수 내림차순")
  void top24_by_score_desc() {
    // 30명 생성 (점수: 0..29)
    IntStream.range(0, 30).forEach(i ->
        persist("u" + i + "@ex.com", "n" + i, i)
    );

    List<User> top = userRepository.findTop24ByOrderByScoreDesc();

    assertThat(top).hasSize(24);
    // 내림차순 정렬 확인
    List<Integer> scores = top.stream().map(u -> {
      try {
        Field f = u.getClass().getDeclaredField("score");
        f.setAccessible(true);
        return (Integer) f.get(u);
      } catch (Exception e) {
        throw new RuntimeException(e);
      }
    }).toList();

    assertThat(scores)
        .isSortedAccordingTo(Comparator.reverseOrder())
        .first().isEqualTo(29);   // 최고 점수
    assertThat(scores.get(23)).isEqualTo(6);   // 24번째는 6 (29..6)
  }

  @Test
  @DisplayName("findRankByEmail: 특정 사용자의 점수 기준 순위(더 높은 점수 수 + 1)")
  void rank_by_email() {
    // 점수: 50, 40, 30, 20, 10
    persist("s50@ex.com", "n50", 50);
    persist("s40@ex.com", "n40", 40);
    persist("s30@ex.com", "n30", 30);
    persist("s20@ex.com", "n20", 20);
    persist("s10@ex.com", "n10", 10);

    int r50 = userRepository.findRankByEmail("s50@ex.com"); // 1위
    int r30 = userRepository.findRankByEmail("s30@ex.com"); // 3위
    int r10 = userRepository.findRankByEmail("s10@ex.com"); // 5위

    assertThat(r50).isEqualTo(1);
    assertThat(r30).isEqualTo(3);
    assertThat(r10).isEqualTo(5);
  }
}
