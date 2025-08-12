package org.hh.heritagehunters.config;

import java.util.HashMap;
import java.util.Map;
import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Configuration
@ConfigurationProperties(prefix = "ai")
@Getter
@Setter
public class AiClientProperties {
  private Map<Integer, String> clients = new HashMap<>();
}
