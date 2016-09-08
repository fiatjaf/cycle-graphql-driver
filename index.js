import ApolloClient, { createNetworkInterface } from 'apollo-client'
import most from 'most'
import graphqlTag from 'graphql-tag'

export const gql = graphqlTag

export function makeGraphQLDriver ({templates = {}, endpoint = '/graphql', includeHeaders = {}}) {
  const networkInterface = createNetworkInterface(endpoint, {credentials: 'include'})
  networkInterface.use([{
    applyMiddleware (req, next) {
      // if some header was sent through input$ it will appear here.
      // users must make sure any necessary header is sent before actual calls.
      if (includeHeaders) {
        req.options.headers = includeHeaders
      }
      next()
    }
  }])
  const client = new ApolloClient({networkInterface})

  return function graphqlDriver (input$) {
    // extract headers from the given input, if they come.
    let headers$ = input$.filter(e => e.headers)
    headers$.observe(s => {
      includeHeaders= s.headers
    })

    // actually make the calls
    let query$ = input$.filter(e => e.query)
    let mutation$ = input$.filter(e => e.mutation)

    let res$$ = most.merge(
      query$
        .map(({query, variables, forceFetch = true}) => {
          query = templates[query] || query
          let res$ = most.fromPromise(client.query({query, variables, forceFetch}))
          return res$
        }),
      mutation$
        .map(({mutation, variables}) => {
          mutation = templates[mutation] || mutation
          let res$ = most.fromPromise(client.mutate({mutation, variables}))
          return res$
        })
      )

    return res$$
      .multicast()
  }
}
