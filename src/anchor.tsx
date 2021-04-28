import React from 'react'
import { router } from './router'

// use <A href=''> instead of <a href=''> to open links via the router
export function A(props: Record<string, any>): JSX.Element {
  return (
    <a
      {...props}
      onClick={(event) => {
        if (!props.target) {
          event.preventDefault()
          router.actions.push(props.href) // router is mounted automatically, so this is safe to call
        }
        props.onClick && props.onClick(event)
      }}
    />
  )
}
