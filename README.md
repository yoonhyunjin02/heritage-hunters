<img width="2323" height="444" alt="Image" src="https://github.com/user-attachments/assets/890eada2-c847-435c-8194-a9554a44b567" />

- 📅 진행 기간: 2025년 7월 28일 ~ 2025년 8월 25일


- 🎯 주요 기능
    - 회원가입/로그인 및 소셜 로그인(구글, 깃허브, 네이버)
    - 문화재 정보 및 위치 검색 기능
    - 앨런 AI를 이용한 문화재 관련 정보 제공
    - 문화재 방문 인증 게시글 CRUD 기능
    - Google Maps API로 위치 인증 기능
    - 공공데이터 4종 정보 제공


- 🏹 팀명 HH : 프로젝트명인 "Heritage Hunters"의 첫 글자 + 태극기 건곤감리의 감와 유사

- 📬[배포](https://www.heritage-hunters.kro.kr/)

- 📺[시연 영상]()

- 📢[발표 자료]()

## 📍 목차
1. [프로젝트 소개](#1-프로젝트-소개)  
2. [팀원 소개 및 역할](#2-팀원-소개-및-역할)  
3. [ERD 구조](#3-erd)  
4. [피그마 디자인](#4-피그마-디자인)  
5. [페이지 구성 미리보기](#5-페이지-구성-미리보기)  
6. [페이지별 주요 상세 기능](#6-페이지별-주요-상세-기능)  
7. [디렉토리 구조](#7-디렉토리-구조)  
8. [브랜치 전략 및 컨벤션](#8-브랜치-전략-및-컨벤션)  
9. [사용 기술 및 도구](#9-사용-기술-및-도구)  
10. [최종 회고](#10-최종-회고)

---

## 1. 프로젝트 소개

전통과 기술이 만나는 곳, Heritage Hunters는 대한민국의 국가 유산을 직접 방문하고 사진을 공유하며 점수를 얻는 **게임형 SNS 플랫폼**입니다.

### 🚀 About the Project

> "국가 유산을 직접 방문해 사진을 찍어 올려 점수를 얻는 게임 + SNS"

사용자는 전국의 국가 유산을 탐방하고, 인증 사진을 업로드하여 점수 및 디지털 우표를 획득합니다.

랭킹 시스템을 통해 유산 탐험의 재미와 경쟁 요소를 동시에 제공합니다.

[더 자세한 프로젝트 기획서](https://chain-winter-af2.notion.site/Heritage-Hunters-23f2233de69380408581ef713fc77cc6?source=copy_link)

---- 

## 2. 팀원 소개 및 역할
<table>
  <tr>
    <td align="center" width="150px">
      <a href="https://github.com/yoonhyunjin02" target="_blank">
        <img src="https://avatars.githubusercontent.com/u/97629676?v=4"
        alt="윤현진 프로필" /></a>
    </td>
    <td align="center" width="150px">
      <a href="https://github.com/eastdh" target="_blank">
        <img src="https://avatars.githubusercontent.com/u/39060720?v=4"
        alt="유동혁 프로필" /></a>
    </td>
    <td align="center" width="150px">
      <a href="https://github.com/SooowanLee" target="_blank">
        <img src="https://avatars.githubusercontent.com/u/87759519?v=4"
        alt="이수완 프로필" /></a>
    </td>

  </tr>
  <tr>
    <td align="center">
      <a href="https://github.com/yoonhyunjin02" target="_blank">윤현진(팀장)
    </td>
    <td align="center">
      <a href="https://github.com/eastdh" target="_blank">유동혁</a>
    </td>
    <td align="center">
      <a href="https://github.com/SooowanLee" target="_blank">이수완</a>
    </td>
  </tr>
</table>

### 📆 페이지별 역할 분담
<table>
  <tr>
   <td align="center">
      윤현진
    </td>
    <td align="center">
      유동혁
    </td>
    <td align="center">
      이수완
    </td>
  </tr>
  <tr>
    <td align="center">
      디자인, ETL, 로그인/회원가입, 메인, 지도, 순위, 배포
    </td>
    <td align="center">
      AWS RDS·s3, 검색 목록·상세, 앨런 AI 적용, util, 프로필
    </td>
    <td align="center">
      환경 변수, 전역 예외처리, AWS s3, 게시글 목록·상세·작성, 스웨거
    </td>
  </tr>
</table>

###  기간별 작업 요약(WBS)
asdfasdf

---
## 3. ERD
<img width="1302" height="789" alt="Image" src="https://github.com/user-attachments/assets/9959b84a-fc53-4fe7-92fe-632f4e7f01cb" />

## 4. 피그마 디자인
<img width="1883" height="601" alt="Image" src="https://github.com/user-attachments/assets/36d78e69-369d-43e5-958c-4d4ffa5d6952" />

🎨[피그마](https://www.figma.com/design/2QGcq7VGRlTLl6yIMhmIOQ/Heritage-Hunters?node-id=98-1413&p=f&t=pwWieG5cbZx8tyYK-0)

## 5. 페이지 구성 미리보기
<details>
<summary>회원가입(register)</summary>
<img width="1920" height="911" alt="Image" src="https://github.com/user-attachments/assets/0a21ffa0-c00d-4199-8a4d-cf2febe346e7" />
</details>

<details>
<summary>로그인(login)</summary>
<img width="1920" height="911" alt="Image" src="https://github.com/user-attachments/assets/21c07ab6-f9b2-40f3-83c0-5dd607fac241" />
</details>

<details>
<summary>메인(main)</summary>
<img width="1884" height="3565" alt="Image" src="https://github.com/user-attachments/assets/a5b5c202-3c01-444f-918f-9936e38f06a1" />
</details>

<details>
<summary>지도(map)</summary>
<img width="1884" height="1123" alt="Image" src="https://github.com/user-attachments/assets/6bf552ed-a0d4-46fe-b76d-3b26efd1941c" />
</details>

<details>
<summary>검색(search)</summary>
<img width="1390" height="919" alt="Image" src="https://github.com/user-attachments/assets/6ec859c5-9a88-4b2b-8d58-5b8854f6d44a" />
<img width="1375" height="2240" alt="Image" src="https://github.com/user-attachments/assets/c6918a58-64b7-4fd6-bf73-66c16b7d07ef" />
<img width="1375" height="1800" alt="Image" src="https://github.com/user-attachments/assets/0c7ab8c7-21a2-4890-a7fe-484e56c4cd41" />
</details>

<details>
<summary>게시글(post)</summary>
<img width="1575" height="2112" alt="Image" src="https://github.com/user-attachments/assets/f1aea6eb-21f1-4be7-b854-26111fad0426" />
<img width="1869" height="900" alt="Image" src="https://github.com/user-attachments/assets/becc5a15-0522-499d-8681-41705f016344" />
<img width="1874" height="906" alt="Image" src="https://github.com/user-attachments/assets/f7a48fb7-8bb4-4490-998a-8c6db5569b8f" />
</details>

<details>
<summary>순위(leaderboard)</summary>
<img width="1898" height="915" alt="Image" src="https://github.com/user-attachments/assets/19ea2253-9e46-4d0a-aaaa-4758f21c4626" />
</details>

<details>
<summary>프로필(profile)</summary>
<img width="1575" height="1320" alt="Image" src="https://github.com/user-attachments/assets/0878a24a-3702-4e3b-bcb4-353568520bcb" />
<img width="1575" height="923" alt="Image" src="https://github.com/user-attachments/assets/832925d4-3658-43d5-bb05-8e3ce05011c6" />
<img width="1575" height="1244" alt="Image" src="https://github.com/user-attachments/assets/62db2e4c-0ba0-481d-95b3-1e76adac8938" />
</details>

## 6. 페이지별 주요 상세 기능
### [노션 페이지 참고](https://chain-winter-af2.notion.site/2552233de69380ffbd00e4aa25e5e438?source=copy_link)

## 7. 디렉토리 구조
<details>
<summary>상세 디렉토리 구조</summary>

```
heritage-hunters/
├── etl/
│   ├── adapters/
│   ├── db/
│   └── loader/
├── src/
│   ├── main/
│   │   ├── java/
│   │   │   └── …/heritagehunters/
│   │   │       ├── common/
│   │   │       │   ├── controller/
│   │   │       │   ├── exception/
│   │   │       │   │   ├── oauth/
│   │   │       │   │   └── payload/
│   │   │       │   │       └── ErrorCode.java
│   │   │       │   ├── handler/
│   │   │       │   ├── security/
│   │   │       │   └── util/
│   │   │       ├── config/
│   │   │       ├── domain/
│   │   │       │   ├── leaderboard/
│   │   │       │   │   ├── controller/
│   │   │       │   │   ├── dto/
│   │   │       │   │   └── service/
│   │   │       │   ├── main/
│   │   │       │   │   └── controller/
│   │   │       │   ├── map/
│   │   │       │   │   ├── controller/
│   │   │       │   │   ├── dto/
│   │   │       │   │   ├── entity/
│   │   │       │   │   ├── repository/
│   │   │       │   │   └── service/
│   │   │       │   ├── oauth/
│   │   │       │   │   ├── controller/
│   │   │       │   │   ├── dto/
│   │   │       │   │   ├── entity/
│   │   │       │   │   ├── repository/
│   │   │       │   │   └── service/
│   │   │       │   ├── post/
│   │   │       │   │   ├── application/
│   │   │       │   │   ├── controller/
│   │   │       │   │   ├── dto/
│   │   │       │   │   │   ├── request/
│   │   │       │   │   │   └── response/
│   │   │       │   │   ├── entity/
│   │   │       │   │   ├── repository/
│   │   │       │   │   └── service/
│   │   │       │   ├── profile/
│   │   │       │   │   ├── controller/
│   │   │       │   │   ├── dto/
│   │   │       │   │   ├── entity/
│   │   │       │   │   ├── repository/
│   │   │       │   │   └── service/
│   │   │       │   └── search/
│   │   │       │       ├── controller/
│   │   │       │       ├── dto/
│   │   │       │       ├── entity/
│   │   │       │       ├── repository/
│   │   │       │       ├── service/
│   │   │       │       ├── specification/
│   │   │       │       └── util/
│   │   │       └── HeritageHuntersApplication.java
│   │   ├── resources/
│   │   │   ├── static/
│   │   │   │   ├── audio/
│   │   │   │   ├── common/
│   │   │   │   │   ├── css/
│   │   │   │   │   └── js/
│   │   │   │   │       └── utils/
│   │   │   │   ├── features/
│   │   │   │   │   ├── leaderboard/
│   │   │   │   │   │   └── css/
│   │   │   │   │   ├── main/
│   │   │   │   │   │   ├── css/
│   │   │   │   │   │   └── js/
│   │   │   │   │   ├── map/
│   │   │   │   │   │   ├── css/
│   │   │   │   │   │   └── js/
│   │   │   │   │   ├── oauth/
│   │   │   │   │   │   ├── css/
│   │   │   │   │   │   └── js/
│   │   │   │   │   ├── post/
│   │   │   │   │   │   ├── css/
│   │   │   │   │   │   └── js/
│   │   │   │   │   ├── profile/
│   │   │   │   │   │   ├── css/
│   │   │   │   │   │   └── js/
│   │   │   │   │   └── search/
│   │   │   │   │       ├── css/
│   │   │   │   │       └── js/
│   │   │   │   └── images/
│   │   │   │       ├── icons/
│   │   │   │       ├── logo/
│   │   │   │       ├── main/
│   │   │   │       ├── oauth/
│   │   │   │       ├── placeholders/
│   │   │   │       ├── profile/
│   │   │   │       └── stamp/
│   │   │   ├── templates/
│   │   │   │   ├── features/
│   │   │   │   │   ├── leaderboard/
│   │   │   │   │   ├── main/
│   │   │   │   │   ├── map/
│   │   │   │   │   ├── oauth/
│   │   │   │   │   ├── post/
│   │   │   │   │   ├── profile/
│   │   │   │   │   └── search/
│   │   │   │   └── fragments/
│   │   │   ├── application-local.yml
│   │   │   ├── application-prod.yml
│   │   │   └── application.yml
│   └── test/
│       ├── java/
│       │   └── …/heritagehunters/
│       │       ├── common/
│       │       │   └── security/
│       │       ├── domain/
│       │       │   ├── leaderboard/
│       │       │   │   ├── controller/
│       │       │   │   └── service/
│       │       │   ├── map/
│       │       │   │   ├── controller/
│       │       │   │   ├── repository/
│       │       │   │   └── service/
│       │       │   └── oauth/
│       │       │       ├── controller/
│       │       │       ├── repository/
│       │       │       └── service/
│       │       ├── testsupport/
│       │       └── HeritageHuntersApplicationTests.java
├── uploads/
├── Dockerfile
├── README.md
├── mvnw
├── mvnw.cmd
└── pom.xml
```

</details>


```
heritage-hunters/
├── etl/
│   ├── adapters/
│   ├── db/
│   └── loader/
├── src/
│   ├── main/
│   │   ├── java/…/heritagehunters/
│   │   │   ├── common/ (controller, exception, handler, security, util)
│   │   │   ├── config/
│   │   │   ├── domain/
│   │   │   │   ├── leaderboard/
│   │   │   │   ├── main/
│   │   │   │   ├── map/
│   │   │   │   ├── oauth/
│   │   │   │   ├── post/
│   │   │   │   ├── profile/
│   │   │   │   └── search/
│   │   │   └── HeritageHuntersApplication.java
│   │   ├── resources/
│   │   │   ├── static/ (common, features, images)
│   │   │   ├── templates/ (features, fragments)
│   │   │   ├── application-local.yml
│   │   │   ├── application-prod.yml
│   │   │   └── application.yml
│   └── test/
│       └── java/…/heritagehunters/
│           ├── common/
│           ├── domain/ (leaderboard, map, oauth)
│           ├── testsupport/
│           └── HeritageHuntersApplicationTests.java
├── uploads/
├── Dockerfile
├── README.md
├── mvnw / mvnw.cmd
└── pom.xml
```

## 8. 브랜치 전략 및 컨벤션

### 🔹 브랜치 전략
<img width="693" height="298" alt="Image" src="https://github.com/user-attachments/assets/90a22db8-8302-4d13-9395-0ef0e03c69fe" />

### 🔹 [컨벤션](https://chain-winter-af2.notion.site/23e2233de6938078b383f379438b6ff2?source=copy_link)

## 9. 사용 기술 및 도구

### 🔹 Frontend

<div style="display: flex; flex-wrap: wrap; gap: 8px;">
  <img src="https://img.shields.io/badge/html5-E34F26?style=for-the-badge&logo=html5&logoColor=white">
  <img src="https://img.shields.io/badge/css-1572B6?style=for-the-badge&logo=css3&logoColor=white">
  <img src="https://img.shields.io/badge/javascript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black">
</div>

---

### 🔹 Backend

<div style="display: flex; flex-wrap: wrap; gap: 8px;">
  <img src="https://img.shields.io/badge/java-007396?style=for-the-badge&logo=java&logoColor=white">
  <img src="https://img.shields.io/badge/spring%20boot-6DB33F?style=for-the-badge&logo=springboot&logoColor=white">
  <img src="https://img.shields.io/badge/Maven-C71A36?style=for-the-badge&logo=apachemaven&logoColor=white">
  <img src="https://img.shields.io/badge/Spring%20Security-6DB33F?style=for-the-badge&logo=springsecurity&logoColor=white">
</div>

---

### 🔹 Database

<div style="display: flex; flex-wrap: wrap; gap: 8px;">
  <img src="https://img.shields.io/badge/postgresql-4169E1?style=for-the-badge&logo=postgresql&logoColor=white">
    <img src="https://img.shields.io/badge/AWS%20RDS-527FFF?style=for-the-badge&logo=amazonaws&logoColor=white">
</div>

---

### 🔹 Infrastructure / Deployment

<div style="display: flex; flex-wrap: wrap; gap: 8px;">
  <img src="https://img.shields.io/badge/AWS%20EC2-FF9900?style=for-the-badge&logo=amazonaws&logoColor=white">
  <img src="https://img.shields.io/badge/AWS%20S3-569A31?style=for-the-badge&logo=amazonaws&logoColor=white">
  <img src="https://img.shields.io/badge/AWS%20ECR-FF9900?style=for-the-badge&logo=amazonaws&logoColor=white">
  <img src="https://img.shields.io/badge/AWS%20ACM-232F3E?style=for-the-badge&logo=amazonaws&logoColor=white">
  <img src="https://img.shields.io/badge/AWS%20ALB-146EB4?style=for-the-badge&logo=amazonaws&logoColor=white">
  <img src="https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white">
  <img src="https://img.shields.io/badge/GitHub%20Actions-2088FF?style=for-the-badge&logo=githubactions&logoColor=white">
</div>

---

### 🔹 Collaboration

<div style="display: flex; flex-wrap: wrap; gap: 8px;">
  <a href="https://github.com/yoonhyunjin02/youtube-clone-frontend" target="_blank">
    <img src="https://img.shields.io/badge/Github-181717?style=for-the-badge&logo=Github&logoColor=white">
  </a>
  <img src="https://img.shields.io/badge/figma-F24E1E?style=for-the-badge&logo=figma&logoColor=white">
</div>

---

### 🔹 Communication

<div style="display: flex; flex-wrap: wrap; gap: 8px;">
  <img src="https://img.shields.io/badge/notion-FEFEFE?style=for-the-badge&logo=notion&logoColor=black">
  <img src="https://img.shields.io/badge/discord-5865F2?style=for-the-badge&logo=discord&logoColor=white">
  <img src="https://img.shields.io/badge/ERD%20Cloud-1DA1F2?style=for-the-badge&logo=icloud&logoColor=white">
  <img src="https://img.shields.io/badge/Google%20Sheets-34A853?style=for-the-badge&logo=googlesheets&logoColor=white">
  <img src="https://img.shields.io/badge/draw.io-F08705?style=for-the-badge&logo=diagramsdotnet&logoColor=white">
</div>

---

### 🔹 Development Tools

<div style="display: flex; flex-wrap: wrap; gap: 8px;">
  <img src="https://img.shields.io/badge/IntelliJ%20IDEA-000000?style=for-the-badge&logo=intellijidea&logoColor=white">
  <img src="https://img.shields.io/badge/VS%20Code-007ACC?style=for-the-badge&logo=visualstudiocode&logoColor=white">
</div>

---

## 10. 최종 회고
- 윤현진
- 유동혁
- 이수완
