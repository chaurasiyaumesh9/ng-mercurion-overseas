# MercurionOverseas

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 21.0.4.

## Development server

To start a local development server, run:

```bash
ng serve Or npm run start or npm run serve:ssp
```

Once the server is running, open your browser and navigate to `http://localhost:4200/` or `https://sca.primarysports.com/sca-dev-2019-2/ng-shopping-local.ssp#/`. The application will automatically reload whenever you modify any of the source files.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with the [Vitest](https://vitest.dev/) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.

## NetSuite File Cabinet Deploy

Deploy Angular build output from `dist/mercurion-overseas/browser` through the SCA deploy Restlet.

This flow deploys these files together in one command:

- `ng-shopping.ssp`
- `ng-shopping-local.ssp`
- all files from the Angular `dist` bundle

`ng-shopping.ssp` and `ng-shopping-local.ssp` are read from the repo folder `ssp/` (fallback: generated from `index.html` when files are missing).
SSP files are uploaded to `NS_TARGET_FOLDER_ID`, while Angular build files are uploaded to `NS_TARGET_FOLDER_ID/fastcommerce` (auto-created if missing).

```bash
npm run deploy:ssp
```

`NS_TARGET_FOLDER_ID` is read from `.env.netsuite`.

Recommended setup:

```bash
Populate values in `.env.netsuite`, then run deploy.
```

Required environment variables:

```bash
NS_ACCOUNT_ID=<your_account_id>
NS_CLIENT_ID=<your_client_id>
NS_CERTIFICATE_ID=<your_certificate_id>
NS_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"
NS_TARGET_FOLDER_ID=<target_folder_id>
NS_DEPLOY_SCRIPT_ID=customscript_sca_deployer
NS_DEPLOY_DEPLOY_ID=customdeploy_sca_deployer
```

Optional variables:

```bash
NS_BUILD_DIR=dist/mercurion-overseas/browser
NS_DEPLOY_BATCH_BYTES=4194304
NS_DEPLOY_BATCH_FILES=100
NS_SET_IS_ONLINE=true
NS_SSP_BASE_PATH=/fastcommerce/
NS_DEPLOY_SUBFOLDER=fastcommerce
NS_PREFER_REPO_SSP_FILES=true
NS_REQUIRE_FOLDER_ARG=true
NS_NG_SHOPPING_FILE_NAME=ng-shopping.ssp
NS_NG_SHOPPING_BASE_HREF=ng-shopping.ssp
NS_NG_SHOPPING_LOCAL_FILE_NAME=ng-shopping-local.ssp
NS_NG_SHOPPING_LOCAL_BASE_HREF=/
NS_CLEAN_TARGET_FOLDER=true
NS_FILE_RECORD_TYPES=mediaitem,mediaItem,file
NS_FOLDER_RECORD_TYPES=folder,mediaitemfolder,mediaItemFolder
```

Optional custom env file:

```bash
node scripts/deploy-netsuite.js --envFile=.env.netsuite
```

You can also pass values via CLI flags:

```bash
node scripts/deploy-netsuite.js --account=... --clientId=... --certificateId=... --privateKey="..." --folderId=... --scriptId=... --deployId=...
```

Base href behavior for second-approach SSP deployment:

```bash
# Standalone ng-shopping.ssp access
node scripts/deploy-netsuite.js --folderId=... --ngShoppingBaseHref=ng-shopping.ssp

# Homepage touchpoint routing
node scripts/deploy-netsuite.js --folderId=... --ngShoppingBaseHref=/
```
