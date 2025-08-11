package org.hh.heritagehunters.domain.post.repository;

import org.hh.heritagehunters.domain.post.entity.Comment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface CommentRepository extends JpaRepository<Comment, Long> {

  @Query("SELECT COUNT(c) FROM Comment c WHERE c.post.id = :postId")
  Integer countByPostId(@Param("postId") Long postId);
}
