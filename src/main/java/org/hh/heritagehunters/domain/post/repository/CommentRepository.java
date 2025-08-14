package org.hh.heritagehunters.domain.post.repository;

import java.util.List;
import org.hh.heritagehunters.domain.post.entity.Comment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface CommentRepository extends JpaRepository<Comment, Long> {

  /**
   * 게시글의 모든 댓글을 작성자 정보와 함께 조회합니다
   * @param postId 게시글 ID
   * @return 생성일시 순으로 정렬된 댓글 목록
   */
  @Query("SELECT c FROM Comment c JOIN FETCH c.user WHERE c.post.id = :postId ORDER BY c.createdAt ASC")
  List<Comment> findAllByPostIdWithUser(@Param("postId") Long postId);
}
