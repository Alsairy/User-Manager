import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { AccessLevelBadge } from './access-level-badge'

describe('AccessLevelBadge', () => {
  it('should render viewer level with correct label', () => {
    render(<AccessLevelBadge level="viewer" />)

    const badge = screen.getByTestId('badge-access-level-viewer')
    expect(badge).toBeInTheDocument()
    expect(badge).toHaveTextContent('Viewer')
  })

  it('should render editor level with correct label', () => {
    render(<AccessLevelBadge level="editor" />)

    const badge = screen.getByTestId('badge-access-level-editor')
    expect(badge).toBeInTheDocument()
    expect(badge).toHaveTextContent('Editor')
  })

  it('should render approver level with correct label', () => {
    render(<AccessLevelBadge level="approver" />)

    const badge = screen.getByTestId('badge-access-level-approver')
    expect(badge).toBeInTheDocument()
    expect(badge).toHaveTextContent('Approver')
  })

  it('should render full_access level with correct label', () => {
    render(<AccessLevelBadge level="full_access" />)

    const badge = screen.getByTestId('badge-access-level-full_access')
    expect(badge).toBeInTheDocument()
    expect(badge).toHaveTextContent('Full Access')
  })

  it('should apply blue styling for viewer level', () => {
    render(<AccessLevelBadge level="viewer" />)

    const badge = screen.getByTestId('badge-access-level-viewer')
    expect(badge).toHaveClass('bg-blue-100')
    expect(badge).toHaveClass('text-blue-800')
  })

  it('should apply purple styling for editor level', () => {
    render(<AccessLevelBadge level="editor" />)

    const badge = screen.getByTestId('badge-access-level-editor')
    expect(badge).toHaveClass('bg-purple-100')
    expect(badge).toHaveClass('text-purple-800')
  })

  it('should apply orange styling for approver level', () => {
    render(<AccessLevelBadge level="approver" />)

    const badge = screen.getByTestId('badge-access-level-approver')
    expect(badge).toHaveClass('bg-orange-100')
    expect(badge).toHaveClass('text-orange-800')
  })

  it('should apply green styling for full_access level', () => {
    render(<AccessLevelBadge level="full_access" />)

    const badge = screen.getByTestId('badge-access-level-full_access')
    expect(badge).toHaveClass('bg-green-100')
    expect(badge).toHaveClass('text-green-800')
  })

  it('should apply small size classes when size is sm', () => {
    render(<AccessLevelBadge level="viewer" size="sm" />)

    const badge = screen.getByTestId('badge-access-level-viewer')
    expect(badge).toHaveClass('text-xs')
    expect(badge).toHaveClass('px-2')
    expect(badge).toHaveClass('py-0.5')
  })

  it('should render correctly with default size', () => {
    render(<AccessLevelBadge level="viewer" size="default" />)

    const badge = screen.getByTestId('badge-access-level-viewer')
    // Badge should render correctly with default styling
    expect(badge).toBeInTheDocument()
    expect(badge).toHaveTextContent('Viewer')
  })

  it('should render correctly when size prop is not provided', () => {
    render(<AccessLevelBadge level="viewer" />)

    const badge = screen.getByTestId('badge-access-level-viewer')
    // Badge should render with default styling when no size is specified
    expect(badge).toBeInTheDocument()
    expect(badge).toHaveTextContent('Viewer')
  })
})
