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
  private Long id; // 자동생성

  @Column(unique = true, nullable = false)
  private String email; // UNIQUE

  @Column(unique = true, nullable = false)
  private String nickname; // UNIQUE

  private String password;

  private String profile_image; // URL

  @Column(nullable = false)
  private Integer score = 0;

  private String bio;
}
