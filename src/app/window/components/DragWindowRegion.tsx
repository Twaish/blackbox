import {
  closeWindow,
  maximizeWindow,
  minimizeWindow,
} from '@/app/window/actions'
import { ComponentProps, type ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/utils/tailwind'

interface DragWindowRegionProps {
  title?: ReactNode
  children?: ReactNode
}

export default function DragWindowRegion({
  title,
  children,
}: DragWindowRegionProps) {
  return (
    <div className="z-50 flex h-8 min-h-8 w-full items-stretch justify-between border-b">
      <div className="draglayer hide-scroll flex flex-1 items-center overflow-x-auto">
        {title && (
          <div className="mr-auto flex pr-1 pl-2 text-xs whitespace-nowrap opacity-65 select-none">
            {title}
          </div>
        )}
        {children}
      </div>
      <WindowButtons />
    </div>
  )
}

function WindowButtons() {
  return (
    <div className="m-1 flex">
      <WindowButton onClick={minimizeWindow}>
        <svg
          aria-hidden="true"
          role="img"
          width="12"
          height="12"
          viewBox="0 0 12 12"
        >
          <rect fill="currentColor" width="10" height="1" x="1" y="6"></rect>
        </svg>
      </WindowButton>
      <WindowButton onClick={maximizeWindow}>
        <svg
          aria-hidden="true"
          role="img"
          width="12"
          height="12"
          viewBox="0 0 12 12"
        >
          <rect
            width="9"
            height="9"
            x="1.5"
            y="1.5"
            fill="none"
            stroke="currentColor"
          ></rect>
        </svg>
      </WindowButton>
      <WindowButton onClick={closeWindow}>
        <svg
          aria-hidden="true"
          role="img"
          width="12"
          height="12"
          viewBox="0 0 12 12"
        >
          <polygon
            fill="currentColor"
            fillRule="evenodd"
            points="11 1.576 6.583 6 11 10.424 10.424 11 6 6.583 1.576 11 1 10.424 5.417 6 1 1.576 1.576 1 6 5.417 10.424 1"
          ></polygon>
        </svg>
      </WindowButton>
    </div>
  )
}

function WindowButton({
  className,
  children,
  ...rest
}: ComponentProps<typeof Button>) {
  return (
    <Button
      variant={'ghost'}
      className={cn('h-min rounded-sm px-2.25 py-1.5', className)}
      {...rest}
    >
      {children}
    </Button>
  )
}
