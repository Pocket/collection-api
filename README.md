# Collections API

Provides collections: A set of static curated stories around a central theme.

## Application Overview

[Express](https://expressjs.com/) is the Node framework, [Apollo Server](https://www.apollographql.com/docs/apollo-server/) is used in Express to expose a GraphQL API, and [Prisma](https://www.prisma.io/) is used as the ORM. [MySQL](https://www.mysql.com/) is the relational database, though in AWS this is [Aurora Serverless](https://aws.amazon.com/rds/aurora/serverless/). [S3](https://aws.amazon.com/s3/) is used for image storage, and S3 paths are mapped to entities in MySQL.

(You may notice in `docker-compose.yml` that the MySQL image is set to `5.7` - this is for compatability with Aurora Serverless. We think this is fine because Aurora Serverless doesn't match MySQL versions.)

### GraphQL Schemas

This application has two GraphQL schemas - one public for clients (Web, Android, iOS) and one private for the [admin tools](https://github.com/Pocket/curation-admin-tools). As these schemas share data, we have created three schema files:

- `./schema-shared.graphql`
- `./schema-public.graphql`
- `./schema-admin.graphql`

`schema-shared.graphql` is stitched onto the other schemas in `src/typeDefs.ts`.

Having two schemas means we need two GraphQL endpoints, meaning two Apollo Servers. These servers are located in `src/admin/server.ts` and `src/public/server.ts`. In `src/main.ts`, we add both Apollo Servers to Express.

## Local development

### Fresh Setup

Clone the repo:

- `git clone git@github.com:Pocket/collection-api.git`
- `cd collection-api`

Prepare Prisma:

- `npm install`
- `npx prisma generate` (this generates Prisma Typescript types)

Start Docker container:

- `docker-compose up`

After Docker completes, you should be able to hit the GraphQL playground at `http://localhost:4004`.

### Working with Prisma

When you run `docker compose up`, all existing Prisma migrations will be run, getting your local database in order. But, there are a number of tasks you'll want to run when developing locally.

#### Resetting & Seeding the Database

Though `docker compose up` will get your database schema set, you'll probably want some test data in there to play with. You can wipe the database and inject seed data by running `docker compose exec app npx prisma migrate reset`. This will ensure all migrations have been run (which they will have been during `docker compose up`), and will also run the `prisma/seed.ts` file, which will create data for the following entities: `CollectionAuthor`, `Collection`, and `CollectionStory`.

TODO: Add images to our seeder?

#### Adding a Migration

If you need to change the Prisma schema (in `prisma/schema.prisma`), you'll need to create a migration to ensure the database is in sync. After you have made your changes to `schema.prisma`, run `docker compose exec app npx prisma migrate dev --name some_meaningful_migration_name`. This will create a migration script in `prisma/migrations` and will automatically run the new migration. This will also re-create your Prisma Typescript types.

#### Re-creating Prisma Typescript Types

If your local environment gets messed up (it happens), you can re-create your Prisma Typescript types by running `npx prisma generate`. (Note that you don't have to do this within the Docker container, but you can if you want.)

## Running Tests

We have two test commands, one for unit/functional tests and one for integration tests. These are both run by [Jest](https://jestjs.io/) and are differentiated by file names. Any file ending with `.spec.ts` will be run in the unit/functional suite, while integration tests should have the `.integration.ts` suffix.

Unit/functional tests are self-contained, meaning they do not rely on any external services. Integration tests rely on MySQL and AWS (which is mocked by a [localstack](https://github.com/localstack/localstack) Docker container locally).

Test are run via `npm` commands:

- Unit/functional: `npm test`
- Integration: `docker compose exec app npm run test-integrations`

### Testing Federated Resolvers

TODO: Describe what Federated Resolvers are

When you want to test the federated resolvers you can use a query like the below:

```graphql
query {
  _entities(
    representations: [
      {
        givenUrl: "https://getpocket.com/collections/daniels-first-collection"
        __typename: "Item"
      }
      {
        givenUrl: "https://getpocket.com/collections/mathijss-first-collection"
        __typename: "Item"
      }
    ]
  ) {
    ... on Item {
      collection {
        title
      }
    }
  }
}
```

## Digging into the Database

Sometimes it's nice to look in the database to see what's actually going on with data. Here are a few handy commands for that.

First, get into MySQL:

- `docker compose exec mysql bash`
- `mysql -u root`

Once you're there, you can inspect the available databases with `show databases;`. Select the `collections` database with `use collections;`.

From there, you can inspect the structure and data of tables contained within:

- `show tables;` shows all available tables
- `describe {tablename};` will show you the schema for a table
- `select * from {tablename};` will show you all the data for a table

From here you can issue any SQL statements you want to view/change data. Don't mess with the table schemas though. If you need to change table schemas, do that through Prisma migrations (see above).

### What About a GUI?

Command line not your thing? That's fine. You can connect to MySQL through any GUI you like. It's available at `localhost:3308`. You're responsible for setting up your own GUI though. 😉
