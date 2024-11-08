REST API facade template for microservices that interacts with the MultiversX blockchain.

## Quick start

1. Run `npm install` in the project directory
2. Optionally make edits to `config/config.yaml` and/or `.env` files

## Dependencies

1. Redis Server is required to be installed [docs](https://redis.io/).
2. MySQL Server is required to be installed [docs](https://dev.mysql.com/doc/refman/8.0/en/installing.html).
3. MongoDB Server is required to be installed [docs](https://docs.mongodb.com/).

You can run `docker-compose up` (or `docker-compose up -d` as detached) in a separate terminal to use a local Docker container for all these dependencies.

After running the sample, you can stop the Docker container with `docker-compose down`

## Available Features / Modules

### `Public API`

Endpoints that can be used by anyone (public endpoints).

### `Private API`

Endpoints that are not exposed on the internet
For example: We do not want to expose our metrics and cache interactions to anyone (/metrics /cache)

### `Crons`

This is used to handle automated jobs that run on a predefined schedule. .

### `Events Notifier`

This is used for scanning the transactions from MultiversX Blockchain.

### `Grafana dashboard`

You can find a predefined Grafana dashboard with basic metrics at [http://localhost:3010](http://localhost:3010)

Use `admin` for user and password fields. Then navigate to `Dashboards` -> `Template Service`

## Available Scripts

This is a MultiversX project built on Nest.js framework.

### Environment variables

In order to simplify the scripts, the templates will use the following environment variables:

- `NODE_ENV`

**Description**: Defines the environment in which the application runs. This influences various configuration settings.

**Possible Values**: `mainnet`, `testnet`, `devnet`, `infra`

**Usage**: Determines the environment-specific configurations and behaviors of the application.

- `NODE_APP`

**Description**: Specifies which part of the application to start.

**Possible Values**: `api`, `crons`, `events-notifier`

**Usage**: Selects the specific application module to run.

- `NODE_DEBUG`

**Description**: Enables or disables development debug mode.

**Possible Values**: `true`, `false`

**Usage**: When set to true, the application starts in debug mode, useful for development.

- `NODE_WATCH`

**Description**: Enables or disables development watch mode.

**Possible Values**: `true`, `false`

**Usage**: When set to true, the application starts in watch mode, which automatically reloads the app on code changes.


### `npm run start`

Runs the app in the production mode.
Make requests to [http://localhost:3001](http://localhost:3001).

Redis Server is required to be installed.

## Running the api

```bash
# development watch mode on devnet
$ NODE_ENV=devnet NODE_APP=api NODE_WATCH=true npm run start
or
$ NODE_ENV=devnet NODE_WATCH=true npm run start:api

# development debug mode on devnet
$ NODE_ENV=devnet NODE_APP=api NODE_DEBUG=true npm run start
or
$ NODE_ENV=devnet NODE_DEBUG=true npm run start:api

# development mode
$ NODE_ENV=devnet NODE_APP=api npm run start
or
$ NODE_ENV=devnet npm run start:api

# production mode
$ NODE_ENV=mainnet NODE_APP=api npm run start
or
$ NODE_ENV=mainnet npm run start:api
```

## Running the crons

```bash
# development watch mode on devnet
$ NODE_ENV=devnet NODE_APP=crons NODE_WATCH=true npm run start
or
$ NODE_ENV=devnet NODE_WATCH=true npm run start:crons

# development debug mode on devnet
$ NODE_ENV=devnet NODE_APP=crons NODE_DEBUG=true npm run start
or
$ NODE_ENV=devnet NODE_DEBUG=true npm run start:crons

# development mode on devnet
$ NODE_ENV=devnet NODE_APP=crons npm run start
or
$ NODE_ENV=devnet npm run start:crons

# production mode
$ NODE_ENV=mainnet npm run start:crons
```

## Running the events-notifier

```bash
# development watch mode on devnet
$ NODE_ENV=devnet NODE_APP=events-notifier NODE_WATCH=true npm run start
or
$ NODE_ENV=devnet NODE_WATCH=true npm run start:events-notifier

# development debug mode on devnet
$ NODE_ENV=devnet NODE_APP=events-notifier NODE_DEBUG=true npm run start
or
$ NODE_ENV=devnet NODE_DEBUG=true npm run start:events-notifier

# development mode on devnet
$ NODE_ENV=devnet NODE_APP=events-notifier npm run start
or
$ NODE_ENV=devnet npm run start:events-notifier

# production mode
$ NODE_ENV=mainnet npm run start:events-notifier
```

Requests can be made to http://localhost:3001 for the api. The app will reload when you'll make edits (if opened in watch mode). You will also see any lint errors in the console.​

### `npm run test`

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```
### APPS short descriptions

# API endpoints: 

- `/create`: Used to start to process the csv file and create the objects for each airdrop (address & amount).
- `/cleanup-airdrops`: Used to cleanup the objects that have the tx-hash from the try to airdrop older than 5 minutes, so the CRON can make another try.
- `/count-pending`: Used to get the live number of pending airdrops.

# CRONS functions:

- `sendAirdrops`: Started every 2 minutes; Processes a batch of 10,000 airdrops as groups of 100 that are send to xBulk smart-contract;

# EVENTS-NOTIFIER functions:

- Listens on MultiversX block-chain for the transactions sended from the signer contract to the xBulk and updates the DB objects in case of success;

# Airdrop document from DB:

{
 address: string; -> receiver of the airdrop; from CSV; added at the creation
 amount: string; -> amount of the token to receive; from CSV; added at the creation
 txHash?: string; -> hash of the main transaction sended to the xBulk(the airdrops are part of this transaction); added by the cron job
 timestamp?: number; -> timestamp of the transaction try; added by the cron job
  pending?: boolean; -> set to `true` by the cron then attempting to create transactions; deleted when events-notifier finds the transaction with success;
  success?: boolean; -> set to `true` when events notifier finds the transaction with success
}

# ENV values:

NETWORK= `mainnet`, `testnet`, `devnet`
API_URL= `https://devnet-api.multiversx.com` or the one from the network
GATEWAY_URL= `https://devnet-gateway.multiversx.com` or the one from the network
TOKEN_IDENTIFIER= the token identifier of the one that is subject of the airdrop
QUEUE_URL= URL of the notifier queue
XBULK_ADDRESS= Address of the xBulk smart-contract used
MNEMONIC_1= Mnemonic of the wallet that holds the tokens for the airdrop and will be used to send them


### How to use:

**Example for DEVNET**

- add CSV file in: `./libs/services/src/constants/airdrop.csv`; format: "address","amount"
- `docker-compose up -d` - to create the docker part of the project (DB)
- `NODE_ENV=devnet npm run start:api` - starts the API 
- `NODE_ENV=devnet npm run start:crons` - starts the CRONS 
- `NODE_ENV=devnet npm run start:events-notifier` - starts the EVENTS-NOTIFIER

After starting the apps and creating the docker container:

1. #manual Use `/create` endpoint to process the CSV file and create the airdrops in DB;
2. #auto CRON app will take the batches and will attempt to create transactions on blockchain till the completion;
3. #auto EVENTS-NOTIFIER app will find the ones with success and will updated them in DB till the completion;
4. #manual Can use `/count-pending` to see live time the number of the transactions that CRON attempted to create on blockchain but are not yet successful;
5. #manual Can use `/cleanup-airdrops` to delete the pending transactions (after a considered time; for transactions that do not reached the blockchain)