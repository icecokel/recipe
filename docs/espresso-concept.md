# Espresso Recipe Concept

## 목적

에스프레소는 완성된 조리법보다 반복해서 마시며 조정하는 기록에 가깝다. 이 문서는 에스프레소 레시피를 일반 요리 레시피와 분리해 관리하기 위한 기준을 정리한다.

## 기본 개념

- 에스프레소 기록의 중심은 원두다.
- 각 항목의 타이틀은 원두 이름으로 둔다.
- 레시피는 고정된 정답이 아니라, 마실 때마다 남기는 추출 기록이다.
- 같은 원두라도 날짜, 분쇄도, 도징, 추출량, 시간, 맛에 따라 여러 기록이 쌓일 수 있다.

## 기록 단위

에스프레소 기록은 원두별로 묶는다. 원두 이름 아래에 그때그때 사용한 레시피를 추가한다.

예시:

```json
{
  "title": "원두 이름",
  "recipe": []
}
```

## 레시피 칸의 의미

`recipe`는 해당 원두로 마셨던 추출 기록을 담는 칸이다. 처음에는 빈 배열로 시작하고, 마실 때마다 필요한 만큼 추가한다.

예시:

```json
{
  "title": "원두 이름",
  "recipe": [
    {
      "type": "log",
      "rounds": [
        {
          "round": 1,
          "recipe": {
            "dose": "18g",
            "yield": "36g",
            "extractionTime": "28초"
          },
          "result": {
            "taste": [
              "단맛 증가",
              "산미 감소"
            ]
          }
        }
      ]
    }
  ]
}
```

## 일반 레시피와의 차이

일반 요리 레시피는 재료와 조리 순서를 다시 만들기 쉽게 정리한다. 에스프레소 기록은 같은 원두를 더 잘 이해하기 위해 추출 조건과 맛의 변화를 남긴다.

따라서 에스프레소 데이터는 `ingredients`나 `source` 없이 시작해도 된다. 필요해지면 나중에 원두 정보, 날짜, 장비, 맛 기록 같은 필드를 추가한다.

## 현재 기준

- 데이터는 일반 레시피와 분리한다.
- 원문 입력은 `data/espresso-raw-records.json`에 보관한다.
- 화면과 입력 폼에서 사용할 정규화 데이터는 `data/espresso-normalized-recipes.json`을 사용한다.
- 정규화 데이터 파일은 `schemaVersion`과 `beans` 배열을 갖는 구조를 사용한다.
- 각 원두는 `id`, `name`, `goals`, `defaultEquipment`, `logs`를 갖는다.
- 각 로그는 `rounds`, `currentAnalysis`, `adjustmentGuide`, `nextTest`, `nextDirection`을 갖는다.
- 각 라운드는 `id`, `roundNumber`, `date`, `recipe`, `result`, `analysis`, `nextActions`를 갖는다.
- 도징, 추출량, 온도, 시간, 압력처럼 단위가 있는 값은 `{ "value": 20, "unit": "g" }` 또는 `{ "min": 28, "max": 34, "unit": "sec" }` 형태로 기록한다.
- 타입 기준은 `src/espresso-types.js`의 JSDoc typedef를 따른다.
