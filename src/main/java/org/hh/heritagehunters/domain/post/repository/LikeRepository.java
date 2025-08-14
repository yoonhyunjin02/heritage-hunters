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

  /**
   * 사용자가 해당 게시글에 좋아요를 눌렀는지 확인합니다
   * @param userId 사용자 ID
   * @param postId 게시글 ID
   * @return 좋아요 존재 여부
   */
  boolean existsByUserIdAndPostId(Long userId, Long postId);

  /**
   * 사용자의 게시글 좋아요를 삭제합니다
   * @param userId 사용자 ID
   * @param postId 게시글 ID
   */
  void deleteByUserIdAndPostId(Long userId, Long postId);

  /**
   * 사용자가 좋아요를 누른 게시글 ID들을 조회합니다
   * @param userId 사용자 ID
   * @param posts 게시글 목록
   * @return 좋아요를 누른 게시글 ID 집합
   */
  @Query("select l.post.id from Like l where l.user.id = :userId and l.post in :posts")
  Set<Long> findLikedPostIds(@Param("userId") Long userId, @Param("posts") List<Post> posts);

}
