package org.hh.heritagehunters.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.servers.Server;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;

@Configuration
public class SwaggerConfig {

  @Bean
  public OpenAPI customOpenAPI() {
    return new OpenAPI()
        .servers(List.of(
            new Server()
                .url("http://localhost:8080")
                .description("로컬 개발 서버")
        ))
        .info(new Info()
            .title("Heritage Hunters API")
            .version("1.0.0")
            .description("한국의 문화유산과 박물관 정보를 제공하고, 사용자가 발견한 문화유산을 공유할 수 있는 플랫폼 API"));
  }
}