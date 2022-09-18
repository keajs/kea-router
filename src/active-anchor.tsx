import React from 'react'
import { router } from './router'
import { useValues } from 'kea'

/**
 * This is similar to A, but it subscribes to the router values
 * and adds an "active" class when the link's href matches the current pathname
 */
interface ActiveAProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  /**
   * Whether the match is exact
   *
   * If you have two links to /console and /console/posts,
   * "exact" should be used in the /console ActiveA so that
   *
   * <ActiveA href="/console" exact={true} />
   * <ActiveA href="/console/posts" />
   */
  exact?: boolean
}

const ActiveA = React.forwardRef<HTMLAnchorElement, ActiveAProps>((props = {}, ref) => {
  let {
    location: { pathname },
  } = useValues(router)

  pathname = pathname.toLowerCase()
  const isActive =
    props.href.toLowerCase() === pathname ||
    (!props.exact && pathname.startsWith(props.href) && pathname.charAt(props.href.length) === '/')

  let className = props.className || null
  if (isActive) {
    className = className ? `${className} active` : 'active'
  }

  return (
    <a
      {...props}
      ref={ref}
      onClick={(event) => {
        if (!props.target) {
          event.preventDefault()
          router.actions.push(props.href) // router is mounted automatically, so this is safe to call
        }
        props.onClick && props.onClick(event)
      }}
      className={className}
    />
  )
})

export { ActiveA }
