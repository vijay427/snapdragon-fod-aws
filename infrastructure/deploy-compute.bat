@echo off
echo Deploying Compute Stack with TypeScript bundling...
npx cdk deploy FOD-Compute-dev --require-approval never
pause
