function addOrClause(query, orClause) {
  const {$or, ...queryRest} = query;
  if ($or) {
    return {
      ...queryRest,
      $and: [...(queryRest.$and || []), {$or}, orClause]
    };
  }

  if (queryRest.$and) {
    return {
      ...queryRest,
      $and: [...queryRest.$and, orClause]
    };
  }

  return {
    ...query,
    ...orClause
  };
}

module.exports = addOrClause;
