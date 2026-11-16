'use strict';
const { main } = require('./ecommerce-agents/evaluation-runner');
if (require.main === module) {
  if (process.argv.length !== 3) {
    console.error('Supply one new real-agent evaluation evidence directory');
    process.exitCode = 1;
  } else {
    main().catch((error) => {
      console.error(error.message);
      process.exitCode = 1;
    });
  }
}
module.exports = { main };
