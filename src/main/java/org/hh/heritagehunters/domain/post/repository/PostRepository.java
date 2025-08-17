package org.hh.heritagehunters.domain.post.repository;

import java.util.List;
import java.util.Optional;
import java.util.Set;
import org.hh.heritagehunters.domain.post.entity.Post;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
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


  /**
   * ✅ 수정: comments fetch-join 제거, 이미지만 fetch-join (기존 findByIdWithDetails 대체)
   */
  @Query("""
        select p from Post p
          left join fetch p.user
          left join fetch p.heritage
          left join fetch p.images
        where p.id = :postId
      """)
  Optional<Post> findByIdWithImages(@Param("postId") Long postId);

  @Query("SELECT COUNT(l) > 0 FROM Like l WHERE l.userId = :userId AND l.postId = :postId")
  boolean existsByUserIdAndPostId(@Param("userId") Long userId, @Param("postId") Long postId);

  // 특정 유저가 작성한 게시물 목록 (최신순)
  @EntityGraph(attributePaths = {"user", "heritage"})
  @Query("select p from Post p where p.user.id = :userId order by p.id desc")
  Page<Post> findByUserIdOrderByIdDesc(@Param("userId") Long userId, Pageable pageable);

  // 특정 유저가 '좋아요'한 게시물 목록 (최신순)
  @EntityGraph(attributePaths = {"user", "heritage"})
  @Query("select l.post from Like l where l.user.id = :userId order by l.post.id desc")
  Page<Post> findLikedPostsByUserId(@Param("userId") Long userId, Pageable pageable);

  // 스탬프 계산: 유저가 게시한 Heritage id 목록 (distinct)
  @Query("select distinct p.heritage.id from Post p where p.user.id = :userId")
  List<Long> findDistinctHeritageIdsByUserId(@Param("userId") Long userId);

  // 스탬프 계산: Heritage별 최초 획득일
  @Query("""
        select p.heritage.id as heritageId, min(p.createdAt) as obtainedAt
          from Post p
         where p.user.id = :userId
         group by p.heritage.id
      """)
  List<Object[]> findFirstObtainedAtByHeritage(@Param("userId") Long userId);

  // 목록 그리드 썸네일(첫 이미지) 일괄 조회
  @Query("""
        select i.post.id as postId, i.url as url
          from PostImage i
         where i.post.id in :postIds
           and i.orderIndex = 0
      """)
  List<Object[]> findFirstImageUrlsFor(@Param("postIds") List<Long> postIds);


//  @Query(
//      value = """
//        select
//          p.id as postId,
//          p.title as title,
//          p.thumbnailUrl as thumbnailUrl,
//          p.createdAt as createdAt,
//
//          u.id as authorId,
//          u.nickname as authorNickname,
//
//          h.id as heritageId,
//          h.name as heritageName,
//
//          (select count(l) from Like l where l.post = p) as likeCount,
//          (select count(c) from Comment c where c.post = p) as commentCount
//        from Post p
//          join p.user u
//          join p.heritage h
//        where u.id = :userId
//        order by p.id desc
//      """,
//      countQuery = """
//        select count(p)
//        from Post p
//        where p.user.id = :userId
//      """
//  )
//  Page<PostListProjection> findPostListProjectionByUserId(
//      @Param("userId") Long userId,
//      Pageable pageable
//  );
}
