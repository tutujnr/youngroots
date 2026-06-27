import uuid
class AnonymousSessionMiddleware:
    SESSION_KEY = 'anon_session_id'
    def __init__(self, get_response): self.get_response = get_response
    def __call__(self, request):
        if self.SESSION_KEY not in request.session:
            request.session[self.SESSION_KEY] = str(uuid.uuid4())
        request.anon_session_id = request.session[self.SESSION_KEY]
        response = self.get_response(request)
        response.headers.pop('Server', None)
        response.headers.pop('X-Powered-By', None)
        return response
