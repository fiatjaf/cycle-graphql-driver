var assert = require('assert');

var run = require('@cycle/most-run').default;
var adapter = require('@cycle/most-adapter').default;

var most = require('most');

var gql = require('graphql-tag');

var { makeGraphQLDriver } = require('./index');

// fake ApolloClient for testing
const client = {
  query: ({query, variables, forFetch}) => new Promise( (resolve, reject) => {
    resolve({id: 1, name: 'WidgetOne'});
  })
};

describe('GraphQL Driver', function() {
  it('should return an item', function(done) {

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
    });

    var input = most.from([{
      query: 'fetchItem',
      variables: {
        id: 1
      }
    }])

    var output = graphQLDriver(input, adapter);

    output.forEach( ({id, name}) => {
      assert.equal(id, 1);
      assert.equal(name, 'WidgetOne');
      done();
    });

  });
});
