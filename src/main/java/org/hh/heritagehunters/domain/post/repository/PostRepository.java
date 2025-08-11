package org.hh.heritagehunters.domain.post.repository;

import java.util.List;
import java.util.Optional;
import java.util.Set;
import org.hh.heritagehunters.domain.post.entity.Post;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface PostRepository extends JpaRepository<Post, Long> {

  @Query("SELECT p FROM Post p " +
         "LEFT JOIN FETCH p.user " +
         "LEFT JOIN FETCH p.heritage " +
         "WHERE (:keyword IS NULL OR :keyword = '' OR " +
         "       LOWER(p.content) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
         "       LOWER(p.heritage.name) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
         "       LOWER(p.location) LIKE LOWER(CONCAT('%', :keyword, '%'))) " +
         "AND (:region IS NULL OR :region = '' OR p.heritage.region = :region)")
  Page<Post> findPostsWithFilters(@Param("keyword") String keyword,
                                  @Param("region") String region,
                                  Pageable pageable);

  @Query("SELECT l.post.id FROM Like l WHERE l.user.id = :userId AND l.post IN :posts")
  Set<Long> findLikedPostIds(@Param("userId") Long userId, @Param("posts") List<Post> posts);

  @Query("SELECT p FROM Post p " +
      "LEFT JOIN FETCH p.user " +
      "LEFT JOIN FETCH p.heritage " +
      "LEFT JOIN FETCH p.images " +
      "LEFT JOIN FETCH p.comments c " +
      "LEFT JOIN FETCH c.user " +
      "WHERE p.id = :postId")
  Optional<Post> findByIdWithDetails(@Param("postId") Long postId);

  @Query("SELECT COUNT(l) > 0 FROM Like l WHERE l.userId = :userId AND l.postId = :postId")
  boolean existsByUserIdAndPostId(@Param("userId") Long userId, @Param("postId") Long postId);
}
