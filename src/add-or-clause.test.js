const addOrClause = require('./add-or-clause');

test('should add the passed or clause if no $or on the current query', () => {
  const orClause = {$or: [{myField: 'value'}, {myField: null}]};
  const query = {foo: 'bar'};
  expect(addOrClause(query, orClause)).toEqual({
    $or: [{myField: 'value'}, {myField: null}],
    foo: 'bar'
  });
});
describe('when the query already has an $or', () => {
  test('should add the passed or clause to and $and that also contains the current query', () => {
    const orClause = {$or: [{myField: 'value'}, {myField: null}]};
    const query = {$or: [{foo: 'bar'}, {foo: {$exists: false}}]};
    expect(addOrClause(query, orClause)).toEqual({
      $and: [
        {$or: [{foo: 'bar'}, {foo: {$exists: false}}]},
        {
          $or: [{myField: 'value'}, {myField: null}]
        }
      ]
    });
  });
  describe('when the query has an $and', () => {
    test('should keep the $and, add the $or and the current query', () => {
      const orClause = {$or: [{myField: 'value'}, {myField: null}]};
      const query = {
        $or: [{hello: 'world'}],
        $and: [{foo: 'bar'}, {bar: 'baz'}]
      };
      expect(addOrClause(query, orClause)).toEqual({
        $and: [
          {foo: 'bar'},
          {bar: 'baz'},
          {$or: [{hello: 'world'}]},
          {$or: [{myField: 'value'}, {myField: null}]}
        ]
      });
    });
  });
});
describe('when the query has an $and query', () => {
  test('should add the new or clause to the $and', () => {
    const orClause = {$or: [{myField: 'value'}, {myField: null}]};
    const query = {$and: [{foo: 'bar'}, {bar: 'baz'}]};
    expect(addOrClause(query, orClause)).toEqual({
      $and: [
        {foo: 'bar'},
        {bar: 'baz'},
        {$or: [{myField: 'value'}, {myField: null}]}
      ]
    });
  });
});
