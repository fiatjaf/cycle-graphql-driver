import ApolloClient, { createNetworkInterface } from 'apollo-client'
import gql from 'apollo-client/gql'
import most from 'most'

export {gql}

export function makeGraphQLDriver ({templates = {}, endpoint = '/graphql'}) {
  var jwt = ''

  const networkInterface = createNetworkInterface(endpoint)
  networkInterface.use([{
    applyMiddleware (req, next) {
      if (jwt) {
        if (!req.options.headers) {
          req.options.headers = {}
        }
        req.options.headers.authorization = 'token ' + jwt
      }
      next()
    }
  }])

  const client = new ApolloClient({networkInterface})

  return function graphqlDriver (input$) {
    let query$ = input$.filter(e => e.query)
    let mutation$ = input$.filter(e => e.mutation)
    let token$ = input$.filter(e => e.jwt)

    token$.observe(s => {
      jwt = s.jwt
    })

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
