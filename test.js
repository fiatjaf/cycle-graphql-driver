/* global it, describe */

var assert = require('assert')
var adapter = require('@cycle/most-adapter').default
var most = require('most')

var gql = require('graphql-tag')

var { makeGraphQLDriver } = require('./index')

// fake ApolloClient for testing
const client = {
  query: ({query, variables, forFetch}) => new Promise((resolve, reject) => {
    resolve({id: 1, name: 'WidgetOne'})
  }),
  mutate: ({mutation, variables}) => new Promise((resolve, reject) => {
    resolve({id: 1, ok: true})
  })
}

describe('GraphQL Driver', function () {
  it('should save an item', function (done) {
    var graphQLDriver = makeGraphQLDriver({
      client: client,
      templates: {
        saveItem: gql`
         mutation saveItem($id: ID!, $name: String!) {
           saveItem(id: $id, name: $name) {
             id
             ok
           }
         }`
      }
    })

    var input = most.from([{
      mutation: 'saveItem',
      variables: {
        id: 1,
        name: 'WidgetOne'
      }
    }])

    var output = graphQLDriver(input, adapter)

    output.forEach(({id, ok}) => {
      assert.equal(id, 1)
      assert.equal(ok, true)
      done()
    })
  })

  it('should return an item', function (done) {
    var graphQLDriver = makeGraphQLDriver({
      client: client,
      templates: {
        fetchItem: gql`
         query fetchItem($id: ID!) {
           item(id: $id) {
             id
             name
           }
         }`
      }
    })

    var input = most.from([{
      query: 'fetchItem',
      variables: {
        id: 1
      }
    }])

    var output = graphQLDriver(input, adapter)

    output.forEach(({id, name}) => {
      assert.equal(id, 1)
      assert.equal(name, 'WidgetOne')
      done()
    })
  })
})
