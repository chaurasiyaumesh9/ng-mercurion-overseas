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

Deploy Angular build output from `dist/mercurion-overseas/browser` through the SCA deploy Restlet:

```bash
npm run build
npm run deploy:netsuite
```

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
```

Optional custom env file:

```bash
node scripts/deploy-netsuite.js --envFile=.env.netsuite
```

You can also pass values via CLI flags:

```bash
node scripts/deploy-netsuite.js --account=... --clientId=... --certificateId=... --privateKey="..." --folderId=... --scriptId=... --deployId=...
```
