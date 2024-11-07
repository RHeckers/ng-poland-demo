# NgPoland

This is the demo project for Ng Poland.

## How to start the project?
1. Run: ng serve
2. Start the mock Db with: npx json-server src\assets\db.json
3. Open: http://localhost:4200/ (or a different port if you served it there)


## How to use offline feature?
1. Build the project with: ng build
2. Start the mock Db with: npx json-server src\assets\db.json
3. Serve build output with: npx http-server -p 8080 -c-1 dist/ng-poland/browser
4. Open http://127.0.0.1:8080/ 
5. Make you changes
6. Go to the chrome developer console and open the network tab
7. Open network conditions by clicking on the Wifi + gear icon 
8. Toggle the network throtteling to offline and continue using the app
9. Toggle back the network throtteling to no throtteling and evething should still work as expected
