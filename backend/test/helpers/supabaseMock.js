function createSupabaseMock(responses = []) {
  const calls = [];
  let responseIndex = 0;

  function nextResponse() {
    if (responseIndex >= responses.length) {
      throw new Error(`No mock Supabase response configured for call ${responseIndex + 1}.`);
    }
    return responses[responseIndex++];
  }

  function from(table) {
    const call = { table, actions: [] };
    calls.push(call);

    const builder = {
      select(...args) {
        call.actions.push({ method: 'select', args });
        return builder;
      },
      insert(...args) {
        call.actions.push({ method: 'insert', args });
        return builder;
      },
      update(...args) {
        call.actions.push({ method: 'update', args });
        return builder;
      },
      delete(...args) {
        call.actions.push({ method: 'delete', args });
        return builder;
      },
      eq(...args) {
        call.actions.push({ method: 'eq', args });
        return builder;
      },
      neq(...args) {
        call.actions.push({ method: 'neq', args });
        return builder;
      },
      order(...args) {
        call.actions.push({ method: 'order', args });
        return builder;
      },
      limit(...args) {
        call.actions.push({ method: 'limit', args });
        return builder;
      },
      maybeSingle() {
        call.actions.push({ method: 'maybeSingle', args: [] });
        return Promise.resolve(nextResponse());
      },
      single() {
        call.actions.push({ method: 'single', args: [] });
        return Promise.resolve(nextResponse());
      },
      then(resolve, reject) {
        return Promise.resolve(nextResponse()).then(resolve, reject);
      },
    };

    return builder;
  }

  return { from, calls };
}

function actionArgs(call, method) {
  return call.actions.find((action) => action.method === method)?.args;
}

module.exports = { createSupabaseMock, actionArgs };
