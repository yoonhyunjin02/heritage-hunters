package org.hh.heritagehunters.domain.map.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "exhibited_at")
@Data
@NoArgsConstructor
@AllArgsConstructor
@IdClass(ExhibitedAtId.class)
public class ExhibitedAt {

  @Id
  private Long museums_id;

  @Id
  private Long heritages_id;
}
