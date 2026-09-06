const axios = require("axios");

const URL = "https://smt.smtsigma.com/api/";
const TOTAL_REQUESTS = 100000000;
const CONCURRENCY = 5;

async function worker(start, end) {
  for (let i = start; i < end; i++) {
    const started = Date.now();

    try {
      const response = await axios.get(URL, {
        timeout: 5000,
      });

      console.log(
        `#${i + 1} -> ${response.status} -> ${Date.now() - started}ms`
      );
    } catch (error) {
      console.log(
        `#${i + 1} -> ERROR -> ${error.code || error.message}`
      );
    }
  }
}

async function loadTest() {
  const batchSize = Math.ceil(TOTAL_REQUESTS / CONCURRENCY);
  const workers = [];

  for (let i = 0; i < CONCURRENCY; i++) {
    const start = i * batchSize;
    const end = Math.min(start + batchSize, TOTAL_REQUESTS);

    if (start < end) {
      workers.push(worker(start, end));
    }
  }

  await Promise.all(workers);

  console.log("Load test completed.");
}

loadTest();
