// Reads the running local fixed-endpoint adapter. No wallet, signer or broadcast.
const response = await fetch('http://localhost:5173/api/qorechain/health');
if (!response.ok) throw new Error(`Local adapter returned ${response.status}. Run npm run dev first.`);
const health = await response.json();
console.log(JSON.stringify(health, null, 2));
if (!health.native?.ok) process.exitCode = 1;
