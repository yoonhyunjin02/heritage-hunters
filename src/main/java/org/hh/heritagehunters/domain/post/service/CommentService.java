package org.hh.heritagehunters.domain.post.service;

import lombok.RequiredArgsConstructor;
import org.hh.heritagehunters.common.exception.NotFoundException;
import org.hh.heritagehunters.common.exception.payload.ErrorCode;
import org.hh.heritagehunters.domain.oauth.entity.User;
import org.hh.heritagehunters.domain.post.dto.request.CommentCreateRequestDto;
import org.hh.heritagehunters.domain.post.entity.Comment;
import org.hh.heritagehunters.domain.post.entity.Post;
import org.hh.heritagehunters.domain.post.repository.CommentRepository;
import org.hh.heritagehunters.domain.post.repository.PostRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional
public class CommentService {

  private final PostRepository postRepository;
  private final CommentRepository commentRepository;

  public Comment add(Long postId, User user, CommentCreateRequestDto dto) {
    Post post = postRepository.findById(postId)
        .orElseThrow(() -> new NotFoundException(ErrorCode.POST_NOT_FOUND));
    Comment c = Comment.create(user, post, dto.getContent());
    commentRepository.save(c);
    post.syncCommentCount();
    return c;
  }
}