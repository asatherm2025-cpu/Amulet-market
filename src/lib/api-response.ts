import { NextResponse } from 'next/server'

export type ApiResponse<T = unknown> = {
  success: boolean
  data?: T
  error?: string
  message?: string
  meta?: {
    total?: number
    page?: number
    limit?: number
    hasMore?: boolean
  }
}

// ✅ Success responses
export function ok<T>(data: T, meta?: ApiResponse['meta'], status = 200) {
  return NextResponse.json<ApiResponse<T>>(
    { success: true, data, meta },
    { status }
  )
}

export function created<T>(data: T) {
  return NextResponse.json<ApiResponse<T>>(
    { success: true, data },
    { status: 201 }
  )
}

// ❌ Error responses
export function badRequest(error: string) {
  return NextResponse.json<ApiResponse>(
    { success: false, error },
    { status: 400 }
  )
}

export function unauthorized(error = 'Unauthorized') {
  return NextResponse.json<ApiResponse>(
    { success: false, error },
    { status: 401 }
  )
}

export function forbidden(error = 'Forbidden') {
  return NextResponse.json<ApiResponse>(
    { success: false, error },
    { status: 403 }
  )
}

export function notFound(error = 'Not found') {
  return NextResponse.json<ApiResponse>(
    { success: false, error },
    { status: 404 }
  )
}

export function conflict(error: string) {
  return NextResponse.json<ApiResponse>(
    { success: false, error },
    { status: 409 }
  )
}

export function serverError(error: unknown) {
  console.error('[API Error]', error)
  const message =
    error instanceof Error ? error.message : 'Internal server error'
  return NextResponse.json<ApiResponse>(
    { success: false, error: message },
    { status: 500 }
  )
}
