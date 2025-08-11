package org.hh.heritagehunters.domain.post.repository;

import org.hh.heritagehunters.domain.post.entity.Like;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface LikeRepository extends JpaRepository<Like, Long> {

  boolean existsByUserIdAndPostId(Long userId, Long postId);

  void deleteByUserIdAndPostId(Long userId, Long postId);

  @Query("SELECT COUNT(l) FROM Like l WHERE l.postId = :postId")
  Integer countByPostId(@Param("postId") Long postId);

}
