// useCallback: custom hooks
// http://localhost:3000/isolated/exercise/02.js

import * as React from 'react'
import {
  fetchPokemon,
  PokemonForm,
  PokemonDataView,
  PokemonInfoFallback,
  PokemonErrorBoundary,
} from '../pokemon'


function useAsync(initialState, isMountedRef) {

  const [state, dispatch] = React.useReducer(asyncReducer, {
    status: 'idle',
    data: null,
    error: null,
    ...initialState
  })

  React.useEffect(() => {
    return (() => console.log("cleanup"))
  })

  const safeDispatch = React.useCallback((s) =>  {
    if (isMountedRef.current) {
      dispatch(s)
    }
  }, [dispatch, isMountedRef])

  const run = React.useCallback((promise) => {
    if (!promise) {
      return
    }
    dispatch({type: 'pending'})
    promise.then(
      data => safeDispatch({type: 'resolved', data}),
      error => safeDispatch({type: 'rejected', error})
    )
  }, [safeDispatch])

  // 🐨 this is going to be our generic asyncReducer
  function asyncReducer(state, action) {
    switch (action.type) {
      case 'pending': {
        return {status: 'pending', data: null, error: null}
      }
      case 'resolved': {
        return {status: 'resolved', data: action.data, error: null}
      }
      case 'rejected': {
        return {status: 'rejected', data: null, error: action.error}
      }
      default: {
        throw new Error(`Unhandled action type: ${action.type}`)
      }
    }
  }

  return {...state, run }
}

function PokemonInfo({pokemonName}) {

  const isMountedRef = React.useRef(null)

  const {data: pokemon, status, error, run} = useAsync({
    status: pokemonName ? 'pending' : 'idle',
  }, isMountedRef)

  React.useEffect(() => {
    isMountedRef.current = true
    if (!pokemonName) {
      return
    }
    run(fetchPokemon(pokemonName, 5000))
    return () => isMountedRef.current = false
  }, [pokemonName], run)

  if (status === 'idle' || !pokemonName) {
    return 'Submit a pokemon'
  } else if (status === 'pending') {
    return <PokemonInfoFallback name={pokemonName} />
  } else if (status === 'rejected') {
    throw error
  } else if (status === 'resolved') {
    return <PokemonDataView pokemon={pokemon} />
  }

  throw new Error('This should be impossible')
}

function App() {
  const [pokemonName, setPokemonName] = React.useState('')

  function handleSubmit(newPokemonName) {
    setPokemonName(newPokemonName)
  }

  function handleReset() {
    setPokemonName('')
  }

  return (
    <div className="pokemon-info-app">
      <PokemonForm pokemonName={pokemonName} onSubmit={handleSubmit} />
      <hr />
      <div className="pokemon-info">
        <PokemonErrorBoundary onReset={handleReset} resetKeys={[pokemonName]}>
          <PokemonInfo pokemonName={pokemonName} />
        </PokemonErrorBoundary>
      </div>
    </div>
  )
}

function AppWithUnmountCheckbox() {
  const [mountApp, setMountApp] = React.useState(true)
  return (
    <div>
      <label>
        <input
          type="checkbox"
          checked={mountApp}
          onChange={e => setMountApp(e.target.checked)}
        />{' '}
        Mount Component
      </label>
      <hr />
      {mountApp ? <App /> : null}
    </div>
  )
}

export default AppWithUnmountCheckbox
