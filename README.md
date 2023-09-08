# Final Project : TicketNest

<img src="https://github.com/tkdgks7036/prac_code_JS/assets/133713235/e0ff6101-8702-4591-bb5a-3bbb54d909fa">

## 프로젝트 소개

대용량 트래픽 핸들링을 타게팅 한 티켓팅 예매 소셜 이커머스입니다.

최근 온라인 서비스의 규모가 커지고 지속적으로 서버가 확장됨에 따라 운영 비용은 최소화하고 동시에 대규모 트래픽은 효율적으로 관리하고자 하는 기업이 늘어나고 있습니다.

이에 따라, 현재의 트렌드를 따라가기 위해 제한된 조건을 가지고 동시성 제어, 확장성 및 고가용성을 우선시하는 시스템을 설계해 보고자 시장 조사를 해본 결과 "티켓팅 서비스" 가 저희가 생각한 환경과 가장 유사하며 접근성이 좋은 주제이고, 순간적 or 지속적인 대용량 트래픽을 핸들링 하기에 적합하다고 생각하여 선택하게 되었습니다.


FE-Repository : https://github.com/TicketNest/TicketNest-FE

Pub-Repository : https://github.com/TicketNest/TicketNest-Pub

Sub-Repository : https://github.com/TicketNest/TicketNest-sub

Notion : https://www.notion.so/7-J-o-J-e21d060e8f474805aeef6a4828b37712

## 서비스 아키텍처

<img src="https://github.com/tkdgks7036/prac_code_JS/assets/133713235/4bcbb734-ca43-4778-bbfe-df0c5c237ebd" width="75%">

## ERD

<img src="https://github.com/tkdgks7036/prac_code_JS/assets/133713235/61d7d574-c72d-4593-9913-b1174a8bd65b" width="75%">

## 기술적 의사 결정

<details>
<summary><b>NestJS </b></summary>

* 몰더 및 파일 구조를 잡아줌<br>
* 컴파일 단계에서 에러를 미리 발견할 수 있어 생산성 향상<br>
* 데이터 타입을 지정할 수 있어 개발자가 기대한 결괏값과 다른 값이 반환되는 현상 방지<br>
</details>

<details>
<summary><b>PostgreSQL</b></summary>

* 오픈소스 기반 및 다양한 레퍼런스
* 프로젝트 주제의 특성상 읽기 작업 못지않은 대량의 쓰기 작업
* 추후 프로젝트 확장 및 테이블 관계의 복잡성에 대한 성능 보장<br>

</details>


<details>
<summary><b>TypeORM</b></summary>

* 쿼리의 복잡도가 상승함에 따른 가독성 및 성능 고려
* 데이터 무결성을 위해 흐름 제어에 필요한 ACID 속성 지원
* NestJS의 공식 ORM으로써 안정적인 지원과 준수한 성능<br>
</details>

<details>
<summary><b>Redis</b></summary>

* 메세지를 기록하지 않는 대신 높은 처리 속도 보장
* 다양한 레퍼런스와 Learning Curve
* Pub/Sub과 인메모링 캐싱 기술을 하나로 사용함에 따라 운용 범위 축소<br>
</details>

<details>
<summary><b>nGrinder</b></summary>

* 비교적 쉬운 설치 및 구성
* 국내 커뮤니티 및 다양한 레퍼런스 존재
* 여러 대의 Agent를 사용하여 대규모 부하 테스트 진행 가능<br>
</details>

<details>
<summary><b>Elastic APM</b></summary>

* 작업 처리 소요 시간에 대한 자세한 가시화 데이터
* 병목 현상 지점 파악 용이
* Transaction에 소요되는 시간 체크<br>
</details>

<details>
<summary><b>HAPROXY</b></summary>

* 간단한 설치 및 설정
* L4/L7 지원이 가능해 아키텍쳐 확장에 대한 유연성 보장
* 실시간 모니터링으로 서버별 상태 지속 파악 가능
</details>

<details>
<summary><b>Pgpool-II</b></summary>

* PostgreSQL에 특화된 라이브러리로 최적의 성능과 기능 제공
* 하나의 쿼리를 여러 서버에 동시 분산하여 응답 시간 단축<br>
</details>

## 성능 개선

<img src="https://github.com/munyeol-Yoon/mini-BE/assets/50113066/cf2d5d01-92e2-452a-843e-ece298ecb536" />

||초기단계|SQL 로그 제거|쿼리 최적화|Redis Cache|Redis Pub/Sub|
|------|---|---|---|---|---|
|TPS|110.3|172.9|175.4|657.7|1040.7|
|MTT|421.78ms|286.45ms|278.36ms|73.59ms|48.33ms|

</br>

<details>
<summary><b>Terminal 에서 SQL Log 제거</b></summary>

### Issue

EC2 Instance CPU 사용량 약 90% 과부하 상태 현상

### Try

DB의 CPU와 I/O 부하 등 상태를 확인해 봤으나, 읽기/쓰기 모두 일정한 패턴

서버를 Scale Up 해봤지만, CPU 사용량 80%로 여전히 높은 현상

### Solution

DB에 데이터를 넣기 시작하면 발생하는 로그가 Instance에 상당한 부하를 주는 것을 확인하여 로그가 자동으로 생성되지 않도록 수정

|항목|적용 전|적용 후|변화량|
|------|---|---|---|
|TPS|110.3|172.9|약 57% 상승|
|Mean Time|421.78ms|286.45ms|약 68% 감소|
|CPU 사용량|80%|40%|40% 감소|


</details>
<details>
<summary><b>쿼리 최적화(Dynamic Query)</b></summary>

### Issue

CreateBooking API 호출 시 Latency가 낮은 현상

### Try

goods entity의 BookingCount Update 시 TypeORM의 Save Method를 사용할 경우, Select 문을 통해 해당하는 id Column을 전체 조회 후 Update를 진행하는 형태의 쿼리를 확인하여 최적화 시도

### Solution

TypeORM의 QueryBuilder를 통해 동적 쿼리를 구현하여 TPS 및 MTT 개선

|항목|적용 전|적용 후|변화량|
|------|---|---|---|
|TPS|138.4|175.4|약 21% 상승|
|Mean Time|357.67ms|275.05ms|약 22% 감소|

</details>
<details>
<summary><b>Redis Cache</b></summary>

### Issue

QueryBuilder를 통해 동적 쿼리를 사용하여 Latency, TPS 등 성능 향상은 했지만 여전히 절댓값은 크지 않은 현상

### Try

네트워크 피크 값이 발생하지 않고, 시스템 부하도 낮은 상태에서 디스크 I/O 값만 높은 상태여서 DB의 구조적 한계로 판단하여 Redis Cache 적용 시도

### Solution

Redis Cache를 통해 DB의 부하를 줄여서 CPU 사용량을 개선하고, Cache를 통해 데이터에 접근하기 때문에 TPS 및 Mean Time까지 개선

|항목|적용 전|적용 후|변화량|
|------|---|---|---|
|TPS|215.4|657.7|약 205% 상승|
|Mean Time|226.05ms|73.59ms|약 67% 감소|
|CPU 사용량|40~50%|80%|30~40% 상승|

</details>
<details>
<summary><b>Redis Pub/Sub</b></summary>

### Issue 

In-memory 기반의 Redis Cache를 사용하여 전반적인 성능은 개선했지만, 동시성 제어의 실패

### Try

Redis 분산락을 통한 동시성 제어 시도 실패

### Solution

- 여러 개의 Pub에서 Message를 비동기적으로 발행하기 때문에 성능이 개선됨과 동시에 Queue는 순차적으로 Message를 저장하기 때문에 동시성 제어 또한 해결

- Queue로 인해 순차적으로 저장되기 때문에 Transaction의 필요성이 사라지며 로직의 간소화

|항목|적용 전|적용 후|변화량|
|------|---|---|---|
|TPS|657.7|1,040.7|약 585% 상승|
|Mean Time|73.59ms|48.33ms|약 34% 감소|
|CPU 사용량|80%|65%|15% 감소|


</details>
<details>
<summary><b>Scale Out</b></summary>

### Issue

성능 개선 및 동시성 제어에 유의미한 결과를 얻었지만, 사용자 수를 증가시켜도 더 이상 TPS 가 상승하지 않는 현상

### Solution

다수의 서버를 로드 밸런서를 통해 연결 및 분산하여 추가적인 TPS 상승

|항목|적용 전|적용 후|변화량|
|------|---|---|---|
|TPS|1,252|3,066|약 245% 상승|
|Mean Time|1,588ms|604.58ms|약 40% 감소|
|CPU 사용량|100%|약 80%|20% 감소|
|Run Time|13m 46s|5m 54s|약 57% 감소|


</details>

</br>

* <span style="font-weight:bold">TPS : 110.3 -> 1040.7</span> <span style="color:skyblue; font-weight:bold">(약 845% 상승)</span>

* <span style="font-weight:bold">Mean Time : 421.78ms -> 48.33ms</span> <span style="color:red; font-weight:bold">(약 89% 감소)</span>


</br>

## Trouble Shooting

<details>
<summary><b>EC2 인스턴스 간 연결</b></summary>

**`❗  Issue`**

- 애플리케이션 Instance -> PostgreSQL Instance 연결 실패

**`💡  Solution`**
- Public IPv4 / Private IPv4 차이점을 활용
- 도커 컨테이너의 -p 옵션을 통해 호스트와 별도의 네트워크 연결 처리<br>

- 인바운드 규칙을 통해 Instance에 접근 권한을 준 것은 ipv4 이다.
- -p 옵션을 통해 호스트 IP 주소를 연결하고자 하는 Instance의 public ipv4로 설정하였다.
- 호스트 IP 주소를 설정할 때, Public과 Private 중 무엇을 설정해야 할지 잘 생각해 봐야 했다.
    - Public IPv4: 외부 네트워크에서 인스턴스로의 연결을 도와주는 주소로써. 인스턴스를 중지하고 재시작할 경우 IPv4 값이 변경될 수 있다.
    - Private IPv4: VPC 또는 로컬 네트워크 내에서만 인스턴스에 연결할 수 있도록 도와주는 주소이다.

</details>

<details>
<summary><b>데이터 동시성 제어</b></summary>

**`❗  Issue`**

- 다수의 User가 동시 접속 시 데이터 일관성이 지켜지지 않는 상태 발생


**`💡  Solution`**
- goods_entity 테이블에 BookingCount라는 새로운 Column을 생성하여 Write Lock을 걸어 Row 수준에서의 Lock 진행
- 이를 통해 API에 다수의 사용자가 동시에 접근했을 때 순차적으로 예매할 수 있도록 설정<br>

- Transaction은 Read COMMITED로 설정하고, Find Method에 Write Lock을 걸어 동시성을 제어한다.
  -  더 높은 Isolate Level이나, Read Lock(공유락)을 설정 시 DeadLock 현상이 발생하는 문제점

- Count Method는 Row 수준의 Lock이 걸리지 않는 부분을 확인하였다
  -  Table 전체를 조회하여 해당하는 Row의 갯수를 Count 하기 때문에 Row 수준의 Lock은 걸리지 않는다.

- 따라서, Goods Table에 BookingCount Column을 추가한 뒤, 해당 Row에 Write Lock을 적용하였다.

- Transaction을 설정할 때, Transaction의 원리, Lock의 종류 등을 잘 생각하여 적용해야 한다 특히, 다수의 Transaction을 도식화하면서 분석하면, 더욱 빠르게 해법을 찾을 수 있다.

</details>

<details>
<summary><b>504 Gateway Time-out Error</b></summary>

**`❗  Issue`**

- 약 VUser 3500 / Run Count 1000 이상의 부하 조건에서 504 Gateway Time-Out Error 발생

**`💡  Solution`**
- 한 서버가 다른 서버로부터 제때 응답을 받지 못했기 때문에 로드 밸런서의 timeout 값 설정을 통해 자체 대기 시간 및 리소스 제한 해결<br>



</details>

## 기술스택

| 분류         | 기술                                                                                                                                                                                                                                                                                                                               |
| ------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Language     | <img src="https://img.shields.io/badge/javascript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=white"> <img src="https://img.shields.io/badge/typescript-3178C6?style=for-the-badge&logo=typescript&logoColor=white">                                                                                                      |
| FrameWork    | <img src="https://img.shields.io/badge/nestjs-E0234E?style=for-the-badge&logo=nestjs&logoColor=white">                                                                                                                                                                                                                             |
| DB & ORM     | <img src="https://img.shields.io/badge/postgresql-4169E1?style=for-the-badge&logo=postgresql&logoColor=white"> <img src="https://img.shields.io/badge/repmgr-4169E1?style=for-the-badge&logo=postgresql&logoColor=white"> <img src="https://img.shields.io/badge/typeorm-512BD4?style=for-the-badge&logo=typeorm&logoColor=white"> |
| Caching      | <img src="https://img.shields.io/badge/redis-DC382D?style=for-the-badge&logo=redis&logoColor=white"> <img src="https://img.shields.io/badge/bulljs-004088?style=for-the-badge&logo=bulljs&logoColor=white">                                                                                                                        |
| Monitor      | <img src="https://img.shields.io/badge/-Elasticsearch-005571?style=for-the-badge&logo=elasticsearch&logoColor=white"> <img src="https://img.shields.io/badge/-kibana-005571?style=for-the-badge&logo=kibana&logoColor=white">                                                                                                      |
| Test         | <img src="https://img.shields.io/badge/ngrinder-ff7f00?style=for-the-badge&logo=ngrinder&logoColor=white">                                                                                                                                                                                                                         |
| Cloud & OS   | <img src="https://img.shields.io/badge/AWS-%23FF9900.svg?style=for-the-badge&logo=amazon-aws&logoColor=white"> <img src="https://img.shields.io/badge/Ubuntu-E95420?style=for-the-badge&logo=ubuntu&logoColor=white">                                                                                                              |
| Load Balance | <img src="https://img.shields.io/badge/haproxy-E95420?style=for-the-badge&logo=haproxy&logoColor=white"> <img src="https://img.shields.io/badge/pgpool-E95420?style=for-the-badge&logo=pgpool&logoColor=white">                                                                                                                    |
| Etc          | <img src="https://img.shields.io/badge/docker-%230db7ed.svg?style=for-the-badge&logo=docker&logoColor=white"> <img src="https://img.shields.io/badge/-Swagger-%23Clojure?style=for-the-badge&logo=swagger&logoColor=white">                                                                                                        |

## 구성원

|역할|이름|깃허브|
|------|---|---|
|BE(팀장)|윤문열|https://github.com/munyeol-Yoon|
|BE|박형주|https://github.com/Hangju0610|
|BE|신성윤|https://github.com/since1630|
|BE|이상한|https://github.com/tkdgks7036|
