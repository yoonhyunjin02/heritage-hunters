package org.hh.heritagehunters.domain.search.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "heritages")
public class Heritage {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(name = "name", columnDefinition = "TEXT", nullable = false)
  private String name;

  @Column(name = "name_hanja", columnDefinition = "TEXT")
  private String nameHanja;

  @Column(name = "thumbnail_url", columnDefinition = "TEXT")
  private String thumbnailUrl;

  @Column(name = "description", columnDefinition = "TEXT")
  private String description;

  @Column(name = "designation", length = 50, nullable = true)
  private String designation;

  @Column(name = "region", length = 50, nullable = true)
  private String region;

  @Column(name = "address", columnDefinition = "TEXT")
  private String address;

  @Column(name = "era", columnDefinition = "TEXT")
  private String era;

  @Column(name = "latitude", precision = 12, scale = 8)
  private BigDecimal latitude;

  @Column(name = "longitude", precision = 12, scale = 8)
  private BigDecimal longitude;
}