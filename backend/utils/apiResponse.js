import { NextResponse } from 'next/server';

export function success(message, data = null, status = 200) {
  return NextResponse.json(
    { success: true, data, message },
    { status }
  );
}

export function error(message, status = 500, data = null) {
  return NextResponse.json(
    { success: false, data, message },
    { status }
  );
}