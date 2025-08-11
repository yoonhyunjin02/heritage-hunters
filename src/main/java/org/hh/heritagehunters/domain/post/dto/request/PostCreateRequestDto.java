package org.hh.heritagehunters.domain.post.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
public class PostCreateRequestDto {

  @NotBlank
  private String content;

  @NotBlank
  private String location;

  @NotNull
  private Double lat;

  @NotNull
  private Double lng;
}
