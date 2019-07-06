module.exports = {
  "extends": "ebay",
  "env": {
    "browser": true,
    "node": true
  },
  "plugins": [
      "chai-friendly"
  ],
  "rules": {
    "no-unused-expressions": 0,
    "chai-friendly/no-unused-expressions": 2,
    "no-unused-vars": ["error", { "args": "none" }]
  },
  "overrides": [{
    "files": ["src/**.js"],
    "parserOptions": {
      "sourceType": "module"
    }
  }]
}
