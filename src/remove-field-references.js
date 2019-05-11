const omit = (obj, [field, ...nextFields]) => {
  const {[field]: ignore, ...rest} = obj;
  return nextFields.length > 0 ? omit(rest, nextFields) : rest;
};

function removeFieldClausesFromQuery(query, fieldName, maxDepth = 5) {
  if (maxDepth <= 0) {
    return query;
  }

  const filteredTopLevel = omit(query, [fieldName]);

  const newOr = (filteredTopLevel.$or || [])
    .map(q => removeFieldClausesFromQuery(q, fieldName, maxDepth - 1))
    .filter(q => Object.keys(q).length > 0);

  const newAnd = (filteredTopLevel.$and || [])
    .map(q => removeFieldClausesFromQuery(q, fieldName, maxDepth - 1))
    .filter(q => Object.keys(q).length > 0);

  return {
    ...omit(filteredTopLevel, ['$or', '$and']),
    ...(newOr.length > 0 ? {$or: newOr} : {}),
    ...(newAnd.length > 0 ? {$and: newAnd} : {})
  };
}

module.exports = removeFieldClausesFromQuery;
