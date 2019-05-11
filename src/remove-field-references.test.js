const removeFieldReferences = require('./remove-field-references');

test('should remove top-level fields', () => {
  const query = {
    hello: 'value'
  };
  const fieldName = 'hello';
  expect(removeFieldReferences(query, fieldName).hello).toBeUndefined();
});
test('should return passed query when maxDepth is hit (avoids busting the stack by default)', () => {
  const query = {
    hello: 'value'
  };
  const fieldName = 'hello';
  expect(removeFieldReferences(query, fieldName, 0)).toEqual(query);
});
test('should remove references to the field in top-level $or queries', () => {
  const query = {
    $or: [
      {hello: 'value', otherField: 'not-related'},
      {hello: 'othervalue', otherField: 'even-less-related'}
    ]
  };
  const fieldName = 'hello';
  expect(removeFieldReferences(query, fieldName)).toEqual({
    $or: [{otherField: 'not-related'}, {otherField: 'even-less-related'}]
  });
});
test('should remove $or clauses where the query becomes empty on omission of a field', () => {
  const query = {
    $or: [{hello: 'value'}, {otherField: 'not-related'}]
  };
  const fieldName = 'hello';
  expect(removeFieldReferences(query, fieldName)).toEqual({
    $or: [{otherField: 'not-related'}]
  });
});
test('should remove references to field in top-level queries inside of $and', () => {
  const query = {
    $and: [
      {hello: 'value', otherField: 'value'},
      {hello: 'other-value', otherField: 'value'}
    ]
  };
  const fieldName = 'hello';
  expect(removeFieldReferences(query, fieldName)).toEqual({
    $and: [{otherField: 'value'}, {otherField: 'value'}]
  });
});
test('should remove $and clause if all queries end up filtered out', () => {
  const query = {
    foo: 'bar',
    $and: [{hello: 'value'}, {hello: 'other-value'}]
  };
  const fieldName = 'hello';
  expect(removeFieldReferences(query, fieldName)).toEqual({foo: 'bar'});
});
test('should remove references to field in nested $or inside of $and', () => {
  const query = {
    $and: [
      {
        $or: [{hello: 'value'}, {hello: null}]
      },
      {otherField: 'not-related'}
    ]
  };
  const fieldName = 'hello';
  expect(removeFieldReferences(query, fieldName)).toEqual({
    $and: [{otherField: 'not-related'}]
  });
});
