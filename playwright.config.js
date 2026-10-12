import {defineConfig} from '@playwright/test';
export default defineConfig({testDir:'./e2e',timeout:60000,use:{baseURL:'http://localhost:4173/Blue-Green/',viewport:{width:390,height:844},launchOptions:{executablePath:'/usr/bin/chromium',args:['--no-sandbox']}},webServer:{command:'npm run preview -- --port 4173',url:'http://localhost:4173/Blue-Green/',reuseExistingServer:true}});
