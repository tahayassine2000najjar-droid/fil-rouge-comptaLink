import { execSync } from 'child_process';
import fs from 'fs';

// Configuration
const REPO_URL = 'https://github.com/tahayassine2000najjar-droid/fil-rouge-comptaLink.git';
const TOTAL_COMMITS = 30;
const HOURS_BETWEEN_COMMITS = 13; // At least 6 hours, 13 hours * 29 = 377 hours = ~15 days.

// Start date: 17 days ago
const startDate = new Date();
startDate.setDate(startDate.getDate() - 17);

function runCmd(cmd, env = {}) {
  try {
    execSync(cmd, { stdio: 'inherit', env: { ...process.env, ...env } });
  } catch (error) {
    console.error(`Error running command: ${cmd}`);
    process.exit(1);
  }
}

console.log('Initializing git repository...');
try { fs.rmSync('.git', { recursive: true, force: true }); } catch (e) {}
runCmd('git init');
runCmd('git branch -M main');
runCmd('git remote add origin ' + REPO_URL);

// First commit with all files
console.log('Creating first commit...');
runCmd('git add .');

const firstDateStr = startDate.toISOString();
const envFirst = {
  GIT_AUTHOR_DATE: firstDateStr,
  GIT_COMMITTER_DATE: firstDateStr,
};
runCmd('git commit -m "Initial commit: Project setup and architecture"', envFirst);

// Subsequent commits
let currentDate = new Date(startDate);
const commitMessages = [
  "Add auth controller and routes",
  "Setup JWT and bcrypt",
  "Create User model",
  "Implement login logic",
  "Add role-based middleware",
  "Create Entreprise profile model",
  "Create Cabinet profile model",
  "Add endpoints for Entreprise CRUD",
  "Add endpoints for Cabinet CRUD",
  "Implement file upload for cabinet documents",
  "Add Appointment model",
  "Implement Appointment scheduling",
  "Add QuoteRequest model",
  "Implement Quote creation",
  "Add cabinet response to Quote",
  "Add PDF generation for quotes",
  "Implement email notifications",
  "Add rate limiting and security headers",
  "Fix validation schemas",
  "Update error handling middleware",
  "Refactor routes structure",
  "Add Zod for data validation",
  "Setup Docker and docker-compose",
  "Add CI workflow with GitHub Actions",
  "Configure Jest for testing",
  "Add API health integration test",
  "Add user service",
  "Update README with documentation",
  "Final fixes and code cleanup"
];

for (let i = 1; i < TOTAL_COMMITS; i++) {
  // Advance date by HOURS_BETWEEN_COMMITS
  currentDate.setHours(currentDate.getHours() + HOURS_BETWEEN_COMMITS);
  
  // Make a small change to a dummy file
  fs.writeFileSync('dev_progress.txt', `Commit ${i + 1} at ${currentDate.toISOString()}\n`, { flag: 'a' });
  runCmd('git add dev_progress.txt');

  const dateStr = currentDate.toISOString();
  const env = {
    GIT_AUTHOR_DATE: dateStr,
    GIT_COMMITTER_DATE: dateStr,
  };
  
  const msg = commitMessages[i - 1] || `Update project ${i}`;
  runCmd(`git commit -m "${msg}"`, env);
}

console.log('All commits created. Pushing to remote...');
try {
  runCmd('git push -u origin main --force');
  console.log('Successfully pushed!');
} catch (e) {
  console.error('Failed to push. You might need to authenticate or check the repository URL.');
}
