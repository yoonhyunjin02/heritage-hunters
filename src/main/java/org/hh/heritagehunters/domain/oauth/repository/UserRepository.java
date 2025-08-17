package org.hh.heritagehunters.domain.oauth.repository;

import java.util.List;
import java.util.Optional;
import org.hh.heritagehunters.domain.oauth.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserRepository extends JpaRepository<User, Long> {

  boolean existsByEmail(String email);        // 이메일 중복 확인
  boolean existsByNickname(String nickname);  // 닉네임 중복 확인

  Optional<User> findByEmail(String email);   // 로그인 시 유저 조회

  List<User> findTop24ByOrderByScoreDesc(); // 리더보드: 점수 내림차순 상위 24명 조회
}