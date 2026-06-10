/**
 * 원문 입력 그대로 보존하는 파일 구조.
 * 이 데이터는 사용자가 입력한 문장, 메모, 비정형 필드를 잃지 않기 위한 원천 기록이다.
 *
 * @typedef {Object} EspressoRawDataFile
 * @property {1} schemaVersion
 * @property {EspressoRawEntry[]} entries
 */

/**
 * @typedef {Object} EspressoRawEntry
 * @property {string} id
 * @property {string} beanName
 * @property {"manual" | "import"} source
 * @property {string} capturedAt
 * @property {string} text
 * @property {string} [normalizedBeanId]
 * @property {string} [normalizedLogId]
 * @property {string} [normalizedRoundId]
 */

/**
 * 화면 렌더링, 검색, 향후 입력 폼 저장에 사용하는 정규화 파일 구조.
 *
 * @typedef {"g" | "sec" | "celsius" | "bar"} EspressoUnit
 */

/**
 * @typedef {Object} EspressoMeasurement
 * @property {number} [value]
 * @property {number} [min]
 * @property {number} [max]
 * @property {EspressoUnit} unit
 */

/**
 * @typedef {Object} EspressoEquipment
 * @property {string} [machine]
 * @property {string} [grinder]
 * @property {string} [basket]
 * @property {string} [tamper]
 */

/**
 * @typedef {Object} EspressoRecipeParameters
 * @property {EspressoMeasurement} [dose]
 * @property {EspressoMeasurement} [yield]
 * @property {EspressoMeasurement} [temperature]
 * @property {EspressoMeasurement} [preinfusion]
 * @property {EspressoMeasurement} [extractionTime]
 * @property {EspressoMeasurement} [targetExtractionTime]
 * @property {EspressoMeasurement} [pressure]
 * @property {string} [flow]
 * @property {string} [grind]
 */

/**
 * @typedef {Object} EspressoResult
 * @property {EspressoMeasurement} [extractionTime]
 * @property {EspressoMeasurement} [pressure]
 * @property {string[]} [taste]
 * @property {string[]} [notes]
 */

/**
 * @typedef {Object} EspressoRoundAnalysis
 * @property {string[]} [changes]
 * @property {string[]} [notes]
 * @property {string[]} [judgments]
 * @property {string[]} [inferences]
 * @property {string[]} [conclusions]
 * @property {string[]} [plannedComparisons]
 */

/**
 * @typedef {Object} EspressoRound
 * @property {string} id
 * @property {number} roundNumber
 * @property {string | null} [date]
 * @property {EspressoRecipeParameters} recipe
 * @property {EspressoResult} result
 * @property {EspressoRoundAnalysis} [analysis]
 * @property {string[]} nextActions
 */

/**
 * @typedef {Object} EspressoCurrentAnalysis
 * @property {string[]} [conditions]
 * @property {string[]} [suspectedIssues]
 */

/**
 * @typedef {Object} EspressoAdjustmentGuide
 * @property {string} condition
 * @property {string} action
 */

/**
 * @typedef {Object} EspressoMethodStep
 * @property {string} time
 * @property {string[]} steps
 */

/**
 * @typedef {Object} EspressoNextTest
 * @property {number} [targetRoundNumber]
 * @property {string[]} goals
 * @property {EspressoRecipeParameters} recipe
 * @property {EspressoMethodStep[]} method
 * @property {string[]} expectedResult
 */

/**
 * @typedef {Object} EspressoLog
 * @property {string} id
 * @property {"espresso-log"} type
 * @property {string} title
 * @property {EspressoRound[]} rounds
 * @property {EspressoCurrentAnalysis} [currentAnalysis]
 * @property {EspressoAdjustmentGuide[]} [adjustmentGuide]
 * @property {string[]} [finalHypothesis]
 * @property {EspressoNextTest} [nextTest]
 * @property {string[]} [nextDirection]
 */

/**
 * @typedef {Object} EspressoBean
 * @property {string} id
 * @property {string} name
 * @property {string} [roaster]
 * @property {string[]} goals
 * @property {EspressoEquipment} defaultEquipment
 * @property {EspressoLog[]} logs
 */

/**
 * @typedef {Object} EspressoDataFile
 * @property {1} schemaVersion
 * @property {EspressoBean[]} beans
 */

module.exports = {};
