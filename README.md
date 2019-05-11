# MongoDB query clause modification

> Real-world recursion: MongoDB nested query clause addition and removal

## Add an $or query clause to an existing MongoDB query

See the code at [./src/add-or-clause.js](./src/add-or-clause.js).

The parameters are `query` and `orClause`.

`query` is a MongoDB query which might or might not already contain an `$or` and/or `$and` clause.

`orClause` is an object containing and `$or` clause (it's a fully-fledged MongoDB query in its own right) eg.

```js
const orClause = {
  $or: [
    {createdAt: {$exists: false}},
    {createdAt: someDate}
  ]
};
```

There is initially just 1 thing to look out for:
1. the query does not contain an $or clause
2. the query contains an $or clause

### When there's no $or clause in the query

If there is no `$or` clause, we can simply spread our `orClause` query and the `query` parameter, ie.

```js
const newQuery = {
  ...query,
  ...orClause
};
```

That is unless there's and `$and` in there somewhere, in which case we want to add our `orClause` to the `$and`:

```js
const newQuery = {
  ...query,
  $and: [...query.$and, orClause]
};
```

### When there's an $or clause in the query

If there is an `$or` clause, we can't just overwrite it, we need to `$and` the two `$or` queries.

We should also keep existing `$and` clause contents which yields:

```js
const newQuery = {
  ...queryWithoutOrRemoved,
  $and: [
    ...(query.$and || []),
    { $or: query.$or },
    orClause
  ]
};
```

## Remove references to a field in an MongoDB query (potentially) using $or and $and

In this case we're creating a function that takes 2 parameters: `query` (MongoDB query as above) and `fieldName` (name of the field we want to remove references to).

### Remove top-level fields

The simplest thing to do is remove references to the field at the top-level of the object.

We can create a simple `omit` function using destructuring and recursion

```js
const omit = (obj, [field, ...nextFields]) => {
  const {[field]: ignore, ...rest} = obj;
  return nextFields.length > 0 ? omit(rest, nextFields) : rest;
};
```

And use it:

```js
const newQuery = omit(query, [fieldName]);
```

### Remove fields in any $or clause

To remove fields in an $or clause (which is a fully-fledged query) is as simple as taking the $or value (which is an array) and running a recursion of the function onto it.

This will remove fields at the top-level of the `$or` sub-queries _and_ in nest `$or` fields' sub-queries.

We want to make sure to remove empty $or sub-queries, since `{ $or: [ { }, {} ]}` is an invalid query.

We default the query's `$or` to an empty array and check length before spreading it back into the newQuery. This is because `{ $or: [] }` is an invalid query.

We're also careful to remove the top-level `$or` when spreading `filteredTopLevel` so that if the new `$or` is an empty array, the old `$or` is ommitted.

```js
function removeFieldReferences (query, fieldName) {
  const filteredTopLevel = omit(query, [fieldName]);

  const newOr = (filteredTopLevel.$or || [])
    .map(q => removeFieldReferences(q, fieldName))
    .filter(q => Object.keys(q).length > 0);

  return {
    ...omit(filteredTopLevel, ['$or']),
    ...(newOr.length > 0 ? {$or: newOr} : {})
  };
}
```

### Remove fields in any $and clause

The rationale for the `$and` solution is the same as for the $or solution.

We recurse and check that we're not generating an invalid query by omitting empty arrays and objects:

```js
function removeFieldReferences (query, fieldName) {
  const filteredTopLevel = omit(query, [fieldName]);

  const newAnd = (filteredTopLevel.$and || [])
    .map(q => removeFieldReferences(q, fieldName))
    .filter(q => Object.keys(q).length > 0);

  return {
    ...omit(filteredTopLevel, ['$and']),
    ...(newAnd.length > 0 ? {$and: newAnd} : {})
  };
}
```

### Check that we're not likely to bust the stack

The actual implementation has a `maxDepth` 3rd parameter defaulted to 5.

When `maxDepth` is equal to `0`, we return the query without any treatment (arguably we should run the top-level filter).

On recursive calls to `removeFieldReferences` we pass `(q, fieldName, maxDepth - 1)` so that we're not going any deeper than we need to by accident.

This avoids `RangeError: Maximum call stack size exceeded`. 


## Tests

Tests are in `.test.js` files co-located with the modules they're testing.

See [./src/add-or-clause.test.js](./src/add-or-clause.test.js) and [./src/remove-field-references.test.js](./src/remove-field-references.test.js)
