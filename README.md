# Collections API

Provides collections: A set of static curated stories around a central theme.

## Getting started
- `docker-compose up`

## Testing Federated Resolvers

When you want to test the federated resolvers you can use a query like the below:

```graphql
query {
  _entities(
    representations: [
      { givenUrl: "https://getpocket.com/collections/daniels-first-collection", __typename: "Item" }
      { givenUrl: "https://getpocket.com/collections/mathijss-first-collection" , __typename: "Item"}
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
