package org.hh.heritagehunters.domain.post.repository;

import java.util.List;
import org.hh.heritagehunters.domain.post.entity.Comment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface CommentRepository extends JpaRepository<Comment, Long> {

  @Query("SELECT c FROM Comment c JOIN FETCH c.user WHERE c.post.id = :postId ORDER BY c.createdAt ASC")
  List<Comment> findAllByPostIdWithUser(@Param("postId") Long postId);
}
