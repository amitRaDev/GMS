const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load .env from root
const envPath = path.join(__dirname, '..', '.env');
const result = dotenv.config({ path: envPath });

if (result.error) {
  console.error('Error loading .env file:', result.error);
  process.exit(1);
}

const env = result.parsed;

// Generate frontend environment.ts
const frontendEnvPath = path.join(__dirname, '..', 'frontend', 'src', 'environments');

// Ensure directory exists
if (!fs.existsSync(frontendEnvPath)) {
  fs.mkdirSync(frontendEnvPath, { recursive: true });
}

const envContent = `// Auto-generated from .env - DO NOT EDIT MANUALLY
export const environment = {
  production: false,
  apiUrl: '${env.API_URL}/api',
  wsUrl: '${env.API_URL}',
};
`;

const envProdContent = `// Auto-generated from .env - DO NOT EDIT MANUALLY
export const environment = {
  production: true,
  apiUrl: '${env.API_URL}/api',
  wsUrl: '${env.API_URL}',
};
`;

fs.writeFileSync(path.join(frontendEnvPath, 'environment.ts'), envContent);
fs.writeFileSync(path.join(frontendEnvPath, 'environment.prod.ts'), envProdContent);

// Update angular.json with port and host
const angularJsonPath = path.join(__dirname, '..', 'frontend', 'angular.json');
const angularJson = JSON.parse(fs.readFileSync(angularJsonPath, 'utf-8'));

angularJson.projects.frontend.architect.serve.options = {
  port: parseInt(env.FRONTEND_PORT, 10),
  host: env.HOST || '0.0.0.0'
};

fs.writeFileSync(angularJsonPath, JSON.stringify(angularJson, null, 2));

// Update config.json with CORS origins (allow both localhost and public IP)
const configPath = path.join(__dirname, '..', 'config.json');
const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));

const origins = [env.FRONTEND_URL];
// Also allow localhost for local development
if (env.PUBLIC_IP && env.PUBLIC_IP !== 'localhost') {
  origins.push(`http://localhost:${env.FRONTEND_PORT}`);
}

config.cors.origins = origins;
config.websocket.cors.origins = origins;

fs.writeFileSync(configPath, JSON.stringify(config, null, 2));

console.log('✅ Environment files generated from .env');
console.log(`   Host: ${env.HOST}`);
console.log(`   Public IP: ${env.PUBLIC_IP}`);
console.log(`   Frontend: http://${env.PUBLIC_IP}:${env.FRONTEND_PORT}`);
console.log(`   Backend: http://${env.PUBLIC_IP}:${env.BACKEND_PORT}`);
console.log(`   API URL: ${env.API_URL}`);
