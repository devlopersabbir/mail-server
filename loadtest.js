import http from "k6/http";
import { check, sleep } from "k6";

export const options = {
  stages: [
    { duration: "10s", target: 50 },  // Ramp up to 50 VUs
    { duration: "20s", target: 150 }, // Sustained load 150 VUs
    { duration: "10s", target: 0 },   // Cool down
  ],
  thresholds: {
    http_req_failed: ["rate<0.05"],
    http_req_duration: ["p(95)<1000"],
  },
};

const BASE_URL = __ENV.BASE_URL || "http://localhost:8080";

export default function () {
  const randomId = Math.floor(Math.random() * 1000000);

  // 1. POST /send-email
  const payload = JSON.stringify({
    to: [
      `user1_${randomId}@example.com`,
      `user2_${randomId}@example.com`,
    ],
    subject: `Heavy Load Test Email #${randomId}`,
    body: "Load testing payload for MongoDB & Redis",
  });

  const params = {
    headers: {
      "Content-Type": "application/json",
    },
  };

  const sendRes = http.post(`${BASE_URL}/send-email`, payload, params);
  check(sendRes, {
    "send-email status is 202": (r) => r.status === 202,
  });

  // 2. GET /job-status
  const statusRes = http.get(`${BASE_URL}/job-status`);
  check(statusRes, {
    "job-status status is 200": (r) => r.status === 200,
  });

  // 3. GET /metrics
  const metricsRes = http.get(`${BASE_URL}/metrics`);
  check(metricsRes, {
    "metrics status is 200": (r) => r.status === 200,
  });

  sleep(0.1);
}
