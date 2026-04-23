export function ok(message, data = null, meta = null, status = 200) {
  const payload = { message };
  if (data !== null) payload.data = data;
  if (meta !== null) payload.meta = meta;
  return Response.json(payload, { status });
}

export function fail(message, status = 500, error = null) {
  const payload = { message };
  if (error) payload.error = error;
  return Response.json(payload, { status });
}