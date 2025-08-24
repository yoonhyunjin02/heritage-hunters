<img width="2081" height="383" alt="Image" src="https://github.com/user-attachments/assets/471bd46f-f1e4-46a2-b6c8-bf3397351579" />

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
10. [아키텍쳐 구조 및 유저플로우](#10-아키텍쳐-구조-및-유저플로우)
11. [최종 회고](#11-최종-회고)

---

## 1. 프로젝트 소개

전통과 기술이 만나는 곳, Heritage Hunters는 대한민국의 국가 유산을 직접 방문하고 사진을 공유하며 점수를 얻는 **게임형 SNS 플랫폼**입니다.

### 🚀 About the Project

> "국가 유산을 직접 방문해 사진을 찍어 올려 점수를 얻는 게임 + SNS"

사용자는 전국의 국가 유산을 탐방하고, 인증 사진을 업로드하여 점수 및 디지털 우표를 획득합니다.

랭킹 시스템을 통해 유산 탐험의 재미와 경쟁 요소를 동시에 제공합니다.

### [👉 더 자세한 프로젝트 기획서 보러가기](https://chain-winter-af2.notion.site/Heritage-Hunters-23f2233de69380408581ef713fc77cc6?source=copy_link)

- 📅 **진행 기간**: 2025년 7월 28일 ~ 2025년 8월 25일


- 🎯 **주요 기능**
    - 회원가입/로그인 및 소셜 로그인(구글, 깃허브, 네이버)
    - 문화재 정보 및 위치 검색 기능
    - 앨런 AI를 이용한 문화재 관련 정보 제공
    - 문화재 방문 인증 게시글 CRUD 기능
    - Google Maps API로 위치 인증 기능
    - 공공데이터 4종 정보 제공

- 📞 **사용한 API**
      
    | API / 서비스                    | 용도                       |
    | ---------------------------- | ------------------------ |
    | Google OAuth API         | 소셜 로그인 (Google 계정 인증)    |
    | GitHub OAuth API         | 소셜 로그인 (GitHub 계정 인증)    |
    | Naver OAuth API          | 소셜 로그인 (Naver 계정 인증)     |
    | Google Maps API          | 문화재 위치 서비스 (좌표 자동완성, 검증) |
    | Alan AI API              | 문화재 음성 안내/정보 제공          |
    | AWS S3 API               | 이미지 업로드 및 파일 URL 관리      |
    | AWS RDS API (PostgreSQL) | 데이터 저장 및 관리              |

- 🏹 **팀명 HH**
    - 프로젝트명인 "Heritage Hunters"의 첫 글자 + 태극기 건곤감리의 감와 유사

- 📬[배포](https://www.heritage-hunters.kro.kr/)

- 📺[시연 영상](https://youtu.be/lHHQWYGhi34?si=glzjWA5VIuKBd-gq)

- 📢[발표 자료](https://drive.google.com/file/d/1F-81L6v9epOLKutm_YqMChMOUqty2NVO/view?usp=drive_link)

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

| **구분** | **윤현진** | **유동혁** | **이수완** | **공통** |
|----------|------------|------------|------------|----------|
| **기능** | ETL<br>헤더/푸터 | AWS RDS, s3<br>앨런 AI<br>Util(날짜, XSS) | AWS s3<br>환경 변수 관리<br>전역 예외처리 | - |
| **페이지** | 로그인/회원가입<br>메인<br>지도<br>순위 | 검색 목록<br>검색 상세<br>프로필 | 게시글 목록<br>게시글 상세<br>게시글 작성 | - |
| **배포 및 디자인** | AWS<br>도커<br>깃허브액션<br>와이어프레임<br>피그마 | - | - | - |
| **문서 및 기타** | 노션, WBS<br>리드미<br>유저플로우<br>시연영상<br>아키텍처 설계<br>PPT | 리드미<br>유저플로우 | 스웨거 | 요구사항 명세서<br>API 명세서<br>ERD<br>통합 테스트 |


###  기간별 작업 요약(WBS)
▶️[👉 WBS 스프레드시트 보러가기](https://docs.google.com/spreadsheets/d/1ArMrJ5WymKD7nTBFT9s5xAKtZ0qpJCmKEO_AsoGtN9U/edit?usp=sharing)

<img width="3086" height="3061" alt="Image" src="https://github.com/user-attachments/assets/da3c3acb-4416-4650-82aa-29351d9e3b2c" />

---
## 3. ERD
<img width="1302" height="789" alt="Image" src="https://github.com/user-attachments/assets/9959b84a-fc53-4fe7-92fe-632f4e7f01cb" />

## 4. 피그마 디자인
<img width="1883" height="601" alt="Image" src="https://github.com/user-attachments/assets/36d78e69-369d-43e5-958c-4d4ffa5d6952" />

3개의 페이지를 나눠 디자인함
- 아이콘 및 컬러칩, 배경, 로고
- 디자인
- 와이어프레임

🎨[👉 피그마 보러가기](https://www.figma.com/design/2QGcq7VGRlTLl6yIMhmIOQ/Heritage-Hunters?node-id=98-1413&p=f&t=pwWieG5cbZx8tyYK-0)

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
### [👉 노션 페이지 참고](https://chain-winter-af2.notion.site/2552233de69380ffbd00e4aa25e5e438?source=copy_link)

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

도메인 기반으로 설계함

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

### 🔹 [👉 컨벤션 보러가기](https://chain-winter-af2.notion.site/23e2233de6938078b383f379438b6ff2?source=copy_link)

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
  <img src="https://img.shields.io/badge/Github-181717?style=for-the-badge&logo=Github&logoColor=white">
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
## 10. 아키텍쳐 구조 및 유저플로우

### 🔹 아키텍쳐 구조
<img width="4141" height="2090" alt="Image" src="https://github.com/user-attachments/assets/3058abca-c7e7-4af8-aa3a-52ef3629bf45" />

### 🔹 UserFlow
<img width="896" height="649" alt="Image" src="https://github.com/user-attachments/assets/ca31c2cf-8df2-49aa-b828-27729ad6de93" />

## 11. 최종 회고
- 윤현진
  - **인상깊은 기능**

    도커, 깃허브 액션, AWS 배포 및 도메인 연결 작업이 가장 인상 깊었습니다. 처음에는 어떤 순서로 진행해야 할지조차 몰라 어려움이 많았지만, 문제들을 하나씩 해결하며 최종적으로 배포까지 성공했을 때 성취감과 뿌듯함을 느낄 수 있었습니다.
ETL 작업 또한 인상깊었습니다. ETL의 개념 조차 몰랐는데 파이썬으로 데이터를 파싱하고 원하는 형태로 정제하는 과정이 재밌게 느껴졌습니다.

  - **소감**
    
    3명의 팀원들과 기획, 디자인, 발표, 문서 정리까지 함께하며 하나의 프로젝트가 완성되기까지 많은 시간과 노력이 필요하다는 것을 깊이 느낄 수 있었습니다. 마지막 프로젝트인 만큼 모두가 최선을 다해 임했기에 과정 자체가 즐겁고 뜻깊었고, 함께 성장할 수 있었던 소중한 경험이 되었습니다.
번외로 피그마랑 디자인이 너무 어려웠습니다..

- 유동혁
    - **인상깊은 기능**

      Alan AI API를 적용하며 기술적 제약과 사용자 경험 사이의 균형을 깊이 고민했습니다. CORS 우회, 프롬프트 최적화, 키 분산 등 여러 시도를 거치며 안정성과 응답 품질을 동시에 확보하는 과정에서 문제 해결 능력과 서비스 완성도의 중요성을 체감했습니다.
    
    - **소감**

      웹 서비스의 기획부터 설계, 디자인, 개발, 배포까지 전 과정을 직접 완수한 첫 프로젝트라 감회가 남다릅니다. 특히 기획과 디자인 단계에서, 해당 분야에 전문가가 존재하는 이유를 깊이 실감했습니다.

- 이수완
  - **인상깊은 기능**
    
    사용자가 실제 문화유산 현장에서만 인증할 수 있도록 다단계 GPS 검증 시스템을 구현한 기능이 가장 인상 깊었습니다. 업로드한 사진의 EXIF GPS 데이터와 Google Maps 자동완성 위치를 1차 비교하고, 통과 시 데이터베이스의 실제 문화유산 좌표와 2차 검증을 진행합니다. 모든 검증을 통과한 경우에만 점수 부여와 디지털 우표를 발급하여 실제 현장 방문 없이는 인증이 불가능한 공정한 인증 환경을 구현했습니다.
  - **소감**
    
    팀원들이 너무 잘하셔서 배려를 많이 받았던 프로젝트였습니다. 각자 맡은 부분을 책임감있게 마무리해 주시고 문제 발생 시 함께 해결하여 프로젝트를 무사히 마무리할 수 있었습니다. 덕분에 모두가 함께 성장할 수 있었던 감사하고 뜻깊은 시간이었습니다.
