/**
 * @typedef {Object} RecipeSource
 * @property {"notion" | "youtube" | "web"} type
 * @property {string} url
 */

/**
 * @typedef {Object} Recipe
 * @property {string} name
 * @property {string[]} tags
 * @property {string[]} ingredients
 * @property {string[]} recipe
 * @property {RecipeSource} [source]
 */

module.exports = {};
