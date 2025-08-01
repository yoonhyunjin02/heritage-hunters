package org.hh.heritagehunters.domain.leaderboard.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "user_stamps")
@Data
@NoArgsConstructor
@AllArgsConstructor
@IdClass(UserStampId.class)
public class UserStamp {

  @Id
  private Long user_id;

  @Id
  private Long heritage_id; // 자동생성

  private LocalDateTime earned_at;
}

