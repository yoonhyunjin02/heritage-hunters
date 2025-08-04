package org.hh.heritagehunters.domain.search.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
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

  @Column(name = "name", nullable = false, length = 50)
  private String name;

  @Column(name = "name_en", length = 50)
  private String nameEn;

  @Column(name = "thumbnail_url", columnDefinition = "TEXT")
  private String thumbnailUrl;

  @Column(name = "description", columnDefinition = "TEXT")
  private String description;

  @Column(name = "designation")
  private String designation;

  @Column(name = "region")
  private String region;

  @Column(name = "address", length = 100)
  private String address;

  @Column(name = "era", length = 10)
  private String era;

  @Column(name = "latitude", precision = 12, scale = 8)
  private BigDecimal latitude;

  @Column(name = "longitude", precision = 12, scale = 8)
  private BigDecimal longitude;

}
