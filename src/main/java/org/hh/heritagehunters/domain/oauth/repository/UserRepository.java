package org.hh.heritagehunters.domain.oauth.repository;

import java.util.List;
import java.util.Optional;
import org.hh.heritagehunters.domain.oauth.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface UserRepository extends JpaRepository<User, Long> {

  boolean existsByEmail(String email);        // 이메일 중복 확인
  boolean existsByNickname(String nickname);  // 닉네임 중복 확인

  Optional<User> findByEmail(String email);   // 로그인 시 유저 조회

  List<User> findTop24ByOrderByScoreDesc();   // 상위 24명

  // 내 순위만 가져오기
  @Query(value = """
        SELECT COUNT(*) + 1
        FROM users u
        WHERE u.score > (SELECT u2.score FROM users u2 WHERE u2.email = :email)
        """, nativeQuery = true)
  int findRankByEmail(@Param("email") String email);
}