package org.hh.heritagehunters.domain.map.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;

@Entity
@Table(name = "museums")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Museum {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id; // 자동생성

  private String name;

  private String category;

  private BigDecimal latitude;

  private BigDecimal longitude;

  private String address;

  private String region;

  private String description;
}
