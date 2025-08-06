package org.hh.heritagehunters.domain.oauth.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "users")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class User {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id; // 자동 생성

  @Column(unique = true, nullable = false)
  private String email; // UNIQUE

  @Column(unique = true, nullable = false)
  private String nickname; // UNIQUE

  private String password;

  @Column(name = "profile_image")
  private String profileImage; // URL

  @Column(nullable = false)
  private Integer score = 0;

  private String bio;

  @Column(nullable = false)
  private String provider = "local"; // 그 외 "google", "github", "naver" 등

}
