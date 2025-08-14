package org.hh.heritagehunters.domain.post.service;

import java.util.Comparator;
import lombok.RequiredArgsConstructor;
import org.hh.heritagehunters.common.exception.BadRequestException;
import org.hh.heritagehunters.common.exception.payload.ErrorCode;
import org.hh.heritagehunters.domain.oauth.entity.User;
import org.hh.heritagehunters.domain.post.dto.request.PostCreateRequestDto;
import org.hh.heritagehunters.domain.post.dto.request.PostUpdateRequestDto;
import org.hh.heritagehunters.domain.post.entity.Post;
import org.hh.heritagehunters.domain.post.repository.PostRepository;
import org.hh.heritagehunters.domain.search.entity.Heritage;
import org.hh.heritagehunters.domain.search.repository.HeritageRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional
public class PostWriter {


  private final PostRepository postRepository;
  private final HeritageRepository heritageRepository;

  public Post create(User user, PostCreateRequestDto request) {
    if (user == null) {
      throw new BadRequestException(ErrorCode.LOGIN_REQUIRED);
    }

    Heritage nearest = findNearestHeritage(request.getLat(), request.getLng());

    Post post = Post.create(user, nearest, request.getContent(), request.getLocation());
    // (선택) 유물 연동 시 스코어 +1 (null-safe)
    if (nearest != null) {
      Integer s = user.getScore();
      user.setScore((s == null ? 0 : s) + 1);
    }
    return postRepository.save(post);
  }

  public void update(Post post, PostUpdateRequestDto dto) {
    post.setContent(dto.getContent());
    post.setLocation(dto.getLocation());
  }

  public void delete(Post post) {
    postRepository.delete(post);
  }

  private Heritage findNearestHeritage(Double lat, Double lng) {
    if (lat == null || lng == null) {
      return null;
    }
    final double baseLat = lat;
    final double baseLng = lng;

    return heritageRepository.findAll().stream()
        .filter(h -> h.getLatitude() != null && h.getLongitude() != null)
        .min(Comparator.comparingDouble(h ->
            distance(baseLat, baseLng, h.getLatitude().doubleValue(),
                h.getLongitude().doubleValue())
        ))
        .orElse(null);
  }

  private double distance(double lat1, double lng1, double lat2, double lng2) {
    double R = 6371000;
    double dLat = Math.toRadians(lat2 - lat1);
    double dLon = Math.toRadians(lng2 - lng1);
    double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
        + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
        + Math.sin(dLon / 2) * Math.sin(dLon / 2) - Math.cos(Math.toRadians(lat1)) * Math.cos(
        Math.toRadians(lat2)); // 안전: 편미분 방지X
    double c = 2 * Math.atan2(Math.sqrt(Math.max(a, 0)), Math.sqrt(Math.max(1 - a, 0)));
    return R * c;
  }
}