package org.hh.heritagehunters.domain.post.service;

import lombok.RequiredArgsConstructor;
import org.hh.heritagehunters.common.exception.NotFoundException;
import org.hh.heritagehunters.common.exception.payload.ErrorCode;
import org.hh.heritagehunters.domain.oauth.entity.User;
import org.hh.heritagehunters.domain.post.entity.Like;
import org.hh.heritagehunters.domain.post.entity.Post;
import org.hh.heritagehunters.domain.post.repository.LikeRepository;
import org.hh.heritagehunters.domain.post.repository.PostRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional
public class LikeService {

  private final PostRepository postRepository;
  private final LikeRepository likeRepository;

  public boolean toggle(Long postId, User user) {
    Post post = postRepository.findById(postId)
        .orElseThrow(() -> new NotFoundException(ErrorCode.POST_NOT_FOUND));

    boolean liked = likeRepository.existsByUserIdAndPostId(user.getId(), postId);
    if (liked) {
      likeRepository.deleteByUserIdAndPostId(user.getId(), postId);
      post.decrementLikeCount();
      return false;
    } else {
      likeRepository.save(Like.create(user, post));
      post.incrementLikeCount();
      return true;
    }
  }

  @Transactional(readOnly = true)
  public boolean isLiked(Long postId, Long userId) {
    return likeRepository.existsByUserIdAndPostId(userId, postId);
  }
}