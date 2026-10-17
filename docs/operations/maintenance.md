# Graceful maintenance mode (GR-17)

To display the customer-friendly maintenance page on a locally started process:
`MAINTENANCE_MODE=1 npm run start`. To resume normal service:
`MAINTENANCE_MODE=0 npm run start`.

On managed deployments set the same environment variable in the application
deployment and roll out a new revision (for example:
`kubectl set env deployment/<deployment-name> MAINTENANCE_MODE=1`; reverse to
`MAINTENANCE_MODE=0`). Replace the placeholder with the real deployment.
Do not use maintenance mode to mask failed readiness. The `/ready` route
is exempt and continues to report actual DB health. Normal routes respond
with HTTP 503, `Retry-After: 60`, a short request reference, and standalone
HTML that needs neither JavaScript nor a running database. The load-balancer
fallback remains an orchestrator-owned separate deployment task.
