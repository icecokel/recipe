/**
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
