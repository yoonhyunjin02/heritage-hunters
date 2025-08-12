package org.hh.heritagehunters.domain.post.service;

import java.util.List;
import lombok.RequiredArgsConstructor;
import org.hh.heritagehunters.common.exception.BadRequestException;
import org.hh.heritagehunters.common.exception.payload.ErrorCode;
import org.hh.heritagehunters.domain.post.entity.Post;
import org.hh.heritagehunters.domain.post.entity.PostImage;
import org.hh.heritagehunters.domain.post.util.ImageUploader;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

@Service
@RequiredArgsConstructor
public class ImageService {

  private final ImageUploader imageUploader;

  public void attachImages(List<MultipartFile> images, Post post) {
    if (images == null || images.isEmpty()) {
      throw new BadRequestException(ErrorCode.EMPTY_IMAGE_FILE);
    }
    for (int i = 0; i < images.size(); i++) {
      MultipartFile image = images.get(i);
      if (image.isEmpty() || image.getContentType() == null || !image.getContentType().startsWith("image/")) {
        throw new BadRequestException(ErrorCode.INVALID_IMAGE_FORMAT);
      }
      if (image.getSize() > 50L * 1024 * 1024) {
        throw new BadRequestException(ErrorCode.IMAGE_TOO_LARGE);
      }
      String url = imageUploader.upload(image);
      post.getImages().add(new PostImage(null, post, url, i));
    }
  }
}
