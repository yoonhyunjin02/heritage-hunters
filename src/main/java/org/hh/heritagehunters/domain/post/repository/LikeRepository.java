package org.hh.heritagehunters.domain.post.repository;

import java.util.List;
import java.util.Set;
import org.hh.heritagehunters.domain.post.entity.Like;
import org.hh.heritagehunters.domain.post.entity.LikeId;
import org.hh.heritagehunters.domain.post.entity.Post;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface LikeRepository extends JpaRepository<Like, LikeId> {

  boolean existsByUserIdAndPostId(Long userId, Long postId);

  void deleteByUserIdAndPostId(Long userId, Long postId);

  @Query("select l.post.id from Like l where l.user.id = :userId and l.post in :posts")
  Set<Long> findLikedPostIds(@Param("userId") Long userId, @Param("posts") List<Post> posts);

}
