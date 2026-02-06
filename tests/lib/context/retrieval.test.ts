import { describe, it, expect } from 'vitest'
import { summarizeContext } from '@/lib/context/retrieval'

describe('Context Summarization', () => {
  describe('summarizeContext', () => {
    it('should return empty string for empty context', () => {
      const contextData = {
        messages: [],
        files: [],
        notionPages: []
      }

      const result = summarizeContext(contextData)

      expect(result).toBe('')
    })

    it('should format messages only context', () => {
      const contextData = {
        messages: [
          { sender: 'alice@example.com', content: 'Hello, this is a test message' },
          { sender: 'bob@example.com', content: 'Reply to the test message' }
        ],
        files: [],
        notionPages: []
      }

      const result = summarizeContext(contextData)

      expect(result).toContain('Recent Messages (2):')
      expect(result).toContain('- alice@example.com: Hello, this is a test message')
      expect(result).toContain('- bob@example.com: Reply to the test message')
    })

    it('should truncate message content to 100 characters', () => {
      const longContent = 'A'.repeat(150)
      const contextData = {
        messages: [
          { sender: 'alice@example.com', content: longContent }
        ],
        files: [],
        notionPages: []
      }

      const result = summarizeContext(contextData)

      expect(result).toContain(`- alice@example.com: ${'A'.repeat(100)}...`)
      expect(result).not.toContain('A'.repeat(101))
    })

    it('should format files only context', () => {
      const contextData = {
        messages: [],
        files: [
          { name: 'document.pdf', provider: 'GDRIVE' },
          { name: 'spreadsheet.xlsx', provider: 'ONEDRIVE' }
        ],
        notionPages: []
      }

      const result = summarizeContext(contextData)

      expect(result).toContain('Recent Files (2):')
      expect(result).toContain('- document.pdf (GDRIVE)')
      expect(result).toContain('- spreadsheet.xlsx (ONEDRIVE)')
    })

    it('should format notion pages only context', () => {
      const contextData = {
        messages: [],
        files: [],
        notionPages: [
          { title: 'Project Plan', type: 'PAGE' },
          { title: 'Task Database', type: 'DATABASE' }
        ]
      }

      const result = summarizeContext(contextData)

      expect(result).toContain('Notion Pages (2):')
      expect(result).toContain('- Project Plan (PAGE)')
      expect(result).toContain('- Task Database (DATABASE)')
    })

    it('should format mixed context with all sections', () => {
      const contextData = {
        messages: [
          { sender: 'alice@example.com', content: 'Test message' }
        ],
        files: [
          { name: 'document.pdf', provider: 'GDRIVE' }
        ],
        notionPages: [
          { title: 'Project Plan', type: 'PAGE' }
        ]
      }

      const result = summarizeContext(contextData)

      expect(result).toContain('Recent Messages (1):')
      expect(result).toContain('- alice@example.com: Test message')
      expect(result).toContain('\nRecent Files (1):')
      expect(result).toContain('- document.pdf (GDRIVE)')
      expect(result).toContain('\nNotion Pages (1):')
      expect(result).toContain('- Project Plan (PAGE)')
    })

    it('should limit display to 5 items per section even if more exist', () => {
      const contextData = {
        messages: Array.from({ length: 10 }, (_, i) => ({
          sender: `user${i}@example.com`,
          content: `Message ${i}`
        })),
        files: Array.from({ length: 8 }, (_, i) => ({
          name: `file${i}.txt`,
          provider: 'GDRIVE'
        })),
        notionPages: Array.from({ length: 7 }, (_, i) => ({
          title: `Page ${i}`,
          type: 'PAGE'
        }))
      }

      const result = summarizeContext(contextData)

      // Check messages section
      expect(result).toContain('Recent Messages (10):')
      const messageLines = result.split('\n').filter(line => line.includes('user') && line.includes('@example.com'))
      expect(messageLines).toHaveLength(5)

      // Check files section
      expect(result).toContain('Recent Files (8):')
      const fileLines = result.split('\n').filter(line => line.includes('file') && line.includes('.txt'))
      expect(fileLines).toHaveLength(5)

      // Check notion section
      expect(result).toContain('Notion Pages (7):')
      const notionLines = result.split('\n').filter(line => line.includes('Page ') && line.includes('(PAGE)'))
      expect(notionLines).toHaveLength(5)
    })

    it('should handle context with only some sections populated', () => {
      const contextData = {
        messages: [
          { sender: 'alice@example.com', content: 'Test' }
        ],
        files: [],
        notionPages: [
          { title: 'Page', type: 'PAGE' }
        ]
      }

      const result = summarizeContext(contextData)

      expect(result).toContain('Recent Messages (1):')
      expect(result).not.toContain('Recent Files')
      expect(result).toContain('Notion Pages (1):')
    })

    it('should display exactly 5 items when there are exactly 5 items', () => {
      const contextData = {
        messages: Array.from({ length: 5 }, (_, i) => ({
          sender: `user${i}@example.com`,
          content: `Message ${i}`
        })),
        files: [],
        notionPages: []
      }

      const result = summarizeContext(contextData)

      const messageLines = result.split('\n').filter(line => line.includes('user') && line.includes('@example.com'))
      expect(messageLines).toHaveLength(5)
      expect(result).toContain('user0@example.com')
      expect(result).toContain('user4@example.com')
    })
  })
})
