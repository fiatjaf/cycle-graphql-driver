
export function makeGraphQLDriver ({templates = {}, client}) {

  return function graphqlDriver (input$, runStreamAdapter) {

    let query$ = input$.filter(e => e.query)
    let mutation$ = input$.filter(e => e.mutation)

    const { stream, observer } = runStreamAdapter.makeSubject();

    runStreamAdapter.streamSubscribe(query$,
      {
        next: ({query, variables, forceFetch = true}) => {
          query = templates[query] || query
          client.query({query, variables, forceFetch})
            .then( (x) => observer.next(x) )
            .catch( (err) => observer.error(err) );
        }
      });
    runStreamAdapter.streamSubscribe(query$,
      {
        next: ({mutation, variables}) => {
          mutation = templates[mutation] || mutation
          client.mutate({mutation, variables})
            .then( (x) => observer.next(x) )
            .catch( (err) => observer.error(err) );
        }
      });

    return stream;

  }
}
