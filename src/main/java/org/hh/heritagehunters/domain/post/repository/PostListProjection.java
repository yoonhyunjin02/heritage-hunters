package org.hh.heritagehunters.domain.post.repository;

public interface PostListProjection {

  Long getPostId();

  String getTitle();

  String getThumbnailUrl();

  java.time.LocalDateTime getCreatedAt();

  Long getAuthorId();

  String getAuthorNickname();

  Long getHeritageId();

  String getHeritageName();

  Long getLikeCount();

  Long getCommentCount();
}
