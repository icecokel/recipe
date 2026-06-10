# Target Project Integration Guide

## 목적

이 문서는 현재 레시피/에스프레소 기록 기능을 다른 프로젝트의 하위 기능으로 옮길 때 필요한 기준을 정리한다.

타겟 프로젝트에는 이미 디자인 시스템이 어느 정도 있다고 가정한다. 따라서 이 문서는 디자인 복제보다 데이터 구조, 렌더링 책임, 입력 확장 가능성, 파일 이관 순서에 집중한다.

## 현재 기능 요약

- 일반 레시피 목록과 상세 보기
- 에스프레소 기록 보기
- 에스프레소 원문 데이터와 정규화 데이터 분리
- 정적 JSON 기반 읽기 전용 렌더링
- 순수 HTML, CSS, JS로 동작

## 이관 대상 파일

### 반드시 가져갈 파일

```text
data/recipes.json
data/espresso-raw-records.json
data/espresso-normalized-recipes.json
src/recipe-types.js
src/espresso-types.js
docs/espresso-concept.md
```

### 참고용으로 가져갈 파일

```text
app.js
index.html
styles.css
docs/page-purpose.md
```

`app.js`는 렌더링과 데이터 어댑터가 같이 들어 있는 참고 구현이다. 타겟 프로젝트가 React, Vue, Svelte, 서버 렌더링, 라우터 기반 앱 중 하나라면 `app.js`를 그대로 쓰기보다 데이터 읽기/정규화/표시 포맷 함수만 옮기는 편이 낫다.

`styles.css`는 현재 독립 정적 페이지용 스타일이다. 타겟 프로젝트의 디자인 시스템이 있다면 그대로 복사하지 말고, 필요한 레이아웃 계층과 상태 클래스만 참고한다.

## 권장 타겟 구조

타겟 프로젝트 하위에 기능을 넣는다면 다음처럼 분리한다.

```text
recipe/
  data/
    recipes.json
    espresso-raw-records.json
    espresso-normalized-recipes.json
  types/
    recipe-types.js
    espresso-types.js
  lib/
    espresso-normalize.js
    espresso-format.js
  components/
    RecipeList
    RecipeDetail
    EspressoBeanList
    EspressoRoundList
```

정적 페이지 형태를 유지한다면 현재 구조를 거의 그대로 유지해도 된다.

```text
recipe/
  index.html
  app.js
  styles.css
  data/
  src/
```

## 데이터 계약

### 일반 레시피

일반 레시피는 `data/recipes.json`을 기준으로 한다.

```js
/**
 * @typedef {Object} Recipe
 * @property {string} name
 * @property {string[]} tags
 * @property {string[]} ingredients
 * @property {string[]} recipe
 * @property {{ type: "notion" | "youtube" | "web", url: string }} [source]
 */
```

일반 레시피는 입력 폼을 만들 때도 단순 배열 구조를 유지해도 된다.

### 에스프레소 로우 데이터

원문 입력은 `data/espresso-raw-records.json`에 보관한다.

역할:
- 사용자가 입력한 문장과 맥락을 손실 없이 보존
- 정규화 과정에서 누락이 생겨도 원문으로 복구 가능
- 나중에 자동 파싱이나 AI 기반 정규화가 붙을 때 입력 소스로 사용

핵심 구조:

```json
{
  "schemaVersion": 1,
  "entries": [
    {
      "id": "raw-fritz-jal-doeeo-gasina-round-004",
      "beanName": "프릳츠 잘 되어 가시나",
      "source": "manual",
      "capturedAt": "2026-06-11",
      "text": "오늘 에스프레소 히스토리 추가...",
      "normalizedBeanId": "bean-fritz-jal-doeeo-gasina",
      "normalizedLogId": "log-home-espresso-001",
      "normalizedRoundId": "round-004"
    }
  ]
}
```

### 에스프레소 정규화 데이터

화면, 검색, 입력 폼, 통계는 `data/espresso-normalized-recipes.json`을 기준으로 한다.

최상위 구조:

```json
{
  "schemaVersion": 1,
  "beans": []
}
```

핵심 계층:

```text
EspressoDataFile
  beans[]
    logs[]
      rounds[]
```

단위가 있는 값은 문자열이 아니라 측정 객체로 저장한다.

```json
{
  "dose": { "value": 20, "unit": "g" },
  "yield": { "value": 38, "unit": "g" },
  "temperature": { "value": 88, "unit": "celsius" },
  "extractionTime": { "value": 20, "unit": "sec" },
  "targetExtractionTime": { "min": 23, "max": 27, "unit": "sec" }
}
```

타입 기준은 `src/espresso-types.js`의 JSDoc을 따른다.

## 입력 기능을 붙일 때의 권장 흐름

사용자가 에스프레소 기록을 입력하는 경우 두 파일을 함께 갱신한다.

1. 사용자가 입력한 원문을 `espresso-raw-records.json`에 먼저 저장한다.
2. 입력값을 파싱해 정규화 데이터 형태로 변환한다.
3. 새 라운드를 `espresso-normalized-recipes.json`의 해당 원두/로그에 추가한다.
4. raw entry에 `normalizedBeanId`, `normalizedLogId`, `normalizedRoundId`를 기록한다.
5. 화면은 raw가 아니라 normalized 파일만 읽는다.

이렇게 하면 입력 UI가 완성되기 전에도 원문 데이터 손실 없이 기록을 쌓을 수 있다.

## 현재 app.js에서 가져갈 로직

타겟 프로젝트로 옮길 때 우선순위가 높은 로직은 다음이다.

- `normalizeEspressoData`
- `formatMeasurement`
- `formatValue`
- `unitLabel`
- `collectSearchText`
- `recipeMatches`

렌더링 함수는 타겟 프레임워크에 맞춰 다시 작성하는 편이 좋다.

- `createBeanCard`
- `createLogCard`
- `createRoundCard`
- `createRecipeCard`
- `createRecipeDetail`

## 디자인 이관 기준

타겟 프로젝트에 디자인 시스템이 있다면 다음만 유지한다.

- 레시피 목록은 카드 또는 리스트 항목으로 진입
- 레시피 상세는 목록과 분리된 상세 화면
- 에스프레소는 원두 헤더, 요약 통계, 라운드 목록, 다음 테스트 영역으로 계층화
- raw 데이터는 화면에 직접 노출하지 않음
- normalized 데이터만 화면에 표시

현재 `styles.css`는 노션형 정적 페이지 참고용이다. 타겟 프로젝트에서는 다음 클래스 의미만 참고한다.

```text
recipe-card
recipe-detail-card
espresso-bean-card
espresso-bean-header
espresso-stat
espresso-round-card
espresso-next-panel
```

## 적용 체크리스트

- [ ] `data/recipes.json` 복사
- [ ] `data/espresso-raw-records.json` 복사
- [ ] `data/espresso-normalized-recipes.json` 복사
- [ ] `src/recipe-types.js` 또는 동등한 타입 정의 추가
- [ ] `src/espresso-types.js` 또는 동등한 타입 정의 추가
- [ ] 앱에서 에스프레소 화면은 normalized 파일만 읽도록 연결
- [ ] 입력 기능은 raw 저장 후 normalized 갱신 순서로 구현
- [ ] 단위값은 문자열이 아니라 `{ value, unit }` 또는 `{ min, max, unit }` 구조로 저장
- [ ] 기존 디자인 시스템의 카드, 탭, 입력 컴포넌트로 화면 재구성
- [ ] raw 원문 텍스트가 사용자 화면에 직접 노출되지 않는지 확인

## 정적 배포 주의점

현재 구현은 `fetch()`로 JSON을 읽는다. 따라서 `file://`로 열면 JSON 로딩이 막힐 수 있다. 정적 배포나 로컬 서버에서 실행해야 한다.

로컬 확인 예시:

```sh
python3 -m http.server 4174
```

정적 호스팅에 올릴 때는 다음 파일들이 같은 public root 아래에 있어야 한다.

```text
index.html
app.js
styles.css
data/
```

타겟 프로젝트가 빌드 시스템을 사용한다면 `data/*.json`이 public asset으로 배포되는 위치를 먼저 정해야 한다.
