package org.hh.heritagehunters.domain.post.repository;

import java.util.Optional;
import org.hh.heritagehunters.domain.post.entity.Post;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface PostRepository extends JpaRepository<Post, Long> {

  /**
   * 키워드와 지역 필터로 게시글 목록을 조회합니다
   * @param keyword 검색 키워드 (내용, 문화유산명, 위치에서 검색)
   * @param region 지역 필터
   * @param pageable 페이지네이션 정보
   * @return 필터링된 게시글 목록
   */
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

  /**
   * 이미지를 포함하여 게시글을 조회합니다
   * @param postId 게시글 ID
   * @return 이미지가 포함된 게시글 Optional
   */
  @Query("""
        select p from Post p
          left join fetch p.user
          left join fetch p.heritage
          left join fetch p.images
        where p.id = :postId
      """)
  Optional<Post> findByIdWithImages(@Param("postId") Long postId);
}
