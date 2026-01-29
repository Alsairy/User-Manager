import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { StatusBadge } from './status-badge'

describe('StatusBadge', () => {
  it('should render active status with correct label', () => {
    render(<StatusBadge status="active" />)

    const badge = screen.getByTestId('badge-status-active')
    expect(badge).toBeInTheDocument()
    expect(badge).toHaveTextContent('Active')
  })

  it('should render inactive status with correct label', () => {
    render(<StatusBadge status="inactive" />)

    const badge = screen.getByTestId('badge-status-inactive')
    expect(badge).toBeInTheDocument()
    expect(badge).toHaveTextContent('Inactive')
  })

  it('should render pending status with correct label', () => {
    render(<StatusBadge status="pending" />)

    const badge = screen.getByTestId('badge-status-pending')
    expect(badge).toBeInTheDocument()
    expect(badge).toHaveTextContent('Pending')
  })

  it('should apply green styling for active status', () => {
    render(<StatusBadge status="active" />)

    const badge = screen.getByTestId('badge-status-active')
    expect(badge).toHaveClass('bg-green-100')
    expect(badge).toHaveClass('text-green-800')
  })

  it('should apply amber styling for pending status', () => {
    render(<StatusBadge status="pending" />)

    const badge = screen.getByTestId('badge-status-pending')
    expect(badge).toHaveClass('bg-amber-100')
    expect(badge).toHaveClass('text-amber-800')
  })

  it('should not apply special styling for inactive status', () => {
    render(<StatusBadge status="inactive" />)

    const badge = screen.getByTestId('badge-status-inactive')
    expect(badge).not.toHaveClass('bg-green-100')
    expect(badge).not.toHaveClass('bg-amber-100')
  })
})
