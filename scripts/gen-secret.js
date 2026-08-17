// Usage: node scripts/gen-secret.js
console.log(require("crypto").randomBytes(48).toString("hex"));
