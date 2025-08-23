# ===== 빌드 스테이지 =====
FROM maven:3.8.4-openjdk-17 AS builder
WORKDIR /app

COPY pom.xml .
COPY src ./src

# 빌드 컨텍스트에 secrets가 들어왔는지 검사 (있으면 빌드 실패)
RUN test ! -e src/main/resources/secrets/application-secret.yml || (echo "❌ secrets 파일이 컨텍스트에 포함됨"; exit 1)

# 패키징
RUN mvn -B -DskipTests clean package

# 생성된 JAR 내부에 secrets가 섞였는지 검사 (있으면 빌드 실패)
RUN sh -c 'jar tf target/*.jar | grep -iE "(^|/)(secrets/|application-secret.yml)" \
  && { echo "JAR에 secrets 포함"; exit 1; } || echo "OK: JAR에 secrets 없음"'

# ===== 실행 스테이지 =====
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app

# 프로필 prod로 실행
ENV SPRING_PROFILES_ACTIVE=prod

# 타임존
RUN apk add --no-cache tzdata && cp /usr/share/zoneinfo/Asia/Seoul /etc/localtime && echo "Asia/Seoul" > /etc/timezone

COPY --from=builder /app/target/*.jar app.jar

EXPOSE 8080
ENTRYPOINT ["java","-jar","app.jar"]