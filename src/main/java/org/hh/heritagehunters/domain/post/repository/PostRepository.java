package org.hh.heritagehunters.domain.post.repository;

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

  @Query("SELECT COUNT(p) FROM Post p " +
         "WHERE (:keyword IS NULL OR :keyword = '' OR " +
         "       LOWER(p.content) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
         "       LOWER(p.heritage.name) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
         "       LOWER(p.location) LIKE LOWER(CONCAT('%', :keyword, '%'))) " +
         "AND (:region IS NULL OR :region = '' OR p.heritage.region = :region)")
  long countPostsWithFilters(@Param("keyword") String keyword,
                            @Param("region") String region);

}
