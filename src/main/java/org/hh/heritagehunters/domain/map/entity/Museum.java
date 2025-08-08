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
  private Long id;

  @Column(columnDefinition = "TEXT")
  private String name;

  @Column(columnDefinition = "TEXT")
  private String category;

  private BigDecimal latitude;

  private BigDecimal longitude;

  @Column(columnDefinition = "TEXT")
  private String address;

  @Column(columnDefinition = "TEXT")
  private String region;

  @Column(columnDefinition = "TEXT")
  private String description;
}