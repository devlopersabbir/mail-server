import http from "k6/http";
import { check, sleep } from "k6";

export const options = {
  stages: [
    { duration: "10s", target: 100 }, // Ramp up to 100 virtual users over 10 seconds
    { duration: "30s", target: 80 }, // Stay at 80 virtual users for 30 seconds
    { duration: "10s", target: 0 }, // Ramp down to 0 virtual users over 10 seconds
  ],
  thresholds: {
    http_req_failed: ["rate<0.01"], // Less than 1% of requests should fail
    http_req_duration: ["p(95)<100"], // 95% of requests should finish within 100ms
  },
};

const BASE_URL = __ENV.BASE_URL || "http://localhost:8080";

export default function () {
  // 1. GET / - Root route
  const rootRes = http.get(`${BASE_URL}/`);
  check(rootRes, {
    "root status is 200": (r) => r.status === 200,
    "has node_name": (r) => r.body.includes("node_name"),
  });

  // 2. POST /send-email - Triggers DB Write (MongoDB) + Cache Set (Redis)
  const payload = JSON.stringify({
    to: ["loadtest@example.com"],
    subject: "K6 Load Test Email",
    body: "Testing DB persistence and Redis caching under load",
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

  // 3. GET /job-status - Triggers Redis Cache Lookup -> MongoDB Fallback
  const statusRes = http.get(`${BASE_URL}/job-status`);
  check(statusRes, {
    "job-status status is 200": (r) => r.status === 200,
  });

  // 4. GET /metrics - System metrics
  const metricsRes = http.get(`${BASE_URL}/metrics`);
  check(metricsRes, {
    "metrics status is 200": (r) => r.status === 200,
  });

  sleep(0.1);
}
