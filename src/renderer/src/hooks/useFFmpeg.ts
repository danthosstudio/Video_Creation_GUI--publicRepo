import { useState, useEffect, useCallback, useRef } from 'react'

interface FFmpegState {
  status: string
  progress: number
  isProcessing: boolean
  result: { success: boolean; message: string } | null
}

export function useFFmpeg() {
  const [state, setState] = useState<FFmpegState>({
    status: 'Ready',
    progress: 0,
    isProcessing: false,
    result: null
  })
  const processingRef = useRef(false)

  useEffect(() => {
    const cleanup = window.api.onProgress((status, progress) => {
      // Only update if this hook instance is actively processing
      if (processingRef.current) {
        setState((prev) => ({ ...prev, status, progress }))
      }
    })
    return cleanup
  }, [])

  const execute = useCallback(
    async <T>(operation: () => Promise<T>): Promise<T | undefined> => {
      // Guard against concurrent operations
      if (processingRef.current) return undefined

      processingRef.current = true
      setState({ status: 'Starting...', progress: 0, isProcessing: true, result: null })
      try {
        const result = await operation()
        const r = result as { success: boolean; message: string }
        setState({
          status: r.message,
          progress: r.success ? 100 : 0,
          isProcessing: false,
          result: r
        })
        return result
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error'
        setState({
          status: message,
          progress: 0,
          isProcessing: false,
          result: { success: false, message }
        })
        return undefined
      } finally {
        processingRef.current = false
      }
    },
    []
  )

  const reset = useCallback(() => {
    setState({ status: 'Ready', progress: 0, isProcessing: false, result: null })
  }, [])

  return { ...state, execute, reset }
}
