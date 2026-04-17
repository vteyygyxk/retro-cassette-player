import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import App from './App'

describe('App', () => {
  it('should render the app title', () => {
    render(<App />)
    expect(screen.getByText('复古磁带播放器')).toBeInTheDocument()
  })

  it('should render the English subtitle', () => {
    render(<App />)
    expect(screen.getByText('Retro Cassette Player')).toBeInTheDocument()
  })

  it('should have the default skin attribute', () => {
    const { container } = render(<App />)
    const playerDiv = container.querySelector('[data-skin]')
    expect(playerDiv).toHaveAttribute('data-skin', 'classic-black')
  })
})
