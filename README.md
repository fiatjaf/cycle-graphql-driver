This is a driver for all your [pure-most Cycle apps](https://github.com/cyclejs/most-run) (think[Motorcycle](https://github.com/motorcyclejs/core#merging-with-cyclejs)) that talks to a GraphQL endpoint.

It uses [Apollo Client][http://docs.apollostack.com/apollo-client/core.html] underneath.

### Install

```
npm install --save cycle-graphql-most-driver
```


### Use

```javascript
import most from 'most'
import hold from '@most/hold'
import Cycle from '@cycle/most-run'
import {makeDOMDriver, h} from '@motorcycle/dom'
import {makeGraphQLDriver, gql} from 'cycle-graphql-most-driver'

Cycle.run(app, {
  DOM: makeDOMDriver('#container', [
    require('snabbdom/modules/props'),
    require('snabbdom/modules/style')
  ]),
  GRAPHQL: makeGraphQLDriver({
    endpoint: '/graphql',
    templates: {
      fetchItem: gql`
query fetchItem($id: ID!) {
  item($id) {
    id
    name
    description
    events {
      time
      value
    }
  }
}
      `,
      fetchAll: gql`
query {
  items {
    id, name
  }
}
      `,
      setItem: gql`
mutation setItem($id: ID!, $name: String, $desc: String) {
  setItem($id, $name, $desc) {
    id
  }
}
      `
    }
  })
})

function app ({DOM, GRAPHQL}) {
  let response$ = GRAPHQL
    .flatMap(r$ => r$
      .recoverWith(err => most.of({errors: [err.message]}))
    )
    .filter(({errors}) => {
      if (errors && errors.length) {
        console.log('errors:', errors)
        return false
      }
      return true
    })
    .map(({data}) => data)

  let itemList$ = response$.filter(data => data.items)

  let vtree$ = itemList$
    .map(items =>
      h('ul', items.map(item =>
        h('li', {props: {id: item.id}}, item.name)
      ))
    )

  return {
    DOM: vtree$,
    GRAPHQL: most.from([{
      query: 'fetchItems'
    }, {
      mutation: 'setItem',
      variables: {
        id: 123,
        name: 'an item',
        desc: 'this is an item'
      }
    }])
  }
}
```
