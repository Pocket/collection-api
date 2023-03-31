# Collections API

Provides collections: A set of static curated stories around a central theme.

## Application Healthcheck
For the deployed application, there is a [Cloudwatch healthcheck](https://us-east-1.console.aws.amazon.com/cloudwatch/home?region=us-east-1#synthetics:canary/detail/collectionapi-prod), hooked up to [this alarm (which will page Backend Team via Pagerduty)](https://us-east-1.console.aws.amazon.com/cloudwatch/home?region=us-east-1#alarmsV2:alarm/pocket-collectionapi-prod-synthetic-check-access?~(search~'collection)).

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

## Local Development

### Fresh Setup

Clone the repo:

- `git clone git@github.com:Pocket/collection-api.git`
- `cd collection-api`

Prepare Prisma:

- `npm install`
- `npx prisma generate` (this generates Prisma Typescript types)

Start Docker container:

- `docker compose up`

After Docker completes, you should be able to access the GraphQL playground at `http://localhost:4004`.

### Admin API Authorization

The admin API requires HTTP headers be set to authorize operations (both queries and mutations). The public API does not require any authorization.

To run queries _against the `/admin` API_ in the GraphQL playground, you'll need to specify some HTTP headers. To do so:

1. Open up the GraphQL playground at `http://localhost:4004` and make sure your playground tab's address is `http://localhost:4004/admin`.
2. Click the **HTTP HEADERS** link at the bottom of the left hand side of the playground to reveal a text box.
3. Enter the necessary headers (see sample below) into the box and try an operation - it should work!

The sample headers below allow full access to all queries and mutations:

```typescript
{
  "groups": "mozilliansorg_pocket_collection_curator_full",
  "name": "Matt McPockets",
  "username": "ad|Mozilla-LDAP|mmcpockets"
}
```

Note that the `groups` header can contain mulitple values separated by commas (but still in a single string).

If you'd like to experiment with different levels of authorization, you can find the full list of Mozillian groups on our [Shared Data document](https://getpocket.atlassian.net/wiki/spaces/PE/pages/2584150049/Pocket+Shared+Data#Source-of-Truth.3).

### Limitations

- Images saved to S3 via [localstack](https://github.com/localstack/localstack) do not render. This appears to be an access/URL issue and could potentially be fixed.
- Running integration tests will wipe your local database. The database can be re-seeded - see [Resetting & Seeding the Database](#resetting--seeding-the-database) below.

### Working with Prisma

When you run `docker compose up`, all existing Prisma migrations will be run, getting your local database in order. But, there are a number of tasks you'll want to run when developing locally.

#### Resetting & Seeding the Database

Though `docker compose up` will get your database schema set, you'll probably want some test data in there to play with. You can wipe the database and inject seed data by running

```bash
docker compose exec app npx prisma migrate reset
```

This will ensure all migrations have been run (which they will have been during `docker compose up`), and will also run the `prisma/seed.ts` file, which will create sample data for all the entities in the database.

#### Adding a Migration

If you need to change the Prisma schema (in `prisma/schema.prisma`), you'll need to create a migration to ensure the database is in sync. After you have made your changes to `schema.prisma`, run

```bash
docker compose exec app npx prisma migrate dev --name some_meaningful_migration_name
```

This will create a migration script in `prisma/migrations` and will automatically run the new migration. This will also re-create your Prisma Typescript types.

#### Re-creating Prisma Typescript Types

If your local environment gets messed up (it happens - for example switching to a branch with a different prisma schema), you can re-create your Prisma Typescript types by running `npx prisma generate`. (Note that you don't have to do this within the Docker container, but you can if you want.)

### Running Tests

We have two test commands, one for unit/functional tests and one for integration tests. These are both run by [Jest](https://jestjs.io/) and are differentiated by file names. Any file ending with `.spec.ts` will be run in the unit/functional suite, while integration tests should have the `.integration.ts` suffix.

Unit/functional tests are self-contained, meaning they do not rely on any external services. Integration tests rely on MySQL and AWS (which is mocked by a [localstack](https://github.com/localstack/localstack) Docker container locally).

Test are run via `npm` commands:

- Unit/functional:

```bash
npm test
```

- Integration:

```bash
docker compose exec app npm run test-integrations
```

**NOTE** Running integration tests locally will result in your local database being emptied. Refer to [Resetting & Seeding the Database](#resetting--seeding-the-database) above to repopulate seed data.

### Federated Resolvers

This API acts as a federated resolver for the the `Item` property defined by the `parser-graphql-wrapper` service. This extension is defined in [schema-shared.graphql](./schema-shared.graphql). Based on the `givenUrl` value provided by the `parser-graphql-wrapper`, a Collection may or may not be found.

For example, say someone passes the following URL to the [`getItemByUrl` query on the `parser-graphql-wrapper` service](https://github.com/Pocket/parser-graphql-wrapper/blob/main/schema.graphql#L346): https://getpocket.com/collections/how-to-help-kids-work-through-big-feelings

The federation service (Apollo) will "send" that url to the `Item` extension defined in [schema-shared.graphql](./schema-shared.graphql). The fancy resolver for this operation lives in [./src/public/resolvers/item.ts](./src/public/resolvers/item.ts). This resolver retrieves the slug from the URL (in this case `how-to-help-kids-work-through-big-feelings`) and calls `batchFetchBySlugs` in [./src/dataloaders/collectionLoader.ts](./src/dataloaders/collectionLoader.ts).

And that's how a Collection can be returned from a Parser Item. :D

#### Testing Federated Resolvers

If you want to manually test the above, you can "spoof" the call normally made by the federation service:

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
        excerpt
        stories {
          title
        }
      }
    }
  }
}
```

You can think of the `_entities` bit as a representation of the federation service.

To see this in action, make sure your local database has collections with slugs that match the URLs you are specifying in each `givenUrl` above. (Or not if you want to test a non-match!)

### Digging into the Database

Sometimes it's nice to look in the database to see what's actually going on with data. Here are a few handy commands for that.

First, get into MySQL:

```bash
docker compose exec mysql bash
mysql -u root
```

Once you're there, you can inspect the available databases with `show databases;`. Select the `collections` database with `use collections;`.

From there, you can inspect the structure and data of tables contained within:

- `show tables;` shows all available tables
- `describe {tablename};` will show you the schema for a table
- `select * from {tablename};` will show you all the data for a table

From here you can issue any SQL statements you want to view/change data. Don't mess with the table schemas though. If you need to change table schemas, do that through Prisma migrations (see above).

#### What About a GUI?

Command line not your thing? That's fine. You can connect to MySQL through any GUI you like. It's available at `localhost:3308`. You're responsible for setting up your own GUI though. 😉

### Adding a Query or Mutation

Whether against the public or admin endpoint, there are a lot of connected pieces involved in adding a Query or Mutation. There are two primary areas you'll be working in here - the database and the GraphQL API.

#### Database

1. Create a function that either retrieves information from the database (query) or updates information in the database (mutation). This function will live in a file in either [database/queries](./src/database/queries) or [database/mutations](./src/database/mutations). Choose the file named after the entity on which you are operating. For example, if you needed a new query against the `CollectionStory` entity, you'd add a function in [database/queries/CollectionStory.ts](./src/database/queries/CollectionStory.ts).
2. Add tests for this new function in the associated `{entity}.integration.ts` file.
3. Add this new function to the export list in either [database/queries.ts](./src/database/queries.ts) or [database/mutations.ts](./src/database/mutations.ts) (depending on if you wrote a query or a mutation, of course).

#### GraphQL API

Once you have the database stuff ironed out, it's time to move on to connecting this database operation to the GraphQL API.

1. Add your query or mutation to the appropriate GraphQL schema file - [schema-admin.graphql](./schema-admin.graphql) or [schema-public.graphql](./schema-public.graphql). You should only add to `schema-public.graphql` if the query should be usable by outside clients - web or mobile. You should never add a mutation to this file. If a query is to be used in the admin tool, or if you're writing a mutation, add it to `schema-admin.graphql`.
2. Create a resolver that _exactly_ matches the name of the query or mutation you added to the `.graphql` file. This will be in one of four places, depending on endpoint (public or admin) and purpose (query or mutation).
   i. [admin/resolvers/queries.ts](./src/admin/resolvers/queries.ts)
   ii. [admin/resolvers/mutations.ts](./src/admin/resolvers/mutations.ts)
   iii. [public/resolvers/queries.ts](./src/public/resolvers/queries.ts)
   iv. [public/resolvers/mutations.ts](./src/public/resolvers/mutations.ts)
3. The resolver you just made should call the database function you created at the beginning. (You'll need to import this function, of course.) This is where the GraphQL API connects to the database.
4. Add your new resolver (both an `import` and an `export`) to the appropriate `index.ts` file - either [admin/resolvers/index.ts](./src/admin/resolvers/index.ts) or [public/resolvers/index.ts](./src/public/resolvers/index.ts)
5. Test your resolver in the GraphQL playground at `localhost:4004`.

## AWS Dev Environment Testing

There are a few reasons you may want to test the API in AWS:

1. Making sure a schema change/migration will successfully deploy
2. Developing the admin tool locally without having to also set up/run the API locally
3. Allowing testing/QA by the editorial team against non-production data

To deploy to the dev environment, just push to the `dev` branch. CirlceCI will detect this change and deploy for you.

```bash
git push origin my-feature-branch:dev
```

The current expectation is that our AWS dev environment may be reset/changed at any time. To be safe, you should check with your teammates to make sure no one else is testing against dev before you go deploying to it.

### Resetting Dev

There may come a time when you need to reset the Dev environment. For example, if you were testing a schema change and then want to test a different branch _without_ that schema change, the dev database and Prisma schema will be out of sync.
Another common scenario is the need to reset all test data to the initial seed data provided by the seed script.

To reset the Dev database, [follow the instructions in Confluence](https://getpocket.atlassian.net/wiki/spaces/PE/pages/2938273799/Resetting+Data+for+a+Prisma-based+Subgraph+on+Dev).
