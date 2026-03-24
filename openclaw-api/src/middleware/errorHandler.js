export function errorHandler(error, request, reply) {
  request.log.error(error);
  if (error.validation) {
    // Return generic message; full schema detail stays in logs only
    return reply.code(400).send({ success: false, error: { code: 'BAD_REQUEST', message: 'Invalid request parameters' } });
  }
  reply.code(500).send({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } });
}
