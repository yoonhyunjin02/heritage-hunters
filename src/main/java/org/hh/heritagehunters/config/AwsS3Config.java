package org.hh.heritagehunters.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.util.StringUtils;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.AwsCredentialsProvider;
import software.amazon.awssdk.auth.credentials.DefaultCredentialsProvider;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.S3ClientBuilder;

@Configuration
public class AwsS3Config {

  // prod에서는 빈값(미설정)이어도 되게 기본값을 ""로 둠
  @Value("${cloud.aws.credentials.access-key:}")
  private String accessKey;

  @Value("${cloud.aws.credentials.secret-key:}")
  private String secretKey;

  @Value("${cloud.aws.region.static}")
  private String region;

  @Bean
  public S3Client s3Client() {
    S3ClientBuilder builder = S3Client.builder().region(Region.of(region));

    // 로컬/개발에선 키가 있으면 그걸 사용, 없으면 EC2 Role 등 기본 체인 사용
    if (StringUtils.hasText(accessKey) && StringUtils.hasText(secretKey)) {
      AwsCredentialsProvider staticCreds =
          StaticCredentialsProvider.create(AwsBasicCredentials.create(accessKey, secretKey));
      builder.credentialsProvider(staticCreds);
    } else {
      // EC2 IAM Role, 환경변수, 프로파일 등 기본 자격증명 체인
      builder.credentialsProvider(DefaultCredentialsProvider.create());
    }

    return builder.build();
  }
}