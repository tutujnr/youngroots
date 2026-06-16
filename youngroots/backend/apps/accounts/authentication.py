from rest_framework.authentication import BaseAuthentication

class AnonymousTokenAuthentication(BaseAuthentication):
    def authenticate(self, request):
        return None