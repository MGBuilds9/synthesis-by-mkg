import '@testing-library/jest-dom/vitest'
import { vi } from 'vitest'

// Mock scrollIntoView for all tests as it's not implemented in JSDOM
window.HTMLElement.prototype.scrollIntoView = vi.fn()
